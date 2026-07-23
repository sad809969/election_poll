from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.database import get_db
from app.models import LGA, Ward, PollingUnit, User, UserRole
from app.schemas import LGAResponse, WardResponse, PollingUnitResponse, UserResponse
from app.security import get_current_user, get_password_hash

router = APIRouter(prefix="/electoral", tags=["Electoral Hierarchy"])

@router.get("/lgas", response_model=List[LGAResponse])
async def get_all_lgas(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LGA).order_by(LGA.name))
    return result.scalars().all()

@router.get("/wards", response_model=List[WardResponse])
async def get_wards_by_lga(lga_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    query = select(Ward)
    if lga_id:
        query = query.where(Ward.lga_id == lga_id)
    result = await db.execute(query.order_by(Ward.name))
    return result.scalars().all()

@router.get("/polling-units", response_model=List[PollingUnitResponse])
async def get_polling_units(
    lga_id: Optional[int] = None,
    ward_id: Optional[int] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(PollingUnit).options(
        selectinload(PollingUnit.lga),
        selectinload(PollingUnit.ward),
        selectinload(PollingUnit.agent)
    )
    if lga_id:
        query = query.where(PollingUnit.lga_id == lga_id)
    if ward_id:
        query = query.where(PollingUnit.ward_id == ward_id)
    if status:
        query = query.where(PollingUnit.status == status)

    result = await db.execute(query.order_by(PollingUnit.code))
    pus = result.scalars().all()

    response = []
    for pu in pus:
        response.append(PollingUnitResponse(
            id=pu.id,
            lga_id=pu.lga_id,
            ward_id=pu.ward_id,
            code=pu.code,
            name=pu.name,
            registered_voters=pu.registered_voters,
            status=pu.status,
            latitude=pu.latitude,
            longitude=pu.longitude,
            agent_name=pu.agent.full_name if pu.agent else "Unassigned",
            agent_phone=pu.agent.phone_number if pu.agent else None,
            lga_name=pu.lga.name if pu.lga else None,
            ward_name=pu.ward.name if pu.ward else None
        ))
    return response

@router.get("/users", response_model=List[UserResponse])
async def get_users_list(
    role: Optional[str] = None,
    lga_id: Optional[int] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(User).options(
        selectinload(User.lga),
        selectinload(User.ward),
        selectinload(User.polling_unit)
    )
    if role:
        query = query.where(User.role == role)
    if lga_id:
        query = query.where(User.lga_id == lga_id)
    if search:
        query = query.where(
            (User.full_name.contains(search)) | (User.username.contains(search)) | (User.phone_number.contains(search))
        )
    
    result = await db.execute(query.order_by(User.id.desc()))
    users = result.scalars().all()

    res = []
    for u in users:
        res.append(UserResponse(
            id=u.id,
            full_name=u.full_name,
            username=u.username,
            phone_number=u.phone_number,
            role=u.role,
            is_active=u.is_active,
            lga_id=u.lga_id,
            ward_id=u.ward_id,
            polling_unit_id=u.polling_unit_id,
            last_login=u.last_login,
            created_at=u.created_at,
            lga_name=u.lga.name if u.lga else None,
            ward_name=u.ward.name if u.ward else None,
            pu_code=u.polling_unit.code if u.polling_unit else None
        ))
    return res

@router.post("/import-agents-csv")
async def import_agents_csv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contents = await file.read()
    lines = contents.decode("utf-8").splitlines()
    imported_count = 0
    # Simulate processing CSV rows
    for line in lines[1:]: # Skip header
        parts = line.split(",")
        if len(parts) >= 3:
            name, phone, username = parts[0].strip(), parts[1].strip(), parts[2].strip()
            existing = await db.execute(select(User).where(User.username == username))
            if not existing.scalars().first():
                user = User(
                    full_name=name,
                    username=username,
                    phone_number=phone,
                    hashed_password=get_password_hash("password123"),
                    role=UserRole.POLLING_UNIT_AGENT.value
                )
                db.add(user)
                imported_count += 1
    await db.commit()
    return {"status": "success", "imported_count": imported_count, "message": f"{imported_count} agents imported successfully"}
