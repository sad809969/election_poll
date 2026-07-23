# JIGAWA PDP POLLWATCH 2027
## Database System Architecture & Entity Schema Specification

**System Purpose**: Real-time Election Situation Room & Monitoring System engineered for the Jigawa State PDP Governorship Campaign across all 27 Local Government Areas (LGAs), 287 Wards, and 4,827 Polling Units in Jigawa State.

---

## 1. System Architecture Diagram

```
                  ┌──────────────────────────────────────────────┐
                  │           1. ELECTORAL HIERARCHY             │
                  │  LGAs (27)  ──►  Wards (287)  ──► PUs (4,827) │
                  └──────────────────────┬───────────────────────┘
                                         │
                  ┌──────────────────────┴───────────────────────┐
                  │          2. USER AUTHENTICATION & RBAC       │
                  │             Users (9 Hierarchy Roles)        │
                  └──────┬───────────────────┬───────────────────┘
                         │                   │
  ┌──────────────────────┴───────┐   ┌───────┴───────────────────────┐
  │   3. ELECTION FIELD OPERATIVE│   │ 4. COMMUNICATION & AUDIT TRAIL│
  │   - ElectionActivity         │   │   - Announcement              │
  │   - Incident                 │   │   - Message                   │
  │   - VoteResult (Form EC8A)   │   │   - AuditLog                  │
  └──────────────────────────────┘   └───────────────────────────────┘
```

---

## 2. Table Schemas & Specifications

### 2.1 Electoral Geography Subsystem

#### 1. `lgas` (Local Government Areas)
Stores all 27 LGAs in Jigawa State.
- `id` (INTEGER, Primary Key, Auto-increment)
- `name` (VARCHAR, Unique, Indexed) — e.g. *Dutse, Hadejia, Gumel, Kazaure, Ringim, Birnin Kudu, Babura, Jahun, Guri, Kaugama, Kiyawa, Buji, Gwaram, Gwiwa, Yankwashi, Roni, Sule Tankarkar, Taura, Maigatari, Miga, Malam Madori, Kafin Hausa, Kirikasamma, Auyo, Birniwa, Gagarawa*
- `code` (VARCHAR, Unique) — LGA Code
- `total_polling_units` (INTEGER, Default: 0)
- `registered_voters` (INTEGER, Default: 0)

#### 2. `wards` (Electoral Wards)
Stores all 287 Wards across the 27 LGAs.
- `id` (INTEGER, Primary Key, Auto-increment)
- `lga_id` (INTEGER, Foreign Key -> `lgas.id`)
- `name` (VARCHAR, Indexed)
- `code` (VARCHAR)
- `total_polling_units` (INTEGER, Default: 0)

#### 3. `polling_units` (Polling Units Directory)
Stores all 4,827 Polling Units in Jigawa State.
- `id` (INTEGER, Primary Key, Auto-increment)
- `lga_id` (INTEGER, Foreign Key -> `lgas.id`)
- `ward_id` (INTEGER, Foreign Key -> `wards.id`)
- `code` (VARCHAR, Unique, Indexed) — e.g. *PU 001, PU 023*
- `name` (VARCHAR) — Polling Unit Name
- `registered_voters` (INTEGER, Default: 500)
- `latitude` (FLOAT, Nullable) — WGS84 GPS Latitude
- `longitude` (FLOAT, Nullable) — WGS84 GPS Longitude
- `status` (VARCHAR, Default: 'Normal') — Status flag: `Normal`, `Attention`, `Critical`, `No Report`

---

### 2.2 User Access & Role Hierarchy Subsystem

#### 4. `users` (System Accounts)
Stores user accounts across 9 authorization role tiers.
- `id` (INTEGER, Primary Key, Auto-increment)
- `full_name` (VARCHAR)
- `username` (VARCHAR, Unique, Indexed)
- `phone_number` (VARCHAR, Nullable)
- `hashed_password` (VARCHAR) — Passlib Bcrypt / Argon2 hash
- `role` (VARCHAR, Indexed) — 9 Authorization Roles:
  1. `Super Admin`
  2. `State Chairman`
  3. `Governorship Candidate`
  4. `Deputy Governorship Candidate`
  5. `Director General`
  6. `Situation Room Officer`
  7. `LGA Coordinator`
  8. `Ward Coordinator`
  9. `Polling Unit Agent`
- `is_active` (BOOLEAN, Default: True)
- `lga_id` (INTEGER, Foreign Key -> `lgas.id`, Nullable)
- `ward_id` (INTEGER, Foreign Key -> `wards.id`, Nullable)
- `polling_unit_id` (INTEGER, Foreign Key -> `polling_units.id`, Nullable)
- `last_login` (DATETIME, Nullable)
- `created_at` (DATETIME, Default: UTC Now)

---

### 2.3 Field Operations & Vote Aggregation Subsystem

