"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import Map from "react-map-gl/maplibre";
import DistrictLayer from "@/components/DistrictLayer";
import PoiLayer from "@/components/PoiLayer";
import { useState } from "react";

// POI kategorileri
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

  const handleToggle = (type: string) => {
    setActiveTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Kategori içindeki tüm item’leri aç/kapat
  const handleToggleCategory = (category: string) => {
    const items = POI_CATEGORIES[category].map((poi) => poi.key);
    const allSelected = items.every((key) => activeTypes.includes(key));

    if (allSelected) {
      // hepsi seçiliyse -> kaldır
      setActiveTypes((prev) => prev.filter((t) => !items.includes(t)));
    } else {
      // eksik varsa -> ekle
      setActiveTypes((prev) => [...new Set([...prev, ...items])]);
    }
  };

  return (
    <div className="relative w-screen h-screen">
      <Map
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
        {activeTypes.map((type) => (
          <PoiLayer key={type} poiType={type} />
        ))}
      </Map>

      {/* Katman seçici */}
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
    </div>
  );
}
