import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapboxOverlay } from '@deck.gl/mapbox';
import * as turf from '@turf/turf';
import { featureIndex, fmtNum, resolveCitation, rounds, rowsById, siteRing } from '../components/data';
import { dropRedLine, getState, hooks, openSource, setState, subscribe, useStore, type Callout, type State } from '../components/store';
import { SourceChip } from '../components/Source';
import { VIEWS } from '../components/Header';
import { mapApi } from './api';
import { buildLayers, ease, fitFromRound, lerp, lerpFit, ringRadiusOf, type FitItem } from './layers';
import { getDarkStyle, HOME_VIEW, satStyle, UK_VIEW } from './styles';

const EMPTY: any = { type: 'FeatureCollection', features: [] };
const FIT_MS = 1200;
const RED = '#f43f5e';

function calloutEl(c: Callout): HTMLElement {
  const mk = (tag: string, cls: string, text?: string) => {
    const e = document.createElement(tag);
    e.className = cls;
    if (text) e.textContent = text;
    return e;
  };
  const root = mk('div', 'callout');
  const card = mk('div', 'callout-card');
  const x = mk('button', 'callout-x', '×');
  x.onclick = (e) => {
    e.stopPropagation();
    setState((s) => ({ callouts: s.callouts.filter((k) => k.id !== c.id) }));
  };
  const chips = mk('div', 'callout-chips');
  for (const id of c.citation_ids) {
    const cit = resolveCitation(id);
    if (cit.kind === 'failed' || cit.kind === 'unknown') continue;
    // Values shown on a callout always come from the cited row, never from the model's text.
    if (!c.calc && cit.kind === 'row' && typeof cit.row.value === 'number') chips.append(mk('span', 'num', `${fmtNum(cit.row.value)} ${cit.row.unit ?? ''}`.trim()));
    const b = mk('button', cit.kind === 'row' && cit.row.status === 'assumption' ? 'chip chip-amber' : 'chip', `[${id}]`);
    b.onclick = (e) => {
      e.stopPropagation();
      openSource({ type: 'id', id });
    };
    chips.append(b);
  }
  if (c.calc) {
    const calc = c.calc;
    const b = mk('button', 'chip chip-est', 'estimate');
    b.onclick = (e) => {
      e.stopPropagation();
      openSource(calc);
    };
    chips.append(b);
  }
  card.append(x, mk('div', 'callout-title', c.title));
  if (c.text) card.append(mk('div', '', c.text));
  card.append(chips);
  root.append(card, mk('div', 'callout-leader'), mk('div', 'callout-dot'));
  return root;
}

