from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime

from app.database import get_db
from app.models import ElectionActivity, PollingUnit, User
from app.core.permissions import require_agent
from app.core.audit import write_audit_log

router = APIRouter(
    prefix="/activities",
    tags=["Election Activities"],
)

class ActivityCreate(BaseModel):
    polling_unit_id: int
    activity_type: str
    notes: Optional[str] = None

class ActivityResponse(BaseModel):
    id: int
    polling_unit_id: int
    agent_id: int
    activity_type: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

@router.post("", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
def record_activity(
    payload: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_agent),
):
    pu = db.query(PollingUnit).filter(PollingUnit.id == payload.polling_unit_id).first()
    if not pu:
        raise HTTPException(status_code=404, detail="Polling unit not found")

    activity = ElectionActivity(
        polling_unit_id=payload.polling_unit_id,
        agent_id=current_user.id,
        activity_type=payload.activity_type,
        notes=payload.notes,
    )
    db.add(activity)

    write_audit_log(
        db=db,
        user=current_user,
        action="RECORD_ACTIVITY",
        details=f"PU {payload.polling_unit_id} Milestone: {payload.activity_type}",
    )

    db.commit()
    db.refresh(activity)
    return activity

@router.get("", response_model=List[ActivityResponse])
def get_activities(
    polling_unit_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(ElectionActivity)
    if polling_unit_id:
        query = query.filter(ElectionActivity.polling_unit_id == polling_unit_id)
    return query.order_by(ElectionActivity.created_at.desc()).limit(100).all()
