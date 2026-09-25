from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    CheckConstraint,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base


# =============================================================================
# 1. ELECTORAL GEOGRAPHY
# =============================================================================

class LGA(Base):
    __tablename__ = "lgas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    code = Column(String(20), nullable=False, unique=True)
    total_polling_units = Column(Integer, default=0, nullable=False)
    registered_voters = Column(Integer, default=0, nullable=False)

    wards = relationship(
        "Ward",
        back_populates="lga",
        cascade="all, delete-orphan",
    )

    polling_units = relationship(
        "PollingUnit",
        back_populates="lga",
        cascade="all, delete-orphan",
    )

    users = relationship("User", back_populates="lga")

    constituency_lgas = relationship(
        "ConstituencyLGA",
        back_populates="lga",
        cascade="all, delete-orphan",
    )


class Ward(Base):
    __tablename__ = "wards"

    id = Column(Integer, primary_key=True, index=True)

    lga_id = Column(
        Integer,
        ForeignKey("lgas.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name = Column(String(100), nullable=False, index=True)
    code = Column(String(20), nullable=True)
    total_polling_units = Column(Integer, default=0, nullable=False)

    lga = relationship("LGA", back_populates="wards")

    polling_units = relationship(
        "PollingUnit",
        back_populates="ward",
        cascade="all, delete-orphan",
    )

    users = relationship("User", back_populates="ward")

    __table_args__ = (
        UniqueConstraint(
            "lga_id",
            "name",
            name="uq_ward_per_lga",
        ),
    )


class PollingUnit(Base):
    __tablename__ = "polling_units"

    id = Column(Integer, primary_key=True, index=True)

    lga_id = Column(
        Integer,
        ForeignKey("lgas.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    ward_id = Column(
        Integer,
        ForeignKey("wards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    code = Column(
        String(50),
        nullable=False,
        unique=True,
        index=True,
    )

    name = Column(String(200), nullable=False)

    registered_voters = Column(
        Integer,
        default=0,
        nullable=False,
    )

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    status = Column(
        String(20),
        default="Normal",
        nullable=False,
    )

    lga = relationship("LGA", back_populates="polling_units")
    ward = relationship("Ward", back_populates="polling_units")
    users = relationship("User", back_populates="polling_unit")
    activities = relationship("ElectionActivity", back_populates="polling_unit", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="polling_unit", cascade="all, delete-orphan")
    vote_results = relationship("VoteResult", back_populates="polling_unit", cascade="all, delete-orphan")
    vote_result = relationship("VoteResult", back_populates="polling_unit", uselist=False, viewonly=True)
    election_results = relationship(
        "ElectionResult",
        back_populates="polling_unit",
        cascade="all, delete-orphan",
    )


# =============================================================================
# 2. ELECTIONS
# =============================================================================

class Election(Base):
    __tablename__ = "elections"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(
        String(200),
        nullable=False,
    )

    election_type = Column(
        String(50),
        nullable=False,
        index=True,
    )

    election_year = Column(
        Integer,
        nullable=False,
        index=True,
    )

    state = Column(
        String(100),
        nullable=False,
        default="Jigawa",
    )

    status = Column(
        String(30),
        nullable=False,
        default="DRAFT",
        index=True,
    )

    election_date = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    description = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    constituencies = relationship(
        "ElectionConstituency",
        back_populates="election",
        cascade="all, delete-orphan",
    )

    candidates = relationship(
        "Candidate",
        back_populates="election",
        cascade="all, delete-orphan",
    )

    results = relationship(
        "ElectionResult",
        back_populates="election",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint(
            "election_type",
            "election_year",
            "state",
            name="uq_election_type_year_state",
        ),
    )


# =============================================================================
# 3. CONSTITUENCIES
# =============================================================================

class Constituency(Base):
    __tablename__ = "constituencies"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(
        String(200),
        nullable=False,
        index=True,
    )

    code = Column(
        String(50),
        nullable=False,
        unique=True,
        index=True,
    )

    constituency_type = Column(
        String(50),
        nullable=False,
        index=True,
    )

    description = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    constituency_lgas = relationship(
        "ConstituencyLGA",
        back_populates="constituency",
        cascade="all, delete-orphan",
    )

    elections = relationship(
        "ElectionConstituency",
        back_populates="constituency",
        cascade="all, delete-orphan",
    )

    candidates = relationship(
        "Candidate",
        back_populates="constituency",
    )


class ConstituencyLGA(Base):
    __tablename__ = "constituency_lgas"

    id = Column(Integer, primary_key=True, index=True)

    constituency_id = Column(
        Integer,
        ForeignKey("constituencies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    lga_id = Column(
        Integer,
        ForeignKey("lgas.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    constituency = relationship(
        "Constituency",
        back_populates="constituency_lgas",
    )

    lga = relationship(
        "LGA",
        back_populates="constituency_lgas",
    )

    __table_args__ = (
        UniqueConstraint(
            "constituency_id",
            "lga_id",
            name="uq_constituency_lga",
        ),
    )


class ElectionConstituency(Base):
    __tablename__ = "election_constituencies"

    id = Column(Integer, primary_key=True, index=True)

    election_id = Column(
        Integer,
        ForeignKey("elections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    constituency_id = Column(
        Integer,
        ForeignKey("constituencies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    election = relationship(
        "Election",
        back_populates="constituencies",
    )

    constituency = relationship(
        "Constituency",
        back_populates="elections",
    )

    __table_args__ = (
        UniqueConstraint(
            "election_id",
            "constituency_id",
            name="uq_election_constituency",
        ),
    )


# =============================================================================
# 4. POLITICAL PARTIES
# =============================================================================

class Party(Base):
    __tablename__ = "parties"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(
        String(150),
        nullable=False,
        unique=True,
        index=True,
    )

    abbreviation = Column(
        String(20),
        nullable=False,
        unique=True,
        index=True,
    )

    logo_url = Column(
        String(500),
        nullable=True,
    )

    color = Column(
        String(30),
        nullable=True,
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    candidates = relationship(
        "Candidate",
        back_populates="party",
    )


# =============================================================================
# 5. CANDIDATES
# =============================================================================

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)

    election_id = Column(
        Integer,
        ForeignKey("elections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    party_id = Column(
        Integer,
        ForeignKey("parties.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    constituency_id = Column(
        Integer,
        ForeignKey("constituencies.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    name = Column(
        String(200),
        nullable=False,
    )

    candidate_code = Column(
        String(50),
        nullable=True,
        index=True,
    )

    photo_url = Column(
        String(500),
        nullable=True,
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    election = relationship(
        "Election",
        back_populates="candidates",
    )

    party = relationship(
        "Party",
        back_populates="candidates",
    )

    constituency = relationship(
        "Constituency",
        back_populates="candidates",
    )

    result_votes = relationship(
        "ElectionResultVote",
        back_populates="candidate",
    )

    __table_args__ = (
        UniqueConstraint(
            "election_id",
            "party_id",
            "constituency_id",
            name="uq_candidate_election_party_constituency",
        ),
    )


# =============================================================================
# 6. USER ACCESS & ROLE HIERARCHY
# =============================================================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(
        String(150),
        nullable=False,
    )

    username = Column(
        String(100),
        nullable=False,
        unique=True,
        index=True,
    )

    phone_number = Column(
        String(20),
        nullable=True,
    )

    hashed_password = Column(
        String(255),
        nullable=False,
    )

    role = Column(
        String(50),
        nullable=False,
        index=True,
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    lga_id = Column(
        Integer,
        ForeignKey("lgas.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    ward_id = Column(
        Integer,
        ForeignKey("wards.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    polling_unit_id = Column(
        Integer,
        ForeignKey("polling_units.id", ondelete="SET NULL"),
        nullable=True,
    )

    allowed_pages = Column(
        Text,
        nullable=True,
    )

    last_login = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    lga = relationship(
        "LGA",
        back_populates="users",
    )

    ward = relationship(
        "Ward",
        back_populates="users",
    )

    polling_unit = relationship(
        "PollingUnit",
        back_populates="users",
    )

    activities = relationship(
        "ElectionActivity",
        back_populates="agent",
    )

    incidents = relationship(
        "Incident",
        back_populates="reporter",
    )

    vote_results = relationship(
        "VoteResult",
        back_populates="agent",
        cascade="all, delete-orphan",
    )

    election_results = relationship(
        "ElectionResult",
        back_populates="agent",
        foreign_keys="ElectionResult.agent_id",
    )

    verified_results = relationship(
        "ElectionResult",
        back_populates="verified_by_user",
        foreign_keys="ElectionResult.verified_by",
    )


# =============================================================================
# 7. FIELD OPERATIONS
# =============================================================================

class ElectionActivity(Base):
    __tablename__ = "election_activities"

    id = Column(Integer, primary_key=True, index=True)

    polling_unit_id = Column(
        Integer,
        ForeignKey("polling_units.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    agent_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    activity_type = Column(
        String(50),
        nullable=False,
    )

    notes = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    synced_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    polling_unit = relationship(
        "PollingUnit",
        back_populates="activities",
    )

    agent = relationship(
        "User",
        back_populates="activities",
    )


# =============================================================================
# 8. INCIDENTS
# =============================================================================

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)

    polling_unit_id = Column(
        Integer,
        ForeignKey("polling_units.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    reported_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    incident_type = Column(
        String(50),
        nullable=False,
    )

    severity = Column(
        String(20),
        default="MEDIUM",
        nullable=False,
        index=True,
    )

    description = Column(
        Text,
        nullable=False,
    )

    status = Column(
        String(20),
        default="REPORTED",
        nullable=False,
        index=True,
    )

    media_url = Column(
        String(500),
        nullable=True,
    )

    latitude = Column(
        Float,
        nullable=True,
    )

    longitude = Column(
        Float,
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    synced_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    polling_unit = relationship(
        "PollingUnit",
        back_populates="incidents",
    )

    reporter = relationship(
        "User",
        back_populates="incidents",
    )


# =============================================================================
# 8. VOTE RESULTS (POLLING UNIT DIRECT SUBMISSION & MULTI-CONTEST)
# =============================================================================

class VoteResult(Base):
    __tablename__ = "vote_results"
    __table_args__ = (
        UniqueConstraint('polling_unit_id', 'election_type', name='uq_pu_election_type'),
    )

    id = Column(Integer, primary_key=True, index=True)
    polling_unit_id = Column(
        Integer,
        ForeignKey("polling_units.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    agent_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    election_type = Column(
        String(30),
        default="GOVERNORSHIP",
        nullable=False,
        index=True,
    )

    pdp_votes = Column(Integer, default=0, nullable=False)
    apc_votes = Column(Integer, default=0, nullable=False)
    nnpp_votes = Column(Integer, default=0, nullable=False)
    lp_votes = Column(Integer, default=0, nullable=False)
    others_votes = Column(Integer, default=0, nullable=False)

    total_valid_votes = Column(Integer, default=0, nullable=False)
    rejected_votes = Column(Integer, default=0, nullable=False)
    total_votes_cast = Column(Integer, default=0, nullable=False)

    ec8a_photo_url = Column(String(500), nullable=True)
    verification_status = Column(String(30), default="PENDING_PHOTO", nullable=False)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    synced_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    polling_unit = relationship("PollingUnit", back_populates="vote_results")
    agent = relationship("User", back_populates="vote_results")


# =============================================================================
# 9. ELECTION RESULTS
# =============================================================================

class ElectionResult(Base):
    __tablename__ = "election_results"

    id = Column(Integer, primary_key=True, index=True)

    election_id = Column(
        Integer,
        ForeignKey("elections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    polling_unit_id = Column(
        Integer,
        ForeignKey("polling_units.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    agent_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    total_valid_votes = Column(
        Integer,
        default=0,
        nullable=False,
    )

    rejected_votes = Column(
        Integer,
        default=0,
        nullable=False,
    )

    total_votes_cast = Column(
        Integer,
        default=0,
        nullable=False,
    )

    ec8a_photo_url = Column(
        String(500),
        nullable=True,
    )

    verification_status = Column(
        String(30),
        default="PENDING",
        nullable=False,
        index=True,
    )

    verified_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    verified_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    notes = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    synced_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    election = relationship(
        "Election",
        back_populates="results",
    )

    polling_unit = relationship(
        "PollingUnit",
        back_populates="election_results",
    )

    agent = relationship(
        "User",
        back_populates="election_results",
        foreign_keys=[agent_id],
    )

    verified_by_user = relationship(
        "User",
        back_populates="verified_results",
        foreign_keys=[verified_by],
    )

    votes = relationship(
        "ElectionResultVote",
        back_populates="result",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint(
            "election_id",
            "polling_unit_id",
            name="uq_election_result_per_polling_unit",
        ),
        CheckConstraint(
            "total_valid_votes >= 0",
            name="ck_result_valid_votes_nonnegative",
        ),
        CheckConstraint(
            "rejected_votes >= 0",
            name="ck_result_rejected_votes_nonnegative",
        ),
        CheckConstraint(
            "total_votes_cast >= 0",
            name="ck_result_total_votes_nonnegative",
        ),
    )


class ElectionResultVote(Base):
    __tablename__ = "election_result_votes"

    id = Column(Integer, primary_key=True, index=True)

    election_result_id = Column(
        Integer,
        ForeignKey("election_results.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    candidate_id = Column(
        Integer,
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    votes = Column(
        Integer,
        default=0,
        nullable=False,
    )

    result = relationship(
        "ElectionResult",
        back_populates="votes",
    )

    candidate = relationship(
        "Candidate",
        back_populates="result_votes",
    )

    __table_args__ = (
        UniqueConstraint(
            "election_result_id",
            "candidate_id",
            name="uq_result_candidate",
        ),
        CheckConstraint(
            "votes >= 0",
            name="ck_candidate_votes_nonnegative",
        ),
    )


# =============================================================================
# 10. COMMUNICATION
# =============================================================================

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(
        String(200),
        nullable=False,
    )

    message = Column(
        Text,
        nullable=False,
    )

    sender_name = Column(
        String(100),
        nullable=False,
    )

    urgency = Column(
        String(20),
        default="Normal",
        nullable=False,
    )

    target_role = Column(
        String(50),
        default="All",
        nullable=False,
    )

    target_lga_id = Column(
        Integer,
        ForeignKey("lgas.id", ondelete="SET NULL"),
        nullable=True,
    )

    is_pinned = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)

    sender_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    recipient_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    channel = Column(
        String(50),
        default="General",
        nullable=False,
    )

    content = Column(
        Text,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


# =============================================================================
# 11. AUDIT LOG
# =============================================================================

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    username = Column(
        String(100),
        nullable=True,
    )

    action = Column(
        String(100),
        nullable=False,
    )

    details = Column(
        Text,
        nullable=True,
    )

    ip_address = Column(
        String(45),
        nullable=True,
    )

    timestamp = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
    )


# =============================================================================
# 12. COLLATION SIGNOFF & TRIBUNAL SUBSYSTEM (EC8B / EC8C / EC8D)
# =============================================================================

class CollationSignoff(Base):
    __tablename__ = "collation_signoffs"

    id = Column(Integer, primary_key=True, index=True)
    level = Column(String(20), nullable=False, index=True)  # 'WARD', 'LGA', 'STATE'
    entity_id = Column(Integer, nullable=False, index=True) # ward_id, lga_id, or 0 for state
    signed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    pdp_total = Column(Integer, default=0, nullable=False)
    apc_total = Column(Integer, default=0, nullable=False)
    nnpp_total = Column(Integer, default=0, nullable=False)
    lp_total = Column(Integer, default=0, nullable=False)
    total_votes = Column(Integer, default=0, nullable=False)
    status = Column(String(20), default="SIGNED", nullable=False) # 'PENDING', 'SIGNED', 'DISPUTED'
    notes = Column(Text, nullable=True)
    signed_at = Column(DateTime(timezone=True), server_default=func.now())

    signer = relationship("User")
