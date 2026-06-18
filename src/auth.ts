import { createClient } from "@supabase/supabase-js";
import { config } from "./env";

/**
 * Signs in a seeded staff member and returns a Supabase access token.
 *
 * Staff log in by username; bsms derives a synthetic email
 * `<username>@staff.sundayevebridal.com` (see lib/username.ts + supabase/seed.sql),
 * which we reproduce here. An identifier already containing "@" is used as-is.
 */
export async function getAccessToken(
  identifier = config.adminUser,
  password = config.adminPass
): Promise<string> {
  const email = identifier.includes("@")
    ? identifier
    : `${identifier.toLowerCase()}@staff.sundayevebridal.com`;

  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`[bms-e2e] sign-in failed for "${identifier}": ${error?.message ?? "no session"}`);
  }
  return data.session.access_token;
}
