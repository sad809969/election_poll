# Implementation Plan: Clean Mobile App, Render WebSocket & Notification Screen

## 1. Objectives & Scope
The user requested:
> *"clean the app and put socket for render only please remove that gear icon and main only render cloud and also notification icon and screen"*

### Key Requirements:
1. **Clean the App**:
   - Run `flutter clean` and refresh dependencies with `flutter pub get`.
   - Clean up legacy localhost/emulator/Vercel/tunnel candidates from `api_service.dart`.
2. **Remove Gear Icon & Lock to Render Cloud Only**:
   - In `login_screen.dart`, remove the top-right Settings gear icon (`Icons.settings_outlined`) and the server config popup.
   - Hardcode and enforce Render Cloud (`https://pdp-pollwatch-backend.onrender.com/api`) as the sole, immutable backend endpoint across all services.
3. **Add WebSocket Client for Render Cloud**:
   - Build `SocketService` using standard `dart:io` WebSocket (`wss://pdp-pollwatch-backend.onrender.com/ws/live-feed?token=...`).
   - Implement automatic reconnect with exponential backoff on network changes.
   - Dispatch incoming real-time messages (broadcasts, incident alerts, collation updates) to app state.
4. **Add Notification Icon & Screen**:
   - In `home_dashboard.dart`, add a Notification Bell icon with an active unread badge counter to the AppBar.
   - Create `mobile/lib/screens/notifications_screen.dart` displaying incoming broadcasts, situation room alerts, and system notices with timestamps, urgency tags, and clear-all actions.

---

## 2. Technical Architecture & File Changes

### A. Dedicated WebSocket Service (`mobile/lib/services/socket_service.dart`)
- **Endpoint**: `wss://pdp-pollwatch-backend.onrender.com/ws/live-feed?token=<JWT>`
- **Lifecycle**:
  - Connects immediately upon successful login.
  - Disconnects on user logout.
  - Automatically reconnects if connection drops (with exponential backoff: 2s, 4s, 8s, up to 30s).
- **Event Dispatcher**:
  - Exposes a `ValueNotifier<List<AppNotification>>` or callback stream for real-time UI updates.
  - Persists unread count for the notification badge.

### B. Cleaned API Service (`mobile/lib/services/api_service.dart`)
- Set `baseUrl` permanently to `'https://pdp-pollwatch-backend.onrender.com/api'`.
- Remove legacy IP scanning (`autoDetectServer`), presets for localhost/10.0.2.2/Vercel/Neotech, and USB tunnel logic.
- Keep clean, direct methods: `login()`, `submitResult()`, `reportIncident()`, `updateTimeline()`, `uploadPhoto()`, `fetchNotifications()`.

### C. Polished Login Screen (`mobile/lib/screens/login_screen.dart`)
- Remove the top-right gear icon button (`_showServerConfigDialog`).
- Remove the server config dialog and manual preset picker.
- Display a sleek badge indicating "Connected to Render Cloud (Live)".
- Clean, focused PDP branding with username/password inputs and direct authentication.

### D. New Notifications Screen & Badge (`mobile/lib/screens/notifications_screen.dart`)
- **Screen**:
  - Displays real-time messages from Situation Room and broadcasts from the central command.
  - Filter tabs: `All`, `Urgent`, `Broadcasts`, `System`.
  - Action to mark all as read or refresh.
- **Home Dashboard Integration (`home_dashboard.dart`)**:
  - Add notification bell icon to AppBar next to online/offline indicator.
  - Show unread badge count (e.g. red bubble with number).
  - Tapping opens `NotificationsScreen`.

---

## 3. Step-by-Step Execution Plan

1. **Step 1**: Clean the app environment:
   - Run `flutter clean` followed by `flutter pub get` in `mobile/`.
2. **Step 2**: Create `mobile/lib/services/socket_service.dart`:
   - Implement `SocketService` with `dart:io` `WebSocket.connect()`, ping/pong heartbeat, reconnect handler, and notification list state.
3. **Step 3**: Update `mobile/lib/services/api_service.dart`:
   - Set fixed Render Cloud URL and clean out legacy server probing logic.
4. **Step 4**: Update `mobile/lib/screens/login_screen.dart`:
   - Remove gear icon and server config dialog.
5. **Step 5**: Create `mobile/lib/screens/notifications_screen.dart`:
   - Build responsive notifications UI matching the PDP PollWatch dark aesthetic (`#070D1E`, `#141E38`, emerald `#008751`, rose `#E11D48`).
6. **Step 6**: Update `mobile/lib/screens/home_dashboard.dart`:
   - Integrate notification bell icon with badge in the AppBar and wire `SocketService`.
7. **Step 7**: Verification:
   - Run `flutter analyze` to ensure zero compilation or type errors.

---

## 4. Verification Checklist
- [ ] `flutter clean` & `flutter pub get` run cleanly.
- [ ] No gear icon on login screen; server is strictly locked to Render Cloud.
- [ ] `SocketService` connects to `wss://pdp-pollwatch-backend.onrender.com/ws/live-feed`.
- [ ] Notification bell icon appears in `HomeDashboard` with real-time badge.
- [ ] `NotificationsScreen` opens and shows alert history and incoming broadcasts.
- [ ] Dart static analysis passes with 0 errors (`flutter analyze`).
