import { test, expect } from "@playwright/test";
import { makeClient } from "../src/client";
import { getAccessToken } from "../src/auth";

// Auth is now ENFORCED: customers GET = staff (admin OR employee);
// POST + /[id] GET/PATCH/DELETE = admin-only.
test.describe("Customers", () => {
  test("list: 200 typed, paginated (admin)", async () => {
    const client = makeClient(await getAccessToken());
    const { data, response } = await client.GET("/api/admin/customers", {
      params: { query: { page: 1, pageSize: 10 } },
    });
    expect(response.status).toBe(200);
    expect(Array.isArray(data?.data)).toBe(true);
    expect(typeof data?.total).toBe("number");
  });

  test("create -> detail -> delete lifecycle (admin)", async () => {
    const client = makeClient(await getAccessToken());
    const email = `e2e+${Date.now()}@test.local`;

    const created = await client.POST("/api/admin/customers", {
      body: { full_name: "E2E Test Customer", email },
    });
    expect(created.response.status).toBe(201);
    const id = (created.data?.data as { client_id?: string } | undefined)?.client_id;
    expect(id).toBeTruthy();

    const detail = await client.GET("/api/admin/customers/{id}", {
      params: { path: { id: id! } },
    });
    expect(detail.response.status).toBe(200);
    expect((detail.data?.client as { client_id?: string } | undefined)?.client_id).toBe(id);

    const del = await client.DELETE("/api/admin/customers/{id}", {
      params: { path: { id: id! } },
    });
    expect(del.response.status).toBe(200);
    expect(del.data?.success).toBe(true);
  });

  test("create: 400 when required fields are missing (admin)", async () => {
    const client = makeClient(await getAccessToken());
    const { error, response } = await client.POST("/api/admin/customers", { body: {} as never });
    expect(response.status).toBe(400);
    expect(error?.error).toBeTruthy();
  });
});
