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
