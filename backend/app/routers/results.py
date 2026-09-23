from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import VoteResult, PollingUnit, LGA, User
from app.schemas import VoteResultCreate
from app.core.permissions import require_admin, require_agent
from app.core.audit import write_audit_log

router = APIRouter(
    prefix="/results",
    tags=["Results"],
)

# ===========================================================
# Dashboard Summary
# ===========================================================

@router.get("")
def get_results_dashboard(
    lga_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
    db: Session = Depends(get_db)
):
    agg = db.query(
        func.sum(VoteResult.pdp_votes),
        func.sum(VoteResult.apc_votes),
        func.sum(VoteResult.nnpp_votes),
        func.sum(VoteResult.lp_votes),
        func.sum(VoteResult.others_votes),
        func.sum(VoteResult.rejected_votes),
        func.sum(VoteResult.total_valid_votes),
        func.sum(VoteResult.total_votes_cast),
        func.count(VoteResult.id),
    ).first()

    pdp = agg[0] or 0
    apc = agg[1] or 0
    nnpp = agg[2] or 0
    lp = agg[3] or 0
    others = agg[4] or 0
    rejected = agg[5] or 0
    total_valid = agg[6] or 0
    total_votes = agg[7] or 0
    collated_pus = agg[8] or 0
    total_pus = db.query(func.count(PollingUnit.id)).scalar() or 0

    if total_valid == 0:
        pdp_pct = "0%"
        apc_pct = "0%"
    else:
        pdp_pct = f"{(pdp / total_valid) * 100:.1f}%"
        apc_pct = f"{(apc / total_valid) * 100:.1f}%"

    upload_pct = (
        f"{(collated_pus / total_pus) * 100:.1f}%"
        if total_pus
        else "0%"
    )

    chart = [
        {
            "name": "PDP",
            "party": "PDP",
            "votes": pdp,
            "pct": pdp_pct,
            "color": "#10B981",
        },
        {
            "name": "APC",
            "party": "APC",
            "votes": apc,
            "pct": apc_pct,
            "color": "#3B82F6",
        },
        {
            "name": "NNPP",
            "party": "NNPP",
            "votes": nnpp,
            "pct": f"{(nnpp / total_valid) * 100:.1f}%" if total_valid else "0%",
            "color": "#8B5CF6",
        },
        {
            "name": "LP",
            "party": "LP",
            "votes": lp,
            "pct": f"{(lp / total_valid) * 100:.1f}%" if total_valid else "0%",
            "color": "#F59E0B",
        },
    ]

    # Optimized LGA Breakdown
    lga_stats = (
        db.query(
            PollingUnit.lga_id,
            func.count(VoteResult.id).label("collated"),
            func.sum(VoteResult.pdp_votes).label("pdp"),
            func.sum(VoteResult.apc_votes).label("apc"),
            func.sum(VoteResult.nnpp_votes).label("nnpp"),
            func.sum(VoteResult.lp_votes).label("lp"),
        )
        .join(VoteResult, VoteResult.polling_unit_id == PollingUnit.id)
        .group_by(PollingUnit.lga_id)
        .all()
    )
    lga_stat_map = {row.lga_id: row for row in lga_stats}

    total_pus_per_lga = dict(
        db.query(PollingUnit.lga_id, func.count(PollingUnit.id))
        .group_by(PollingUnit.lga_id)
        .all()
    )

    lgas = db.query(LGA).order_by(LGA.name).all()
    breakdown = []
    for lga in lgas:
        st = lga_stat_map.get(lga.id)
        tot_pus = total_pus_per_lga.get(lga.id, 0)
        coll = st.collated if st else 0
        l_pdp = st.pdp or 0 if st else 0
        l_apc = st.apc or 0 if st else 0
        l_nnpp = st.nnpp or 0 if st else 0
        l_lp = st.lp or 0 if st else 0
        pct = (
            f"{(coll / tot_pus) * 100:.0f}%"
            if tot_pus
            else "0%"
        )
        breakdown.append({
            "id": lga.id,
            "lga": lga.name,
            "totalPus": tot_pus,
            "collatedPus": coll,
            "pdp": l_pdp,
            "apc": l_apc,
            "nnpp": l_nnpp,
            "lp": l_lp,
            "pct": pct,
        })

    # Filterable & Paginated Joined Results
    query = (
        db.query(VoteResult, PollingUnit, User)
        .join(PollingUnit, PollingUnit.id == VoteResult.polling_unit_id)
        .outerjoin(User, User.id == VoteResult.agent_id)
    )

    if lga_id:
        query = query.filter(PollingUnit.lga_id == lga_id)
    if status and status.upper() != "ALL":
        query = query.filter(VoteResult.verification_status == status.upper())
    if search:
        query = query.filter(
            (PollingUnit.name.ilike(f"%{search}%")) | (PollingUnit.code.ilike(f"%{search}%"))
        )

    total_matching = query.count()
    rows = query.order_by(VoteResult.id.desc()).offset(skip).limit(limit).all()

    results_list = []
    for r, pu, agent in rows:
        reg_voters = pu.registered_voters or 0
        results_list.append({
            "id": r.id,
            "polling_unit_id": r.polling_unit_id,
            "polling_unit_code": pu.code,
            "polling_unit_name": pu.name,
            "registered_voters": reg_voters,
            "is_overvote": r.total_votes_cast > reg_voters if reg_voters else False,
            "lga_id": pu.lga_id,
            "agent_id": r.agent_id,
            "agent_name": agent.full_name if agent else (agent.username if agent else f"Agent {r.agent_id}"),
            "pdp_votes": r.pdp_votes,
            "apc_votes": r.apc_votes,
            "nnpp_votes": r.nnpp_votes,
            "lp_votes": r.lp_votes,
            "others_votes": r.others_votes,
            "rejected_votes": r.rejected_votes,
            "total_valid_votes": r.total_valid_votes,
            "total_votes_cast": r.total_votes_cast,
            "verification_status": r.verification_status,
            "ec8a_photo_url": r.ec8a_photo_url,
            "notes": r.notes,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    return {
        "summary": {
            "total_votes": total_votes,
            "collated_pus": collated_pus,
            "pdp_votes": pdp,
            "apc_votes": apc,
            "nnpp_votes": nnpp,
            "lp_votes": lp,
            "pdp_pct": pdp_pct,
            "apc_pct": apc_pct,
            "lead_margin": abs(pdp - apc),
            "verified_ec8a": collated_pus,
            "total_ec8a": total_pus,
            "upload_pct": upload_pct,
        },
        "party_vote_share": chart,
        "lga_breakdown": breakdown,
        "results": results_list,
        "total_results": total_matching,
        "limit": limit,
        "skip": skip,
    }


# ===========================================================
# Submit Result
# ===========================================================

@router.post("")
@router.post("/submit")
def submit_result(
    payload: VoteResultCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_agent),
):

    polling_unit = (
        db.query(PollingUnit)
        .filter(PollingUnit.id == payload.polling_unit_id)
        .first()
    )

    if not polling_unit:
        raise HTTPException(
            status_code=404,
            detail="Polling Unit not found.",
        )

    pdp = payload.pdp_votes
    apc = payload.apc_votes
    nnpp = payload.nnpp_votes
    lp = payload.lp_votes
    others = payload.others_votes
    rejected = payload.rejected_votes

    if min(pdp, apc, nnpp, lp, others, rejected) < 0:
        raise HTTPException(
            status_code=400,
            detail="Votes cannot be negative.",
        )

    total_valid = pdp + apc + nnpp + lp + others
    total_cast = total_valid + rejected

    # Discrepancy & Over-voting check: Electoral Act 2022 Section 51
    registered = polling_unit.registered_voters or 0
    is_overvoting = total_cast > registered
    auto_status = "FLAGGED" if is_overvoting else ("VERIFIED" if payload.ec8a_photo_url else "PENDING_PHOTO")

    existing = (
        db.query(VoteResult)
        .filter(VoteResult.polling_unit_id == payload.polling_unit_id)
        .first()
    )

    if existing:
        existing.agent_id = current_user.id
        existing.pdp_votes = pdp
        existing.apc_votes = apc
        existing.nnpp_votes = nnpp
        existing.lp_votes = lp
        existing.others_votes = others
        existing.rejected_votes = rejected
        existing.total_valid_votes = total_valid
        existing.total_votes_cast = total_cast
        existing.verification_status = auto_status
        if payload.ec8a_photo_url:
            existing.ec8a_photo_url = payload.ec8a_photo_url
        if is_overvoting:
            existing.notes = (existing.notes or "") + f" | [ALERT] Over-voting detected: {total_cast} votes cast vs {registered} registered."
        elif payload.notes:
            existing.notes = payload.notes

        write_audit_log(
            db=db,
            user=current_user,
            action="SUBMIT_RESULT",
            details=f"Polling Unit {payload.polling_unit_id} (Status: {auto_status}, Over-voting: {is_overvoting})",
        )

        db.commit()
        db.refresh(existing)

        return {
            "message": "Result updated successfully",
            "id": existing.id,
            "verification_status": existing.verification_status,
            "is_overvoting": is_overvoting,
        }

    result = VoteResult(
        polling_unit_id=payload.polling_unit_id,
        agent_id=current_user.id,
        pdp_votes=pdp,
        apc_votes=apc,
        nnpp_votes=nnpp,
        lp_votes=lp,
        others_votes=others,
        rejected_votes=rejected,
        total_valid_votes=total_valid,
        total_votes_cast=total_cast,
        ec8a_photo_url=payload.ec8a_photo_url,
        notes=(payload.notes or "") + (f" | [ALERT] Over-voting: {total_cast} vs {registered}" if is_overvoting else ""),
        verification_status=auto_status,
    )

    db.add(result)
    write_audit_log(
        db=db,
        user=current_user,
        action="SUBMIT_RESULT",
        details=f"Polling Unit {payload.polling_unit_id} (Status: {auto_status}, Over-voting: {is_overvoting})",
    )
    db.commit()
    db.refresh(result)

    return {
        "message": "Result submitted successfully",
        "id": result.id,
        "verification_status": result.verification_status,
        "is_overvoting": is_overvoting,
    }


# ===========================================================
# Approve Result (Admin / Situation Room Lead only)
# ===========================================================

@router.post("/approve/{result_id}")
def approve_result(
    result_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    result = (
        db.query(VoteResult)
        .filter(VoteResult.id == result_id)
        .first()
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Result not found.",
        )

    polling_unit = (
        db.query(PollingUnit)
        .filter(PollingUnit.id == result.polling_unit_id)
        .first()
    )

    if polling_unit and result.total_votes_cast > (polling_unit.registered_voters or 0):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve result: Over-voting detected ({result.total_votes_cast} votes cast exceeds {polling_unit.registered_voters} registered voters). Must remain FLAGGED.",
        )

    result.verification_status = "VERIFIED"
    write_audit_log(
        db=db,
        user=current_user,
        action="APPROVE_RESULT",
        details=f"Result {result_id} approved by {current_user.username}",
    )
    db.commit()
    db.refresh(result)

    return {
        "message": f"Result {result_id} approved successfully.",
        "id": result.id,
        "verification_status": result.verification_status,
    }


# ===========================================================
# Flag Result (Agent / Situation Room Operator)
# ===========================================================

@router.post("/flag/{result_id}")
def flag_result(
    result_id: int,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_agent),
):

    result = (
        db.query(VoteResult)
        .filter(VoteResult.id == result_id)
        .first()
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Result not found.",
        )

    result.verification_status = "FLAGGED"
    if notes:
        result.notes = (result.notes or "") + f" | [FLAGGED]: {notes}"

    write_audit_log(
        db=db,
        user=current_user,
        action="FLAG_RESULT",
        details=f"Result {result_id} flagged by {current_user.username}: {notes or 'Discrepancy'}",
    )
    db.commit()
    db.refresh(result)

    return {
        "message": f"Result {result_id} flagged successfully.",
        "id": result.id,
        "verification_status": result.verification_status,
    }