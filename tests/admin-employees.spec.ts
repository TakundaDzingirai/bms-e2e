import { test, expect } from "@playwright/test";
import { makeClient } from "../src/client";
import { getAccessToken } from "../src/auth";

// Auth is now ENFORCED: employees list & [id], shifts, assignments are admin-only;
// time-entries GET/POST = staff, PUT/DELETE = admin-only.
test.describe("Employees", () => {
  test("list: 401 without a token", async () => {
    const { response } = await makeClient().GET("/api/admin/employees");
    expect(response.status).toBe(401);
  });

  test("list: 200 typed, paginated with a token", async () => {
    const client = makeClient(await getAccessToken());
    const { data, response } = await client.GET("/api/admin/employees", {
      params: { query: { page: 1, pageSize: 10 } },
    });
    expect(response.status).toBe(200);
    expect(Array.isArray(data?.data)).toBe(true);
    expect(typeof data?.total).toBe("number");
  });

  test("create: 403 for an employee (admin only)", async () => {
    const client = makeClient(await getAccessToken("employee", "Password123!"));
    const { response } = await client.POST("/api/admin/employees", { body: {} as never });
    expect(response.status).toBe(403);
  });

  test("create: 400 for an admin with missing fields", async () => {
    const client = makeClient(await getAccessToken());
    const { error, response } = await client.POST("/api/admin/employees", { body: {} as never });
    expect(response.status).toBe(400);
    expect(error?.error).toBeTruthy();
  });

  // shifts / assignments are admin-only; time-entries GET is staff.
  test("shifts: 400 without date_from (admin)", async () => {
    const client = makeClient(await getAccessToken());
    const { response } = await client.GET("/api/admin/employees/shifts", { params: { query: {} as never } });
    expect(response.status).toBe(400);
  });

  test("shifts: 200 typed with date_from (admin)", async () => {
    const client = makeClient(await getAccessToken());
    const { data, response } = await client.GET("/api/admin/employees/shifts", {
      params: { query: { date_from: "2026-01-01" } },
    });
    expect(response.status).toBe(200);
    expect(Array.isArray(data?.shifts)).toBe(true);
  });

  test("time-entries: 200 typed, paginated (staff)", async () => {
    const client = makeClient(await getAccessToken());
    const { data, response } = await client.GET("/api/admin/employees/time-entries", {
      params: { query: { page: 1, pageSize: 10 } },
    });
    expect(response.status).toBe(200);
    expect(Array.isArray(data?.data)).toBe(true);
  });

  test("assignments: 200 typed { employees, appointments } (admin)", async () => {
    const client = makeClient(await getAccessToken());
    const { data, response } = await client.GET("/api/admin/employees/assignments");
    expect(response.status).toBe(200);
    expect(Array.isArray(data?.employees)).toBe(true);
    expect(Array.isArray(data?.appointments)).toBe(true);
  });
});
