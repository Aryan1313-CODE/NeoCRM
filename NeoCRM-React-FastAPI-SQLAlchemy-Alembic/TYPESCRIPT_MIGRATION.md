# TypeScript / TSX migration

The working NeoCRM frontend has been migrated from JSX/JavaScript to the TypeScript structure used by PR #6.

- React components are `.tsx`.
- Frontend modules/services/configuration are `.ts`.
- `main.tsx`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, and `vite.config.ts` follow the PR's TypeScript/Vite structure.
- The existing FastAPI API contracts and working frontend modules (Customers, Dashboard, Users, Organization, Audit, Health, authentication and RBAC UX) are preserved.
- The PR-style `AppStoreProvider` is included without replacing the existing loading/feedback behavior.
- Mock adapters are not made the production API path.
