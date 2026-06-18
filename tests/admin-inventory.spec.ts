import { test, expect } from "@playwright/test";
import { makeClient } from "../src/client";

// Inventory handlers are not auth-protected yet (auth-sweep WIP) — no 401 test.
test.describe("Inventory", () => {
  test("list: 200 typed { products, total, stats }", async () => {
    const { data, response } = await makeClient().GET("/api/admin/inventory", {
      params: { query: { page: 1, limit: 12 } },
    });
    expect(response.status).toBe(200);
    expect(Array.isArray(data?.products)).toBe(true);
    expect(typeof data?.total).toBe("number");
    expect(typeof data?.stats.total_products).toBe("number");
  });

  test("categories: 200 typed categories[]", async () => {
    const { data, response } = await makeClient().GET("/api/admin/inventory/categories");
    expect(response.status).toBe(200);
    expect(Array.isArray(data?.categories)).toBe(true);
  });

  test("create: 400 when base_price/vendor_id missing", async () => {
    const { error, response } = await makeClient().POST("/api/admin/inventory", { body: {} as never });
    expect(response.status).toBe(400);
    expect(error?.error).toBeTruthy();
  });
});
