# Chemora CRM — React Frontend Days 1–6

This is a fresh runnable React/Vite frontend implementing the first six frontend days in the supplied Chemora visual direction.

## Included

- Day 1: App shell, dashboard layout, sidebar, topbar, routing
- Day 2: Login/authentication UI and token persistence
- Day 3: Protected routes, session restore, logout
- Day 4: Role/permission-based navigation
- Day 5: Users, roles and organization settings
- Day 6: Central API client, mock API, error-ready requests and audit log
- Customer table and Add Contact modal for the foundation/UI demonstration

## Run

```bash
npm install
npm run dev
```

Default development mode uses mock responses.

```env
VITE_USE_MOCK_API=true
VITE_API_BASE_URL=http://localhost:8000
```

When the backend is available, set:

```env
VITE_USE_MOCK_API=false
```

The visual design uses the warm cream/olive/forest-green palette, serif headings, compact enterprise tables and navigation shown in the provided Chemora reference image.

Frontend RBAC is only for UI visibility. Backend authorization remains the final security authority.
