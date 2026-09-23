from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime

from app.database import get_db
from app.models import CollationSignoff, LGA, Ward, PollingUnit, VoteResult, User
from app.core.permissions import require_admin, require_agent
from app.core.audit import write_audit_log

router = APIRouter(
    prefix="/collation",
    tags=["Collation & Sign-offs"],
)

class SignoffCreate(BaseModel):
    level: str  # 'WARD', 'LGA', 'STATE'
    entity_id: int  # lga_id, ward_id, or 0 for state
    notes: Optional[str] = None
    status: Optional[str] = "SIGNED"

class SignoffResponse(BaseModel):
    id: int
    level: str
    entity_id: int
    entity_name: Optional[str] = None
    signed_by: Optional[int] = None
    signer_name: Optional[str] = None
    pdp_total: int
    apc_total: int
    nnpp_total: int
    lp_total: int
    total_votes: int
    status: str
    notes: Optional[str] = None
    signed_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ===========================================================
# 1. Sign-off Collation Form (EC8B / EC8C / EC8D)
# ===========================================================

@router.post("/signoff", response_model=SignoffResponse)
def signoff_collation(
    payload: SignoffCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_agent),
):
    level = payload.level.upper()
    entity_id = payload.entity_id
    entity_name = ""

    pdp_total = 0
    apc_total = 0
    nnpp_total = 0
    lp_total = 0
    total_votes = 0

    if level == "LGA":
        lga = db.query(LGA).filter(LGA.id == entity_id).first()
        if not lga:
            raise HTTPException(status_code=404, detail="LGA not found")
        entity_name = lga.name

        # Aggregate live from all PUs in this LGA
        results = (
            db.query(VoteResult)
            .join(PollingUnit, PollingUnit.id == VoteResult.polling_unit_id)
            .filter(PollingUnit.lga_id == entity_id)
            .all()
        )
        pdp_total = sum(r.pdp_votes for r in results)
        apc_total = sum(r.apc_votes for r in results)
        nnpp_total = sum(r.nnpp_votes for r in results)
        lp_total = sum(r.lp_votes for r in results)
        total_votes = sum(r.total_votes_cast for r in results)

    elif level == "WARD":
        ward = db.query(Ward).filter(Ward.id == entity_id).first()
        if not ward:
            raise HTTPException(status_code=404, detail="Ward not found")
        entity_name = ward.name

        results = (
            db.query(VoteResult)
            .join(PollingUnit, PollingUnit.id == VoteResult.polling_unit_id)
            .filter(PollingUnit.ward_id == entity_id)
            .all()
        )
        pdp_total = sum(r.pdp_votes for r in results)
        apc_total = sum(r.apc_votes for r in results)
        nnpp_total = sum(r.nnpp_votes for r in results)
        lp_total = sum(r.lp_votes for r in results)
        total_votes = sum(r.total_votes_cast for r in results)

    elif level == "STATE":
        entity_name = "Jigawa State Governorship"
        results = db.query(VoteResult).all()
        pdp_total = sum(r.pdp_votes for r in results)
        apc_total = sum(r.apc_votes for r in results)
        nnpp_total = sum(r.nnpp_votes for r in results)
        lp_total = sum(r.lp_votes for r in results)
        total_votes = sum(r.total_votes_cast for r in results)
    else:
        raise HTTPException(status_code=400, detail="Invalid level. Must be WARD, LGA, or STATE")

    # Upsert existing signoff or create new
    signoff = (
        db.query(CollationSignoff)
        .filter(CollationSignoff.level == level, CollationSignoff.entity_id == entity_id)
        .first()
    )

    if signoff:
        signoff.signed_by = current_user.id
        signoff.pdp_total = pdp_total
        signoff.apc_total = apc_total
        signoff.nnpp_total = nnpp_total
        signoff.lp_total = lp_total
        signoff.total_votes = total_votes
        signoff.status = payload.status or "SIGNED"
        signoff.notes = payload.notes
        signoff.signed_at = datetime.utcnow()
    else:
        signoff = CollationSignoff(
            level=level,
            entity_id=entity_id,
            signed_by=current_user.id,
            pdp_total=pdp_total,
            apc_total=apc_total,
            nnpp_total=nnpp_total,
            lp_total=lp_total,
            total_votes=total_votes,
            status=payload.status or "SIGNED",
            notes=payload.notes,
        )
        db.add(signoff)

    write_audit_log(
        db=db,
        user=current_user,
        action=f"COLLATION_SIGNOFF_{level}",
        details=f"Signed {level} Form for {entity_name} ({pdp_total} PDP vs {apc_total} APC)",
    )

    db.commit()
    db.refresh(signoff)

    return SignoffResponse(
        id=signoff.id,
        level=signoff.level,
        entity_id=signoff.entity_id,
        entity_name=entity_name,
        signed_by=signoff.signed_by,
        signer_name=current_user.full_name or current_user.username,
        pdp_total=signoff.pdp_total,
        apc_total=signoff.apc_total,
        nnpp_total=signoff.nnpp_total,
        lp_total=signoff.lp_total,
        total_votes=signoff.total_votes,
        status=signoff.status,
        notes=signoff.notes,
        signed_at=signoff.signed_at,
    )


# ===========================================================
# 2. Get All Sign-offs
# ===========================================================

