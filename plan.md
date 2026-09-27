# Implementation Plan: Mobile Endpoints & Real-Time Data Sync Verification

## 1. Executive Summary & User Objectives
The user requested:
> *"ok now next is to make sure the mobile is send the data and recieving anything make sure all endpoints are working normal"*

The objective of this phase is to ensure that the Flutter mobile application (`mobile/`) seamlessly communicates with the FastAPI backend (`backend/app/`):
1. **Sending Data**: Result submissions (Form EC8A), incident reports with GPS geotagging and photo attachments, election timeline milestones/check-ins, and media uploads.
2. **Receiving Data**: Agent authentication token, assigned Polling Unit details with authentic LGA & Ward hierarchy (eliminating fallback strings), timeline milestones, and incident statuses.
3. **Validating All Endpoints**: Ensure every endpoint called by the mobile client is healthy, returns proper HTTP status codes, properly parses JSON payloads, and handles edge cases (e.g. over-voting detection, duplicate result updates).

---

## 2. Technical Architecture & Endpoints Audit

### 2.1 Backend Endpoints Review & Enhancements

| Endpoint | Method | Mobile Screen / Service | Status & Required Enhancement |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | `POST` | `login_screen.dart` | **Verified Functional.** Accepts OAuth2 form-data or JSON, issues JWT, returns user ID, role, PU ID, LGA ID, Ward ID. |
| `/api/auth/me` | `GET` | `ApiService.login()` | **Verified Functional.** Returns full agent profile and permission matrix. |
| `/api/electoral/polling-units/{id}` | `GET` | `login_screen.dart` | **Needs Schema Enrichment.** `PollingUnitResponse` in `backend/app/schemas.py` currently omits `lga` and `ward` relationship objects, causing mobile to fall back to `"Jigawa Command"`. Enrich with `lga`, `ward`, `lga_name`, and `ward_name`. |
| `/api/upload` | `POST` | `ResultSubmissionScreen`, `IncidentReportScreen` | **New Route Required.** Expose a dedicated multipart file upload endpoint wrapping `UploadService` in `backend/app/services/upload_service.py` to allow mobile to upload EC8A photos and incident media to `/uploads/`. |
| `/api/results/submit` | `POST` | `result_submission_screen.dart` | **Verified Functional.** Supports multi-candidate tallies, checks over-voting (Electoral Act 2022 Section 51), saves GPS geotags in notes, and stores `ec8a_photo_url`. |
| `/api/incidents` | `POST` | `incident_report_screen.dart` | **Needs Enrichment.** Currently returns raw model where `polling_unit_code`, `lga_name`, `reporter_name` are null on creation. Return fully enriched `IncidentResponse`. |
| `/api/incidents` | `GET` | Mobile / Web Dashboard | **Verified Functional.** Returns filtered incidents with PU, LGA, and reporter metadata. |
| `/api/activities` | `POST` | `timeline_tracker_screen.dart` | **Verified Functional.** Logs timeline milestones (e.g., "Agent Check-in", "Accreditation Started", "Counting Started") with audit trail. |
| `/api/activities` | `GET` | `timeline_tracker_screen.dart` | **Verified Functional.** Retrieves timeline milestone history for the polling unit. |

---

## 3. Implementation Steps

### Phase 1: Backend Schema & Router Enhancements
1. **Enrich `PollingUnitResponse` (`backend/app/schemas.py`)**:
   - Add `lga: Optional[LGAResponse] = None`, `ward: Optional[WardResponse] = None`, `lga_name: Optional[str] = None`, `ward_name: Optional[str] = None`.
   - Add `@property` helpers on `PollingUnit` model in `backend/app/models.py` for `lga_name` and `ward_name` to ensure seamless Pydantic serialization.
2. **Enrich Incident Creation Response (`backend/app/routers/incidents.py`)**:
   - Populate `polling_unit_code`, `polling_unit_name`, `lga_name`, `reporter_name`, and `reporter_phone` on the newly created incident before returning `IncidentResponse`.
3. **Expose Media Upload Endpoint (`backend/app/routers/uploads.py`)**:
   - Create `POST /api/upload` route that accepts `file: UploadFile` and `category: str = Form("results")`.
   - Integrate with `upload_service.save_uploaded_file(file, subfolder=category)`.
   - Register `uploads.router` in `backend/app/main.py`.

### Phase 2: Mobile Client Enhancements (`mobile/`)
1. **Multipart Upload Support (`mobile/lib/services/api_service.dart`)**:
   - Implement `ApiService.uploadFile(File file, {String subfolder = 'results'})` using `http.MultipartRequest`.
2. **Result Submission Screen (`mobile/lib/screens/result_submission_screen.dart`)**:
   - Upload captured EC8A photo via `ApiService.uploadFile` and pass the returned server URL to `submitResult`.
   - Pass exact `registeredVoters` from `currentPu['registered_voters']` to ensure accurate over-voting detection.
3. **Incident Report Screen (`mobile/lib/screens/incident_report_screen.dart`)**:
   - Upload captured evidence photo via `ApiService.uploadFile` and pass URL to `reportIncident`.
4. **Login & Home Navigation (`mobile/lib/screens/login_screen.dart`, `mobile/lib/screens/home_dashboard.dart`)**:
   - Bind authentic `lgaName` from `currentPu['lga']['name']` or `currentPu['lga_name']` (e.g. "Dutse") and pass `registeredVoters` to `ResultSubmissionScreen`.

---

## 4. Verification & Testing Plan
1. **Automated Integration Test (`scripts/test_mobile_endpoints.py`)**:
   - Authenticate live agent credentials (`agent` / `agent123`).
   - Fetch assigned PU details and verify LGA name is `"Dutse"` and registered voters is `623`.
   - Upload a test EC8A photo via `POST /api/upload` and verify 200 OK + valid file URL.
   - Submit Form EC8A result via `POST /api/results/submit` with the uploaded photo URL and verify verification status.
   - Report an incident via `POST /api/incidents` with GPS coordinates and verify enriched PU & LGA response.
   - Log an activity milestone via `POST /api/activities` and verify retrieval via `GET /api/activities`.
2. **Flutter Codebase Health**:
   - Run `flutter analyze` in `mobile/` to confirm zero compilation errors.
3. **Web Dashboard Confirmation**:
   - Verify submitted result and incident appear live in the Next.js web dashboard (`/election-results`, `/incidents`).
4. **Git Commit & Push**:
   - Stage, commit, and push changes to `main`.


