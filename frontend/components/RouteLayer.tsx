"use client";

import { useEffect } from "react";
import { useMap } from "react-map-gl/maplibre";
import type { BBox, Feature, LineString } from "geojson";

interface RouteLayerProps {
  feature: Feature<LineString> | null;
  bbox?: BBox | null;
}

const ROUTE_SOURCE_ID = "active-route";
const ROUTE_LAYER_ID = "active-route-line";

export default function RouteLayer({ feature, bbox }: RouteLayerProps) {
  const { current: mapRef } = useMap();
  const map = mapRef?.getMap();

  useEffect(() => {
    if (!map) return;

    if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID);
    if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);

    if (!feature) return;

    map.addSource(ROUTE_SOURCE_ID, {
      type: "geojson",
      data: feature,
    });

    map.addLayer({
      id: ROUTE_LAYER_ID,
      type: "line",
      source: ROUTE_SOURCE_ID,
      paint: {
        "line-color": "#2563eb",
        "line-width": 5,
        "line-opacity": 0.85,
      },
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
    });

    const routeBBox = bbox || feature.bbox;
    if (routeBBox && routeBBox.length === 4) {
      map.fitBounds(
        [
          [routeBBox[0], routeBBox[1]],
          [routeBBox[2], routeBBox[3]],
        ],
        { padding: 80, duration: 900 }
      );
    }

    return () => {
      if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID);
      if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);
    };
  }, [map, feature, bbox]);

  return null;
}
