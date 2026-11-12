import { useMemo, useState } from "react";
import Map, {
  Layer,
  Marker,
  NavigationControl,
  Source,
  type MapLayerMouseEvent,
  type ViewStateChangeEvent,
} from "react-map-gl/maplibre";
import type { CircleLayerSpecification, FillLayerSpecification, LineLayerSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type {
  AmenityFact,
  CommunityData,
  HomeFact,
  PlanningApplication,
  PlanningDecision,
} from "../types";
import { homeSquare } from "../lib/geo";
import { PlanningCard } from "./PlanningCard";

const STYLE = "https://tiles.openfreemap.org/styles/dark";

const DECISION_COLOR: Record<PlanningDecision, string> = {
  refused: "#e05353",
  approved_with_conditions: "#e0a23a",
  approved: "#3faf6b",
};

interface Props {
  data: CommunityData;
}

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

function homesGeoJSON(homes: HomeFact[]) {
  return {
    type: "FeatureCollection" as const,
    features: homes.map((h) => ({
      type: "Feature" as const,
      properties: { id: h.id },
      geometry: {
        type: "Polygon" as const,
        coordinates: [homeSquare(h.lon, h.lat)],
      },
    })),
  };
}

function ringsGeoJSON(rings: CommunityData["c1"]["rings"]) {
  return {
    type: "FeatureCollection" as const,
    features: rings.map((r) => ({
      type: "Feature" as const,
      properties: { id: r.id, radius_m: r.radius_m },
      geometry: {
        type: "Polygon" as const,
        coordinates: [r.coordinates],
      },
    })),
  };
}

function appsGeoJSON(apps: PlanningApplication[]) {
  return {
    type: "FeatureCollection" as const,
    features: apps.map((a) => ({
      type: "Feature" as const,
      properties: {
        id: a.id,
        decision: a.decision,
        color: DECISION_COLOR[a.decision],
      },
      geometry: {
        type: "Point" as const,
        coordinates: [a.lon, a.lat],
      },
    })),
  };
}

const homeFill: FillLayerSpecification = {
  id: "homes-fill",
  type: "fill",
  source: "homes",
  paint: {
    "fill-color": "#d8b56a",
    "fill-opacity": 0.9,
  },
};

const homeLine: LineLayerSpecification = {
  id: "homes-line",
  type: "line",
  source: "homes",
  paint: {
    "line-color": "#8a6a2e",
    "line-width": 1,
  },
};

const ringLine: LineLayerSpecification = {
  id: "rings-line",
  type: "line",
  source: "rings",
  paint: {
    "line-color": "#7ec8e3",
    "line-width": 1.5,
    "line-dasharray": [2, 1.5],
    "line-opacity": 0.85,
  },
};

const siteLine: LineLayerSpecification = {
  id: "site-line",
  type: "line",
  source: "site",
  paint: {
    "line-color": "#e05353",
    "line-width": 2.5,
  },
};

const pinCircle: CircleLayerSpecification = {
  id: "planning-pins",
  type: "circle",
  source: "planning",
  paint: {
    "circle-radius": 8,
    "circle-color": ["get", "color"],
    "circle-stroke-width": 2,
    "circle-stroke-color": "#0f1418",
  },
};

function AmenityMarker({ item }: { item: AmenityFact }) {
  const isSchool = item.kind === "school";
  return (
    <Marker longitude={item.lon} latitude={item.lat} anchor="bottom">
      <div className={`amenity-marker ${item.kind}`} title={item.label}>
        <span className="amenity-icon" aria-hidden>
          {isSchool ? "S" : "W"}
        </span>
        <span className="amenity-label">{item.label}</span>
      </div>
    </Marker>
  );
}

export function CommunityMap({ data }: Props) {
  const siteProps = data.site.features[0]?.properties;
  const [viewState, setViewState] = useState<ViewState>({
    longitude: siteProps?.lon ?? -1.255,
    latitude: siteProps?.lat ?? 52.865,
    zoom: 14.2,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const homes = useMemo(() => homesGeoJSON(data.c1.homes), [data.c1.homes]);
  const rings = useMemo(() => ringsGeoJSON(data.c1.rings), [data.c1.rings]);
  const planning = useMemo(
    () => appsGeoJSON(data.c2.applications),
    [data.c2.applications],
  );
  const amenities = useMemo(
    () => [...data.c1.schools, ...data.c1.places_of_worship],
    [data.c1.schools, data.c1.places_of_worship],
  );

  const selected = data.c2.applications.find((a) => a.id === selectedId) ?? null;

  const onMove = (e: ViewStateChangeEvent) => {
    setViewState({
      longitude: e.viewState.longitude,
      latitude: e.viewState.latitude,
      zoom: e.viewState.zoom,
    });
  };

  const onClick = (e: MapLayerMouseEvent) => {
    const hit = e.features?.find((f) => f.layer?.id === "planning-pins");
    if (hit?.properties?.id) {
      setSelectedId(String(hit.properties.id));
      return;
    }
    setSelectedId(null);
  };

  return (
    <div className="map-shell">
      <Map
        {...viewState}
        onMove={onMove}
        mapStyle={STYLE}
        style={{ width: "100%", height: "100%" }}
        interactiveLayerIds={["planning-pins"]}
        onClick={onClick}
        cursor="pointer"
        attributionControl={{ compact: true }}
      >
        <NavigationControl position="top-right" />

        <Source id="site" type="geojson" data={data.site}>
          <Layer {...siteLine} />
        </Source>

        <Source id="rings" type="geojson" data={rings}>
          <Layer {...ringLine} />
        </Source>

        <Source id="homes" type="geojson" data={homes}>
          <Layer {...homeFill} />
          <Layer {...homeLine} />
        </Source>

        <Source id="planning" type="geojson" data={planning}>
          <Layer {...pinCircle} />
        </Source>

        {amenities.map((item) => (
          <AmenityMarker key={item.id} item={item} />
        ))}
      </Map>

      {selected ? (
        <div className="planning-card-anchor">
          <PlanningCard app={selected} onClose={() => setSelectedId(null)} />
        </div>
      ) : null}
    </div>
  );
}
