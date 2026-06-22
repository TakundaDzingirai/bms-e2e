import { test } from "@playwright/test";
import { getAccessToken } from "../src/auth";
import {
  expectAnonRejected,
  expectEmployee,
  type RouteProbe,
} from "../src/rbac";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * RBAC contract matrix for the routes this suite already covers.
 *
 * For each route we assert:
 *   - anon  → 401  (both guard types)
 *   - employee → 200 (staff routes) / 403 (admin-only routes)
 *
 * Admin → 200 is exercised by the per-route specs (which also validate the
 * typed response shape), so it is not duplicated here.
 *
 * Probes are GETs only. For admin-only routes, anon (401) and employee (403)
 * are rejected by the guard before any path/query value is dereferenced, so a
 * placeholder id is safe.
 */
const ROUTES: RouteProbe[] = [
  // --- staff (ensureAuth: admin OR employee) ---
  { name: "customers list", path: "/api/admin/customers?page=1&pageSize=1", guard: "staff" },
  { name: "inventory list", path: "/api/admin/inventory?page=1&limit=1", guard: "staff" },
  { name: "inventory categories", path: "/api/admin/inventory/categories", guard: "staff" },
  { name: "appointment-slots", path: "/api/admin/appointment-slots", guard: "staff" },
  { name: "dashboard", path: "/api/admin/dashboard", guard: "staff" },
  { name: "dashboard attention-items", path: "/api/admin/dashboard/attention-items", guard: "staff" },
  { name: "dashboard daily-notes", path: "/api/admin/dashboard/daily-notes?date=2026-06-18", guard: "staff" },
  { name: "pos designers", path: "/api/admin/pos/designers", guard: "staff" },
  { name: "pos consignment-items", path: "/api/admin/pos/consignment-items", guard: "staff" },
  { name: "pos size-chart", path: "/api/admin/pos/size-chart", guard: "staff" },

  // --- admin-only (ensureAdmin) ---
  { name: "customer detail", path: `/api/admin/customers/${NIL_UUID}`, guard: "admin" },
  // DIVERGENCE from the stated RBAC contract: the contract lists "employees list
  // & [id]" as admin-only, but the live app guards GET /api/admin/employees with
  // ensureAuth (STAFF). The handler comment is explicit: "Staff (admin or
  // employee) — the list also powers the POS associate dropdown." Employee POST
  // and employees/[id] PUT ARE admin-only, as is everything else under employees.
  // Encoding the app's actual enforced behavior (staff) here and surfacing the
  // mismatch rather than asserting a 403 the app never returns.
  { name: "employees list", path: "/api/admin/employees?page=1&pageSize=1", guard: "staff" },
  { name: "employees shifts", path: "/api/admin/employees/shifts?date_from=2026-01-01", guard: "admin" },
  { name: "employees assignments", path: "/api/admin/employees/assignments", guard: "admin" },
  { name: "purchasing list", path: "/api/admin/purchasing?page=1&limit=1", guard: "admin" },
  { name: "purchasing company", path: "/api/admin/purchasing/company", guard: "admin" },
  { name: "purchasing products", path: `/api/admin/purchasing/products?vendor_id=${NIL_UUID}`, guard: "admin" },
  { name: "sales", path: "/api/admin/sales?page=1&pageSize=1", guard: "admin" },
];

test.describe("RBAC matrix", () => {
  let employeeToken: string;

  test.beforeAll(async () => {
    employeeToken = await getAccessToken("employee", "Password123!");
  });

  for (const route of ROUTES) {
    test(`${route.name} (${route.guard}): anon → 401`, async ({ request }) => {
      await expectAnonRejected(request, route.path);
    });

    test(`${route.name} (${route.guard}): employee → ${route.guard === "staff" ? 200 : 403}`, async ({
      request,
    }) => {
      await expectEmployee(request, route.path, route.guard, employeeToken);
    });
  }
});