export function MapView() {
  const ref = useRef<HTMLDivElement>(null);
  const phase = useStore((s) => s.phase);
  const redline = useStore((s) => s.layers.redline);
  const sel = useStore((s) => s.selection);
  const view = useStore((s) => s.view);
  const terrainOn = useStore((s) => s.view === 'satellite3d' && s.layers.terrain && !s.layers.testfit);

  useEffect(() => {
    const wantTerrain = (s: State) => s.view === 'satellite3d' && s.layers.terrain && !s.layers.testfit;
    const map = new maplibregl.Map({
      container: ref.current!,
      style: satStyle(wantTerrain(getState())),
      center: UK_VIEW.center,
      zoom: UK_VIEW.zoom,
      pitch: 0,
      bearing: 0,
      maxPitch: 78,
      attributionControl: { compact: true },
    } as any);
    mapApi.map = map;
    (window as any).__map = map;

    const onPick = (info: any) => {
      const o = info?.object;
      if (!o) return setState({ selection: null });
      const p = o.properties ?? o;
      if (!p?.id) return;
      const at = info.coordinate ?? [p.lon, p.lat];
      setState({
        selection: {
          id: String(p.id),
          label: p.label ?? p.claim ?? String(p.id),
          citation_ids: p.citation_ids ?? (p.claim ? [p.id] : []),
          lon: at[0],
          lat: at[1],
          x: info.x,
          y: info.y,
        },
      });
    };
    const overlay = new MapboxOverlay({ interleaved: true, layers: [], onClick: onPick } as any);
    map.addControl(overlay as any);
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    // ----- test-fit animation state -----
    const anim = {
      from: new Map<string, FitItem>(),
      to: new Map<string, FitItem>(),
      cur: [] as FitItem[],
      start: 0,
      done: true,
      ringFrom: 0,
      ringTo: 0,
      ring: 0,
    };
    const startFit = () => {
      const s = getState();
      anim.from = new Map(anim.cur.map((f) => [f.id, f]));
      anim.to = s.layers.testfit ? fitFromRound(rounds[s.round]?.data) : new Map();
      anim.ringFrom = anim.ring;
      anim.ringTo = s.layers.testfit ? ringRadiusOf(rounds[s.round]?.data) : 0;
      anim.start = performance.now();
      anim.done = false;
    };
    const posOf = (id: string): number[] | null => {
      const r = rowsById.get(id);
      if (r && typeof r.lon === 'number' && typeof r.lat === 'number') return [r.lon, r.lat];
      const f = featureIndex.get(id);
      if (f) return [f.lon, f.lat];
      const fit = anim.cur.find((x) => x.id === id);
      if (fit) {
        const n = fit.polygon.length - 1;
        return [fit.polygon.slice(0, n).reduce((a, p) => a + p[0], 0) / n, fit.polygon.slice(0, n).reduce((a, p) => a + p[1], 0) / n];
      }
      return null;
    };

    let raf = 0;
    const frame = () => {
      raf = 0;
      const s = getState();
      const now = performance.now();
      if (!anim.done) {
        const t = Math.min(1, (now - anim.start) / FIT_MS);
        const e = ease(t);
        anim.cur = lerpFit(anim.from, anim.to, e);
        anim.ring = lerp(anim.ringFrom, anim.ringTo, e);
        if (t >= 1) anim.done = true;
      }
      try {
        overlay.setProps({
          layers: buildLayers({
            s,
            fit: anim.cur,
            ring: anim.ring,
            ringFail: !rounds[s.round]?.data.metrics.bs4142_compliant,
            time: now,
            hlPos: s.highlight.map(posOf).filter(Boolean) as number[][],
          }),
        });
      } catch (err) {
        console.error('[map] layer build failed', err);
      }
      if (!anim.done || s.view === 'flows' || s.highlight.length) schedule();
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    // ----- native red line (draped, so it survives terrain) -----
    let line: any = null;
    let lineKm = 0;
    let poly: any = null;
    try {
      if (siteRing.length > 3) {
        line = turf.lineString(siteRing);
        lineKm = turf.length(line);
        poly = turf.polygon([siteRing]);
      }
    } catch (err) {
      console.warn('[map] site boundary could not be parsed', err);
    }
    let redProg = 0;
    let redRaf = 0;
    let redBusy = false;
    const setRed = (p: number) => {
      redProg = p;
      const src = map.getSource('site-line') as any;
      const fill = map.getSource('site-fill') as any;
      if (!src || !line) return;
      try {
        src.setData(p <= 0.002 ? EMPTY : p >= 1 ? line : turf.lineSliceAlong(line, 0, lineKm * p));
        fill?.setData(p >= 1 && poly ? poly : EMPTY);
      } catch {
        /* style swapping; re-applied on style.load */
      }
    };
    const animateRed = (on: boolean) => {
      cancelAnimationFrame(redRaf);
      if (!on) {
        redBusy = false;
        return setRed(0);
      }
      redBusy = true;
      const t0 = performance.now();
      const tick = () => {
        const p = Math.min(1, (performance.now() - t0) / 1300);
        setRed(ease(p));
        if (p < 1) redRaf = requestAnimationFrame(tick);
        else redBusy = false;
      };
      tick();
    };
    const ensureNative = () => {
      if (!map.getSource('site-fill')) map.addSource('site-fill', { type: 'geojson', data: EMPTY });
      if (!map.getSource('site-line')) map.addSource('site-line', { type: 'geojson', data: EMPTY });
      if (!map.getLayer('site-fill')) map.addLayer({ id: 'site-fill', type: 'fill', source: 'site-fill', paint: { 'fill-color': RED, 'fill-opacity': 0.07 } });
      if (!map.getLayer('site-glow'))
        map.addLayer({ id: 'site-glow', type: 'line', source: 'site-line', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': RED, 'line-width': 9, 'line-opacity': 0.25, 'line-blur': 6 } });
      if (!map.getLayer('site-line'))
        map.addLayer({ id: 'site-line', type: 'line', source: 'site-line', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': RED, 'line-width': 2.4 } });
      setRed(getState().layers.redline ? (redBusy ? redProg : 1) : 0);
    };

    // ----- basemap / terrain -----
    let isSat = true;
    let terrainApplied: boolean | null = wantTerrain(getState());
    const applyTerrain = () => {
      const want = wantTerrain(getState());
      if (want === terrainApplied) return;
      try {
        // deck.gl extrusions do not sit on MapLibre terrain, so terrain is dropped whenever the test fit is shown.
        if (want && map.getSource('dem')) map.setTerrain({ source: 'dem', exaggeration: 1.3 });
        else map.setTerrain(null);
        terrainApplied = want;
      } catch {
        /* style not ready; retried on style.load */
      }
    };
    map.on('style.load', () => {
      try {
        ensureNative();
      } catch (err) {
        console.warn('[map] native layers', err);
      }
      applyTerrain();
      schedule();
    });

    // ----- callout markers -----
    const markers = new Map<string, { c: Callout; m: maplibregl.Marker }>();
    const syncCallouts = () => {
      const s = getState();
      const want = s.layers.callouts ? s.callouts : [];
      for (const [id, v] of markers)
        if (!want.includes(v.c)) {
          v.m.remove();
          markers.delete(id);
        }
      for (const c of want) {
        if (markers.has(c.id)) continue;
        const m = new maplibregl.Marker({ element: calloutEl(c), anchor: 'bottom-left' }).setLngLat([c.lon, c.lat]).addTo(map);
        markers.set(c.id, { c, m });
      }
    };

    // ----- store subscription -----
    let last = getState();
    const unsub = subscribe(() => {
      const s = getState();
      if (s.round !== last.round || s.layers.testfit !== last.layers.testfit) startFit();
      const sat = s.view === 'satellite3d';
      if (sat !== isSat) {
        isSat = sat;
        terrainApplied = sat ? wantTerrain(s) : false;
        try {
          map.setStyle(sat ? satStyle(wantTerrain(s)) : getDarkStyle(), { diff: false });
        } catch (err) {
          console.error('[map] setStyle failed', err);
        }
      } else applyTerrain();
      if (s.layers.redline !== last.layers.redline) animateRed(s.layers.redline);
      if (s.callouts !== last.callouts || s.layers.callouts !== last.layers.callouts) syncCallouts();
      last = s;
      schedule();
    });

    // ----- opening fly-in -----
    const flyHome = () => {
      setState({ phase: 'flying' });
      return mapApi.flyTo({ ...HOME_VIEW, duration: 4000 }).then(() => setState({ phase: 'landed' }));
    };
    mapApi.flyHome = flyHome;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      if (new URLSearchParams(location.search).get('autofly') !== '0') window.setTimeout(flyHome, 900);
    };
    map.once('load', start);
    const startTimer = window.setTimeout(start, 3500); // do not wait forever on slow tiles
    map.on('error', (e: any) => console.warn('[map]', e?.error?.message ?? e));
    schedule();

    return () => {
      unsub();
      window.clearTimeout(startTimer);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(redRaf);
      markers.forEach((v) => v.m.remove());
      mapApi.map = null;
      mapApi.flyHome = null;
      map.remove();
    };
  }, []);

  return (
    <div className="absolute inset-0">
      {/* Inline + .map-root: maplibre-gl.css sets .maplibregl-map{position:relative}, which beats Tailwind's layered .absolute and collapsed the map to zero height. */}
      <div ref={ref} className="map-root" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
      <div className="map-tag">
        {VIEWS.find((v) => v.id === view)?.label}
        {terrainOn ? ' · terrain on' : ''}
      </div>
      {phase === 'landed' && !redline ? (
        <button className="map-btn" id="drop-redline" onClick={dropRedLine}>
          Drop red line
        </button>
      ) : null}
      {sel ? (
        <div className="sel" style={{ left: sel.x, top: sel.y }}>
          <div className="text-slate-100 font-medium">{sel.label}</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {sel.citation_ids.map((id) => (
              <SourceChip key={id} id={id} />
            ))}
          </div>
          <button
            className="sel-ask"
            onClick={() => {
              hooks.ask?.(sel);
              setState({ selection: null });
            }}
          >
            Ask Grok about this
          </button>
        </div>
      ) : null}
    </div>
  );
}
