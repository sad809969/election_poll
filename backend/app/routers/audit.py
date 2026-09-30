from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import AuditLog, User
from app.schemas import AuditLogResponse
from app.core.permissions import require_admin

router = APIRouter(
    prefix="/audit",
    tags=["Audit Logs & Security Telemetry"],
)

LOGIN_ACTIONS = ["USER_LOGIN", "LOGIN_FAILED", "LOGIN_BLOCKED"]

# ==========================================================
# LIST LOGS (WITH ADVANCED CATEGORY & SEARCH FILTERS)
# ==========================================================

@router.get(
    "",
    response_model=List[AuditLogResponse],
)
@router.get(
    "-logs",
    response_model=List[AuditLogResponse],
)
def get_logs(
    category: Optional[str] = Query(None, description="Category filter: 'all', 'audit', 'activity', 'logins'"),
    action: Optional[str] = Query(None, description="Specific action filter"),
    search: Optional[str] = Query(None, description="Search keyword in username, details, or IP"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    query = db.query(AuditLog)

    if category == "logins":
        query = query.filter(AuditLog.action.in_(LOGIN_ACTIONS))
    elif category == "activity":
        query = query.filter(~AuditLog.action.in_(LOGIN_ACTIONS))
    elif action:
        query = query.filter(AuditLog.action == action)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                AuditLog.username.ilike(s),
                AuditLog.action.ilike(s),
                AuditLog.details.ilike(s),
                AuditLog.ip_address.ilike(s),
            )
        )

    return query.order_by(AuditLog.timestamp.desc()).limit(limit).all()


# ==========================================================
# DEDICATED CONVENIENCE ENDPOINTS
# ==========================================================

@router.get(
    "/activity",
    response_model=List[AuditLogResponse],
)
@router.get(
    "-logs/activity",
    response_model=List[AuditLogResponse],
)
def get_user_activity(
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Retrieve operational user activities (excluding raw authentication events)."""
    return get_logs(category="activity", search=search, limit=limit, db=db, current_user=current_user)


@router.get(
    "/logins",
    response_model=List[AuditLogResponse],
)
@router.get(
    "-logs/logins",
    response_model=List[AuditLogResponse],
)
def get_login_history(
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Retrieve user login stream and authentication history."""
    return get_logs(category="logins", search=search, limit=limit, db=db, current_user=current_user)


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

