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

  test("attention-items: 403 for an employee creating one (admin only)", async () => {
    const client = makeClient(await getAccessToken("employee", "Password123!"));
    const { response } = await client.POST("/api/admin/dashboard/attention-items", {
      body: { content: "should be rejected" },
    });
    expect(response.status).toBe(403);
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
