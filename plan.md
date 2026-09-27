
# Implementation Plan: Jigawa State PDP PollWatch

## 1. User Synchronization Between Side A and Side B

### Problem Diagnosis

The user reported that adding a user in Side A did not make the user appear in Side B.

The identified causes include:

1. **Missing JWT token on Side A:** Unlocking Side A with the admin passcode did not necessarily provide a JWT token for protected backend API requests.
2. **Hardcoded fallback users:** Side B could display static fallback users when the backend request failed, hiding actual users.
3. **User ordering and large datasets:** Thousands of seeded agents could make newly created users difficult to find.
4. **Cross-tab synchronization:** Side A and Side B needed a way to reflect newly created users without requiring manual refreshes.
5. **Serverless database limitations:** Temporary serverless storage may not reliably share newly created users across separate instances.

### Proposed Changes

#### Backend: Agent Listing

- Sort agents with the newest users first.
- Add an optional limit to prevent excessive data loading.
- Ensure that the API returns the appropriate user information.

#### Side A: User Management

- Ensure that administrative API requests have valid authorization.
- When a user is saved, update the local custom-user list where appropriate.
- Dispatch a `pdp_users_updated` event to notify other pages.

#### Side B: User Management and Agent Directory

- Listen for the `pdp_users_updated` and browser `storage` events.
- Display newly created users promptly.
- Merge locally stored custom users with backend users without creating duplicates.
- Show new users at the top of the list and identify them with a NEW badge.
- Add search and pagination to make large user lists easier to manage.
- Ensure custom users are reflected in the agent directory and status controls.

#### Login and Permissions

- Ensure that user login uses the backend as the source of truth.
- Respect the user's assigned role and `allowed_pages`.
- Avoid relying on browser storage alone for authentication or authorization.

## 2. Polling Unit Agent Login and Mobile App Resilience

### Problem Diagnosis

The mobile app may fail to authenticate polling unit agents for several reasons:

1. **Temporary serverless database:** A user created in one temporary serverless instance may not exist in another instance.
2. **Phone number formatting:** Agents may enter phone numbers with spaces or international prefixes, while the backend expects a different format.
3. **Short network timeout:** Slow cellular connections or server cold starts may exceed the mobile app's previous timeout.
4. **Chained request failures:** Additional requests for user or polling unit details may fail even after successful authentication.

### Proposed Changes

#### Backend Authentication

- Normalize phone numbers to support common Nigerian formats.
- Support case-insensitive username matching.
- Return the user's profile information directly in the login response, including their role, polling unit, LGA, ward, and allowed pages.
- Maintain appropriate authentication and account-status checks.

#### Mobile App

- Increase the API timeout to accommodate slower network connections.
- Parse user details directly from the login response.
- Handle missing polling unit details gracefully without incorrectly treating an unassigned agent as assigned.
- Provide clear error messages when credentials or server settings are incorrect.
- Add server presets for Render, Neotech Hosting, Vercel, and local development.

## 3. Database and Production Hosting

### Database Requirements

The application requires persistent storage so that users, polling units, assignments, incidents, and results remain available across web and mobile clients.

### Proposed Changes

- Support PostgreSQL connection URLs.
- Normalize PostgreSQL URL formats where required by SQLAlchemy.
- Configure database access for production hosting.
- Ensure that production data is not dependent on temporary serverless storage.

### Render Deployment

- Provide a `render.yaml` deployment configuration.
- Configure the FastAPI web service.
- Configure a managed PostgreSQL database.
- Link the database URL to the backend service.
- Configure production startup and database initialization safely.

### Neotech Hosting Deployment

- Provide a `passenger_wsgi.py` entry point for supported cPanel hosting.
- Provide a deployment script for Linux environments.
- Configure a systemd service where supported.
- Provide an Nginx reverse proxy configuration where supported.
- Provide a production Docker Compose configuration.

## 4. Verification Plan

### User Synchronization

1. Create a test user in Side A.
2. Confirm that the user appears in Side B.
3. Confirm that the user is displayed with the correct role and permissions.
4. Test synchronization between browser tabs.
5. Confirm that search and pagination work correctly.

### Authentication and Mobile Login

1. Test login using usernames in different letter cases.
2. Test phone numbers with and without spaces and country prefixes.
3. Verify that successful login returns the correct user profile and access token.
4. Test login for users with and without polling unit assignments.
5. Confirm that inactive accounts cannot log in.

### Database and Deployment

1. Verify that SQLite and PostgreSQL connection configurations work as intended.
2. Confirm that production data persists after service restarts.
3. Test the configured deployment process.
4. Verify that the web dashboard and mobile application can access the production backend.

### Automated Tests

- Run the backend test suite.
- Test authentication, agent management, and results endpoints.
- Run Flutter static analysis.
- Verify that frontend builds successfully.

## 5. Implementation Order

1. Complete the frontend user synchronization changes.
2. Review and update the backend user and agent APIs.
3. Complete authentication and mobile login improvements.
4. Verify database persistence and deployment configurations.
5. Run automated and manual tests.
6. Deploy only after the required checks pass.