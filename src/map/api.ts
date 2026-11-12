import type { Map as MlMap } from 'maplibre-gl';

export interface FlyOpts {
  center: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
  duration?: number;
}

/** Imperative handle on the live map, set by MapView. Used by the panel and the Grok action runner. */
export const mapApi = {
  map: null as MlMap | null,
  flyHome: null as null | (() => Promise<void>),
  flyTo(o: FlyOpts): Promise<void> {
    return new Promise<void>((resolve) => {
      const m = this.map;
      if (!m) return resolve();
      let done = false;
      const fin = () => {
        if (!done) {
          done = true;
          resolve();
        }
      };
      const duration = o.duration ?? 1800;
      m.once('moveend', fin);
      m.flyTo({ essential: true, ...o, duration });
      window.setTimeout(fin, duration + 900);
    });
  },
  /** Viewport pixel position of a lon/lat, clamped inside the map so the Grok cursor never leaves the screen. */
  project(lon: number, lat: number): { x: number; y: number } | null {
    const m = this.map;
    if (!m) return null;
    const p = m.project([lon, lat]);
    const r = m.getContainer().getBoundingClientRect();
    return { x: r.left + Math.max(24, Math.min(r.width - 24, p.x)), y: r.top + Math.max(24, Math.min(r.height - 24, p.y)) };
  },
};
