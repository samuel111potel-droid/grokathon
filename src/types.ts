export type FactStatus = "found" | "not_found" | "assumption";
export type FactCheck = "pass" | "fail";

export type PlanningDecision =
  | "refused"
  | "approved_with_conditions"
  | "approved";

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
  kind: "home";
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

export interface CommunityData {
  site: SiteFeatureCollection;
  c1: CommunityC1;
  c2: CommunityC2;
  sourceDir: "live" | "sample";
}
