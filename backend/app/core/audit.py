from sqlalchemy.orm import Session
from app.models import AuditLog, User

def write_audit_log(
    db: Session,
    user: User | None,
    action: str,
    details: str = "",
    ip_address: str | None = None,
):
    log = AuditLog(
        user_id=user.id if user else None,
        username=user.username if user else None,
        action=action,
        details=details,
        ip_address=ip_address,
    )

    db.add(log)
    db.flush()