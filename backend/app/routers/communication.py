from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional

from app.database import get_db
from app.models import Announcement, Message, User
from app.schemas import AnnouncementCreate, AnnouncementResponse
from app.security import get_current_user

router = APIRouter(prefix="/communication", tags=["Communication Center"])

@router.get("/announcements", response_model=List[AnnouncementResponse])
async def list_announcements(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Announcement).order_by(Announcement.is_pinned.desc(), Announcement.created_at.desc()))
    return result.scalars().all()

@router.post("/announcements", response_model=AnnouncementResponse)
async def create_announcement(
    payload: AnnouncementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ann = Announcement(
        title=payload.title,
        message=payload.message,
        sender_name=current_user.full_name,
        urgency=payload.urgency,
        target_role=payload.target_role,
        is_pinned=payload.is_pinned
    )
    db.add(ann)
    await db.commit()
    await db.refresh(ann)
    return ann

@router.get("/stats")
async def get_communication_stats():
    return {
        "messages_sent": 1248,
        "recipients_reached": 4327,
        "announcements_count": 18,
        "alerts_sent": 7,
        "delivery_rate": 98.6
    }
