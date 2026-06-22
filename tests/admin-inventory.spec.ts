import { test, expect } from "@playwright/test";
import { makeClient } from "../src/client";
import { getAccessToken } from "../src/auth";

// Auth is now ENFORCED: inventory GET + categories GET = staff;
// inventory POST/PUT/DELETE + categories PUT = admin-only.
test.describe("Inventory", () => {
  test("list: 200 typed { products, total, stats } (admin)", async () => {
    const client = makeClient(await getAccessToken());
    const { data, response } = await client.GET("/api/admin/inventory", {
      params: { query: { page: 1, limit: 12 } },
    });
    expect(response.status).toBe(200);
    expect(Array.isArray(data?.products)).toBe(true);
    expect(typeof data?.total).toBe("number");
    expect(typeof data?.stats.total_products).toBe("number");
  });

  test("categories: 200 typed categories[] (admin)", async () => {
    const client = makeClient(await getAccessToken());
    const { data, response } = await client.GET("/api/admin/inventory/categories");
    expect(response.status).toBe(200);
    expect(Array.isArray(data?.categories)).toBe(true);
  });

  test("create: 400 when base_price/vendor_id missing (admin)", async () => {
    const client = makeClient(await getAccessToken());
    const { error, response } = await client.POST("/api/admin/inventory", { body: {} as never });
    expect(response.status).toBe(400);
    expect(error?.error).toBeTruthy();
  });
});
