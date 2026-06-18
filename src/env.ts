import "dotenv/config";

/** Required env var or a clear error. */
function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`[bms-e2e] missing env var ${name} (copy .env.example to .env)`);
  return v;
}

function isLocalUrl(url: string): boolean {
  return /^(https?:\/\/)?(127\.0\.0\.1|localhost|0\.0\.0\.0|host\.docker\.internal)(:\d+)?/i.test(url);
}

const appBaseUrl = req("APP_BASE_URL");
const supabaseUrl = req("SUPABASE_URL");
const supabaseAnonKey = req("SUPABASE_ANON_KEY");

// SAFETY: refuse to run against non-local targets unless explicitly allowed, so a
// test run can never read/write production by accident.
const allowRemote = process.env.E2E_ALLOW_REMOTE === "1";
for (const [name, url] of [
  ["APP_BASE_URL", appBaseUrl],
  ["SUPABASE_URL", supabaseUrl],
] as const) {
  if (!isLocalUrl(url) && !allowRemote) {
    throw new Error(
      `[bms-e2e] REFUSING to run: ${name} ("${url}") is not local. Set E2E_ALLOW_REMOTE=1 ` +
        `to target a remote/staging instance — but NEVER point tests at production.`
    );
  }
}

export const config = {
  appBaseUrl,
  supabaseUrl,
  supabaseAnonKey,
  adminUser: process.env.E2E_ADMIN_EMAIL ?? "admin",
  adminPass: process.env.E2E_ADMIN_PASSWORD ?? "Password123!",
};
