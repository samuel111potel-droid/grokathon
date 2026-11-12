import { useMemo } from 'react';
import Map, { NavigationControl } from 'react-map-gl/maplibre';
import { PolygonLayer, SolidPolygonLayer, TextLayer } from '@deck.gl/layers';
import type { MapLayerMouseEvent, ViewStateChangeEvent } from 'react-map-gl/maplibre';
import type { FactRow, Layout, LonLat } from '../types';
import { KIND_COLORS } from '../lib/colors';
import { noiseAtHome, noiseColor, type NoiseRgba } from '../lib/community';
import { DeckOverlay } from './DeckOverlay';
import 'maplibre-gl/dist/maplibre-gl.css';

const STYLE = 'https://tiles.openfreemap.org/styles/dark';

export interface CameraState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

interface HomeWithNoise extends LonLat {
  id: string;
  db: number;
  color: NoiseRgba;
}

interface Props {
  id: string;
  label: string;
  layout: Layout;
  siteRing: [number, number][];
  homes: Array<LonLat & { id?: string; fact?: FactRow }>;
  listedBuildings?: FactRow[];
  sourceDb: number;
  viewState: CameraState;
  onViewStateChange: (next: CameraState) => void;
}

function homeSquare(lon: number, lat: number, halfM = 8): [number, number][] {
  const mLat = 111_320;
  const mLon = 111_320 * Math.cos((lat * Math.PI) / 180);
  const dLat = halfM / mLat;
  const dLon = halfM / mLon;
  return [
    [lon - dLon, lat - dLat],
    [lon + dLon, lat - dLat],
    [lon + dLon, lat + dLat],
    [lon - dLon, lat + dLat],
    [lon - dLon, lat - dLat],
  ];
}

export function SiteMap({
  id,
  label,
  layout,
  siteRing,
  homes,
  listedBuildings = [],
  sourceDb,
  viewState,
  onViewStateChange,
}: Props) {
  const homesWithNoise: HomeWithNoise[] = useMemo(
    () =>
      homes.map((h, i) => {
        const { db } = noiseAtHome(layout, h, sourceDb, { refDistanceM: 7 });
        return {
          id: h.id ?? `home-${i}`,
          lon: h.lon,
          lat: h.lat,
          db,
          color: noiseColor(db),
        };
      }),
    [homes, layout, sourceDb],
  );

  const layers = useMemo(() => {
    const siteLayer = new PolygonLayer({
      id: `${id}-site`,
      data: [{ polygon: siteRing }],
      getPolygon: (d: { polygon: [number, number][] }) => d.polygon,
      stroked: true,
      filled: false,
      getLineColor: [220, 64, 64, 255],
      lineWidthMinPixels: 2,
      lineWidthMaxPixels: 4,
    });

    const blocksLayer = new SolidPolygonLayer({
      id: `${id}-blocks`,
      data: layout,
      getPolygon: (d: Layout[number]) => d.polygon,
      getElevation: (d: Layout[number]) => d.height_m,
      getFillColor: (d: Layout[number]) => KIND_COLORS[d.kind],
      extruded: true,
      wireframe: true,
      getLineColor: [255, 255, 255, 40],
    });

    const homesLayer = new PolygonLayer({
      id: `${id}-homes`,
      data: homesWithNoise.map((h) => ({
        id: h.id,
        polygon: homeSquare(h.lon, h.lat),
        color: h.color,
        db: h.db,
      })),
      getPolygon: (d: { polygon: [number, number][] }) => d.polygon,
      stroked: true,
      filled: true,
      getFillColor: (d: { color: NoiseRgba }) => [...d.color],
      getLineColor: [20, 18, 14, 220],
      lineWidthMinPixels: 1,
      extruded: false,
      updateTriggers: {
        getFillColor: homesWithNoise.map((h) => h.db).join(','),
      },
    });

    const listedLayer = new TextLayer({
      id: `${id}-listed`,
      data: listedBuildings.filter(
        (b) => Number.isFinite(b.lon) && Number.isFinite(b.lat),
      ),
      getPosition: (d: FactRow) => [d.lon, d.lat],
      getText: (d: FactRow) => d.id.replace(/^C1-/, 'LB'),
      getSize: 11,
      getColor: [210, 190, 140, 230],
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'center',
      billboard: true,
      background: true,
      getBackgroundColor: [40, 36, 28, 200],
      backgroundPadding: [3, 2],
    });

    return [siteLayer, blocksLayer, homesLayer, listedLayer];
  }, [homesWithNoise, id, layout, listedBuildings, siteRing]);

  return (
    <div className="map-panel">
      <div className="map-label">{label}</div>
      <Map
        {...viewState}
        mapStyle={STYLE}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        onMove={(e: ViewStateChangeEvent) => {
          const v = e.viewState;
          onViewStateChange({
            longitude: v.longitude,
            latitude: v.latitude,
            zoom: v.zoom,
            pitch: v.pitch,
            bearing: v.bearing,
          });
        }}
        onClick={(_e: MapLayerMouseEvent) => undefined}
      >
        <NavigationControl position="top-right" showCompass={false} />
        <DeckOverlay layers={layers} interleaved />
      </Map>
    </div>
  );
}
