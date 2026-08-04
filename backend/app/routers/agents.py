from app.core.audit import write_audit_log
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, LGA, Ward, PollingUnit
from app.schemas import (
    AgentCreate,
    AgentUpdate,
    AgentResponse,
    MessageResponse,
)
from app.core.permissions import require_admin
from app.core.security import get_password_hash

router = APIRouter(
    prefix="/agents",
    tags=["Agent Management"],
)


@router.get(
    "",
    response_model=list[AgentResponse],
)
def get_agents(
    db: Session = Depends(get_db),
):

    return (
        db.query(User)
        .order_by(User.full_name)
        .all()
    )


@router.post(
    "",
    response_model=AgentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_agent(
    payload: AgentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    existing = (
        db.query(User)
        .filter(User.username == payload.username)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Username already exists",
        )

    if payload.lga_id:

        lga = db.query(LGA).filter(LGA.id == payload.lga_id).first()

        if not lga:
            raise HTTPException(
                status_code=404,
                detail="LGA not found",
            )

    if payload.ward_id:

        ward = db.query(Ward).filter(Ward.id == payload.ward_id).first()

        if not ward:
            raise HTTPException(
                status_code=404,
                detail="Ward not found",
            )

    if payload.polling_unit_id:

        pu = (
            db.query(PollingUnit)
            .filter(PollingUnit.id == payload.polling_unit_id)
            .first()
        )

        if not pu:
            raise HTTPException(
                status_code=404,
                detail="Polling Unit not found",
            )

    agent = User(

        full_name=payload.full_name,

        username=payload.username,

        hashed_password=get_password_hash(payload.password),

        phone_number=payload.phone_number,

        role=payload.role,

        is_active=True,

        lga_id=payload.lga_id,

        ward_id=payload.ward_id,

        polling_unit_id=payload.polling_unit_id,
    )

    db.add(agent)

    db.commit()

    db.refresh(agent)

    write_audit_log(
    db=db,
    user=current_user,
    action="CREATE_AGENT",
    details=f"Created agent '{agent.username}'",
)

    return agent

@router.get(
    "/{agent_id}",
    response_model=AgentResponse,
)
def get_agent(
    agent_id: int,
    db: Session = Depends(get_db),
):

    agent = (
        db.query(User)
        .filter(User.id == agent_id)
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found",
        )

    return agent

@router.put(
    "/{agent_id}",
    response_model=AgentResponse,
)
def update_agent(
    agent_id: int,
    payload: AgentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    agent = (
        db.query(User)
        .filter(User.id == agent_id)
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found",
        )

    data = payload.model_dump(exclude_unset=True)

    if "password" in data:

        agent.hashed_password = get_password_hash(
            data.pop("password")
        )

    for key, value in data.items():
        setattr(agent, key, value)

    db.commit()

    db.refresh(agent)

    return agent

@router.delete(
    "/{agent_id}",
    response_model=MessageResponse,
)
def delete_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    agent = (
        db.query(User)
        .filter(User.id == agent_id)
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found",
        )

    write_audit_log(
    db=db,
    user=current_user,
    action="CREATE_AGENT",
    details=f"Created agent '{agent.username}'",
)
    return {
        "message": "Agent deleted successfully"
    }


@router.patch(
    "/{agent_id}/status",
    response_model=AgentResponse,
)
def change_agent_status(
    agent_id: int,
    active: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    agent = (
        db.query(User)
        .filter(User.id == agent_id)
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found",
        )

    write_audit_log(
    db=db,
    user=current_user,
    action="CHANGE_AGENT_STATUS",
    details=f"{agent.username} active={agent.is_active}",
)

    return agent