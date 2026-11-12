import { useControl } from 'react-map-gl/maplibre';
import { MapboxOverlay, type MapboxOverlayProps } from '@deck.gl/mapbox';

/** deck.gl overlay bridged into MapLibre via MapboxOverlay. */
export function DeckOverlay(props: MapboxOverlayProps) {
  const overlay = useControl<MapboxOverlay>(
    () => new MapboxOverlay({ interleaved: false, ...props }),
  );
  overlay.setProps({ interleaved: false, ...props });
  return null;
}
