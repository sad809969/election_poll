from enum import Enum
from typing import List

from fastapi import Depends, HTTPException, status

from app.routers.auth import get_current_user
from app.models import User


class UserRole(str, Enum):
    POLLING_AGENT = "Polling Unit Agent"
    WARD_SUPERVISOR = "Ward Coordinator"
    LGA_COLLATOR = "LGA Coordinator"
    STATE_ADMIN = "Situation Room Officer"
    SUPER_ADMIN = "Super Admin"


class RoleChecker:

    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(
        self,
        current_user: User = Depends(get_current_user)
    ):

        if current_user.role not in [role.value for role in self.allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action."
            )

        return current_user


# ===========================================================
# Permission Guards
# ===========================================================

require_admin = RoleChecker([
    UserRole.STATE_ADMIN,
    UserRole.SUPER_ADMIN,
])

require_supervisor = RoleChecker([
    UserRole.WARD_SUPERVISOR,
    UserRole.LGA_COLLATOR,
    UserRole.STATE_ADMIN,
    UserRole.SUPER_ADMIN,
])

require_agent = RoleChecker([
    UserRole.POLLING_AGENT,
    UserRole.WARD_SUPERVISOR,
    UserRole.LGA_COLLATOR,
    UserRole.STATE_ADMIN,
    UserRole.SUPER_ADMIN,
])