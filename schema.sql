-- Enable UUID extension if needed in future
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. ELECTORAL GEOGRAPHY SUBSYSTEM
-- =============================================================================

CREATE TABLE lgas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    total_polling_units INT NOT NULL DEFAULT 0 CHECK (total_polling_units >= 0),
    registered_voters INT NOT NULL DEFAULT 0 CHECK (registered_voters >= 0)
);

CREATE TABLE wards (
    id SERIAL PRIMARY KEY,
    lga_id INT NOT NULL REFERENCES lgas(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    total_polling_units INT NOT NULL DEFAULT 0 CHECK (total_polling_units >= 0),
    CONSTRAINT uq_ward_per_lga UNIQUE (lga_id, name)
);

CREATE TABLE polling_units (
    id SERIAL PRIMARY KEY,
    lga_id INT NOT NULL REFERENCES lgas(id) ON DELETE CASCADE,
    ward_id INT NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    registered_voters INT NOT NULL DEFAULT 500 CHECK (registered_voters >= 0),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    status VARCHAR(20) NOT NULL DEFAULT 'Normal' CHECK (status IN ('Normal', 'Attention', 'Critical', 'No Report'))
);

-- =============================================================================
-- 2. USER ACCESS & ROLE HIERARCHY SUBSYSTEM
-- =============================================================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (
        role IN (
            'Super Admin',
            'State Chairman',
            'Governorship Candidate',
            'Deputy Governorship Candidate',
            'Director General',
            'Situation Room Officer',
            'LGA Coordinator',
            'Ward Coordinator',
            'Polling Unit Agent'
        )
    ),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    lga_id INT REFERENCES lgas(id) ON DELETE SET NULL,
    ward_id INT REFERENCES wards(id) ON DELETE SET NULL,
    polling_unit_id INT REFERENCES polling_units(id) ON DELETE SET NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 3. FIELD OPERATIONS & VOTE AGGREGATION SUBSYSTEM
-- =============================================================================

CREATE TABLE election_activities (
    id SERIAL PRIMARY KEY,
    polling_unit_id INT NOT NULL REFERENCES polling_units(id) ON DELETE CASCADE,
    agent_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL CHECK (
        activity_type IN (
            'Check-in',
            'Accreditation Started',
            'Voting Started',
            'Voting Ended',
            'Counting Started',
            'Counting Completed'
        )
    ),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE incidents (
    id SERIAL PRIMARY KEY,
    polling_unit_id INT NOT NULL REFERENCES polling_units(id) ON DELETE CASCADE,
    reported_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    incident_type VARCHAR(50) NOT NULL CHECK (
        incident_type IN (
            'Violence',
            'Intimidation',
            'BVAS Issues',
            'Vote Buying',
            'Ballot Shortage',
            'Late Officials',
            'Others'
        )
    ),
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'REPORTED' CHECK (status IN ('REPORTED', 'INVESTIGATING', 'RESOLVED', 'DISMISSED')),
    media_url VARCHAR(500),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Form EC8A Submissions
CREATE TABLE vote_results (
    id SERIAL PRIMARY KEY,
    polling_unit_id INT NOT NULL UNIQUE REFERENCES polling_units(id) ON DELETE CASCADE,
    agent_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pdp_votes INT NOT NULL DEFAULT 0 CHECK (pdp_votes >= 0),
    apc_votes INT NOT NULL DEFAULT 0 CHECK (apc_votes >= 0),
    nnpp_votes INT NOT NULL DEFAULT 0 CHECK (nnpp_votes >= 0),
    lp_votes INT NOT NULL DEFAULT 0 CHECK (lp_votes >= 0),
    others_votes INT NOT NULL DEFAULT 0 CHECK (others_votes >= 0),
    total_valid_votes INT NOT NULL DEFAULT 0 CHECK (total_valid_votes >= 0),
    rejected_votes INT NOT NULL DEFAULT 0 CHECK (rejected_votes >= 0),
    total_votes_cast INT NOT NULL DEFAULT 0 CHECK (total_votes_cast >= 0),
    ec8a_photo_url VARCHAR(500),
    verification_status VARCHAR(30) NOT NULL DEFAULT 'VERIFIED' CHECK (verification_status IN ('VERIFIED', 'PENDING_PHOTO', 'FLAGGED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 4. COMMUNICATION & SECURITY AUDIT SUBSYSTEM
-- =============================================================================

CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    sender_name VARCHAR(100) NOT NULL,
    urgency VARCHAR(20) NOT NULL DEFAULT 'Normal' CHECK (urgency IN ('Normal', 'Emergency')),
    target_role VARCHAR(50) NOT NULL DEFAULT 'All',
    target_lga_id INT REFERENCES lgas(id) ON DELETE SET NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INT REFERENCES users(id) ON DELETE SET NULL,
    channel VARCHAR(50) NOT NULL DEFAULT 'General',
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- =============================================================================

CREATE INDEX idx_wards_lga ON wards(lga_id);
CREATE INDEX idx_pu_ward ON polling_units(ward_id);
CREATE INDEX idx_pu_lga ON polling_units(lga_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_lga ON users(lga_id);
CREATE INDEX idx_users_ward ON users(ward_id);
CREATE INDEX idx_incidents_pu ON incidents(polling_unit_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_activities_pu ON election_activities(polling_unit_id);
CREATE INDEX idx_results_pu ON vote_results(polling_unit_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);