@router.get("/signoffs", response_model=List[SignoffResponse])
def get_signoffs(
    level: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(CollationSignoff)
    if level:
        query = query.filter(CollationSignoff.level == level.upper())
    signoffs = query.order_by(CollationSignoff.signed_at.desc()).all()

    results = []
    for s in signoffs:
        name = ""
        if s.level == "LGA":
            l = db.query(LGA).filter(LGA.id == s.entity_id).first()
            name = l.name if l else f"LGA {s.entity_id}"
        elif s.level == "WARD":
            w = db.query(Ward).filter(Ward.id == s.entity_id).first()
            name = w.name if w else f"Ward {s.entity_id}"
        elif s.level == "STATE":
            name = "Jigawa State"

        signer = db.query(User).filter(User.id == s.signed_by).first() if s.signed_by else None

        results.append(
            SignoffResponse(
                id=s.id,
                level=s.level,
                entity_id=s.entity_id,
                entity_name=name,
                signed_by=s.signed_by,
                signer_name=signer.full_name if signer else "Unknown",
                pdp_total=s.pdp_total,
                apc_total=s.apc_total,
                nnpp_total=s.nnpp_total,
                lp_total=s.lp_total,
                total_votes=s.total_votes,
                status=s.status,
                notes=s.notes,
                signed_at=s.signed_at,
            )
        )
    return results


# ===========================================================
# 3. LGA Hierarchical Drill-Down (LGA -> Wards -> PUs)
# ===========================================================

@router.get("/lga/{lga_id}")
def get_lga_drilldown(
    lga_id: int,
    db: Session = Depends(get_db),
):
    lga = db.query(LGA).filter(LGA.id == lga_id).first()
    if not lga:
        raise HTTPException(status_code=404, detail="LGA not found")

    signoff = (
        db.query(CollationSignoff)
        .filter(CollationSignoff.level == "LGA", CollationSignoff.entity_id == lga.id)
        .first()
    )
    signer = db.query(User).filter(User.id == signoff.signed_by).first() if signoff and signoff.signed_by else None

    wards = db.query(Ward).filter(Ward.lga_id == lga.id).order_by(Ward.name).all()

    ward_breakdowns = []
    lga_pdp = 0
    lga_apc = 0
    lga_nnpp = 0
    lga_lp = 0
    lga_total_votes = 0
    lga_collated_pus = 0
    lga_flagged_count = 0

    for ward in wards:
        pus = db.query(PollingUnit).filter(PollingUnit.ward_id == ward.id).order_by(PollingUnit.code).all()

        w_pdp = 0
        w_apc = 0
        w_nnpp = 0
        w_lp = 0
        w_total = 0
        w_collated = 0
        w_flagged = 0

        pu_items = []
        for pu in pus:
            res = db.query(VoteResult).filter(VoteResult.polling_unit_id == pu.id).first()
            if res:
                w_collated += 1
                w_pdp += res.pdp_votes
                w_apc += res.apc_votes
                w_nnpp += res.nnpp_votes
                w_lp += res.lp_votes
                w_total += res.total_votes_cast
                if res.verification_status == "FLAGGED":
                    w_flagged += 1

                pu_items.append({
                    "id": pu.id,
                    "code": pu.code,
                    "name": pu.name,
                    "registered_voters": pu.registered_voters,
                    "status": pu.status,
                    "verification_status": res.verification_status,
                    "pdp": res.pdp_votes,
                    "apc": res.apc_votes,
                    "nnpp": res.nnpp_votes,
                    "lp": res.lp_votes,
                    "total_cast": res.total_votes_cast,
                    "ec8a_photo_url": res.ec8a_photo_url,
                    "is_overvote": res.total_votes_cast > (pu.registered_voters or 0),
                })
            else:
                pu_items.append({
                    "id": pu.id,
                    "code": pu.code,
                    "name": pu.name,
                    "registered_voters": pu.registered_voters,
                    "status": pu.status,
                    "verification_status": "NOT_SUBMITTED",
                    "pdp": 0,
                    "apc": 0,
                    "nnpp": 0,
                    "lp": 0,
                    "total_cast": 0,
                    "ec8a_photo_url": None,
                    "is_overvote": False,
                })

        lga_pdp += w_pdp
        lga_apc += w_apc
        lga_nnpp += w_nnpp
        lga_lp += w_lp
        lga_total_votes += w_total
        lga_collated_pus += w_collated
        lga_flagged_count += w_flagged

        ward_breakdowns.append({
            "id": ward.id,
            "name": ward.name,
            "code": ward.code,
            "total_pus": len(pus),
            "collated_pus": w_collated,
            "flagged_count": w_flagged,
            "pdp": w_pdp,
            "apc": w_apc,
            "nnpp": w_nnpp,
            "lp": w_lp,
            "total_votes": w_total,
            "polling_units": pu_items,
        })

    total_pus_in_lga = sum(len(w["polling_units"]) for w in ward_breakdowns)

    return {
        "lga": {
            "id": lga.id,
            "name": lga.name,
            "code": lga.code,
            "registered_voters": lga.registered_voters,
            "total_pus": total_pus_in_lga,
            "collated_pus": lga_collated_pus,
            "flagged_count": lga_flagged_count,
            "pct": f"{(lga_collated_pus / total_pus_in_lga) * 100:.1f}%" if total_pus_in_lga else "0%",
            "pdp": lga_pdp,
            "apc": lga_apc,
            "nnpp": lga_nnpp,
            "lp": lga_lp,
            "total_votes": lga_total_votes,
            "signoff": {
                "is_signed": signoff is not None and signoff.status == "SIGNED",
                "status": signoff.status if signoff else "PENDING",
                "signer_name": signer.full_name if signer else None,
                "signed_at": signoff.signed_at.isoformat() if signoff else None,
                "notes": signoff.notes if signoff else None,
            }
        },
        "wards": ward_breakdowns,
    }
