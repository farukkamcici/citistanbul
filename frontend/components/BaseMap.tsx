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
  const [open, setOpen] = useState(true);
  const [mapRef, setMapRef] = useState<MapRef | null>(null);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<SelectedPoi | null>(null);
  const [userLocation, setUserLocation] = useState<{ lon: number; lat: number } | null>(null);

  // Storage’dan yükle
  useEffect(() => {
    const storedTypes = localStorage.getItem("activeTypes");
    const storedOpen = localStorage.getItem("panelOpen");

    if (storedTypes) setActiveTypes(JSON.parse(storedTypes));
    if (storedOpen) setOpen(JSON.parse(storedOpen));
  }, []);

  // storage’a kaydet
  useEffect(() => {
    localStorage.setItem("activeTypes", JSON.stringify(activeTypes));
  }, [activeTypes]);

  useEffect(() => {
    localStorage.setItem("panelOpen", JSON.stringify(open));
  }, [open]);

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

      {/* Katman seçici panel */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => setOpen(!open)}
          className="bg-white text-black px-3 py-2 rounded shadow-md font-medium"
        >
          ☰ Katmanlar
        </button>

        {open && (
          <div className="mt-2 layer-panel w-56">
            {Object.entries(POI_CATEGORIES).map(([category, items]) => {
              const allSelected = items.every((poi) =>
                activeTypes.includes(poi.key)
              );
              return (
                <div key={category} className="mb-2">
                  <div className="layer-category">
                    <p>{category}</p>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => handleToggleCategory(category)}
                      className="accent-blue-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    {items.map((poi) => (
                      <label key={poi.key} className="layer-item">
                        <input
                          type="checkbox"
                          checked={activeTypes.includes(poi.key)}
                          onChange={() => handleToggle(poi.key)}
                        />
                        <span>{poi.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
