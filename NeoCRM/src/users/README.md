# Mock service integration

The UI calls `src/users/userService.ts` and `src/organization/organizationService.ts`. In development these dynamically load their respective `mock*Adapter.ts` modules; records live in module memory only. Production calls currently fail with a user-facing service-unavailable state and make no guessed API request.

When the backend team supplies the user and organization API contracts, replace each service function with calls through the documented API client and preserve the existing UI-facing types where appropriate. No endpoint is assumed here.
