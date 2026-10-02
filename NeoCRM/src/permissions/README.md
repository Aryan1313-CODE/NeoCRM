# Frontend permission integration

`src/permissions/permissionTypes.ts` contains the provisional permission vocabulary, including the Day 4 `users.*` and `organization.*` capabilities. Update it when the backend publishes its final names.

`src/permissions/PermissionProvider.tsx` is the shared UI-facing permission state. The provider waits for Day 2 authentication, then loads the signed-in user's grants. Sidebar entries, Settings navigation, page guards, and action gates consume this one provider.

During development only, `permissionService.ts` dynamically loads `mockPermissionAdapter.ts`. Set `VITE_MOCK_PERMISSION_SCENARIO` in `.env.local` to one of `customer-sales`, `analytics-only`, `management-admin`, or `users-reader`. The default preview is `management-admin`. The mock is not an authorization mechanism and is not loaded for production builds.

When the backend permission contract is available, replace `loadPermissions` in `permissionService.ts` with an adapter for the documented response and session. Do not add a guessed endpoint. Backend authorization remains authoritative.
