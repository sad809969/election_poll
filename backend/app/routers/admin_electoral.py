import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import LGA, Ward, PollingUnit, User, Party, ElectionResult, Incident
from app.core.config import settings
from app.core.permissions import require_admin

# Electoral infrastructure and permission management is admin-only.
router = APIRouter(
    prefix="/admin",
    tags=["Super Admin Electoral Management"],
    dependencies=[Depends(require_admin)],
)

# =============================================================================
# SCHEMAS
# =============================================================================

class DashboardStats(BaseModel):
    lgas_count: int
    wards_count: int
    polling_units_count: int
    registered_voters: int
    parties_count: int
    users_count: int
    results_count: int
    incidents_count: int
    verified_results: int
    flagged_results: int
    active_agents: int
    system_status: str
    database_driver: str

class PartyCreate(BaseModel):
    name: str
    abbreviation: str
    color: Optional[str] = "#008751"
    logo_url: Optional[str] = None
    is_active: bool = True

class PartyUpdate(BaseModel):
    name: Optional[str] = None
    abbreviation: Optional[str] = None
    color: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: Optional[bool] = None

class LgaCreate(BaseModel):
    name: str
    code: str
    registered_voters: Optional[int] = 0

class LgaUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    registered_voters: Optional[int] = None

class WardCreate(BaseModel):
    name: str
    code: Optional[str] = None
    lga_id: int

class WardUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    lga_id: Optional[int] = None

class PollingUnitCreate(BaseModel):
    code: str
    name: str
    lga_id: int
    ward_id: int
    registered_voters: Optional[int] = 0
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class PollingUnitUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    lga_id: Optional[int] = None
    ward_id: Optional[int] = None
    registered_voters: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class PermissionUpdate(BaseModel):
    user_id: int
    allowed_pages: List[str]

class RolePermissionUpdate(BaseModel):
    role: str
    allowed_pages: List[str]


# =============================================================================
# 1. LIVE DASHBOARD STATS
# =============================================================================

