# Implementation Plan: Mobile App Camera Placeholder & Live GPS Location Geotagging

## 1. Objective & Scope
The goal is to replace the simulated/dummy photo button and missing location capture in the Jigawa PDP PollWatch Mobile Application (`mobile/`) with:
1. **Interactive Camera / Form EC8A Photo Placeholder & Preview Container**:
   - High-fidelity visual placeholder card matching PDP Dark & Emerald theme.
   - Live camera snapshot and gallery picker with `image_picker`.
   - Rich preview card showing the captured image thumbnail, metadata (file name, timestamp), and actions to retake or remove the photo.
   - Reusable evidence photo capture card for `IncidentReportScreen`.
2. **Live GPS Location Geotagging & Polling Unit Geofence Verification**:
   - Real-time GPS coordinate acquisition (Latitude, Longitude, Accuracy) using `geolocator`.
   - Visual GPS Geotag status card showing satellite lock status, coordinates, accuracy (± meters), and geofence verification badge.
   - Seamless permission handling with graceful fallback for emulators, devices with location turned off, or permission denials.
   - Sending live GPS coordinates to the backend for both Form EC8A results and Field Incident reports.
3. **Android Permissions & Configuration**:
   - Add Camera & Media Storage permissions to `AndroidManifest.xml`.
   - Update `mobile/pubspec.yaml` with `image_picker: ^1.1.2`.

---

## 2. Proposed Changes & Architecture

### Component 1: Dependencies & Android Manifest (`mobile/`)
- **`mobile/pubspec.yaml`**:
  - Add `image_picker: ^1.1.2` (geolocator is already installed).
- **`mobile/android/app/src/main/AndroidManifest.xml`**:
  - Add camera permissions:
    - `<uses-permission android:name="android.permission.CAMERA"/>`
    - `<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32"/>`
    - `<uses-permission android:name="android.permission.READ_MEDIA_IMAGES"/>`
  - Ensure location permissions remain active:
    - `<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>`
    - `<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>`

---

### Component 2: Form EC8A Photo & Camera Placeholder (`result_submission_screen.dart`)
Replace the simple text button with an **Interactive Form EC8A Camera Card**:
1. **Empty / Placeholder State**:
   - Container styled with rounded corners (`16px`), glassmorphism dark background (`#0B132B` / `#141E38`), and a subtle dashed border (`#10B981` / `#334155`).
   - Prominent camera & ballot sheet icon in PDP Emerald Green.
   - Title: `OFFICIAL FORM EC8A PHOTO PROOF`.
   - Guidelines:
     - `• INEC Official Stamp must be clearly legible`
     - `• Presiding Officer & Party Agent signatures visible`
     - `• All vote tallies (PDP, APC, NNPP, LP) must be sharp`
   - Two interactive action buttons:
     - **"Take Photo with Camera"** (Elevated Emerald Green `#008751`).
     - **"Select from Gallery"** (Outlined Slate `#334155` with green text).
2. **Captured / Preview State**:
   - Shows actual image thumbnail preview (using `Image.file`).
   - Status badge: `● EC8A PHOTO ATTACHED & GEO-STAMPED` in emerald green.
   - Details: File name and capture timestamp.
   - Actions:
     - **"Retake Photo"** (re-opens camera/picker).
     - **"Remove"** (resets to placeholder state).

---

### Component 3: Live GPS Geotagging & Polling Unit Geofence Card
In both `ResultSubmissionScreen` and `IncidentReportScreen`:
1. **Real-Time GPS Acquisition**:
   - Use `Geolocator.checkPermission()` and `Geolocator.requestPermission()`.
   - Fetch high-accuracy location via `Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high)`.
   - Fallback coordinates (Jigawa Polling Unit baseline e.g. `11.7583° N, 9.3381° E`) if GPS hardware is unavailable or running on emulator.
2. **Visual GPS Status Card**:
   - Container with dark navy background (`#141E38`) and border.
   - Header: `POLLING UNIT GPS GEOTAG VERIFICATION` with a glowing satellite icon.
   - Live coordinates: `Lat: 11.7583° N  |  Lng: 9.3381° E`.
   - Accuracy indicator: `Accuracy: ± 3.8m • Satellite Locked`.
   - Badge: `✓ Geofence Verified: Polling Unit Grounds`.
   - Interactive `Refresh GPS` button to trigger re-polling with loading spinner.

---

### Component 4: Field Incident Evidence Capture (`incident_report_screen.dart`)
- Add an interactive photo capture placeholder to the incident report screen so field agents can snap photos of BVAS failure screens, ballot box disruption, or crowd issues.
- Pass live acquired `latitude` and `longitude` to `ApiService.reportIncident`.

---

### Component 5: API Service & Data Integration (`api_service.dart`)
- Ensure `ApiService.submitResult` embeds GPS coordinates in submission notes (e.g. `[GPS Geotag: 11.75834, 9.33812 | Accuracy: 3.5m]`).
- Ensure `ApiService.reportIncident` sends actual device latitude and longitude.

---

## 3. Visual & Aesthetic Standards (PDP Design System)
- Primary Brand Color: `#008751` (PDP Emerald Green).
- Secondary Highlight: `#10B981` (Bright Emerald).
- Dark Backgrounds: `#070D1E` (Dark Night), `#0B132B` (Navy Surface), `#141E38` (Card Surface).
- Accent Status: Amber for warning/pending, Red for critical/rejected, Emerald for verified.
- Typography: High-contrast white headers with subtle slate `#94A3B8` captions.

---

## 4. Verification & Testing Plan
1. **Dependency Installation**: Run `flutter pub get` in `mobile/` to install `image_picker`.
2. **Static Code Analysis**: Run `flutter analyze` or `dart analyze` to ensure 0 errors and clean code.
3. **Local UI & Flow Verification**:
   - Test `ResultSubmissionScreen`: Verify camera placeholder renders, photo can be chosen or snapped, image preview appears with retake/remove buttons, and GPS card acquires coordinates.
   - Test `IncidentReportScreen`: Verify camera placeholder and GPS coordinates display and dispatch correctly.
   - Test `HomeDashboard`: Verify location and navigation integrity.
4. **Git Commit & Push**: Commit with clear message and push to GitHub repository.
