import { test, expect } from "@playwright/test";
import { makeClient } from "../src/client";
import { getAccessToken } from "../src/auth";

// POS endpoints are protected (ensureAuth: admin OR employee).
test.describe("POS", () => {
  test("designers: 401 without a token", async () => {
    const { response } = await makeClient().GET("/api/admin/pos/designers");
    expect(response.status).toBe(401);
  });

  test("designers: 200 typed string[] with a token", async () => {
    const client = makeClient(await getAccessToken());
    const { data, response } = await client.GET("/api/admin/pos/designers");
    expect(response.status).toBe(200);
    expect(Array.isArray(data?.designers)).toBe(true);
  });

  test("consignment-items: 200 typed items[] with a token", async () => {
    const client = makeClient(await getAccessToken());
    const { data, response } = await client.GET("/api/admin/pos/consignment-items");
    expect(response.status).toBe(200);
    expect(Array.isArray(data?.items)).toBe(true);
  });

  test("size-chart: 200 chart:null when no designer is given", async () => {
    const client = makeClient(await getAccessToken());
    const { data, response } = await client.GET("/api/admin/pos/size-chart");
    expect(response.status).toBe(200);
    expect(data && "chart" in data).toBeTruthy();
  });

  test("checkout: 400 on an empty off-the-rack cart", async () => {
    const client = makeClient(await getAccessToken());
    const { error, response } = await client.POST("/api/admin/pos/checkout", {
      body: {
        client_id: "00000000-0000-0000-0000-000000000000",
        items: [],
        sale_type: "off_the_rack",
        payment_method: "cash",
      },
    });
    expect(response.status).toBe(400);
    expect(error?.error).toBeTruthy();
  });

  test("contract/email: 400 when the customer has no email", async () => {
    const client = makeClient(await getAccessToken());
    const { error, response } = await client.POST("/api/admin/pos/contract/email", { body: {} });
    expect(response.status).toBe(400);
    expect(error?.error).toBeTruthy();
  });
});
