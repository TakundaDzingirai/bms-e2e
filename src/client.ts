import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./api-types";
import { config } from "./env";

/** Set E2E_DEBUG=1 to log every request's method/URL/status/body to the console
 * (captured per-test in the Playwright HTML report). */
const DEBUG = process.env.E2E_DEBUG === "1";

function truncate(text: string, max = 600): string {
  return text.length > max ? `${text.slice(0, max)}… (${text.length} bytes)` : text;
}

const loggingMiddleware: Middleware = {
  onRequest({ request }) {
    console.log(`→ ${request.method} ${new URL(request.url).pathname}${new URL(request.url).search}`);
    return request;
  },
  async onResponse({ request, response }) {
    let body = "";
    try {
      body = await response.clone().text();
    } catch {
      body = "<unreadable body>";
    }
    console.log(`← ${response.status} ${request.method} ${new URL(request.url).pathname} ${truncate(body)}`);
    return response;
  },
};

/**
 * A typed BSMS API client (openapi-fetch over the generated `paths`).
 *
 * Pass a token to authenticate requests (admin/employee endpoints); omit it for
 * public endpoints. Get a token from `getAccessToken()` in ./auth.
 */
export function makeClient(token?: string) {
  const client = createClient<paths>({ baseUrl: config.appBaseUrl });

  if (token) {
    const authMiddleware: Middleware = {
      onRequest({ request }) {
        request.headers.set("Authorization", `Bearer ${token}`);
        return request;
      },
    };
    client.use(authMiddleware);
  }

  if (DEBUG) client.use(loggingMiddleware);

  return client;
}

export type ApiClient = ReturnType<typeof makeClient>;
