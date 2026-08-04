from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import LGA, Ward, PollingUnit, User
from app.schemas import (
    LGACreate,
    LGAUpdate,
    LGAResponse,

    WardCreate,
    WardUpdate,
    WardResponse,

    PollingUnitCreate,
    PollingUnitUpdate,
    PollingUnitResponse,

    MessageResponse,
)
from app.core.permissions import require_admin

router = APIRouter(
    prefix="/electoral",
    tags=["Electoral Management"],
)

# ==========================================================
# LGA ENDPOINTS
# ==========================================================


@router.get(
    "/lgas",
    response_model=list[LGAResponse],
)
def get_lgas(
    db: Session = Depends(get_db),
):
    return (
        db.query(LGA)
        .order_by(LGA.name)
        .all()
    )


@router.get(
    "/lgas/{lga_id}",
    response_model=LGAResponse,
)
def get_lga(
    lga_id: int,
    db: Session = Depends(get_db),
):

    lga = (
        db.query(LGA)
        .filter(LGA.id == lga_id)
        .first()
    )

    if not lga:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="LGA not found",
        )

    return lga


@router.post(
    "/lgas",
    response_model=LGAResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_lga(
    payload: LGACreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    existing = (
        db.query(LGA)
        .filter(
            (LGA.name == payload.name)
            | (LGA.code == payload.code)
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="LGA already exists",
        )

    lga = LGA(
        name=payload.name,
        code=payload.code,
        registered_voters=payload.registered_voters,
    )

    db.add(lga)
    db.commit()
    db.refresh(lga)

    return lga


@router.put(
    "/lgas/{lga_id}",
    response_model=LGAResponse,
)
def update_lga(
    lga_id: int,
    payload: LGAUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    lga = (
        db.query(LGA)
        .filter(LGA.id == lga_id)
        .first()
    )

    if not lga:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="LGA not found",
        )

    data = payload.model_dump(exclude_unset=True)

    for key, value in data.items():
        setattr(lga, key, value)

    db.commit()
    db.refresh(lga)

    return lga


@router.delete(
    "/lgas/{lga_id}",
    response_model=MessageResponse,
)
def delete_lga(
    lga_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    lga = (
        db.query(LGA)
        .filter(LGA.id == lga_id)
        .first()
    )

    if not lga:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="LGA not found",
        )

    db.delete(lga)
    db.commit()

    return {
        "message": "LGA deleted successfully"
    }
# ==========================================================
# WARD ENDPOINTS
# ==========================================================

@router.get(
    "/wards",
    response_model=list[WardResponse],
)
def get_wards(
    lga_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Ward)

    if lga_id is not None:
        query = query.filter(Ward.lga_id == lga_id)

    return query.order_by(Ward.name).all()


@router.get(
    "/wards/{ward_id}",
    response_model=WardResponse,
)
def get_ward(
    ward_id: int,
    db: Session = Depends(get_db),
):
    ward = (
        db.query(Ward)
        .filter(Ward.id == ward_id)
        .first()
    )

    if not ward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ward not found",
        )

    return ward


@router.post(
    "/wards",
    response_model=WardResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_ward(
    payload: WardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    lga = (
        db.query(LGA)
        .filter(LGA.id == payload.lga_id)
        .first()
    )

    if not lga:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="LGA not found",
        )

    existing = (
        db.query(Ward)
        .filter(
            Ward.lga_id == payload.lga_id,
            Ward.name == payload.name,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ward already exists in this LGA",
        )

    ward = Ward(
        lga_id=payload.lga_id,
        name=payload.name,
        code=payload.code,
    )

    db.add(ward)
    db.commit()
    db.refresh(ward)

    return ward


@router.put(
    "/wards/{ward_id}",
    response_model=WardResponse,
)
def update_ward(
    ward_id: int,
    payload: WardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    ward = (
        db.query(Ward)
        .filter(Ward.id == ward_id)
        .first()
    )

    if not ward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ward not found",
        )

    ward.lga_id = payload.lga_id
    ward.name = payload.name
    ward.code = payload.code

    db.commit()
    db.refresh(ward)

    return ward


@router.delete(
    "/wards/{ward_id}",
    response_model=MessageResponse,
)
def delete_ward(
    ward_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    ward = (
        db.query(Ward)
        .filter(Ward.id == ward_id)
        .first()
    )

    if not ward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ward not found",
        )

    db.delete(ward)
    db.commit()

    return {
        "message": "Ward deleted successfully"
    }

# ==========================================================
# POLLING UNIT ENDPOINTS
# ==========================================================

@router.get(
    "/polling-units",
    response_model=list[PollingUnitResponse],
)
def get_polling_units(
    ward_id: int | None = None,
    lga_id: int | None = None,
    db: Session = Depends(get_db),
):

    query = db.query(PollingUnit)

    if lga_id is not None:
        query = query.filter(PollingUnit.lga_id == lga_id)

    if ward_id is not None:
        query = query.filter(PollingUnit.ward_id == ward_id)

    return query.order_by(PollingUnit.name).all()


@router.get(
    "/polling-units/{polling_unit_id}",
    response_model=PollingUnitResponse,
)
def get_polling_unit(
    polling_unit_id: int,
    db: Session = Depends(get_db),
):

    polling_unit = (
        db.query(PollingUnit)
        .filter(PollingUnit.id == polling_unit_id)
        .first()
    )

    if not polling_unit:
        raise HTTPException(
            status_code=404,
            detail="Polling Unit not found",
        )

    return polling_unit


@router.post(
    "/polling-units",
    response_model=PollingUnitResponse,
    status_code=201,
)
def create_polling_unit(
    payload: PollingUnitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    lga = (
        db.query(LGA)
        .filter(LGA.id == payload.lga_id)
        .first()
    )

    if not lga:
        raise HTTPException(
            status_code=404,
            detail="LGA not found",
        )

    ward = (
        db.query(Ward)
        .filter(Ward.id == payload.ward_id)
        .first()
    )

    if not ward:
        raise HTTPException(
            status_code=404,
            detail="Ward not found",
        )

    existing = (
        db.query(PollingUnit)
        .filter(PollingUnit.code == payload.code)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Polling Unit code already exists",
        )

    polling_unit = PollingUnit(
        lga_id=payload.lga_id,
        ward_id=payload.ward_id,
        code=payload.code,
        name=payload.name,
        registered_voters=payload.registered_voters,
        latitude=payload.latitude,
        longitude=payload.longitude,
    )

    db.add(polling_unit)

    ward.total_polling_units += 1
    lga.total_polling_units += 1

    db.commit()
    db.refresh(polling_unit)

    return polling_unit


@router.put(
    "/polling-units/{polling_unit_id}",
    response_model=PollingUnitResponse,
)
def update_polling_unit(
    polling_unit_id: int,
    payload: PollingUnitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    polling_unit = (
        db.query(PollingUnit)
        .filter(PollingUnit.id == polling_unit_id)
        .first()
    )

    if not polling_unit:
        raise HTTPException(
            status_code=404,
            detail="Polling Unit not found",
        )

    data = payload.model_dump(exclude_unset=True)

    for key, value in data.items():
        setattr(polling_unit, key, value)

    db.commit()
    db.refresh(polling_unit)

    return polling_unit


@router.delete(
    "/polling-units/{polling_unit_id}",
    response_model=MessageResponse,
)
def delete_polling_unit(
    polling_unit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    polling_unit = (
        db.query(PollingUnit)
        .filter(PollingUnit.id == polling_unit_id)
        .first()
    )

    if not polling_unit:
        raise HTTPException(
            status_code=404,
            detail="Polling Unit not found",
        )

    ward = polling_unit.ward
    lga = polling_unit.lga

    if ward and ward.total_polling_units > 0:
        ward.total_polling_units -= 1

    if lga and lga.total_polling_units > 0:
        lga.total_polling_units -= 1

    db.delete(polling_unit)
    db.commit()

    return {
        "message": "Polling Unit deleted successfully"
    }