from enum import Enum
from typing import List, Set, Union
from fastapi import Depends, HTTPException, status

from app.routers.auth import get_current_user
from app.models import User


class UserRole(str, Enum):
    POLLING_AGENT = "Polling Unit Agent"
    WARD_SUPERVISOR = "Ward Coordinator"
    LGA_COLLATOR = "LGA Coordinator"
    STATE_ADMIN = "Situation Room Officer"
    SUPER_ADMIN = "Super Admin"


def normalize_role(role: str) -> str:
    if not role:
        return ""
    return role.strip().lower().replace("_", " ")


ADMIN_ROLES: Set[str] = {
    "super admin",
    "admin",
    "state chairman",
    "governorship candidate",
    "deputy governorship candidate",
    "director general",
    "situation room officer",
    "state admin",
}

SUPERVISOR_ROLES: Set[str] = ADMIN_ROLES | {
    "lga coordinator",
    "lga collator",
    "ward coordinator",
    "ward supervisor",
}

AGENT_ROLES: Set[str] = SUPERVISOR_ROLES | {
    "polling unit agent",
    "polling agent",
    "agent",
}


class RoleChecker:
    def __init__(self, allowed_roles: Union[List[Union[UserRole, str]], Set[str]]):
        self.allowed_roles = {
            normalize_role(r.value if isinstance(r, UserRole) else r)
            for r in allowed_roles
        }

    def __call__(
        self,
        current_user: User = Depends(get_current_user)
    ):
        user_role_norm = normalize_role(current_user.role)

        # Super Admin / Admin accounts always have access
        if "super admin" in user_role_norm or user_role_norm == "admin":
            return current_user

        if user_role_norm not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action."
            )

        return current_user


# ===========================================================
# Permission Guards
# ===========================================================

require_admin = RoleChecker(ADMIN_ROLES)
require_supervisor = RoleChecker(SUPERVISOR_ROLES)
require_agent = RoleChecker(AGENT_ROLES)