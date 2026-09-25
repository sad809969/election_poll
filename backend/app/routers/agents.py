from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.audit import write_audit_log
from app.core.permissions import require_admin, require_supervisor
from app.core.security import get_password_hash
from app.database import get_db
from app.models import User, LGA, Ward, PollingUnit, VoteResult
from app.schemas import (
    AgentCreate,
    AgentUpdate,
    AgentResponse,
    MessageResponse,
)

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
    current_user: User = Depends(require_supervisor),
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
        if not payload.ward_id and pu.ward_id:
            payload.ward_id = pu.ward_id
        if not payload.lga_id and pu.lga_id:
            payload.lga_id = pu.lga_id

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

    return agent


@router.delete("/{agent_id}", response_model=MessageResponse)
def delete_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    agent = db.query(User).filter(User.id == agent_id).first()

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found",
        )

    username = agent.username

    # Check whether this agent has submitted election results.
    has_results = (
        db.query(VoteResult)
        .filter(VoteResult.agent_id == agent_id)
        .first()
        is not None
    )

    if has_results:
        # Preserve historical results by deactivating the agent
        # instead of physically deleting the user record.
        agent.is_active = False
        db.commit()
        db.refresh(agent)

        write_audit_log(
            db=db,
            user=current_user,
            action="DEACTIVATE_AGENT",
            details=(
                f"Agent '{username}' was deactivated because "
                "the agent has existing vote results."
            ),
        )

        return {
            "message": (
                "Agent has existing vote results and was "
                "deactivated instead of deleted."
            )
        }

    # No historical results exist, so physical deletion is safe.
    db.delete(agent)
    db.commit()

    write_audit_log(
        db=db,
        user=current_user,
        action="DELETE_AGENT",
        details=f"Deleted agent '{username}'",
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

    agent.is_active = active
    db.commit()
    db.refresh(agent)

    write_audit_log(
        db=db,
        user=current_user,
        action="CHANGE_AGENT_STATUS",
        details=f"Changed {agent.username} active={active}",
    )

    return agent