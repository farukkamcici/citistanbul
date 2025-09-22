"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

// Kategori tanımı
const POI_CATEGORIES: Record<string, { key: string; label: string }[]> = {
  "Ulaşım": [
    { key: "bus_stop", label: "Otobüs" },
    { key: "metro_station", label: "Metro" },
    { key: "tram_station", label: "Tramvay" },
  ],
  "Altyapı": [
    { key: "ev_charger", label: "Elektrikli Araç Şarj" },
    { key: "toilet", label: "Tuvalet" },
    { key: "bike_parking", label: "Bisiklet Parkı" },
    { key: "micro_mobility_parking", label: "Mikro Mobilite Parkı" },
  ],
  "Kültür & Ticaret": [
    { key: "museum", label: "Müze" },
    { key: "theater", label: "Tiyatro" },
    { key: "kiosk", label: "İHE Büfe" },
  ],
  "Sağlık": [
    { key: "health", label: "Sağlık Tesisi" },
  ],
};

export default function NearbyPanel({
  userLocation,
  radius = 500,
  onSelectPoi,
}: Props) {
  const [pois, setPois] = useState<GroupedPois>({});
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!userLocation || !open) return;

    let cancelled = false;
    setLoading(true);

    fetch(
      `${API_URL}/poi/nearby?lon=${userLocation.lon}&lat=${userLocation.lat}&r=${radius}`
    )
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
            poi_type_label: f.properties.poi_type_label,
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
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Trigger butonu */}
      <SheetTrigger asChild>
        <button
          className="
            button-primary
            fixed bottom-20 left-1/2 -translate-x-1/2 z-30
            px-3 py-1.5 text-sm
            sm:left-4 sm:translate-x-0 sm:bottom-4
            sm:px-4 sm:py-2 sm:text-base
          "
        >
          📍 Yakınımda
        </button>
      </SheetTrigger>

      {/* Panel */}
      <SheetContent
        side="bottom"
        className="
          max-h-[70vh] sm:side-left sm:w-80 sm:max-h-screen
          flex flex-col p-0
        "
      >
        {/* Header sabit */}
        <div className="sticky top-0 z-10 bg-white border-b">
          <SheetHeader className="flex flex-row items-center justify-between px-4 py-3">
            <SheetTitle className="text-gray-900 font-semibold">
              Yakınımda
            </SheetTitle>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>
          </SheetHeader>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-6">
          {loading && <p className="text-gray-700">Yükleniyor...</p>}
          {!loading && Object.keys(pois).length === 0 && (
            <p className="text-gray-700">Sonuç bulunamadı</p>
          )}

          {Object.entries(POI_CATEGORIES).map(([category, items]) => {
            const categoryPois = items.flatMap((poiDef) => pois[poiDef.key] || []);
            if (categoryPois.length === 0) return null;

            return (
              <div key={category} className="space-y-2">
                {/* kategori başlığı */}
                <p className="font-semibold text-gray-800 border-b pb-1">
                  {category} ({categoryPois.length})
                </p>

                <ul className="space-y-1">
                  {categoryPois.slice(0, 10).map((poi) => (
                    <li
                      key={poi.id}
                      className="p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                      onClick={() => onSelectPoi?.(poi)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">
                          {poi.name || "(İsimsiz)"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDistance(poi.distance_m)}
                        </span>
                      </div>
                      {(poi.subtype || poi.address_text) && (
                        <p className="text-xs text-gray-600 truncate">
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
      </SheetContent>
    </Sheet>
  );
}
