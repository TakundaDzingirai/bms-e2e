import { test, expect } from "@playwright/test";
import { makeClient } from "../src/client";
import { getAccessToken } from "../src/auth";

test.describe("GET /api/admin/sales (admin only)", () => {
  test("401 without a token", async () => {
    const client = makeClient();
    const { error, response } = await client.GET("/api/admin/sales");
    expect(response.status).toBe(401);
    expect(error?.error).toBeTruthy();
  });

  test("403 for an employee (admin-only endpoint)", async () => {
    const token = await getAccessToken("employee", "Password123!");
    const client = makeClient(token);
    const { response } = await client.GET("/api/admin/sales");
    expect(response.status).toBe(403);
  });

  test("200 with a typed, paginated payload for an admin", async () => {
    const token = await getAccessToken(); // defaults to the seeded admin
    const client = makeClient(token);
    const { data, error, response } = await client.GET("/api/admin/sales", {
      params: { query: { page: 1, pageSize: 25 } },
    });

    expect(response.status).toBe(200);
    expect(error).toBeUndefined();
    // Fully typed from the spec: { sales: Sale[]; page; pageSize; total }.
    expect(Array.isArray(data?.sales)).toBe(true);
    expect(typeof data?.total).toBe("number");
    expect(data?.page).toBe(1);
  });
});
