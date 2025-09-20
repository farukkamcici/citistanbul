"use client";

import { useEffect } from "react";
import { useMap } from "react-map-gl/maplibre";

export default function GreenAreasLayer() {
  const { current: mapRef } = useMap();
  const map = mapRef?.getMap();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!map) return;

    const sourceId = "green-areas";

    const fetchGreenAreas = () => {
      const bounds = map.getBounds();
      const bbox = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ].join(",");

      fetch(`${API_URL}/green_areas?bbox=${bbox}`)
        .then((res) => res.json())
        .then((json) => {
          if (map.getSource(sourceId)) {
            (map.getSource(sourceId) as any).setData(json.data);
          } else {
            map.addSource(sourceId, { type: "geojson", data: json.data });

            // Fill (şeffaf yeşil)
            map.addLayer({
              id: "green-fill",
              type: "fill",
              source: sourceId,
              paint: {
                "fill-color": "#22c55e",
                "fill-opacity": 0.3,
              },
            });

            // Outline (koyu yeşil çizgi)
            map.addLayer({
              id: "green-outline",
              type: "line",
              source: sourceId,
              paint: {
                "line-color": "#166534",
                "line-width": 1,
              },
            });
          }
        });
    };

    // İlk yükleme
    fetchGreenAreas();

    // Harita hareket edince güncelle
    map.on("moveend", fetchGreenAreas);

    return () => {
      map.off("moveend", fetchGreenAreas);
      if (map.getLayer("green-fill")) map.removeLayer("green-fill");
      if (map.getLayer("green-outline")) map.removeLayer("green-outline");
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map]);

  return null;
}
