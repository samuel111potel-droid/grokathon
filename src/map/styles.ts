import { siteCenter } from '../components/data';

const DEM_TILES = ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'];
const dem = () => ({ type: 'raster-dem', tiles: DEM_TILES, encoding: 'terrarium', tileSize: 256, maxzoom: 15, attribution: 'Terrain: Mapzen / AWS Open Data' });

/** Satellite 3D: Esri World Imagery + terrarium DEM terrain + hillshade + dark label overlay. No API keys. */
export function satStyle(withTerrain: boolean): any {
  const style: any = {
    version: 8,
    sources: {
      esri: {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        maxzoom: 19,
        attribution: 'Imagery © Esri',
      },
      labels: {
        type: 'raster',
        tiles: ['a', 'b', 'c'].map((s) => `https://${s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png`),
        tileSize: 256,
        attribution: '© CARTO © OpenStreetMap contributors',
      },
      dem: dem(),
      'dem-hs': dem(),
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#05070c' } },
      { id: 'esri', type: 'raster', source: 'esri', paint: { 'raster-saturation': -0.3, 'raster-brightness-max': 0.8, 'raster-contrast': 0.1 } },
      { id: 'hillshade', type: 'hillshade', source: 'dem-hs', paint: { 'hillshade-exaggeration': 0.3, 'hillshade-shadow-color': '#020617' } },
      { id: 'labels', type: 'raster', source: 'labels', paint: { 'raster-opacity': 0.85 } },
    ],
  };
  if (withTerrain) style.terrain = { source: 'dem', exaggeration: 1.3 };
  return style;
}

const OFM_DARK = 'https://tiles.openfreemap.org/styles/dark';
const CARTO_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
let dark: any = OFM_DARK;
// Probe OpenFreeMap once; fall back to CARTO dark-matter if it is unreachable.
(async () => {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 3500);
    const r = await fetch(OFM_DARK, { signal: ctl.signal });
    clearTimeout(t);
    if (!r.ok) throw new Error(String(r.status));
    dark = await r.json();
  } catch {
    dark = CARTO_DARK;
  }
})();
export const getDarkStyle = () => dark;

export const UK_VIEW = { center: [-2.6, 54.3] as [number, number], zoom: 4.7 };
export const HOME_VIEW = { center: siteCenter, zoom: 15.2, pitch: 48, bearing: -18 };
