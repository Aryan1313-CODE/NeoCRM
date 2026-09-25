import fs from "node:fs";
import assert from "node:assert/strict";

const required = [
  "src/main.jsx",
  "src/styles.css",
  "Dockerfile",
  "nginx.conf",
  ".github/workflows/frontend.yml"
];

for (const file of required) assert.ok(fs.existsSync(file), `Missing ${file}`);
const source = fs.readFileSync("src/main.jsx", "utf8");
for (const token of ["PermissionGuard","LoadingProvider","ToastProvider","healthCheck","apiList","normalizeApiError"]) {
  assert.ok(source.includes(token), `Missing ${token}`);
}
console.log("Chemora frontend Day 1–6 smoke checks passed.");
