import fs from "node:fs";
import assert from "node:assert/strict";

const required = [
  "src/main.tsx",
  "src/app/App.tsx",
  "src/routes/AppRoutes.tsx",
  "src/auth/AuthProvider.tsx",
  "src/permissions/PermissionProvider.tsx",
  "src/permissions/PermissionGate.tsx",
  "src/permissions/PermissionRoute.tsx",
  "src/feedback/ErrorBoundary.tsx",
  "src/feedback/FeedbackProvider.tsx",
  "src/components/layout/AppShell.tsx",
  "src/components/ui/Dialog.tsx",
  "src/services/api.ts",
  "src/services/customerService.ts",
  "src/services/userService.ts",
  "src/services/organizationService.ts",
  "src/services/auditService.ts",
  "src/services/dashboardService.ts",
  "src/styles.css",
  "Dockerfile",
  "nginx.conf",
  ".github/workflows/frontend.yml"
];
for (const file of required) assert.ok(fs.existsSync(file), `Missing ${file}`);
const source = fs.readFileSync("src/app/App.tsx", "utf8");
for (const token of ["AuthProvider", "PermissionProvider", "LoadingProvider", "FeedbackProvider", "ErrorBoundary", "AppRoutes"]) {
  assert.ok(source.includes(token), `Missing ${token}`);
}
console.log("NeoCRM modular frontend smoke checks passed.");
