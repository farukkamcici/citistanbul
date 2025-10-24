"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { POI_CATEGORIES } from "@/components/poi-config";

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
      fixed bottom-16 left-4 z-30
      w-14 h-14 bg-white rounded-full shadow-lg border
      flex items-center justify-center hover:bg-gray-100
      sm:bottom-4 sm:w-auto sm:h-auto
      sm:px-4 sm:py-2 sm:text-base sm:rounded-lg sm:gap-2
    "
  >
    <img
      src="/near.svg"
      alt="Yakınımda"
      className="w-7 h-7"
    />
    <span className="hidden sm:block text-base font-medium">
      Yakınımda Ne Var?
    </span>
  </button>
</SheetTrigger>

      {/* Panel */}
      <SheetContent
        side="bottom"
        className="max-h-[75vh] flex flex-col rounded-t-3xl border-t border-gray-200 bg-white px-0 pb-6 sm:side-left sm:w-80 sm:max-h-screen"
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-gray-300" />
        {/* Header sabit */}
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white">
          <SheetHeader className="flex flex-row items-center justify-between px-4 py-3">
            <SheetTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <img src="/near.svg" alt="Yakınımda" className="h-5 w-5" />
              Yakınımda
            </SheetTitle>
          </SheetHeader>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
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
