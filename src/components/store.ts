import { useSyncExternalStore } from 'react';
import { rounds } from './data';

export type ViewMode = 'satellite3d' | 'dark' | 'flows' | 'columns';
export const VIEW_ORDER: ViewMode[] = ['satellite3d', 'dark', 'flows', 'columns'];
export type Tab = 'Feed' | 'Community' | 'Environment' | 'Power';

export type CalcTarget = { type: 'calc'; claim: string; value: string; method: string; citation_ids: string[] };
export type DrawerTarget = { type: 'id'; id: string } | { type: 'metric'; key: string; round: number } | CalcTarget;

export interface Callout {
  id: string;
  lon: number;
  lat: number;
  title: string;
  text: string;
  citation_ids: string[];
  calc?: CalcTarget;
}
export interface Ring {
  id: string;
  lon: number;
  lat: number;
  radius_m: number;
}
export interface Measure {
  id: string;
  from: [number, number];
  to: [number, number];
}
export interface Step {
  n: number;
  kind: 'prompt' | 'reply' | 'run' | 'ok' | 'fail';
  text: string;
  cites?: string[];
}
export interface Selection {
  id: string;
  label: string;
  citation_ids: string[];
  lon: number;
  lat: number;
  x: number;
  y: number;
}

export interface State {
  round: number;
  view: ViewMode;
  tab: Tab;
  phase: 'intro' | 'flying' | 'landed';
  layers: Record<string, boolean>;
  communityMetric: string | null;
  drawer: DrawerTarget | null;
  report: boolean;
  steps: Step[];
  callouts: Callout[];
  rings: Ring[];
  measures: Measure[];
  highlight: string[];
  selection: Selection | null;
  grok: { busy: boolean; input: string; reply: string; status: string; next: number };
  cursor: { x: number; y: number; visible: boolean; ripple: number };
}

let state: State = {
  round: 0,
  view: 'satellite3d',
  tab: 'Feed',
  phase: 'intro',
  layers: {
    redline: false,
    testfit: false,
    terrain: true,
    receptors: true,
    ring: true,
    route: true,
    substations: true,
    precedents: true,
    pins: true,
    flood: false,
    contamination: false,
    ecology: false,
    lines: false,
    fibre: false,
    heatmap: false,
    areas: false,
    callouts: true,
  },
  communityMetric: null,
  drawer: null,
  report: false,
  steps: [],
  callouts: [],
  rings: [],
  measures: [],
  highlight: [],
  selection: null,
  grok: { busy: false, input: '', reply: '', status: '', next: 0 },
  cursor: { x: 0, y: 0, visible: false, ripple: 0 },
};

const listeners = new Set<() => void>();
export const getState = () => state;
export function setState(p: Partial<State> | ((s: State) => Partial<State>)) {
  const patch = typeof p === 'function' ? p(state) : p;
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}
export function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => sel(state));
}

// Hooks filled in by later modules (keeps the store free of circular imports).
export const hooks: { ask?: (sel: Selection) => void; prompt?: (text: string) => void; next?: () => void } = {};

export function setLayer(id: string, on: boolean) {
  setState((s) => ({ layers: { ...s.layers, [id]: on } }));
}
export function openSource(t: DrawerTarget) {
  setState({ drawer: t });
}
export function setRound(r: number) {
  const s = getState();
  const round = Math.max(0, Math.min(rounds.length - 1, r));
  setState({ round, layers: s.layers.testfit ? s.layers : { ...s.layers, redline: true, testfit: true } });
}
export function replan() {
  const s = getState();
  if (!s.layers.testfit) return setRound(s.round);
  setRound((s.round + 1) % Math.max(1, rounds.length));
}
export function dropRedLine() {
  setLayer('redline', true);
  window.setTimeout(() => setLayer('testfit', true), 1500);
}
let stepN = 0;
export function pushStep(kind: Step['kind'], text: string, cites?: string[]) {
  setState((s) => ({ steps: [...s.steps.slice(-60), { n: ++stepN, kind, text, cites }] }));
}
let hlTimer = 0;
export function highlight(ids: string[], ms = 4500) {
  setState({ highlight: ids });
  window.clearTimeout(hlTimer);
  hlTimer = window.setTimeout(() => setState({ highlight: [] }), ms);
}
export function addCallout(c: Callout) {
  setState((s) => ({ callouts: [...s.callouts.filter((x) => x.id !== c.id), c].slice(-8) })); // max 8 on screen
}
