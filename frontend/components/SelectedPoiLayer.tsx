"use client";

import { useEffect } from "react";
import { useMap } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import type { FeatureCollection, Point } from "geojson";

interface SelectedPoiLayerProps {
  poi: {
    id: string;
    lon: number;
    lat: number;
    type: string;
    name?: string;
    district_name?: string;
    address_text?: string;
    poi_type_label?: string;
    subtype?: string;
  } | null;
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

let currentPopup: maplibregl.Popup | null = null;

export default function SelectedPoiLayer({ poi }: SelectedPoiLayerProps) {
  const { current: mapRef } = useMap();
  const map = mapRef?.getMap();

  useEffect(() => {
    if (!map) return;

    const sourceId = "selected-poi";
    const layerId = "selected-poi-layer";

    // önceki layer/source temizle
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    // önceki popup kapat
    if (currentPopup) {
      currentPopup.remove();
      currentPopup = null;
    }

    if (!poi) return;

    if (poi) {
      const geojson: FeatureCollection<Point> = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [poi.lon, poi.lat] },
            properties: { id: poi.id, type: poi.type },
          },
        ],
      };

      map.addSource(sourceId, { type: "geojson", data: geojson });
      map.addLayer({
        id: layerId,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-color": POI_COLORS[poi.type] || "#000",
          "circle-radius": 16,
          "circle-stroke-width": 4,
          "circle-stroke-color": "#ffffff",
        },
      });

      const subtypeText =
        poi.type === "bus_stop" && poi.subtype
          ? `Gidiş yönü: ${poi.subtype}`
          : poi.subtype || "";

      // yeni popup
      currentPopup = new maplibregl.Popup({ closeButton: true, offset: 15 })
        .setLngLat([poi.lon, poi.lat])
        .setHTML(`
          <div>
            <h3 class="poi-title">${poi.name || "Unnamed"}</h3>
            <p class="poi-district">${poi.district_name || ""}</p>
            <div class="poi-badges">
              <span class="poi-badge">${poi.poi_type_label || poi.type}</span>
              ${subtypeText ? `<span class="poi-subtype">${subtypeText}</span>` : ""}
            </div>
            ${
              poi.address_text
                ? `<p class="poi-address">${poi.address_text}</p>`
                : ""
            }
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lon}" 
              target="_blank" 
              class="poi-directions"
            >
              Git
            </a>
          </div>
        `)
        .addTo(map);
    }

    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      if (currentPopup) {
        currentPopup.remove();
        currentPopup = null;
      }
    };
  }, [map, poi]);

  return null;
}
