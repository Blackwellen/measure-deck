/**
 * Typed, validated environment variable exports.
 * Throws at runtime if any required variable is missing in production.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ?? "";
}

// ── Supabase (public) ────────────────────────────────────────────────────────
export const SUPABASE_URL: string =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? requireEnv("NEXT_PUBLIC_SUPABASE_URL");

export const SUPABASE_ANON_KEY: string =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

// ── Supabase (server-only) ───────────────────────────────────────────────────
export const SUPABASE_SERVICE_ROLE_KEY: string = requireEnv(
  "SUPABASE_SERVICE_ROLE_KEY"
);

// ── Stripe ───────────────────────────────────────────────────────────────────
export const STRIPE_SECRET_KEY: string = requireEnv("STRIPE_SECRET_KEY");

export const STRIPE_PUBLISHABLE_KEY: string =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
  requireEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");

export const STRIPE_WEBHOOK_SECRET: string = requireEnv(
  "STRIPE_WEBHOOK_SECRET"
);

// ── App ──────────────────────────────────────────────────────────────────────
export const NEXT_PUBLIC_APP_URL: string =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";

export const NODE_ENV: string = process.env.NODE_ENV ?? "development";

export const IS_PRODUCTION: boolean = NODE_ENV === "production";
