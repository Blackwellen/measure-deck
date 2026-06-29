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
  | "white_label"
  // ── V2 Enterprise Flags ──────────────────────────────────────────────────────
  | "nec4_ce_engine"
  | "hgcra_suite"
  | "cis_compliance"
  | "retention_module"
  | "cashflow_forecasting"
  | "evm_dashboard"
  | "subcontract_orders"
  | "supply_chain_kyc"
  | "pc_snagging"
  | "ai_contract_analyser"
  | "ai_ce_identifier"
  | "ai_daywork_capture"
  | "client_portal"
  | "cross_project_analytics"
  | "adjudication_module"
  | "asta_import"
  | "programme_notifications"
  | "delay_analysis"
  | "fluctuations_module"
  | "mobile_dayworks";

type FlagDefaults = Record<FeatureFlag, boolean>;

/**
 * Default flag states shipped with the binary.
 * v1 core is always on; advanced / enterprise flags are off by default.
 */
const FLAG_DEFAULTS: FlagDefaults = {
  // ── v1 Core ──────────────────────────────────────────────────────────────
  v1: true,

  // ── BIM Extension (enabled) ──────────────────────────────────────────────
  v1_5_bim: true,

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

  // ── V2 Enterprise Modules ─────────────────────────────────────────────────
  nec4_ce_engine: false,
  hgcra_suite: false,
  cis_compliance: false,
  retention_module: false,
  cashflow_forecasting: false,
  evm_dashboard: false,
  subcontract_orders: false,
  supply_chain_kyc: false,
  pc_snagging: false,
  ai_contract_analyser: false,
  ai_ce_identifier: false,
  ai_daywork_capture: false,
  client_portal: false,
  cross_project_analytics: false,
  adjudication_module: false,
  asta_import: false,
  programme_notifications: false,
  delay_analysis: false,
  fluctuations_module: false,
  mobile_dayworks: false,
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
