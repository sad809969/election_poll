from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

# =============================================================================
# 1. AUTHENTICATION & USER SCHEMAS (STEP 3)
# =============================================================================

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class UserOut(BaseModel):
    id: int
    full_name: str
    username: str
    phone_number: Optional[str] = None
    role: str
    is_active: bool
    lga_id: Optional[int] = None
    ward_id: Optional[int] = None
    polling_unit_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# 2. ELECTION RESULTS & SUMMARY SCHEMAS (STEP 4)
# =============================================================================

class VoteResultCreate(BaseModel):
    polling_unit_id: int
    pdp_votes: int = 0
    apc_votes: int = 0
    nnpp_votes: int = 0
    lp_votes: int = 0
    others_votes: int = 0
    rejected_votes: int = 0
    ec8a_photo_url: Optional[str] = None
    notes: Optional[str] = None

class VoteResultResponse(VoteResultCreate):
    id: int
    agent_id: int
    total_valid_votes: int
    total_votes_cast: int
    verification_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ElectionSummaryResponse(BaseModel):
    pdp_votes: int
    apc_votes: int
    nnpp_votes: int
    lp_votes: int
    others_votes: int
    total_valid_votes: int
    rejected_votes: int
    total_votes_cast: int
    polling_units_reported: int

# =============================================================================
# 3. INCIDENT REPORTING SCHEMAS (STEP 5)
# =============================================================================

class IncidentCreate(BaseModel):
    polling_unit_id: int
    incident_type: str
    severity: str = "MEDIUM"
    description: str
    media_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class IncidentStatusUpdate(BaseModel):
    status: str

class IncidentResponse(IncidentCreate):
    id: int
    reported_by: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    # =============================================================================
# 4. ELECTORAL GEOGRAPHY SCHEMAS (STEP 8)
# =============================================================================

class LGAResponse(BaseModel):
    id: int
    name: str
    code: str
    total_polling_units: int
    registered_voters: int

    model_config = ConfigDict(from_attributes=True)


class WardResponse(BaseModel):
    id: int
    lga_id: int
    name: str
    code: str
    total_polling_units: int

    model_config = ConfigDict(from_attributes=True)


class PollingUnitResponse(BaseModel):
    id: int
    lga_id: int
    ward_id: int
    code: str
    name: str
    registered_voters: int
    status: str

    model_config = ConfigDict(from_attributes=True)

    # =============================================================================
# 5. AGENT MANAGEMENT SCHEMAS
# =============================================================================

class AgentCreate(BaseModel):
    full_name: str
    username: str
    password: str
    phone_number: Optional[str] = None
    role: str = "AGENT"
    lga_id: int | None = None
    ward_id: int | None = None
    polling_unit_id: int | None = None


class AgentUpdate(BaseModel):
    full_name: str | None = None
    username: str | None = None
    password: str | None = None
    phone_number: Optional[str] = None
    role: str | None = None
    is_active: bool | None = None
    lga_id: int | None = None
    ward_id: int | None = None
    polling_unit_id: int | None = None


class AgentResponse(BaseModel):
    id: int
    full_name: str
    username: str
    phone_number: Optional[str] = None
    role: str
    is_active: bool
    lga_id: int | None = None
    ward_id: int | None = None
    polling_unit_id: int | None = None

    model_config = ConfigDict(from_attributes=True)


    # =============================================================================
# ELECTORAL MANAGEMENT
# =============================================================================

class LGACreate(BaseModel):
    name: str
    code: str
    registered_voters: int = 0


class LGAUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    registered_voters: int | None = None


class WardCreate(BaseModel):
    lga_id: int
    name: str
    code: str


class WardUpdate(BaseModel):
    name: str | None = None
    code: str | None = None


class PollingUnitCreate(BaseModel):
    lga_id: int
    ward_id: int
    code: str
    name: str
    registered_voters: int = 0
    latitude: float | None = None
    longitude: float | None = None


class PollingUnitUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    registered_voters: int | None = None
    latitude: float | None = None
    longitude: float | None = None
    status: str | None = None

    # =============================================================================
# COMMON RESPONSE SCHEMAS
# =============================================================================

class MessageResponse(BaseModel):
    message: str


# =============================================================================
# COMMUNICATION SCHEMAS
# =============================================================================

class AnnouncementCreate(BaseModel):
    title: str
    message: str
    urgency: str = "Normal"
    target_role: str = "All"
    target_lga_id: int | None = None
    is_pinned: bool = False


class AnnouncementResponse(BaseModel):
    id: int
    title: str
    message: str
    sender_name: str
    urgency: str
    target_role: str
    target_lga_id: int | None = None
    is_pinned: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MessageCreate(BaseModel):
    recipient_id: int | None = None
    channel: str = "General"
    content: str


class MessageResponseModel(BaseModel):
    id: int
    sender_id: int
    recipient_id: int | None = None
    channel: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# =============================================================================
# AUDIT LOG SCHEMAS
# =============================================================================

class AuditLogResponse(BaseModel):
    id: int
    user_id: int | None = None
    username: str | None = None
    action: str
    details: str | None = None
    ip_address: str | None = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)