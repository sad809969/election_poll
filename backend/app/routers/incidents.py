from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime
import os
import uuid

from app.database import get_db
from app.models import Incident, PollingUnit, User, IncidentSeverity, IncidentStatus
from app.schemas import IncidentCreate, IncidentResponse
from app.security import get_current_user
from app.config import settings

router = APIRouter(prefix="/incidents", tags=["Incident Management"])

@router.get("", response_model=List[IncidentResponse])
async def list_incidents(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    lga_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Incident).options(
        selectinload(Incident.polling_unit).selectinload(PollingUnit.lga),
        selectinload(Incident.reported_by_user)
    )
    if severity:
        query = query.where(Incident.severity == severity)
    if status:
        query = query.where(Incident.status == status)
    if lga_id:
        query = query.join(PollingUnit).where(PollingUnit.lga_id == lga_id)

    result = await db.execute(query.order_by(Incident.created_at.desc()))
    incidents = result.scalars().all()

    res = []
    for inc in incidents:
        res.append(IncidentResponse(
            id=inc.id,
            polling_unit_id=inc.polling_unit_id,
            reported_by=inc.reported_by,
            incident_type=inc.incident_type,
            severity=inc.severity,
            description=inc.description,
            status=inc.status,
            media_url=inc.media_url,
            latitude=inc.latitude,
            longitude=inc.longitude,
            created_at=inc.created_at,
            synced_at=inc.synced_at,
            pu_name=inc.polling_unit.name if inc.polling_unit else None,
            pu_code=inc.polling_unit.code if inc.polling_unit else None,
            lga_name=inc.polling_unit.lga.name if (inc.polling_unit and inc.polling_unit.lga) else None,
            reporter_name=inc.reported_by_user.full_name if inc.reported_by_user else None
        ))
    return res

@router.post("", response_model=IncidentResponse)
async def create_incident(
    payload: IncidentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    created_time = payload.created_at or datetime.utcnow()
    synced_time = datetime.utcnow()

    # Find PU to update status if critical
    pu_res = await db.execute(select(PollingUnit).where(PollingUnit.id == payload.polling_unit_id))
    pu = pu_res.scalars().first()
    if pu and payload.severity in [IncidentSeverity.HIGH.value, IncidentSeverity.CRITICAL.value]:
        pu.status = "Critical" if payload.severity == IncidentSeverity.CRITICAL.value else "Attention"

    incident = Incident(
        polling_unit_id=payload.polling_unit_id,
        reported_by=current_user.id,
        incident_type=payload.incident_type,
        severity=payload.severity,
        description=payload.description,
        media_url=payload.media_url,
        latitude=payload.latitude,
        longitude=payload.longitude,
        status=IncidentStatus.REPORTED.value,
        created_at=created_time,
        synced_at=synced_time
    )
    db.add(incident)
    await db.commit()
    await db.refresh(incident)

    return IncidentResponse(
        id=incident.id,
        polling_unit_id=incident.polling_unit_id,
        reported_by=incident.reported_by,
        incident_type=incident.incident_type,
        severity=incident.severity,
        description=incident.description,
        status=incident.status,
        media_url=incident.media_url,
        latitude=incident.latitude,
        longitude=incident.longitude,
        created_at=incident.created_at,
        synced_at=incident.synced_at,
        pu_name=pu.name if pu else None,
        pu_code=pu.code if pu else None,
        reporter_name=current_user.full_name
    )

@router.post("/upload-media")
async def upload_incident_media(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    filename = f"{uuid.uuid4().hex}_{file.filename}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)

    return {"url": f"/uploads/{filename}", "filename": filename}
