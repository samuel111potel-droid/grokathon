export type FactStatus = 'found' | 'not_found' | 'assumption';
export type FactCheck = 'pass' | 'fail';
export type BlockKind =
  | 'hall'
  | 'generator'
  | 'battery'
  | 'substation'
  | 'screen'
  | 'barrier'
  | 'tree_belt'
  | 'access';

export interface FactRow {
  id: string;
  claim: string;
  value: number | null;
  unit: string;
  lat: number;
  lon: number;
  source_org: string;
  url: string;
  quote: string;
  retrieved: string;
  status: FactStatus;
  check: FactCheck;
}

export interface HomePoint extends FactRow {
  value: number;
}

export interface HomesFact extends FactRow {
  homes: HomePoint[];
}

export interface LayoutBlock {
  id: string;
  kind: BlockKind;
  polygon: [number, number][];
  height_m: number;
}

export type Layout = LayoutBlock[];

export interface ObjectionCard {
  id: string;
  theme: string;
  who_affected: string;
  fix: string;
  row_ids: string[];
  severity: number;
  /** Optional: card drops out once this round index is reached. */
  resolved_in_round?: number;
}

export interface ObjectionsFile extends FactRow {
  cards: ObjectionCard[];
}

export interface SiteFeatureProperties extends FactRow {
  value: number;
}

export interface LonLat {
  lon: number;
  lat: number;
}

/** Planning precedent / refusal quote used by themeWeights. */
export interface PlanningQuote extends FactRow {
  theme: string;
  /** Decision text; anything containing "refus" counts double. */
  decision?: string;
  /** Who raised the objection; empty ⇒ row is not counted in themeWeights. */
  raised_by?: string;
}

/** Flat C2 EvidenceRow list (Lane 2 / data/out) or legacy nested quotes file. */
export type C2File = FactRow & {
  quotes?: PlanningQuote[];
  theme?: string;
  decision?: string;
  raised_by?: string;
};

export interface FloodZone {
  id: string;
  ring: [number, number][];
  label?: string;
}

/** One source level in the simple noise model. */
export interface SourceLevel {
  row_id: string;
  /** Level in dB at the reference distance. */
  level_db: number;
  /** Reference distance in metres (typically 10). */
  ref_distance_m: number;
}

/** Map of plant kind → source level (e.g. generator). */
export type SourceDb = Record<string, SourceLevel>;

export interface S2File extends FactRow {
  /** Stand-off distance (m) between generators and homes. */
  value: number;
  flood_zones: FloodZone[];
  source_db: SourceDb;
}
