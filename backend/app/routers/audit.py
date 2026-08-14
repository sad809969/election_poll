from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AuditLog, User
from app.schemas import AuditLogResponse, MessageResponse
from app.core.permissions import require_admin

router = APIRouter(
    prefix="/audit",
    tags=["Audit Logs"],
)

# ==========================================================
# LIST LOGS
# ==========================================================

@router.get(
    "",
    response_model=list[AuditLogResponse],
)
def get_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    return (
        db.query(AuditLog)
        .order_by(AuditLog.timestamp.desc())
        .all()
    )


# ==========================================================
# GET SINGLE LOG
# ==========================================================

@router.get(
    "/{log_id}",
    response_model=AuditLogResponse,
)
def get_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    log = (
        db.query(AuditLog)
        .filter(AuditLog.id == log_id)
        .first()
    )

    if not log:
        raise HTTPException(
            status_code=404,
            detail="Log not found",
        )

    return log


# ==========================================================
# DELETE LOG
# ==========================================================

@router.delete(
    "/{log_id}",
    response_model=MessageResponse,
)
def delete_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    log = (
        db.query(AuditLog)
        .filter(AuditLog.id == log_id)
        .first()
    )

    if not log:
        raise HTTPException(
            status_code=404,
            detail="Log not found",
        )

    db.delete(log)
    db.commit()

    return {
        "message": "Audit log deleted successfully"
    }