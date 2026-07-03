import { test, expect } from "@playwright/test";
import { makeClient } from "../src/client";
import { getAccessToken } from "../src/auth";

test.describe("Dashboard, settings & analytics", () => {
  test("dashboard: 401 without a token", async () => {
    const { response } = await makeClient().GET("/api/admin/dashboard");
    expect(response.status).toBe(401);
  });

  test("dashboard: 200 typed stats with a token", async () => {
    const client = makeClient(await getAccessToken());
    const { data, response } = await client.GET("/api/admin/dashboard");
    expect(response.status).toBe(200);
    expect(typeof data?.stats.appointmentsToday).toBe("number");
    expect(Array.isArray(data?.todayAppointments)).toBe(true);
  });

  test("analytics: 401 without a token", async () => {
    const { response } = await makeClient().GET("/api/admin/analytics");
    expect(response.status).toBe(401);
  });

  test("analytics: 200 typed summary with a token", async () => {
    const client = makeClient(await getAccessToken());
    const { data, response } = await client.GET("/api/admin/analytics", {
      params: { query: { year: 2026 } },
    });
    expect(response.status).toBe(200);
    expect(typeof data?.summary.total_revenue).toBe("number");
    expect(data?.role === "admin" || data?.role === "employee").toBeTruthy();
  });

  test("settings/booking: 200 typed flag with a token", async () => {
    const client = makeClient(await getAccessToken());
    const { data, response } = await client.GET("/api/admin/settings/booking");
    expect(response.status).toBe(200);
    expect(typeof data?.bookingEnabled).toBe("boolean");
  });

  test("attention-items: 200 typed items[] with a token", async () => {
    const client = makeClient(await getAccessToken());
    const { data, response } = await client.GET("/api/admin/dashboard/attention-items");
    expect(response.status).toBe(200);
    expect(Array.isArray(data?.items)).toBe(true);
  });

  test("attention-items: 200 for an employee creating one (staff may create)", async () => {
    const client = makeClient(await getAccessToken("employee", "Password123!"));
    const { data, response } = await client.POST("/api/admin/dashboard/attention-items", {
      body: { content: "created by employee (e2e)" },
    });
    expect(response.status).toBe(200);
    expect(typeof data?.item.id).toBe("string");

    // Clean up as admin (delete stays admin-only).
    const adminClient = makeClient(await getAccessToken());
    const { response: delRes } = await adminClient.DELETE("/api/admin/dashboard/attention-items/{id}", {
      params: { path: { id: data!.item.id } },
    });
    expect(delRes.status).toBe(200);
  });

  test("attention-items: 403 for an employee deleting one (delete stays admin only)", async () => {
    // Admin creates a fixture item…
    const adminClient = makeClient(await getAccessToken());
    const { data: created } = await adminClient.POST("/api/admin/dashboard/attention-items", {
      body: { content: "delete-guard fixture (e2e)" },
    });
    const id = created!.item.id;

    // …employee must not be able to delete it…
    const employeeClient = makeClient(await getAccessToken("employee", "Password123!"));
    const { response: empDel } = await employeeClient.DELETE("/api/admin/dashboard/attention-items/{id}", {
      params: { path: { id } },
    });
    expect(empDel.status).toBe(403);

    // …then admin cleans up.
    const { response: delRes } = await adminClient.DELETE("/api/admin/dashboard/attention-items/{id}", {
      params: { path: { id } },
    });
    expect(delRes.status).toBe(200);
  });

  test("daily-notes: 200 typed note for a date with a token", async () => {
    const client = makeClient(await getAccessToken());
    const { data, response } = await client.GET("/api/admin/dashboard/daily-notes", {
      params: { query: { date: "2026-06-18" } },
    });
    expect(response.status).toBe(200);
    expect(data && "note" in data).toBeTruthy();
  });
});