@router.get("/dashboard-stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Provides 100% live database counts and operational telemetry for Side A."""
    lgas_count = db.query(LGA).count()
    wards_count = db.query(Ward).count()
    pus_count = db.query(PollingUnit).count()
    
    total_reg = db.query(func.sum(PollingUnit.registered_voters)).scalar() or 0
    parties_count = db.query(Party).count()
    users_count = db.query(User).count()
    active_agents = db.query(User).filter(User.role == "Polling Unit Agent", User.is_active == True).count()
    
    results_count = db.query(ElectionResult).count()
    verified_results = db.query(ElectionResult).filter(ElectionResult.verification_status == "VERIFIED").count()
    flagged_results = db.query(ElectionResult).filter(ElectionResult.verification_status == "FLAGGED").count()
    incidents_count = db.query(Incident).count()

    db_driver = "PostgreSQL" if "postgresql" in settings.DATABASE_URL else "SQLite"

    return {
        "lgas_count": lgas_count,
        "wards_count": wards_count,
        "polling_units_count": pus_count,
        "registered_voters": int(total_reg),
        "parties_count": parties_count,
        "users_count": users_count,
        "results_count": results_count,
        "incidents_count": incidents_count,
        "verified_results": verified_results,
        "flagged_results": flagged_results,
        "active_agents": active_agents,
        "system_status": "ONLINE",
        "database_driver": db_driver
    }



# =============================================================================
# 1A. FORCE-SEED POLLING UNITS (Admin trigger for live DB)
# =============================================================================

@router.post("/seed-polling-units")
def seed_polling_units(force: bool = False, db: Session = Depends(get_db)):
    """
    Trigger seeding of all 4,827 official INEC Jigawa polling units.

    - Default (force=false): adds polling units only if count is 0.
    - force=true: nulls FK refs on all dependent tables, wipes, and re-seeds.
    """
    from app.seed import _seed_polling_units, _refresh_polling_unit_counts
    from app.models import (
        ElectionResult, ElectionResultVote, Incident,
        ElectionActivity, VoteResult, ElectionAgentAssignment, User
    )

    count_before = db.query(PollingUnit).count()

    if count_before > 0 and not force:
        return {
            "message": f"Polling units already exist: {count_before} units. Use ?force=true to wipe and re-seed.",
            "seeded": False,
            "polling_units": count_before,
        }

    if force and count_before > 0:
        # Null FK references on all tables that point to polling_unit_id
        # so we don't hit FK constraint violations on delete.
        db.query(ElectionResultVote).delete(synchronize_session=False)
        db.query(ElectionResult).update({"polling_unit_id": None}, synchronize_session=False)
        db.query(VoteResult).delete(synchronize_session=False)
        db.query(Incident).update({"polling_unit_id": None}, synchronize_session=False)
        db.query(ElectionActivity).update({"polling_unit_id": None}, synchronize_session=False)
        db.query(ElectionAgentAssignment).update({"polling_unit_id": None}, synchronize_session=False)
        db.query(User).update({"polling_unit_id": None}, synchronize_session=False)
        db.commit()
        db.query(PollingUnit).delete(synchronize_session=False)
        db.commit()

    _seed_polling_units(db)
    _refresh_polling_unit_counts(db)

    count_after = db.query(PollingUnit).count()
    return {
        "message": f"Successfully seeded {count_after} official INEC Jigawa polling units across all 27 LGAs.",
        "seeded": True,
        "polling_units": count_after,
    }



# =============================================================================
# 1B. ELECTORAL HIERARCHY TREE (LGA -> WARDS -> POLLING UNITS)
# =============================================================================

@router.get("/electoral-hierarchy")
def get_electoral_hierarchy(db: Session = Depends(get_db)):
    """
    Returns the complete hierarchy of 27 LGAs with their authentic wards,
    PU counts, and registered voters for instantaneous drill-down navigation.
    """
    lgas = db.query(LGA).order_by(LGA.name.asc()).all()
    wards = db.query(Ward).order_by(Ward.name.asc()).all()
    
    # Pre-aggregate polling units count and registered voters per ward
    pu_stats = db.query(
        PollingUnit.ward_id,
        func.count(PollingUnit.id).label("pu_count"),
        func.coalesce(func.sum(PollingUnit.registered_voters), 0).label("voters")
    ).group_by(PollingUnit.ward_id).all()
    
    pu_map = {row.ward_id: {"pu_count": row.pu_count, "voters": int(row.voters)} for row in pu_stats}
    
    # Map wards to LGAs
    wards_by_lga = {}
    for w in wards:
        stats = pu_map.get(w.id, {"pu_count": 0, "voters": 0})
        wards_by_lga.setdefault(w.lga_id, []).append({
            "id": w.id,
            "name": w.name,
            "code": w.code,
            "polling_units_count": stats["pu_count"],
            "registered_voters": stats["voters"]
        })
        
    result = []
    for lga in lgas:
        lga_wards = wards_by_lga.get(lga.id, [])
        total_pus = sum(w["polling_units_count"] for w in lga_wards)
        total_voters = sum(w["registered_voters"] for w in lga_wards) or lga.registered_voters or 0
        result.append({
            "id": lga.id,
            "name": lga.name,
            "code": lga.code,
            "wards_count": len(lga_wards),
            "polling_units_count": total_pus,
            "registered_voters": total_voters,
            "wards": lga_wards
        })
        
    return {
        "total_lgas": len(result),
        "total_wards": sum(item["wards_count"] for item in result),
        "total_polling_units": sum(item["polling_units_count"] for item in result),
        "lgas": result
    }


# =============================================================================
# 2. POLITICAL PARTIES CRUD
# =============================================================================

@router.get("/parties")
def list_parties(db: Session = Depends(get_db)):
    parties = db.query(Party).order_by(Party.id.asc()).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "abbreviation": p.abbreviation,
            "color": p.color or "#008751",
            "logo_url": p.logo_url,
            "is_active": p.is_active,
            "created_at": p.created_at.isoformat() if p.created_at else None
        }
        for p in parties
    ]

