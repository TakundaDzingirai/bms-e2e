import { test, expect } from "@playwright/test";
import { makeClient } from "../src/client";

test.describe("GET /api/appointment-slots", () => {
  test("400 with a typed error when no date/range is given", async () => {
    const client = makeClient();
    const { data, error, response } = await client.GET("/api/appointment-slots");

    expect(response.status).toBe(400);
    expect(data).toBeUndefined();
    // `error` is the 400 body, typed as ApiError ({ error: string }).
    expect(error?.error).toBeTruthy();
  });

  test("400 when date is malformed", async () => {
    const client = makeClient();
    const { response } = await client.GET("/api/appointment-slots", {
      params: { query: { date: "not-a-date" } },
    });

    expect(response.status).toBe(400);
  });

  test("200 returns a typed slots array for a valid date", async () => {
    const client = makeClient();
    const { data, error, response } = await client.GET("/api/appointment-slots", {
      params: { query: { date: "2026-07-01" } },
    });

    expect(response.status).toBe(200);
    expect(error).toBeUndefined();
    // 200 is a union: { slots: [...] } for a date query, { availableDates: [...] } for a range.
    expect(data && "slots" in data).toBeTruthy();
    if (data && "slots" in data) {
      expect(Array.isArray(data.slots)).toBe(true);
    }
  });

  test("200 returns typed availableDates for a from/to range", async () => {
    const client = makeClient();
    const { data, error, response } = await client.GET("/api/appointment-slots", {
      params: { query: { from: "2026-07-01", to: "2026-07-31" } },
    });

    expect(response.status).toBe(200);
    expect(error).toBeUndefined();
    expect(data && "availableDates" in data).toBeTruthy();
    if (data && "availableDates" in data) {
      expect(Array.isArray(data.availableDates)).toBe(true);
    }
  });
});
