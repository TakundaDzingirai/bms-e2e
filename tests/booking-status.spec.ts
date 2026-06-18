import { test, expect } from "@playwright/test";
import { makeClient } from "../src/client";

test.describe("GET /api/storefront/booking-status", () => {
  test("returns a typed bookingEnabled boolean", async () => {
    const client = makeClient();
    const { data, error, response } = await client.GET("/api/storefront/booking-status");

    expect(response.status).toBe(200);
    expect(error).toBeUndefined();
    // `data` is typed as { bookingEnabled: boolean } from the generated spec.
    expect(typeof data?.bookingEnabled).toBe("boolean");
  });
});