@router.post("/parties", status_code=status.HTTP_201_CREATED)
def create_party(party_in: PartyCreate, db: Session = Depends(get_db)):
    existing = db.query(Party).filter(
        (func.lower(Party.abbreviation) == party_in.abbreviation.lower()) |
        (func.lower(Party.name) == party_in.name.lower())
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Party name or abbreviation already registered")

    party = Party(
        name=party_in.name.strip(),
        abbreviation=party_in.abbreviation.strip().upper(),
        color=party_in.color or "#008751",
        logo_url=party_in.logo_url,
        is_active=party_in.is_active
    )
    db.add(party)
    db.commit()
    db.refresh(party)
    return party

@router.patch("/parties/{party_id}")
def update_party(party_id: int, party_in: PartyUpdate, db: Session = Depends(get_db)):
    party = db.query(Party).filter(Party.id == party_id).first()
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")

    if party_in.name is not None:
        party.name = party_in.name.strip()
    if party_in.abbreviation is not None:
        party.abbreviation = party_in.abbreviation.strip().upper()
    if party_in.color is not None:
        party.color = party_in.color
    if party_in.logo_url is not None:
        party.logo_url = party_in.logo_url
    if party_in.is_active is not None:
        party.is_active = party_in.is_active

    db.commit()
    db.refresh(party)
    return party

@router.delete("/parties/{party_id}")
def delete_party(party_id: int, db: Session = Depends(get_db)):
    party = db.query(Party).filter(Party.id == party_id).first()
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    db.delete(party)
    db.commit()
    return {"status": "success", "message": f"Party {party.abbreviation} deleted"}


# =============================================================================
# 3. LGAS CRUD
# =============================================================================

@router.get("/lgas")
def list_lgas(db: Session = Depends(get_db)):
    lgas = db.query(LGA).order_by(LGA.name.asc()).all()
    out = []
    for l in lgas:
        wards_cnt = db.query(Ward).filter(Ward.lga_id == l.id).count()
        pus_cnt = db.query(PollingUnit).filter(PollingUnit.lga_id == l.id).count()
        voters = db.query(func.sum(PollingUnit.registered_voters)).filter(PollingUnit.lga_id == l.id).scalar() or l.registered_voters or 0
        out.append({
            "id": l.id,
            "name": l.name,
            "code": l.code,
            "wards_count": wards_cnt,
            "polling_units_count": pus_cnt,
            "registered_voters": int(voters)
        })
    return out

@router.post("/lgas", status_code=status.HTTP_201_CREATED)
def create_lga(lga_in: LgaCreate, db: Session = Depends(get_db)):
    existing = db.query(LGA).filter(
        (func.lower(LGA.name) == lga_in.name.lower()) |
        (func.lower(LGA.code) == lga_in.code.lower())
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="LGA with this name or code already exists")

    lga = LGA(
        name=lga_in.name.strip(),
        code=lga_in.code.strip().upper(),
        registered_voters=lga_in.registered_voters or 0
    )
    db.add(lga)
    db.commit()
    db.refresh(lga)
    return lga

@router.patch("/lgas/{lga_id}")
def update_lga(lga_id: int, lga_in: LgaUpdate, db: Session = Depends(get_db)):
    lga = db.query(LGA).filter(LGA.id == lga_id).first()
    if not lga:
        raise HTTPException(status_code=404, detail="LGA not found")

    if lga_in.name is not None:
        lga.name = lga_in.name.strip()
    if lga_in.code is not None:
        lga.code = lga_in.code.strip().upper()
    if lga_in.registered_voters is not None:
        lga.registered_voters = lga_in.registered_voters

    db.commit()
    db.refresh(lga)
    return lga

@router.delete("/lgas/{lga_id}")
def delete_lga(lga_id: int, db: Session = Depends(get_db)):
    lga = db.query(LGA).filter(LGA.id == lga_id).first()
    if not lga:
        raise HTTPException(status_code=404, detail="LGA not found")
    db.delete(lga)
    db.commit()
    return {"status": "success", "message": f"LGA {lga.name} deleted"}


# =============================================================================
# 4. WARDS CRUD
# =============================================================================

@router.get("/wards")
def list_wards(lga_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Ward)
    if lga_id:
        query = query.filter(Ward.lga_id == lga_id)
    wards = query.order_by(Ward.name.asc()).all()
    
    out = []
    for w in wards:
        pus_cnt = db.query(PollingUnit).filter(PollingUnit.ward_id == w.id).count()
        voters = db.query(func.sum(PollingUnit.registered_voters)).filter(PollingUnit.ward_id == w.id).scalar() or 0
        lga_name = w.lga.name if w.lga else "Unknown"
        out.append({
            "id": w.id,
            "name": w.name,
            "code": w.code,
            "lga_id": w.lga_id,
            "lga_name": lga_name,
            "polling_units_count": pus_cnt,
            "registered_voters": int(voters)
        })
    return out

@router.post("/wards", status_code=status.HTTP_201_CREATED)
def create_ward(ward_in: WardCreate, db: Session = Depends(get_db)):
    lga = db.query(LGA).filter(LGA.id == ward_in.lga_id).first()
    if not lga:
        raise HTTPException(status_code=404, detail="Specified LGA does not exist")

    existing = db.query(Ward).filter(
        Ward.lga_id == ward_in.lga_id,
        func.lower(Ward.name) == ward_in.name.lower()
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ward already exists in this LGA")

    code = ward_in.code.strip().upper() if ward_in.code else f"{lga.code}-W{db.query(Ward).filter(Ward.lga_id == lga.id).count() + 1}"
    ward = Ward(
        name=ward_in.name.strip(),
        code=code,
        lga_id=ward_in.lga_id
    )
    db.add(ward)
    db.commit()
    db.refresh(ward)
    return ward

@router.patch("/wards/{ward_id}")
def update_ward(ward_id: int, ward_in: WardUpdate, db: Session = Depends(get_db)):
    ward = db.query(Ward).filter(Ward.id == ward_id).first()
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")

    if ward_in.name is not None:
        ward.name = ward_in.name.strip()
    if ward_in.code is not None:
        ward.code = ward_in.code.strip().upper()
    if ward_in.lga_id is not None:
        ward.lga_id = ward_in.lga_id

    db.commit()
    db.refresh(ward)
    return ward

@router.delete("/wards/{ward_id}")
def delete_ward(ward_id: int, db: Session = Depends(get_db)):
    ward = db.query(Ward).filter(Ward.id == ward_id).first()
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")
    db.delete(ward)
    db.commit()
    return {"status": "success", "message": f"Ward {ward.name} deleted"}


# =============================================================================
# 5. POLLING UNITS CRUD
# =============================================================================

@router.get("/polling-units")
def list_polling_units(
    lga_id: Optional[int] = None,
    ward_id: Optional[int] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(PollingUnit)
    if lga_id:
        query = query.filter(PollingUnit.lga_id == lga_id)
    if ward_id:
        query = query.filter(PollingUnit.ward_id == ward_id)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((PollingUnit.code.ilike(s)) | (PollingUnit.name.ilike(s)))

    total = query.count()
    offset = (page - 1) * limit
    pus = query.order_by(PollingUnit.id.asc()).offset(offset).limit(limit).all()

    items = []
    for pu in pus:
        items.append({
            "id": pu.id,
            "code": pu.code,
            "name": pu.name,
            "registered_voters": pu.registered_voters,
            "lga_id": pu.lga_id,
            "lga_name": pu.lga.name if pu.lga else "Unknown",
            "ward_id": pu.ward_id,
            "ward_name": pu.ward.name if pu.ward else "Unknown",
            "latitude": pu.latitude,
            "longitude": pu.longitude,
            "status": pu.status
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit
    }

@router.post("/polling-units", status_code=status.HTTP_201_CREATED)
def create_polling_unit(pu_in: PollingUnitCreate, db: Session = Depends(get_db)):
    existing = db.query(PollingUnit).filter(PollingUnit.code == pu_in.code.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Polling unit code already exists")

    pu = PollingUnit(
        code=pu_in.code.strip(),
        name=pu_in.name.strip(),
        lga_id=pu_in.lga_id,
        ward_id=pu_in.ward_id,
        registered_voters=pu_in.registered_voters or 0,
        latitude=pu_in.latitude,
        longitude=pu_in.longitude
    )
    db.add(pu)
    db.commit()
    db.refresh(pu)
    return pu

@router.patch("/polling-units/{pu_id}")
def update_polling_unit(pu_id: int, pu_in: PollingUnitUpdate, db: Session = Depends(get_db)):
    pu = db.query(PollingUnit).filter(PollingUnit.id == pu_id).first()
    if not pu:
        raise HTTPException(status_code=404, detail="Polling unit not found")

    if pu_in.code is not None:
        pu.code = pu_in.code.strip()
    if pu_in.name is not None:
        pu.name = pu_in.name.strip()
    if pu_in.lga_id is not None:
        pu.lga_id = pu_in.lga_id
    if pu_in.ward_id is not None:
        pu.ward_id = pu_in.ward_id
    if pu_in.registered_voters is not None:
        pu.registered_voters = pu_in.registered_voters
    if pu_in.latitude is not None:
        pu.latitude = pu_in.latitude
    if pu_in.longitude is not None:
        pu.longitude = pu_in.longitude

    db.commit()
    db.refresh(pu)
    return pu

@router.delete("/polling-units/{pu_id}")
def delete_polling_unit(pu_id: int, db: Session = Depends(get_db)):
    pu = db.query(PollingUnit).filter(PollingUnit.id == pu_id).first()
    if not pu:
        raise HTTPException(status_code=404, detail="Polling unit not found")
    db.delete(pu)
    db.commit()
    return {"status": "success", "message": f"Polling unit {pu.code} deleted"}


# =============================================================================
# 6. PERMISSIONS MATRIX API
# =============================================================================

@router.get("/permissions")
def list_permissions(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.id.asc()).all()
    out = []
    for u in users:
        parsed_pages = []
        if u.allowed_pages:
            try:
                parsed_pages = json.loads(u.allowed_pages)
            except Exception:
                parsed_pages = [p.strip() for p in u.allowed_pages.split(",") if p.strip()]
        out.append({
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "role": u.role,
            "phone_number": u.phone_number,
            "is_active": u.is_active,
            "lga_id": u.lga_id,
            "ward_id": u.ward_id,
            "polling_unit_id": u.polling_unit_id,
            "allowed_pages": parsed_pages
        })
    return out

@router.post("/permissions/update")
def update_user_permissions(perm_in: PermissionUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == perm_in.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.allowed_pages = json.dumps(perm_in.allowed_pages)
    db.commit()
    db.refresh(user)
    return {
        "status": "success",
        "user_id": user.id,
        "username": user.username,
        "allowed_pages": perm_in.allowed_pages
    }

@router.post("/permissions/role-update")
def update_role_permissions(perm_in: RolePermissionUpdate, db: Session = Depends(get_db)):
    users = db.query(User).filter(func.lower(User.role) == perm_in.role.lower()).all()
    count = 0
    pages_json = json.dumps(perm_in.allowed_pages)
    for u in users:
        u.allowed_pages = pages_json
        count += 1
    db.commit()
    return {
        "status": "success",
        "role": perm_in.role,
        "updated_users_count": count,
        "allowed_pages": perm_in.allowed_pages
    }
