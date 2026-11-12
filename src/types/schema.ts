// Canonical data contracts, transcribed from docs/EXECUTION_PLAN.md section 4.
// Created by Lane 5 because the file was not on main at build time; Lane 4 owns it from here.
// Optional fields beyond section 4 (basis, category, stage, metric_sources) come from
// docs/FRONTEND_AGENT_BRIEF.md Part B and docs/TRACEABILITY_RULES.md.

export type EvidenceStatus = 'found' | 'not_found' | 'assumption';
export type RedTeamCheck = 'pass' | 'fail';
export type Verdict = 'agrees' | 'differs' | 'no_source';

export interface EvidenceRow {
  id: string;
  claim: string;
  value?: number | string | null;
  unit?: string;
  lat?: number;
  lon?: number;
  source_org?: string;
  url?: string;
  quote?: string;
  retrieved?: string;
  status: EvidenceStatus;
  check?: RedTeamCheck;
  fail_reason?: string;
  verdict?: Verdict;
  theme?: string;
  basis?: string;
  category?: string;
  stage?: string;
}

export type Fix =
  | 'move generators away from homes'
  | 'add acoustic screen'
  | 'move site access'
  | 'lower hall height'
  | 'add tree belt'
  | 'move substation';

export const ALLOWED_FIXES: Fix[] = [
  'move generators away from homes',
  'add acoustic screen',
  'move site access',
  'lower hall height',
  'add tree belt',
  'move substation',
];

export interface ObjectionCard {
  id: string;
  theme: string;
  title: string;
  affected_summary: string;
  severity: 1 | 3 | 5;
  precedent_id?: string;
  receptor_ids?: string[];
  fix: Fix;
  secondary_fix?: Fix;
  resolved_in_round?: number;
  citation_ids: string[];
}

export interface MetricSource {
  method?: string;
  citation_ids?: string[];
}

export interface LayoutFeatureProperties {
  id: string;
  kind: string;
  label: string;
  height_m: number;
  color?: string;
}

export interface LayoutFeature {
  type: 'Feature';
  properties: LayoutFeatureProperties;
  geometry: { type: string; coordinates: any };
}

export interface LayoutRound {
  round: number;
  label: string;
  summary: string;
  applied_fixes: Fix[];
  metrics: {
    it_load_mw: number;
    gross_site_acres: number;
    hall_height_m: number;
    nearest_home_to_gen_m: number;
    predicted_receptor_dba: number;
    bs4142_compliant: boolean;
    objection_risk_score: number;
    approval_probability_pct: number;
    [key: string]: number | boolean;
  };
  underwrite: {
    farmland_baseline_gbp_m: number;
    industrial_downside_gbp_m: number;
    gross_powered_land_gbp_m: number;
    grid_connection_capex_gbp_m: number;
    mitigation_and_s106_capex_gbp_m: number;
    risk_adjusted_land_value_gbp_m: number;
    citation_ids: string[];
  };
  metric_sources?: Record<string, MetricSource>;
  features: { type: 'FeatureCollection'; features: LayoutFeature[] };
}

export interface MSCIReceipt {
  id: string;
  tool: string;
  query_summary: string;
  retrieved: string;
  sha256: string;
  display_note?: string;
}
