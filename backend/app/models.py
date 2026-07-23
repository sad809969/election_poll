import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from app.database import Base

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "Super Admin"
    STATE_CHAIRMAN = "State Chairman"
    GOVERNORSHIP_CANDIDATE = "Governorship Candidate"
    DEPUTY_CANDIDATE = "Deputy Governorship Candidate"
    DIRECTOR_GENERAL = "Director General"
    SITUATION_ROOM_OFFICER = "Situation Room Officer"
    LGA_COORDINATOR = "LGA Coordinator"
    WARD_COORDINATOR = "Ward Coordinator"
    POLLING_UNIT_AGENT = "Polling Unit Agent"

class IncidentSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class IncidentStatus(str, enum.Enum):
    REPORTED = "REPORTED"
    INVESTIGATING = "INVESTIGATING"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"

class ResultVerificationStatus(str, enum.Enum):
    VERIFIED = "VERIFIED"
    PENDING_PHOTO = "PENDING_PHOTO"
    FLAGGED = "FLAGGED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    phone_number = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default=UserRole.POLLING_UNIT_AGENT.value, index=True)
    is_active = Column(Boolean, default=True)
    
    # Location Scope Mapping
    lga_id = Column(Integer, ForeignKey("lgas.id"), nullable=True)
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=True)
    polling_unit_id = Column(Integer, ForeignKey("polling_units.id"), nullable=True)
    
    last_login = Column(DateTime, nullable=True, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    lga = relationship("LGA", back_populates="users")
    ward = relationship("Ward", back_populates="users")
    polling_unit = relationship("PollingUnit", back_populates="agent")
    incidents = relationship("Incident", back_populates="reported_by_user")
    activities = relationship("ElectionActivity", back_populates="agent")
    vote_result = relationship("VoteResult", back_populates="agent", uselist=False)

class LGA(Base):
    __tablename__ = "lgas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    code = Column(String, unique=True, nullable=False)
    total_polling_units = Column(Integer, default=0)
    registered_voters = Column(Integer, default=0)

    # Relationships
    wards = relationship("Ward", back_populates="lga")
    users = relationship("User", back_populates="lga")
    polling_units = relationship("PollingUnit", back_populates="lga")

class Ward(Base):
    __tablename__ = "wards"

    id = Column(Integer, primary_key=True, index=True)
    lga_id = Column(Integer, ForeignKey("lgas.id"), nullable=False)
    name = Column(String, index=True, nullable=False)
    code = Column(String, nullable=False)
    total_polling_units = Column(Integer, default=0)

    # Relationships
    lga = relationship("LGA", back_populates="wards")
    polling_units = relationship("PollingUnit", back_populates="ward")
    users = relationship("User", back_populates="ward")

class PollingUnit(Base):
    __tablename__ = "polling_units"

    id = Column(Integer, primary_key=True, index=True)
    lga_id = Column(Integer, ForeignKey("lgas.id"), nullable=False)
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    registered_voters = Column(Integer, default=500)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String, default="Normal") # Normal, Attention, Critical, No Report

    # Relationships
    lga = relationship("LGA", back_populates="polling_units")
    ward = relationship("Ward", back_populates="polling_units")
    agent = relationship("User", back_populates="polling_unit", uselist=False)
    incidents = relationship("Incident", back_populates="polling_unit")
    activities = relationship("ElectionActivity", back_populates="polling_unit")
    vote_result = relationship("VoteResult", back_populates="polling_unit", uselist=False)

class ElectionActivity(Base):
    __tablename__ = "election_activities"

    id = Column(Integer, primary_key=True, index=True)
    polling_unit_id = Column(Integer, ForeignKey("polling_units.id"), nullable=False)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity_type = Column(String, nullable=False) # Check-in, Accreditation Started, Voting Started, Voting Ended, Counting Started, Counting Completed
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow) # Creation time
    synced_at = Column(DateTime, default=datetime.utcnow) # Sync time

    polling_unit = relationship("PollingUnit", back_populates="activities")
    agent = relationship("User", back_populates="activities")

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    polling_unit_id = Column(Integer, ForeignKey("polling_units.id"), nullable=False)
    reported_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    incident_type = Column(String, nullable=False) # Violence, Intimidation, BVAS Issues, Vote Buying, Ballot Shortage, Late Officials, Others
    severity = Column(String, default=IncidentSeverity.MEDIUM.value)
    description = Column(Text, nullable=False)
    status = Column(String, default=IncidentStatus.REPORTED.value)
    media_url = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow) # Offline creation timestamp
    synced_at = Column(DateTime, default=datetime.utcnow) # Online sync timestamp

    polling_unit = relationship("PollingUnit", back_populates="incidents")
    reported_by_user = relationship("User", back_populates="incidents")

class VoteResult(Base):
    __tablename__ = "vote_results"

    id = Column(Integer, primary_key=True, index=True)
    polling_unit_id = Column(Integer, ForeignKey("polling_units.id"), unique=True, nullable=False)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Party Votes
    pdp_votes = Column(Integer, default=0)
    apc_votes = Column(Integer, default=0)
    nnpp_votes = Column(Integer, default=0)
    lp_votes = Column(Integer, default=0)
    others_votes = Column(Integer, default=0)
    
    total_valid_votes = Column(Integer, default=0)
    rejected_votes = Column(Integer, default=0)
    total_votes_cast = Column(Integer, default=0)
    
    ec8a_photo_url = Column(String, nullable=True)
    verification_status = Column(String, default=ResultVerificationStatus.VERIFIED.value)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    synced_at = Column(DateTime, default=datetime.utcnow)

    polling_unit = relationship("PollingUnit", back_populates="vote_result")
    agent = relationship("User", back_populates="vote_result")

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    sender_name = Column(String, nullable=False)
    urgency = Column(String, default="Normal") # Normal, Emergency
    target_role = Column(String, default="All") # All, LGA Coordinators, Ward Coordinators, Polling Unit Agents
    target_lga_id = Column(Integer, nullable=True)
    is_pinned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    channel = Column(String, default="General") # All Agents, LGA Coordinators, Ward Coordinators, etc.
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    username = Column(String, nullable=True)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
