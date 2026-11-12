export type FactStatus = 'found' | 'not_found' | 'assumption';
export type FactCheck = 'pass' | 'fail';
export type BlockKind = 'hall' | 'generator' | 'battery' | 'substation';

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

export interface PrecedentFact extends FactRow {
  objection_id: string;
  decision?: string;
}

export interface C2Fact extends FactRow {
  precedents: PrecedentFact[];
}

export interface OfferFact extends FactRow {
  objection_id: string;
  offer: string;
}

export interface C3FactFile extends FactRow {
  generator_source_db?: number;
  facts: FactRow[];
  offers: OfferFact[];
  /** Stated infrastructure gaps a developer could fund (C3-32, C3-33, C3-35). */
  funding_gaps?: FactRow[];
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
  precedent_id: string;
  offer_id: string;
  row_ids: string[];
  severity: number;
  /** Verbatim precedent / objection quote from C2. */
  quote?: string;
  /** Who raised the objection (from live C2). */
  who_raised?: string;
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
