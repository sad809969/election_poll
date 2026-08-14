from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey,
    UniqueConstraint, CheckConstraint, func
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

# =============================================================================
# 1. ELECTORAL GEOGRAPHY SUBSYSTEM
# =============================================================================

class LGA(Base):
    __tablename__ = "lgas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    code = Column(String(20), nullable=False, unique=True)
    total_polling_units = Column(Integer, default=0, nullable=False)
    registered_voters = Column(Integer, default=0, nullable=False)

    wards = relationship("Ward", back_populates="lga", cascade="all, delete-orphan")
    polling_units = relationship("PollingUnit", back_populates="lga", cascade="all, delete-orphan")
    users = relationship("User", back_populates="lga")


class Ward(Base):
    __tablename__ = "wards"

    id = Column(Integer, primary_key=True, index=True)
    lga_id = Column(Integer, ForeignKey("lgas.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False, index=True)
    code = Column(String(20), nullable=True)
    total_polling_units = Column(Integer, default=0, nullable=False)

    lga = relationship("LGA", back_populates="wards")
    polling_units = relationship("PollingUnit", back_populates="ward", cascade="all, delete-orphan")
    users = relationship("User", back_populates="ward")

    __table_args__ = (
        UniqueConstraint("lga_id", "name", name="uq_ward_per_lga"),
    )


class PollingUnit(Base):
    __tablename__ = "polling_units"

    id = Column(Integer, primary_key=True, index=True)
    lga_id = Column(Integer, ForeignKey("lgas.id", ondelete="CASCADE"), nullable=False, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String(50), nullable=False, unique=True, index=True)
    name = Column(String(200), nullable=False)
    registered_voters = Column(Integer, default=500, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String(20), default="Normal", nullable=False)

    lga = relationship("LGA", back_populates="polling_units")
    ward = relationship("Ward", back_populates="polling_units")
    users = relationship("User", back_populates="polling_unit")
    activities = relationship("ElectionActivity", back_populates="polling_unit", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="polling_unit", cascade="all, delete-orphan")
    vote_result = relationship("VoteResult", back_populates="polling_unit", uselist=False, cascade="all, delete-orphan")


# =============================================================================
# 2. USER ACCESS & ROLE HIERARCHY SUBSYSTEM
# =============================================================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    username = Column(String(100), nullable=False, unique=True, index=True)
    phone_number = Column(String(20), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)

    lga_id = Column(Integer, ForeignKey("lgas.id", ondelete="SET NULL"), nullable=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="SET NULL"), nullable=True, index=True)
    polling_unit_id = Column(Integer, ForeignKey("polling_units.id", ondelete="SET NULL"), nullable=True)

    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lga = relationship("LGA", back_populates="users")
    ward = relationship("Ward", back_populates="users")
    polling_unit = relationship("PollingUnit", back_populates="users")
    activities = relationship("ElectionActivity", back_populates="agent")
    incidents = relationship("Incident", back_populates="reporter")
    vote_results = relationship("VoteResult", back_populates="agent")


# =============================================================================
# 3. FIELD OPERATIONS & VOTE AGGREGATION SUBSYSTEM
# =============================================================================

class ElectionActivity(Base):
    __tablename__ = "election_activities"

    id = Column(Integer, primary_key=True, index=True)
    polling_unit_id = Column(Integer, ForeignKey("polling_units.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    activity_type = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    synced_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    polling_unit = relationship("PollingUnit", back_populates="activities")
    agent = relationship("User", back_populates="activities")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    polling_unit_id = Column(Integer, ForeignKey("polling_units.id", ondelete="CASCADE"), nullable=False, index=True)
    reported_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    incident_type = Column(String(50), nullable=False)
    severity = Column(String(20), default="MEDIUM", nullable=False, index=True)
    description = Column(Text, nullable=False)
    status = Column(String(20), default="REPORTED", nullable=False, index=True)
    media_url = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    synced_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    polling_unit = relationship("PollingUnit", back_populates="incidents")
    reporter = relationship("User", back_populates="incidents")


class VoteResult(Base):
    __tablename__ = "vote_results"

    id = Column(Integer, primary_key=True, index=True)
    polling_unit_id = Column(Integer, ForeignKey("polling_units.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    agent_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    pdp_votes = Column(Integer, default=0, nullable=False)
    apc_votes = Column(Integer, default=0, nullable=False)
    nnpp_votes = Column(Integer, default=0, nullable=False)
    lp_votes = Column(Integer, default=0, nullable=False)
    others_votes = Column(Integer, default=0, nullable=False)

    total_valid_votes = Column(Integer, default=0, nullable=False)
    rejected_votes = Column(Integer, default=0, nullable=False)
    total_votes_cast = Column(Integer, default=0, nullable=False)

    ec8a_photo_url = Column(String(500), nullable=True)
    verification_status = Column(String(30), default="VERIFIED", nullable=False)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    synced_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    polling_unit = relationship("PollingUnit", back_populates="vote_result")
    agent = relationship("User", back_populates="vote_results")


# =============================================================================
# 4. COMMUNICATION & SECURITY AUDIT SUBSYSTEM
# =============================================================================

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    sender_name = Column(String(100), nullable=False)
    urgency = Column(String(20), default="Normal", nullable=False)
    target_role = Column(String(50), default="All", nullable=False)
    target_lga_id = Column(Integer, ForeignKey("lgas.id", ondelete="SET NULL"), nullable=True)
    is_pinned = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    channel = Column(String(50), default="General", nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    username = Column(String(100), nullable=True)
    action = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)