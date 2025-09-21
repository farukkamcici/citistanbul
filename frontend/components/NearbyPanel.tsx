"use client";

import { useEffect, useState } from "react";

type NearbyPoi = {
  id: string;
  name: string;
  type: string;
  poi_type_label?: string;
  subtype?: string | null;
  address_text?: string | null;
  distance_m?: number;
  lon: number;
  lat: number;
};

type GroupedPois = Record<string, NearbyPoi[]>;

interface Props {
  userLocation: { lon: number; lat: number } | null;
  radius?: number;
  onSelectPoi?: (poi: NearbyPoi) => void;
}

function formatDistance(m?: number) {
  if (!m) return "?";
  if (m > 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}

export default function NearbyPanel({ userLocation, radius = 500, onSelectPoi }: Props) {
  const [pois, setPois] = useState<GroupedPois>({});
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!userLocation || !open) return;

    let cancelled = false;
    setLoading(true);

    fetch(`${API_URL}/poi/nearby?lon=${userLocation.lon}&lat=${userLocation.lat}&r=${radius}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const features = json.data?.features || [];
        const grouped: GroupedPois = {};
        for (const f of features) {
          const t = f.properties.poi_type;
          if (!grouped[t]) grouped[t] = [];
          grouped[t].push({
            id: f.properties.poi_id,
            name: f.properties.name,
            type: t,
              poi_type_label:f.properties.poi_type_label,
            subtype: f.properties.subtype,
            address_text: f.properties.address_text,
            distance_m: f.properties.distance_m,
            lon: f.geometry.coordinates[0],
            lat: f.geometry.coordinates[1],
          });
        }
        setPois(grouped);
      })
      .catch(() => !cancelled && setPois({}))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [userLocation?.lon, userLocation?.lat, radius, API_URL, open]);

  return (
    <div
      className="
        absolute bottom-0 left-0 w-full sm:w-80 sm:bottom-4 sm:left-4
        bg-white/95 rounded-t-xl sm:rounded-xl shadow-xl border
        z-20 overflow-y-auto max-h-[45%] sm:max-h-[70%]
      "
    >
      <div
        className="flex items-center justify-between px-4 py-2 border-b cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <p className="font-semibold text-gray-900">📍 Yakınımda</p>
        <span className="text-gray-600">{open ? "▼" : "▲"}</span>
      </div>

      {open && (
        <div className="p-3 space-y-4 text-sm">
          {loading && <p className="text-gray-700">Yükleniyor...</p>}
          {!loading && Object.keys(pois).length === 0 && (
            <p className="text-gray-700">Sonuç bulunamadı</p>
          )}

          {Object.entries(pois).map(([type, list]) => {
            const limited = list.slice(0, 10);
            return (
              <div key={type}>
                <p className="font-semibold text-gray-800 mb-2">
                  {list[0]?.poi_type_label || ""} ({list.length})
                </p>
                <ul className="space-y-2">
                  {limited.map((poi) => (
                    <li
                      key={poi.id}
                      className="p-2 rounded hover:bg-gray-100 cursor-pointer"
                      onClick={() => onSelectPoi?.(poi)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">
                          {poi.name || "(İsimsiz)"}
                        </span>
                        <span className="text-xs text-gray-700">
                          {formatDistance(poi.distance_m)}
                        </span>
                      </div>
                      {(poi.subtype || poi.address_text) && (
                        <p className="text-xs text-gray-700 truncate">
                          {poi.subtype || poi.address_text}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
