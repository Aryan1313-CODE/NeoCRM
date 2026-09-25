
# Chemora CRM — Day 1–6 Completion

This package closes the previously identified frontend gaps.

## Day 1
- React/Vite app shell
- Responsive Chemora UI
- Routing
- Docker + nginx
- GitHub Actions CI build
- `/health` connectivity screen

## Day 2
- Login UI
- `/auth/login`
- Token persistence
- Logout
- Authentication errors

## Day 3
- Protected routes
- Session restoration via `/auth/me`
- Central 401/session-expired event
- Login redirect

## Day 4
- Roles and permissions
- Permission-aware sidebar
- Reusable `PermissionGuard`
- Permission-protected routes

## Day 5
- Users list
- Create user API
- Edit user API
- Deactivate/delete API
- User validation
- User success/error toasts
- Organization GET
- Organization PUT
- Organization validation
- Organization notifications
- Audit filters
- Audit pagination controls

## Day 6
- Central API client
- Bearer token
- Standard API error normalization
- Query/pagination helper
- Global loading indicator
- Global toast notifications
- 401/403/404/409/422/5xx handling
- Backend health check
- Mock API for independent frontend development

## Backend endpoint expectations

The frontend now expects these production endpoints when mock mode is disabled:

- POST `/auth/login`
- GET `/auth/me`
- GET/POST/PUT/DELETE `/users`
- GET/PUT `/organization`
- GET `/audit`
- GET `/health`

Audit pagination/filter parameters are sent as:
`page`, `limit`, `result`, `action`.

The backend remains responsible for authoritative authentication, RBAC, validation, audit logging and data integrity.
