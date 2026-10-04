from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import Announcement, User
from app.schemas import (
    AnnouncementCreate,
    AnnouncementResponse,
    MessageResponse,
)
from app.core.permissions import require_admin, require_agent, require_viewer
from app.core.audit import write_audit_log

router = APIRouter(
    prefix="/announcements",
    tags=["Announcements"],
)


@router.get("", response_model=list[AnnouncementResponse])
def get_announcements(
    db: Session = Depends(get_db),
    _: User = Depends(require_viewer),
):
    return (
        db.query(Announcement)
        .order_by(Announcement.created_at.desc())
        .all()
    )


@router.post("", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
def create_announcement(
    payload: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    sender = payload.sender_name or current_user.full_name or "Situation Room HQ"

    announcement = Announcement(
        title=payload.title,
        message=payload.message,
        sender_name=sender,
        urgency=payload.urgency,
        target_role=payload.target_role,
        target_lga_id=payload.target_lga_id,
        is_pinned=payload.is_pinned,
    )

    write_audit_log(
        db=db,
        user=current_user,
        action="CREATE_ANNOUNCEMENT",
        details=announcement.title,
    )

    db.add(announcement)
    db.commit()
    db.refresh(announcement)

    try:
        from app.routers.ws import dispatch_live_event
        dispatch_live_event({
            "type": "broadcast",
            "id": announcement.id,
            "title": announcement.title,
            "message": announcement.message,
            "urgency": announcement.urgency or "Normal",
            "sender_name": announcement.sender_name,
            "target_role": announcement.target_role,
            "target_lga_id": announcement.target_lga_id,
            "is_pinned": announcement.is_pinned,
            "timestamp": announcement.created_at.isoformat() if announcement.created_at else None,
        })
    except Exception:
        pass

    return announcement


@router.delete("/{announcement_id}", response_model=MessageResponse)
def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    announcement = (
        db.query(Announcement)
        .filter(Announcement.id == announcement_id)
        .first()
    )

    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    db.delete(announcement)
    db.commit()

    return {"message": "Announcement deleted successfully"}


# Alias router so /api/broadcasts maps 1:1 to announcements
broadcasts_router = APIRouter(
    prefix="/broadcasts",
    tags=["Broadcasts"],
)
broadcasts_router.add_api_route("", get_announcements, methods=["GET"], response_model=list[AnnouncementResponse])
broadcasts_router.add_api_route("", create_announcement, methods=["POST"], response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
broadcasts_router.add_api_route("/{announcement_id}", delete_announcement, methods=["DELETE"], response_model=MessageResponse)

