"use client";

import { useEffect, useState, useCallback } from "react";
import { useMap } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import { POI_COLORS, POI_LABELS } from "@/components/poi-config";

interface PoiLayerProps {
  poiType: string;
  selectedPoiId?: string | null;
  onSelectPoi?: (poi: {
    id: string;
    lon: number;
    lat: number;
    type: string;
    name?: string;
    district_name?: string;
    address_text?: string | null;
    poi_type_label?: string;
    subtype?: string | null;
  }) => void;
}

export default function PoiLayer({ poiType, selectedPoiId, onSelectPoi }: PoiLayerProps) {
  const { current: mapRef } = useMap();
  const map = mapRef?.getMap();
  const [poiData, setPoiData] = useState<any>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchPoiData = useCallback(() => {
    if (!map || !poiType) return;

    const bounds = map.getBounds();
    const bbox = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ].join(",");

    fetch(`${API_URL}/poi?poi_type=${poiType}&bbox=${bbox}`)
      .then((res) => res.json())
      .then((json) => setPoiData(json.data))
      .catch((e) => console.error("POI fetch error:", e));
  }, [map, poiType, API_URL]);

  useEffect(() => {
    if (!map) return;
    fetchPoiData();

    const handleMoveEnd = () => fetchPoiData();
    map.on("moveend", handleMoveEnd);

    return () => {
      map.off("moveend", handleMoveEnd);
    };
  }, [map, fetchPoiData]);

  useEffect(() => {
    if (!map || !poiData) return;

    const sourceId = `pois-${poiType}`;
    const unclusteredId = `${sourceId}-unclustered`;
    const highlightId = `${sourceId}-highlight`;

    // Source güncelle veya ekle
    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as any).setData(poiData);
    } else {
      map.addSource(sourceId, {
        type: "geojson",
        data: poiData,
        cluster: true,
        clusterMaxZoom: 11,
        clusterRadius: 70,
      });

      map.addLayer({
        id: `${sourceId}-clusters`,
        type: "circle",
        source: sourceId,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#11b4da",
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "point_count"],
            1, 12,
            100, 28,
          ],
          "circle-opacity": 0.6,
        },
      });

      map.addLayer({
        id: `${sourceId}-cluster-count`,
        type: "symbol",
        source: sourceId,
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["Open Sans Bold"],
          "text-size": 12,
        },
      });

      map.addLayer({
        id: unclusteredId,
        type: "circle",
        source: sourceId,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": POI_COLORS[poiType] || "#888",
          "circle-radius": 9,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });
    }

    if (selectedPoiId) {
      if (map.getLayer(highlightId)) map.removeLayer(highlightId);
      map.addLayer({
        id: highlightId,
        type: "circle",
        source: sourceId,
        filter: [
          "all",
          ["!", ["has", "point_count"]],
          ["==", ["get", "poi_id"], selectedPoiId],
        ],
        paint: {
          "circle-color": POI_COLORS[poiType] || "#000",
          "circle-radius": 14,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#FFD700",
        },
      });
    } else {
      if (map.getLayer(highlightId)) map.removeLayer(highlightId);
    }

    const onClick = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [unclusteredId],
      });
      if (!features.length) return;

      const f = features[0];
      const coords = (f.geometry as any).coordinates;
      const props = f.properties as any;

      onSelectPoi?.({
        id: props.poi_id,
        lon: coords[0],
        lat: coords[1],
        type: props.poi_type,
        name: props.name,
        district_name: props.district_name,
        address_text: props.address || props.address_text || null,
        poi_type_label: POI_LABELS[props.poi_type] || props.poi_type,
        subtype: props.subtype,
      });
    };

    map.on("click", onClick);

    return () => {
      map.off("click", onClick);
      if (map.getLayer(highlightId)) map.removeLayer(highlightId);
      if (map.getLayer(`${sourceId}-clusters`)) map.removeLayer(`${sourceId}-clusters`);
      if (map.getLayer(`${sourceId}-cluster-count`)) map.removeLayer(`${sourceId}-cluster-count`);
      if (map.getLayer(unclusteredId)) map.removeLayer(unclusteredId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, poiData, poiType, selectedPoiId, onSelectPoi]);

  return null;
}
