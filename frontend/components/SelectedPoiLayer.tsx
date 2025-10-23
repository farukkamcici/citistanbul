"use client";

import { useMemo } from "react";
import { Source, Layer } from "react-map-gl/maplibre";
import type { FeatureCollection, Point } from "geojson";
import type { CircleLayerSpecification } from "maplibre-gl";
import type { SelectedPoi } from "@/components/SearchBar";

interface SelectedPoiLayerProps {
  poi: SelectedPoi | null;
}

const POI_COLORS: Record<string, string> = {
  bike_parking: "#facc15",
  bus_stop: "#1d4ed8",
  ev_charger: "#22c55e",
  health: "#ef4444",
  kiosk: "#94a3b8",
  metro_station: "#16a34a",
  micro_mobility_parking: "#fb923c",
  museum: "#0ea5e9",
  theater: "#ec4899",
  toilet: "#a855f7",
  tram_station: "#14b8a6",
};

const HIGHLIGHT_LAYER: CircleLayerSpecification = {
  id: "selected-poi-layer",
  type: "circle",
  paint: {
    "circle-color": ["coalesce", ["get", "color"], "#000"],
    "circle-radius": 16,
    "circle-stroke-width": 4,
    "circle-stroke-color": "#ffffff",
  },
};

export default function SelectedPoiLayer({ poi }: SelectedPoiLayerProps) {
  const sourceData = useMemo<FeatureCollection<Point> | null>(() => {
    if (!poi) return null;
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [poi.lon, poi.lat] },
          properties: {
            id: poi.id,
            color: POI_COLORS[poi.type] || "#000",
          },
        },
      ],
    };
  }, [poi]);

  if (!poi || !sourceData) {
    return null;
  }

  return (
    <Source id="selected-poi" type="geojson" data={sourceData}>
      <Layer {...HIGHLIGHT_LAYER} />
    </Source>
  );
}
