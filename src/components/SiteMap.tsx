import { useMemo, useCallback, useState } from 'react';
import Map, { NavigationControl } from 'react-map-gl/maplibre';
import { PolygonLayer, SolidPolygonLayer } from '@deck.gl/layers';
import type { ViewStateChangeEvent } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import type { Layout, LonLat } from '../types';
import { KIND_COLORS } from '../lib/colors';
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

interface Props {
  id: string;
  label: string;
  layout: Layout;
  siteRing: [number, number][];
  homes: LonLat[];
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
  viewState,
  onViewStateChange,
}: Props) {
  const [ready, setReady] = useState(false);

  const onMapRef = useCallback((ref: MapRef | null) => {
    if (ref) {
      // Ensure size after layout.
      requestAnimationFrame(() => ref.resize());
    }
  }, []);

  const layers = useMemo(() => {
    if (!ready) return [];

    const siteLayer = new PolygonLayer({
      id: `${id}-site`,
      data: [{ polygon: siteRing }],
      getPolygon: (d: { polygon: [number, number][] }) => d.polygon,
      stroked: true,
      filled: true,
      getFillColor: [220, 64, 64, 30],
      getLineColor: [220, 64, 64, 255],
      lineWidthMinPixels: 2,
      lineWidthMaxPixels: 4,
      parameters: { depthTest: false },
    });

    const blocksLayer = new SolidPolygonLayer({
      id: `${id}-blocks`,
      data: layout,
      getPolygon: (d: Layout[number]) => d.polygon,
      getElevation: (d: Layout[number]) => d.height_m,
      getFillColor: (d: Layout[number]) => KIND_COLORS[d.kind],
      extruded: true,
      wireframe: true,
      getLineColor: [255, 255, 255, 60],
      elevationScale: 1,
    });

    const homesLayer = new PolygonLayer({
      id: `${id}-homes`,
      data: homes.map((h, i) => ({
        id: `home-${i}`,
        polygon: homeSquare(h.lon, h.lat),
      })),
      getPolygon: (d: { polygon: [number, number][] }) => d.polygon,
      stroked: true,
      filled: true,
      getFillColor: [240, 220, 160, 230],
      getLineColor: [40, 30, 10, 220],
      lineWidthMinPixels: 1,
      parameters: { depthTest: false },
    });

    return [siteLayer, homesLayer, blocksLayer];
  }, [homes, id, layout, ready, siteRing]);

  return (
    <div className="map-panel">
      <div className="map-label">{label}</div>
      <Map
        ref={onMapRef}
        longitude={viewState.longitude}
        latitude={viewState.latitude}
        zoom={viewState.zoom}
        pitch={viewState.pitch}
        bearing={viewState.bearing}
        mapStyle={STYLE}
        style={{ width: '100%', height: '100%' }}
        attributionControl={{ compact: true }}
        canvasContextAttributes={{ preserveDrawingBuffer: true }}
        onLoad={() => setReady(true)}
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
      >
        <NavigationControl position="top-right" showCompass={false} />
        {ready && <DeckOverlay layers={layers} />}
      </Map>
    </div>
  );
}
