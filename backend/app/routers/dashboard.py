from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import (
    VoteResult,
    Incident,
    User,
    PollingUnit,
    LGA,
)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("")
def dashboard(db: Session = Depends(get_db)):

    total_polling_units = db.query(PollingUnit).count()

    active_agents = (
        db.query(User)
        .filter(User.is_active == True)
        .count()
    )

    total_results = db.query(VoteResult).count()

    total_incidents = db.query(Incident).count()

    pending_reports = total_polling_units - total_results

    pdp_votes = db.query(
        func.coalesce(func.sum(VoteResult.pdp_votes), 0)
    ).scalar()

    apc_votes = db.query(
        func.coalesce(func.sum(VoteResult.apc_votes), 0)
    ).scalar()

    nnpp_votes = db.query(
        func.coalesce(func.sum(VoteResult.nnpp_votes), 0)
    ).scalar()

    lp_votes = db.query(
        func.coalesce(func.sum(VoteResult.lp_votes), 0)
    ).scalar()

    others_votes = db.query(
        func.coalesce(func.sum(VoteResult.others_votes), 0)
    ).scalar()

    total_votes = (
        pdp_votes
        + apc_votes
        + nnpp_votes
        + lp_votes
        + others_votes
    )

    return {
        "kpi": {
            "polling_units": total_polling_units,
            "agents": active_agents,
            "reports": total_results,
            "incidents": total_incidents,
            "pending": pending_reports,
        },

        "votes": {
            "pdp": pdp_votes,
            "apc": apc_votes,
            "nnpp": nnpp_votes,
            "lp": lp_votes,
            "others": others_votes,
            "total": total_votes,
        },
    }