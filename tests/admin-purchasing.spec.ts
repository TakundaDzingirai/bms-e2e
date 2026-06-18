import { test, expect } from "@playwright/test";
import { makeClient } from "../src/client";
import { getAccessToken } from "../src/auth";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

test.describe("Purchasing", () => {
  test("list: 200 typed { data, total } (no auth yet)", async () => {
    const { data, response } = await makeClient().GET("/api/admin/purchasing", {
      params: { query: { page: 1, limit: 10 } },
    });
    expect(response.status).toBe(200);
    expect(Array.isArray(data?.data)).toBe(true);
    expect(typeof data?.total).toBe("number");
  });

  test("company: 200 typed company details", async () => {
    const { data, response } = await makeClient().GET("/api/admin/purchasing/company");
    expect(response.status).toBe(200);
    expect(typeof data?.po_company_name).toBe("string");
  });

  test("products: 200 typed products[] for a vendor", async () => {
    const { data, response } = await makeClient().GET("/api/admin/purchasing/products", {
      params: { query: { vendor_id: NIL_UUID } },
    });
    expect(response.status).toBe(200);
    expect(Array.isArray(data?.products)).toBe(true);
  });

  // POST/PUT/DELETE require a token (getAuthUser) — these ARE protected.
  test("create PO: 401 without a token", async () => {
    const { response } = await makeClient().POST("/api/admin/purchasing", { body: {} as never });
    expect(response.status).toBe(401);
  });

  test("create PO: 400 with a token but no vendor_id", async () => {
    const client = makeClient(await getAccessToken());
    const { error, response } = await client.POST("/api/admin/purchasing", { body: {} as never });
    expect(response.status).toBe(400);
    expect(error?.error).toBeTruthy();
  });

  test("delete receiving voucher: 401 without a token", async () => {
    const { response } = await makeClient().DELETE("/api/admin/purchasing/{id}/receiving", {
      params: { path: { id: NIL_UUID } },
    });
    expect(response.status).toBe(401);
  });
});
