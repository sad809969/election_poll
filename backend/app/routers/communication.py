from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Announcement, Message, User
from app.schemas import (
    AnnouncementCreate,
    AnnouncementResponse,
    MessageCreate,
    MessageResponse,
    MessageResponseModel,
)
from app.core.permissions import require_admin, get_current_user
from app.core.audit import write_audit_log

router = APIRouter(
    prefix="/communication",
    tags=["Communication"],
)

# ==========================================================
# ANNOUNCEMENTS
# ==========================================================

@router.get(
    "/announcements",
    response_model=list[AnnouncementResponse],
)
def get_announcements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Announcement)
        .order_by(Announcement.created_at.desc())
        .all()
    )


@router.post(
    "/announcements",
    response_model=AnnouncementResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_announcement(
    payload: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    announcement = Announcement(
        title=payload.title,
        message=payload.message,
        sender_name=current_user.full_name,
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


@router.delete(
    "/announcements/{announcement_id}",
    response_model=MessageResponse,
)
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
        raise HTTPException(404, "Announcement not found")

    db.delete(announcement)
    db.commit()

    return {
        "message": "Announcement deleted successfully"
    }

# ==========================================================
# MESSAGES
# ==========================================================

@router.get(
    "/messages",
    response_model=list[MessageResponseModel],
)
def get_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Message)
        .order_by(Message.created_at.desc())
        .all()
    )


@router.post(
    "/messages",
    response_model=MessageResponseModel,
    status_code=status.HTTP_201_CREATED,
)
def send_message(
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    message = Message(
        sender_id=current_user.id,
        recipient_id=payload.recipient_id,
        channel=payload.channel,
        content=payload.content,
    )

    write_audit_log(
    db=db,
    user=current_user,
    action="SEND_MESSAGE",
    details=f"Channel: {message.channel}",
)

    db.add(message)
    db.commit()
    db.refresh(message)

    try:
        from app.routers.ws import dispatch_live_event
        dispatch_live_event({
            "type": "message",
            "id": message.id,
            "title": f"Message: {message.channel.title()}",
            "message": message.content,
            "channel": message.channel,
            "sender_id": message.sender_id,
            "recipient_id": message.recipient_id,
            "timestamp": message.created_at.isoformat() if message.created_at else None,
        })
    except Exception:
        pass

    return message


@router.delete(
    "/messages/{message_id}",
    response_model=MessageResponse,
)
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    message = (
        db.query(Message)
        .filter(Message.id == message_id)
        .first()
    )

    if not message:
        raise HTTPException(404, "Message not found")

    db.delete(message)
    db.commit()

    return {
        "message": "Message deleted successfully"
    }