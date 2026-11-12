export type FactStatus = "found" | "not_found" | "assumption" | "computed";
export type FactCheck = "pass" | "fail";

export type PlanningDecision =
  | "refused"
  | "approved_with_conditions"
  | "approved";

export type BlockKind =
  | "hall"
  | "generator"
  | "battery"
  | "substation"
  | "screen"
  | "barrier"
  | "tree_belt"
  | "access";

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

export interface HomeFact extends FactRow {
  kind?: "home";
}

export interface AmenityFact extends FactRow {
  kind: "school" | "place_of_worship";
  label: string;
}

export interface RingFact extends FactRow {
  radius_m: number;
  coordinates: [number, number][];
}

export interface CommunityC1 extends FactRow {
  homes: HomeFact[];
  schools: AmenityFact[];
  places_of_worship: AmenityFact[];
  rings: RingFact[];
  counts: FactRow[];
}

export interface PlanningApplication extends FactRow {
  reference: string;
  decision: PlanningDecision;
}

export interface CommunityC2 extends FactRow {
  applications: PlanningApplication[];
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
  who_raised?: string;
  who_affected?: string;
  quote: string;
  design_response: string;
  fix?: string;
  row_ids: string[];
  severity: number;
  resolved_in_round?: number;
}

export interface ObjectionsFile extends FactRow {
  cards: ObjectionCard[];
}

export interface S1File extends FactRow {
  rows: FactRow[];
}

export interface PowerQueueRow extends FactRow {
  project?: string;
  connection_site?: string;
  date?: string | null;
  project_status?: string;
}

export interface P1File extends FactRow {
  rows: PowerQueueRow[];
  substation_kv?: number;
  application_id?: string;
  queue_ids?: string[];
}

export interface SiteFeatureCollection {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: FactRow;
    geometry: {
      type: "Polygon";
      coordinates: [number, number][][];
    };
  }>;
}

export interface AppData {
  site: SiteFeatureCollection;
  c1: CommunityC1;
  c2: CommunityC2;
  s1: S1File;
  p1: P1File;
  objections: ObjectionsFile;
  layouts: [Layout, Layout, Layout];
  sourceDir: "live" | "sample";
  factIndex: Record<string, FactRow>;
}
