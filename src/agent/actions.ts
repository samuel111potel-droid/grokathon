// Grok action API. Grok (or the replay script) only chooses actions and writes words;
// every count, distance and position here is computed by code from loaded data.
import * as turf from '@turf/turf';
import { ALLOWED_FIXES, type Fix } from '../types/schema';
import { featureIndex, fmtNum, isCitable, receptorPts, rounds, rowPts, rowsById, siteCenter } from '../components/data';
import { addCallout, getState, highlight, openSource, pushStep, setLayer, setRound, setState, VIEW_ORDER, type ViewMode } from '../components/store';
import { mapApi } from '../map/api';
import { fitFromRound, genCenterOf } from '../map/layers';

export type LonLat = { lon: number; lat: number; zoom?: number; pitch?: number; bearing?: number };
/** "site" | "row:<id>" | "feature:<id>" | "auto:generators" | "auto:nearest_home" | "auto:nearest_substation" | {lon,lat} */
export type Target = string | LonLat;
export type Action =
  | { type: 'fly_to'; target: Target }
  | { type: 'set_view'; view: ViewMode }
  | { type: 'toggle_layer'; id: string; on: boolean }
  | { type: 'draw_ring'; center: Target; radius_m: number; label?: string }
  | { type: 'measure'; from: Target; to: Target }
  | { type: 'add_callout'; at: Target; title: string; text: string; citation_ids: string[] }
  | { type: 'highlight'; ids: string[] }
  | { type: 'set_round'; round: number }
  | { type: 'apply_fix'; fix: Fix }
  | { type: 'open_source'; id: string };

interface Resolved extends LonLat {
  label: string;
  id?: string;
}

const curFit = () => fitFromRound(rounds[getState().round]?.data);
const km = (a: number[], b: number[]) => turf.distance(turf.point(a), turf.point(b));

export function resolveTarget(t: Target): Resolved | string {
  if (t && typeof t === 'object') {
    if (!Number.isFinite(t.lon) || !Number.isFinite(t.lat) || Math.abs(t.lat) > 90 || Math.abs(t.lon) > 180) return 'invalid lon/lat';
    return { ...t, label: 'point' };
  }
  if (typeof t !== 'string') return 'invalid target';
  if (t === 'site') return { lon: siteCenter[0], lat: siteCenter[1], label: 'site' };
  if (t.startsWith('row:')) {
    const id = t.slice(4);
    const r = rowsById.get(id);
    if (!r) return `unknown id ${id}`;
    if (typeof r.lon !== 'number' || typeof r.lat !== 'number') return `row ${id} has no location`;
    return { lon: r.lon, lat: r.lat, label: id, id };
  }
  if (t.startsWith('feature:')) {
    const id = t.slice(8);
    const f = featureIndex.get(id);
    if (f) return { lon: f.lon, lat: f.lat, label: f.label, id };
    const fit = curFit().get(id);
    if (fit) {
      const pts = fit.polygon.slice(0, -1);
      return { lon: pts.reduce((a, p) => a + p[0], 0) / pts.length, lat: pts.reduce((a, p) => a + p[1], 0) / pts.length, label: fit.label, id };
    }
    return `unknown id ${id}`;
  }
  if (t === 'auto:generators' || t === 'auto:nearest_home') {
    const gc = genCenterOf([...curFit().values()]);
    if (!gc) return 'no generators in this round';
    if (t === 'auto:generators') return { lon: gc[0], lat: gc[1], label: 'generators' };
    if (!receptorPts.length) return 'no receptors loaded';
    const near = receptorPts.reduce((best, p) => (km(gc, [p.lon, p.lat]) < km(gc, [best.lon, best.lat]) ? p : best));
    return { lon: near.lon, lat: near.lat, label: 'nearest home', id: near.id };
  }
  if (t === 'auto:nearest_substation') {
    const subs = rowPts('P1').filter((r) => typeof r.value === 'number' && (r.value as number) > 0);
    if (!subs.length) return 'no substation row with headroom';
    const near = subs.reduce((best, p) => (km(siteCenter, [p.lon, p.lat]) < km(siteCenter, [best.lon, best.lat]) ? p : best));
    return { lon: near.lon, lat: near.lat, label: near.id, id: near.id };
  }
  return `unknown target ${String(t)}`;
}

const knownId = (id: string) => rowsById.has(id) || featureIndex.has(id) || curFit().has(id);

