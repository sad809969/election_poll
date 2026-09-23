from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Incident, PollingUnit, User
from app.schemas import (
    IncidentCreate,
    IncidentResponse,
    IncidentStatusUpdate,
    MessageResponse,
)
from app.core.permissions import require_admin, require_agent
from app.core.audit import write_audit_log

router = APIRouter(
    prefix="/incidents",
    tags=["Incident Management"],
)

# ==========================================================
# LIST INCIDENTS
# ==========================================================

@router.get(
    "",
    response_model=list[IncidentResponse],
)
def get_incidents(
    polling_unit_id: int | None = None,
    status: str | None = None,
    severity: str | None = None,
    db: Session = Depends(get_db),
):

    query = db.query(Incident)

    if polling_unit_id is not None:
        query = query.filter(
            Incident.polling_unit_id == polling_unit_id
        )

    if status is not None:
        query = query.filter(
            Incident.status == status
        )

    if severity is not None:
        query = query.filter(
            Incident.severity == severity
        )

    incidents = query.order_by(
        Incident.created_at.desc()
    ).all()

    enriched = []
    for inc in incidents:
        pu = inc.polling_unit
        reporter = inc.reporter
        lga = pu.lga if pu else None
        enriched.append(
            IncidentResponse(
                id=inc.id,
                polling_unit_id=inc.polling_unit_id,
                incident_type=inc.incident_type,
                severity=inc.severity,
                description=inc.description,
                media_url=inc.media_url,
                latitude=inc.latitude,
                longitude=inc.longitude,
                reported_by=inc.reported_by,
                status=inc.status,
                created_at=inc.created_at,
                polling_unit_code=pu.code if pu else None,
                polling_unit_name=pu.name if pu else None,
                lga_name=lga.name if lga else None,
                reporter_name=reporter.full_name if reporter else None,
                reporter_phone=reporter.phone_number if reporter else None,
            )
        )
    return enriched


# ==========================================================
# GET ONE INCIDENT
# ==========================================================

@router.get(
    "/{incident_id}",
    response_model=IncidentResponse,
)
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db),
):

    incident = (
        db.query(Incident)
        .filter(Incident.id == incident_id)
        .first()
    )

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found",
        )

    pu = incident.polling_unit
    reporter = incident.reporter
    lga = pu.lga if pu else None

    return IncidentResponse(
        id=incident.id,
        polling_unit_id=incident.polling_unit_id,
        incident_type=incident.incident_type,
        severity=incident.severity,
        description=incident.description,
        media_url=incident.media_url,
        latitude=incident.latitude,
        longitude=incident.longitude,
        reported_by=incident.reported_by,
        status=incident.status,
        created_at=incident.created_at,
        polling_unit_code=pu.code if pu else None,
        polling_unit_name=pu.name if pu else None,
        lga_name=lga.name if lga else None,
        reporter_name=reporter.full_name if reporter else None,
        reporter_phone=reporter.phone_number if reporter else None,
    )


# ==========================================================
# CREATE INCIDENT
# ==========================================================

@router.post(
    "",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_incident(
    payload: IncidentCreate,
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
            detail="Polling Unit not found",
        )

    incident = Incident(

        polling_unit_id=payload.polling_unit_id,

        reported_by=current_user.id,

        incident_type=payload.incident_type,

        severity=payload.severity,

        description=payload.description,

        media_url=payload.media_url,

        latitude=payload.latitude,

        longitude=payload.longitude,
    )

    write_audit_log(
    db=db,
    user=current_user,
    action="REPORT_INCIDENT",
    details=f"{payload.incident_type} at Polling Unit {payload.polling_unit_id}",
   )

    db.add(incident)

    db.commit()

    db.refresh(incident)

    return incident


# ==========================================================
# UPDATE INCIDENT STATUS
# ==========================================================

@router.patch(
    "/{incident_id}/status",
    response_model=IncidentResponse,
)
def update_incident_status(
    incident_id: int,
    payload: IncidentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    incident = (
        db.query(Incident)
        .filter(Incident.id == incident_id)
        .first()
    )

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found",
        )

    incident.status = payload.status
    write_audit_log(
    db=db,
    user=current_user,
    action="UPDATE_INCIDENT",
    details=f"Incident ID {incident.id}",
)

    db.commit()

    db.refresh(incident)

    return incident


# ==========================================================
# DELETE INCIDENT
# ==========================================================

@router.delete(
    "/{incident_id}",
    response_model=MessageResponse,
)
def delete_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    incident = (
        db.query(Incident)
        .filter(Incident.id == incident_id)
        .first()
    )

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found",
        )

    write_audit_log(
    db=db,
    user=current_user,
    action="DELETE_INCIDENT",
    details=f"Incident ID {incident.id}",
)

    db.delete(incident)

    db.commit()

    return {
        "message": "Incident deleted successfully"
    }