"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import Map from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import DistrictLayer from "@/components/DistrictLayer";
import PoiLayer from "@/components/PoiLayer";
import UserLocationLayer from "@/components/UserLocationLayer";
import SearchBar, { SelectedPoi } from "@/components/SearchBar";
import SelectedPoiLayer from "@/components/SelectedPoiLayer";
import NearbyPanel from "@/components/NearbyPanel";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

export default function BaseMap() {
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [mapRef, setMapRef] = useState<MapRef | null>(null);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<SelectedPoi | null>(null);
  const [userLocation, setUserLocation] = useState<{ lon: number; lat: number } | null>(null);

  // Storage’dan yükle (sadece activeTypes)
  useEffect(() => {
    const storedTypes = localStorage.getItem("activeTypes");
    if (storedTypes) setActiveTypes(JSON.parse(storedTypes));
  }, []);

  // storage’a kaydet (sadece activeTypes)
  useEffect(() => {
    localStorage.setItem("activeTypes", JSON.stringify(activeTypes));
  }, [activeTypes]);

  const handleToggle = (type: string) => {
    setActiveTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleToggleCategory = (category: string) => {
    const items = POI_CATEGORIES[category].map((poi) => poi.key);
    const allSelected = items.every((key) => activeTypes.includes(key));

    if (allSelected) {
      setActiveTypes((prev) => prev.filter((t) => !items.includes(t)));
    } else {
      setActiveTypes((prev) => [...new Set([...prev, ...items])]);
    }
  };

  return (
    <div className="relative w-screen h-screen">
      <Map
        ref={setMapRef}
        mapLib={import("maplibre-gl")}
        initialViewState={{
          longitude: 28.9744,
          latitude: 41.0128,
          zoom: 9,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={`https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`}
      >
        <DistrictLayer />

        {/* POI Katmanları */}
        {activeTypes.map((type) => (
          <PoiLayer key={type} poiType={type} selectedPoiId={selectedPoiId} />
        ))}

        {/* Kullanıcı konumu */}
        <UserLocationLayer onLocationUpdate={(coords) => setUserLocation(coords)} />

        {/* Seçili POI bağımsız marker */}
        {selectedPoi && <SelectedPoiLayer poi={selectedPoi} />}
      </Map>

      {/* Arama barı */}
      <SearchBar
        map={mapRef?.getMap() || null}
        onSelectPoi={(poi) => {
          if (poi) {
            setSelectedPoiId(poi.id);
            setSelectedPoi(poi);
          } else {
            setSelectedPoiId(null);
            setSelectedPoi(null);
          }
        }}
      />

      {/* === Katman seçici === */}

      {/* Tablet ve altı: buton + bottom sheet */}
      <div className="lg:hidden absolute top-3 left-3 z-20">
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="
                bg-white border border-gray-300 rounded-full p-2 shadow-md
                hover:bg-gray-50 flex items-center justify-center
              "
            >
              <img src="/layers.svg" alt="Katmanlar" className="w-5 h-5" />
            </button>
          </SheetTrigger>

          <SheetContent side="bottom" className="max-h-[70vh] flex flex-col">
            <SheetHeader className="border-b pb-2">
              <SheetTitle className="text-base font-semibold text-gray-900">
                Katmanlar
              </SheetTitle>
            </SheetHeader>

            <div className="mt-4 px-4 py-2 space-y-4 overflow-y-auto max-h-[60vh]">
              {Object.entries(POI_CATEGORIES).map(([category, items]) => {
                const allSelected = items.every((poi) =>
                  activeTypes.includes(poi.key)
                );
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-800">{category}</p>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => handleToggleCategory(category)}
                        className="accent-blue-600 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      {items.map((poi) => (
                        <label
                          key={poi.key}
                          className="flex items-center space-x-2 text-sm p-2 rounded-md hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={activeTypes.includes(poi.key)}
                            onChange={() => handleToggle(poi.key)}
                            className="accent-blue-600"
                          />
                          <span>{poi.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: collapsible bar */}
      <div className="hidden lg:block absolute top-4 left-4 z-20 w-64">
        <Collapsible>
          <CollapsibleTrigger asChild>
            <button
              className="
                w-full bg-white border border-gray-300 rounded-lg px-4 py-2 shadow-md
                flex items-center justify-between hover:bg-gray-50 font-medium text-gray-800
              "
            >
              <div className="flex items-center gap-2">
                <img src="/layers.svg" alt="Katmanlar" className="w-5 h-5" />
                <span className="text-base font-medium text-gray-800">Katmanlar</span>
              </div>
              <span>▼</span>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-2 bg-white border rounded-lg shadow-md p-3 space-y-2 max-h-[60vh] overflow-y-auto">
            {Object.entries(POI_CATEGORIES).map(([category, items]) => {
              const allSelected = items.every((poi) =>
                activeTypes.includes(poi.key)
              );
              return (
                <div key={category} className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-gray-800 text-sm">{category}</p>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => handleToggleCategory(category)}
                      className="accent-blue-600 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    {items.map((poi) => (
                      <label
                        key={poi.key}
                        className="flex items-center space-x-2 text-sm p-2 rounded-md hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={activeTypes.includes(poi.key)}
                          onChange={() => handleToggle(poi.key)}
                          className="accent-blue-600"
                        />
                        <span>{poi.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Nearby panel */}
      <NearbyPanel
        userLocation={userLocation}
        radius={500}
        onSelectPoi={(poi) => {
          setSelectedPoiId(poi.id);
          setSelectedPoi(poi);

          const map = mapRef?.getMap();
          if (map) {
            map.flyTo({
              center: [poi.lon, poi.lat],
              zoom: 16,
              speed: 1.2,
            });
          }
        }}
      />
    </div>
  );
}
