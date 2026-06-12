/**
 * Feature flags for MeasureDeck.
 * Static defaults — extend with DB/remote config as needed.
 */

export type FeatureFlag =
  | "v1"
  | "v1_5_bim"
  | "ai_lite"
  | "ai_pro"
  | "advanced_reports"
  | "secure_share"
  | "stripe_connect"
  | "affiliate_programme"
  | "smart_rules"
  | "cvr_module"
  | "final_accounts_module"
  | "evidence_module"
  | "drawings_module"
  | "site_map_module"
  | "schedule_gantt"
  | "multi_workspace"
  | "api_access"
  | "sso"
  | "white_label";

type FlagDefaults = Record<FeatureFlag, boolean>;

/**
 * Default flag states shipped with the binary.
 * v1 core is always on; advanced / enterprise flags are off by default.
 */
const FLAG_DEFAULTS: FlagDefaults = {
  // ── v1 Core ──────────────────────────────────────────────────────────────
  v1: true,

  // ── v1.5 BIM Extension ───────────────────────────────────────────────────
  v1_5_bim: false,

  // ── AI ───────────────────────────────────────────────────────────────────
  ai_lite: false,
  ai_pro: false,

  // ── Reports & Analytics ──────────────────────────────────────────────────
  advanced_reports: false,

  // ── Sharing & Collaboration ──────────────────────────────────────────────
  secure_share: false,

  // ── Payments / Affiliate ─────────────────────────────────────────────────
  stripe_connect: false,
  affiliate_programme: false,

  // ── Workflow Automation ──────────────────────────────────────────────────
  smart_rules: false,

  // ── Modules ──────────────────────────────────────────────────────────────
  cvr_module: false,
  final_accounts_module: false,
  evidence_module: false,
  drawings_module: false,
  site_map_module: false,
  schedule_gantt: false,

  // ── Enterprise ───────────────────────────────────────────────────────────
  multi_workspace: false,
  api_access: false,
  sso: false,
  white_label: false,
};

/**
 * Returns the current value of a feature flag.
 * In future this can be augmented with plan-level or user-level overrides.
 */
export function getFlag(name: FeatureFlag): boolean {
  return FLAG_DEFAULTS[name];
}

/**
 * Returns a snapshot of all flag values (useful for debugging / admin panels).
 */
export function getAllFlags(): Readonly<FlagDefaults> {
  return Object.freeze({ ...FLAG_DEFAULTS });
}
