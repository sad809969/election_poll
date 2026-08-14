from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

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
def get_results_dashboard(db: Session = Depends(get_db)):

    results = db.query(VoteResult).all()

    pdp = sum(r.pdp_votes for r in results)
    apc = sum(r.apc_votes for r in results)
    nnpp = sum(r.nnpp_votes for r in results)
    lp = sum(r.lp_votes for r in results)
    others = sum(r.others_votes for r in results)

    rejected = sum(r.rejected_votes for r in results)

    total_valid = pdp + apc + nnpp + lp + others
    total_votes = total_valid + rejected

    collated_pus = len(results)
    total_pus = db.query(PollingUnit).count()

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

    breakdown = []

    lgas = db.query(LGA).all()

    for lga in lgas:

        polling_units = (
            db.query(PollingUnit)
            .filter(PollingUnit.lga_id == lga.id)
            .all()
        )

        total_pus_lga = len(polling_units)

        pu_ids = [pu.id for pu in polling_units]

        if pu_ids:
            lga_results = (
                db.query(VoteResult)
                .filter(VoteResult.polling_unit_id.in_(pu_ids))
                .all()
            )
        else:
            lga_results = []

        breakdown.append(
            {
                "lga": lga.name,
                "totalPus": total_pus_lga,
                "collatedPus": len(lga_results),
                "pdp": sum(r.pdp_votes for r in lga_results),
                "apc": sum(r.apc_votes for r in lga_results),
                "nnpp": sum(r.nnpp_votes for r in lga_results),
                "lp": sum(r.lp_votes for r in lga_results),
                "pct": (
                    f"{(len(lga_results)/total_pus_lga)*100:.0f}%"
                    if total_pus_lga
                    else "0%"
                ),
            }
        )

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
    }


# ===========================================================
# Submit Result
# ===========================================================

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

        
        write_audit_log(
        db=db,
         user=current_user,
         action="SUBMIT_RESULT",
         details=f"Polling Unit {payload.polling_unit_id}",
    )

        db.commit()
        db.refresh(existing)

        return {
            "message": "Result updated successfully",
            "id": existing.id,
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
    )

    db.add(result)
    db.commit()
    db.refresh(result)

    return {
        "message": "Result submitted successfully",
        "id": result.id,
    }


# ===========================================================
# Approve Result
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

    result.verification_status = "VERIFIED"

    db.commit()

    return {
        "message": f"Result {result_id} approved successfully.",
    }