#### 5. `election_activities` (Timeline Milestones Tracker)
- `id` (INTEGER, Primary Key, Auto-increment)
- `polling_unit_id` (INTEGER, Foreign Key -> `polling_units.id`)
- `agent_id` (INTEGER, Foreign Key -> `users.id`)
- `activity_type` (VARCHAR) — `Check-in`, `Accreditation Started`, `Voting Started`, `Voting Ended`, `Counting Started`, `Counting Completed`
- `notes` (TEXT, Nullable)
- `created_at` (DATETIME, Default: UTC Now) — Field creation timestamp
- `synced_at` (DATETIME, Default: UTC Now) — Online sync timestamp

#### 6. `incidents` (Field Incidents Log)
- `id` (INTEGER, Primary Key, Auto-increment)
- `polling_unit_id` (INTEGER, Foreign Key -> `polling_units.id`)
- `reported_by` (INTEGER, Foreign Key -> `users.id`)
- `incident_type` (VARCHAR) — `Violence`, `Intimidation`, `BVAS Issues`, `Vote Buying`, `Ballot Shortage`, `Late Officials`, `Others`
- `severity` (VARCHAR, Default: 'MEDIUM') — `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `description` (TEXT)
- `status` (VARCHAR, Default: 'REPORTED') — `REPORTED`, `INVESTIGATING`, `RESOLVED`, `DISMISSED`
- `media_url` (VARCHAR, Nullable) — Attachment photo/video S3/Cloud URL
- `latitude` (FLOAT, Nullable) — GPS tag
- `longitude` (FLOAT, Nullable) — GPS tag
- `created_at` (DATETIME, Default: UTC Now)
- `synced_at` (DATETIME, Default: UTC Now)

#### 7. `vote_results` (Official Form EC8A Submissions)
- `id` (INTEGER, Primary Key, Auto-increment)
- `polling_unit_id` (INTEGER, Foreign Key -> `polling_units.id`, Unique 1:1)
- `agent_id` (INTEGER, Foreign Key -> `users.id`)
- `pdp_votes` (INTEGER, Default: 0) — PDP Vote Tally
- `apc_votes` (INTEGER, Default: 0) — APC Vote Tally
- `nnpp_votes` (INTEGER, Default: 0) — NNPP Vote Tally
- `lp_votes` (INTEGER, Default: 0) — LP Vote Tally
- `others_votes` (INTEGER, Default: 0) — Other Parties Tally
- `total_valid_votes` (INTEGER, Default: 0)
- `rejected_votes` (INTEGER, Default: 0)
- `total_votes_cast` (INTEGER, Default: 0)
- `ec8a_photo_url` (VARCHAR, Nullable) — High-res official Form EC8A result sheet photo
- `verification_status` (VARCHAR, Default: 'VERIFIED') — `VERIFIED`, `PENDING_PHOTO`, `FLAGGED`
- `notes` (TEXT, Nullable)
- `created_at` (DATETIME, Default: UTC Now)
- `synced_at` (DATETIME, Default: UTC Now)

---

### 2.4 Communication & Security Audit Subsystem

#### 8. `announcements` (Broadcast Announcements)
- `id` (INTEGER, Primary Key, Auto-increment)
- `title` (VARCHAR)
- `message` (TEXT)
- `sender_name` (VARCHAR)
- `urgency` (VARCHAR, Default: 'Normal') — `Normal`, `Emergency`
- `target_role` (VARCHAR, Default: 'All') — `All`, `LGA Coordinators`, `Ward Coordinators`, `Polling Unit Agents`
- `target_lga_id` (INTEGER, Nullable)
- `is_pinned` (BOOLEAN, Default: False)
- `created_at` (DATETIME, Default: UTC Now)

#### 9. `messages` (Inter-Agent Communications)
- `id` (INTEGER, Primary Key, Auto-increment)
- `sender_id` (INTEGER, Foreign Key -> `users.id`)
- `recipient_id` (INTEGER, Foreign Key -> `users.id`, Nullable)
- `channel` (VARCHAR, Default: 'General')
- `content` (TEXT)
- `created_at` (DATETIME, Default: UTC Now)

#### 10. `audit_logs` (Immutable Security Audit Trail)
- `id` (INTEGER, Primary Key, Auto-increment)
- `user_id` (INTEGER, Nullable)
- `username` (VARCHAR, Nullable)
- `action` (VARCHAR) — e.g. `SUPER_ADMIN_LOGIN`, `SUBMIT_EC8A_RESULT`, `FLAG_CRITICAL_INCIDENT`
- `details` (TEXT, Nullable)
- `ip_address` (VARCHAR, Nullable)
- `timestamp` (DATETIME, Default: UTC Now)

---

## 3. Production Deployment Configurations

### SQLite (Default / Pre-Seeded Testing Engine)
- Automatically seeded on startup with all 27 Jigawa LGAs and default accounts (`/tmp/pollwatch.db` on Vercel).

### PostgreSQL (Recommended for Live Election Day)
To connect managed PostgreSQL (Neon / Supabase / Vercel Postgres) for high-concurrency Election Day operations:
- `DATABASE_URL` = `postgresql+asyncpg://user:password@host:5432/pollwatch`
- `SYNC_DATABASE_URL` = `postgresql://user:password@host:5432/pollwatch`

---
© 2027 Jigawa PDP PollWatch. All rights reserved.
