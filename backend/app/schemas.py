from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user_info: dict

class TokenData(BaseModel):
    username: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    full_name: str
    username: str
    phone_number: Optional[str] = None
    role: str
    is_active: bool = True
    lga_id: Optional[int] = None
    ward_id: Optional[int] = None
    polling_unit_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    last_login: Optional[datetime] = None
    created_at: datetime
    lga_name: Optional[str] = None
    ward_name: Optional[str] = None
    pu_code: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# LGA & Ward & PU Schemas
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
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    agent_name: Optional[str] = None
    agent_phone: Optional[str] = None
    lga_name: Optional[str] = None
    ward_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# Incident Schemas
class IncidentCreate(BaseModel):
    polling_unit_id: int
    incident_type: str
    severity: str = "MEDIUM"
    description: str
    media_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: Optional[datetime] = None

class IncidentResponse(BaseModel):
    id: int
    polling_unit_id: int
    reported_by: int
    incident_type: str
    severity: str
    description: str
    status: str
    media_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime
    synced_at: datetime
    pu_name: Optional[str] = None
    pu_code: Optional[str] = None
    lga_name: Optional[str] = None
    reporter_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# Vote Result Schemas
class VoteResultCreate(BaseModel):
    polling_unit_id: int
    pdp_votes: int
    apc_votes: int
    nnpp_votes: int
    lp_votes: int
    others_votes: int
    rejected_votes: int = 0
    ec8a_photo_url: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

class VoteResultResponse(BaseModel):
    id: int
    polling_unit_id: int
    agent_id: int
    pdp_votes: int
    apc_votes: int
    nnpp_votes: int
    lp_votes: int
    others_votes: int
    total_valid_votes: int
    rejected_votes: int
    total_votes_cast: int
    ec8a_photo_url: Optional[str] = None
    verification_status: str
    notes: Optional[str] = None
    created_at: datetime
    synced_at: datetime
    pu_code: Optional[str] = None
    pu_name: Optional[str] = None
    lga_name: Optional[str] = None
    ward_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# Election Activity Check-in
class ActivityCreate(BaseModel):
    polling_unit_id: int
    activity_type: str
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

# Announcement Schema
class AnnouncementCreate(BaseModel):
    title: str
    message: str
    urgency: str = "Normal"
    target_role: str = "All"
    is_pinned: bool = False

class AnnouncementResponse(AnnouncementCreate):
    id: int
    sender_name: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