/** Returns an error string if the action must be rejected, otherwise null. Nothing runs before this passes. */
export function validate(a: Action): string | null {
  const bad = (t: Target) => {
    const r = resolveTarget(t);
    return typeof r === 'string' ? r : null;
  };
  if (!a || typeof a !== 'object') return 'malformed action';
  switch (a.type) {
    case 'fly_to':
      return bad(a.target);
    case 'set_view':
      return VIEW_ORDER.includes(a.view) ? null : `unknown view ${a.view}`;
    case 'toggle_layer':
      return a.id in getState().layers ? null : `unknown layer ${a.id}`;
    case 'draw_ring':
      return bad(a.center) ?? (Number.isFinite(a.radius_m) && a.radius_m > 0 && a.radius_m <= 50000 ? null : 'invalid radius');
    case 'measure':
      return bad(a.from) ?? bad(a.to);
    case 'add_callout': {
      if (!Array.isArray(a.citation_ids) || !a.citation_ids.length) return 'callout has no citation ids';
      const miss = a.citation_ids.find((id) => !isCitable(id));
      return miss ? `unknown id ${miss}` : (bad(a.at) ?? (a.title ? null : 'callout has no title'));
    }
    case 'highlight': {
      const miss = (a.ids ?? []).find((id) => !knownId(id));
      return !a.ids?.length ? 'nothing to highlight' : miss ? `unknown id ${miss}` : null;
    }
    case 'set_round':
      return Number.isInteger(a.round) && a.round >= 0 && a.round < rounds.length ? null : 'unknown round';
    case 'apply_fix':
      if (!ALLOWED_FIXES.includes(a.fix)) return 'fix is not one of the allowed fixes';
      return rounds.some((r) => r.data.applied_fixes?.includes(a.fix)) ? null : 'no round applies this fix';
    case 'open_source':
      if (typeof a.id !== 'string') return 'missing id';
      if (a.id.startsWith('metric:')) {
        const key = a.id.slice(7);
        const r = rounds[getState().round]?.data;
        return r && (key in r.metrics || key in r.underwrite) ? null : `unknown id ${a.id}`;
      }
      return isCitable(a.id) ? null : `unknown id ${a.id}`;
    default:
      return 'unknown action';
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const status = (text: string) => setState((s) => ({ grok: { ...s.grok, status: text ? `Grok · ${text}` : '' } }));
function elCenter(sel: string) {
  const el = document.querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
/** Glide Grok's cursor to a viewport position, then show a click ripple. */
async function glide(pos: { x: number; y: number } | null) {
  if (!pos) return;
  if (!getState().cursor.visible) {
    const from = elCenter('.grok-orb') ?? pos;
    setState((s) => ({ cursor: { ...s.cursor, x: from.x, y: from.y, visible: true } }));
    await sleep(60);
  }
  setState((s) => ({ cursor: { ...s.cursor, x: pos.x, y: pos.y, visible: true } }));
  await sleep(540);
  setState((s) => ({ cursor: { ...s.cursor, ripple: s.cursor.ripple + 1 } }));
  await sleep(240);
}
const at = (r: Resolved) => mapApi.project(r.lon, r.lat);
let uid = 0;

/** Validate, animate the cursor, run the action and log step lines to the Feed. */
export async function runAction(a: Action): Promise<boolean> {
  const err = validate(a);
  if (err) {
    pushStep('fail', `✗ rejected: ${err}`);
    return false;
  }
  switch (a.type) {
    case 'fly_to': {
      const t = resolveTarget(a.target) as Resolved;
      pushStep('run', `→ fly_to ${t.label}`);
      status(`flying to ${t.label}`);
      await glide(at(t));
      if (a.target === 'site' && mapApi.flyHome) await mapApi.flyHome();
      else await mapApi.flyTo({ center: [t.lon, t.lat], zoom: t.zoom ?? 15.6, pitch: t.pitch ?? 50, bearing: t.bearing ?? mapApi.map?.getBearing() ?? 0 });
      setState((s) => ({ cursor: { ...s.cursor, ...(at(t) ?? {}) } }));
      pushStep('ok', `✓ at ${t.label}`, t.id && rowsById.has(t.id) ? [t.id] : []);
      return true;
    }
    case 'set_view':
      status(`switching view to ${a.view}`);
      await glide(elCenter(`[data-view="${a.view}"]`));
      setState({ view: a.view });
      await sleep(500);
      pushStep('ok', `✓ view ${a.view}`);
      return true;
    case 'toggle_layer': {
      status(`${a.on ? 'showing' : 'hiding'} ${a.id}`);
      if (a.id === 'redline' || a.id === 'testfit') await glide(mapApi.project(siteCenter[0], siteCenter[1]));
      setLayer(a.id, a.on);
      await sleep(a.id === 'redline' && a.on ? 1400 : a.id === 'testfit' && a.on ? 1300 : 250);
      pushStep('ok', `✓ layer ${a.id} ${a.on ? 'on' : 'off'}`);
      return true;
    }
    case 'draw_ring': {
      const c = resolveTarget(a.center) as Resolved;
      status(`drawing ${fmtNum(a.radius_m, 0)} m ring around ${c.label}`);
      await glide(at(c));
      // Receptor count is computed here, never taken from the model.
      const inside = receptorPts.filter((p) => km([c.lon, c.lat], [p.lon, p.lat]) * 1000 <= a.radius_m);
      const cites = Array.from(new Set(inside.flatMap((p) => p.citation_ids))).filter(isCitable).slice(0, 3);
      const id = `ring-${++uid}`;
      setState((s) => ({ rings: [...s.rings, { id, lon: c.lon, lat: c.lat, radius_m: a.radius_m }], layers: { ...s.layers, receptors: true } }));
      const edge = turf.destination(turf.point([c.lon, c.lat]), a.radius_m / 1000, 0).geometry.coordinates;
      const value = `${inside.length} homes inside ${fmtNum(a.radius_m, 0)} m`;
      addCallout({
        id,
        lon: edge[0],
        lat: edge[1],
        title: a.label || 'Ring',
        text: value,
        citation_ids: cites,
        calc: {
          type: 'calc',
          claim: `Homes within ${fmtNum(a.radius_m, 0)} m of ${c.label}`,
          value,
          method: 'Counted in the browser with Turf: receptor points from receptors.geojson whose great-circle distance to the ring centre is at or below the radius.',
          citation_ids: cites,
        },
      });
      pushStep('ok', `✓ ring ${fmtNum(a.radius_m, 0)} m · ${inside.length} homes`, cites);
      return true;
    }
    case 'measure': {
      const p = resolveTarget(a.from) as Resolved;
      const q = resolveTarget(a.to) as Resolved;
      status(`measuring ${p.label} → ${q.label}`);
      await glide(at(p));
      await glide(at(q));
      const metres = km([p.lon, p.lat], [q.lon, q.lat]) * 1000; // distance is computed here, never by the model
      const id = `measure-${++uid}`;
      setState((s) => ({ measures: [...s.measures, { id, from: [p.lon, p.lat], to: [q.lon, q.lat] }] }));
      const value = `${fmtNum(metres, 0)} m`;
      addCallout({
        id,
        lon: (p.lon + q.lon) / 2,
        lat: (p.lat + q.lat) / 2,
        title: `${p.label} → ${q.label}`,
        text: value,
        citation_ids: [],
        calc: {
          type: 'calc',
          claim: `Straight-line distance, ${p.label} to ${q.label}`,
          value,
          method: 'Great-circle distance computed in the browser with Turf between the two map positions (layout feature centre and receptor point).',
          citation_ids: [q.id, p.id].filter((x): x is string => !!x && isCitable(x)),
        },
      });
      pushStep('ok', `✓ measure ${p.label} → ${q.label} · ${value}`);
      return true;
    }
    case 'add_callout': {
      const t = resolveTarget(a.at) as Resolved;
      status(`pinning "${a.title}"`);
      await glide(at(t));
      addCallout({ id: `callout-${++uid}`, lon: t.lon, lat: t.lat, title: a.title, text: a.text ?? '', citation_ids: a.citation_ids });
      pushStep('ok', '✓ callout', a.citation_ids);
      return true;
    }
    case 'highlight':
      status('highlighting');
      highlight(a.ids);
      await sleep(350);
      pushStep('ok', `✓ highlight ${a.ids.join(', ')}`, a.ids.filter((i) => rowsById.has(i)));
      return true;
    case 'set_round':
    case 'apply_fix': {
      const cur = getState().round;
      let idx: number;
      if (a.type === 'set_round') idx = a.round;
      else {
        const has = rounds.map((r, i) => (r.data.applied_fixes?.includes(a.fix) ? i : -1)).filter((i) => i >= 0);
        idx = has.find((i) => i >= cur) ?? has[0];
      }
      status(a.type === 'apply_fix' ? `re-planning: ${a.fix}` : `loading round ${idx}`);
      await glide(elCenter('#replan-btn'));
      setRound(idx);
      await sleep(1350);
      pushStep('ok', a.type === 'apply_fix' ? `✓ fix "${a.fix}" → ${rounds[idx].data.label}` : `✓ ${rounds[idx].data.label}`);
      return true;
    }
    case 'open_source': {
      status(`opening source ${a.id}`);
      if (a.id.startsWith('metric:')) {
        await glide(elCenter('#value-ladder'));
        openSource({ type: 'metric', key: a.id.slice(7), round: getState().round });
      } else openSource({ type: 'id', id: a.id });
      pushStep('ok', `✓ source ${a.id}`, a.id.startsWith('metric:') ? [] : [a.id]);
      return true;
    }
  }
  return false;
}
