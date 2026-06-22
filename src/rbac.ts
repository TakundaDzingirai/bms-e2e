import { expect, type APIRequestContext } from "@playwright/test";
import { config } from "./env";

/**
 * RBAC matrix helper.
 *
 * Encodes the auth contract for routes the suite already covers, using a plain
 * GET probe per route. We use the raw fetch path (not the typed openapi-fetch
 * client) because the matrix only asserts HTTP status, not response shape — the
 * shape is validated in the per-route specs that run as admin.
 *
 * Guard types:
 *  - "staff": ensureAuth — anon 401, employee 200, admin 200
 *  - "admin": ensureAdmin — anon 401, employee 403, admin 200
 */
export type Guard = "staff" | "admin";

export interface RouteProbe {
  /** Human label for the test title. */
  name: string;
  /** Path + querystring to GET, e.g. "/api/admin/customers?page=1&pageSize=1". */
  path: string;
  guard: Guard;
}

async function status(
  request: APIRequestContext,
  path: string,
  token?: string
): Promise<number> {
  const res = await request.get(`${config.appBaseUrl}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    failOnStatusCode: false,
  });
  return res.status();
}

/** anon GET → always 401 for both guard types. */
export async function expectAnonRejected(request: APIRequestContext, path: string) {
  expect(await status(request, path)).toBe(401);
}

/** employee GET → 200 for staff routes, 403 for admin-only routes. */
export async function expectEmployee(
  request: APIRequestContext,
  path: string,
  guard: Guard,
  employeeToken: string
) {
  const got = await status(request, path, employeeToken);
  expect(got).toBe(guard === "staff" ? 200 : 403);
}
