import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./api-types";
import { config } from "./env";

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

  return client;
}

export type ApiClient = ReturnType<typeof makeClient>;
