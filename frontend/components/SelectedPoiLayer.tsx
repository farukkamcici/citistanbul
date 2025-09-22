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
    address_text?: string | null;
    poi_type_label?: string;
    subtype?: string | null;
  } | null;
  onClear?: () => void;
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

export default function SelectedPoiLayer({ poi, onClear }: SelectedPoiLayerProps) {
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
  <div class="bg-white rounded-xl shadow-lg border p-4 w-64 space-y-2">
    <!-- Başlık -->
    <h3 class="text-sm font-semibold text-gray-900 truncate">
      ${poi.name || "İsimsiz"}
    </h3>
    <p class="text-xs text-gray-500">${poi.district_name || ""}</p>

    <!-- Badge grubu -->
    <div class="flex flex-wrap gap-1">
      <span class="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
        ${poi.poi_type_label || poi.type}
      </span>
      ${
        subtypeText
          ? `<span class="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">${subtypeText}</span>`
          : ""
      }
    </div>

    <!-- Adres -->
    ${
      poi.address_text
        ? `<p class="text-xs text-gray-600 line-clamp-2">${poi.address_text}</p>`
        : ""
    }

    <!-- Buton -->
    <div class="pt-2">
      <a
        href="https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lon}"
        target="_blank"
        class="inline-flex items-center justify-center w-full
               px-3 py-1.5 text-xs font-medium
               bg-blue-600 text-white rounded-lg shadow-sm
               hover:bg-blue-700 transition-colors"
      >
        Google Maps’te Aç
      </a>
    </div>
  </div>
`)
      .addTo(map);

    currentPopup.on("close", () => onClear?.());


    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      if (currentPopup) {
        currentPopup.remove();
        currentPopup = null;
      }
    };
  }, [map, poi, onClear]);

  return null;
}
