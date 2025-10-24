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
import RouteLayer from "@/components/RouteLayer";
import DirectionsSidebar from "@/components/DirectionsSidebar";
import { POI_CATEGORIES, POI_COLORS } from "@/components/poi-config";
import { useState, useEffect } from "react";
import type { Feature, LineString, BBox } from "geojson";
import type { TravelMode } from "@/components/directions-utils";

type OrsFeatureProperties = {
  summary?: {
    distance: number;
    duration: number;
  } | null;
};
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

export default function BaseMap() {
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [mapRef, setMapRef] = useState<MapRef | null>(null);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<SelectedPoi | null>(null);
  const [userLocation, setUserLocation] = useState<{ lon: number; lat: number } | null>(null);
  const [routeFeature, setRouteFeature] = useState<Feature<LineString> | null>(null);
  const [routeBBox, setRouteBBox] = useState<BBox | null>(null);
  const [routeSummary, setRouteSummary] = useState<{ distance: number; duration: number } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<TravelMode>("walk");
  const [isDirectionsPanelOpen, setIsDirectionsPanelOpen] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Storage’dan yükle (sadece activeTypes)
  useEffect(() => {
    const storedTypes = localStorage.getItem("activeTypes");
    if (storedTypes) setActiveTypes(JSON.parse(storedTypes));
  }, []);

  // storage’a kaydet (sadece activeTypes)
  useEffect(() => {
    localStorage.setItem("activeTypes", JSON.stringify(activeTypes));
  }, [activeTypes]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    let cancelled = false;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setUserLocation({ lon: pos.coords.longitude, lat: pos.coords.latitude });
      },
      () => undefined,
      { enableHighAccuracy: true }
    );

    return () => {
      cancelled = true;
    };
  }, []);

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

  const clearRoute = ({ closePanel = false }: { closePanel?: boolean } = {}) => {
    setRouteFeature(null);
    setRouteBBox(null);
    setRouteSummary(null);
    setRouteError(null);
    setRouteLoading(false);
    if (closePanel) {
      setIsDirectionsPanelOpen(false);
    }
  };

  const handleSelectPoi = (poi: SelectedPoi | null) => {
    if (poi) {
      setSelectedPoiId(poi.id);
      setSelectedPoi(poi);
      setActiveMode("walk");
      setIsDirectionsPanelOpen(true);
      clearRoute({ closePanel: false });
    } else {
      setSelectedPoiId(null);
      setSelectedPoi(null);
      clearRoute({ closePanel: true });
    }
  };

  const flyToLocation = (coords: { lon: number; lat: number }, zoom = 15) => {
    const map = mapRef?.getMap();
    if (map) {
      map.flyTo({ center: [coords.lon, coords.lat], zoom, speed: 1.2 });
    }
  };

  const handleRequestDirections = async (mode: TravelMode) => {
    if (routeLoading) return;
    if (!selectedPoi) return;

    setActiveMode(mode);
    setIsDirectionsPanelOpen(true);
    setRouteError(null);

    if (!userLocation) {
      clearRoute({ closePanel: false });
      setRouteError("Kullanıcı konumu bulunamadı");
      return;
    }

    if (!API_URL) {
      clearRoute({ closePanel: false });
      setRouteError("API adresi tanımlı değil");
      return;
    }

    setRouteLoading(true);

    try {
      const res = await fetch(`${API_URL}/directions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: userLocation,
          end: { lon: selectedPoi.lon, lat: selectedPoi.lat },
          mode,
        }),
      });
      const json = await res.json();

      if (!res.ok || json.status !== "success" || !json.data) {
        const message = json.message || "Rota bulunamadı";
        clearRoute({ closePanel: false });
        setRouteError(message);
        return;
      }

      const routeData = json.data;
      const feature = routeData?.features?.[0] as Feature<LineString> | undefined;

      if (!feature) {
        clearRoute({ closePanel: false });
        setRouteError("Geçerli rota yanıtı alınamadı");
        return;
      }

      const props = (feature.properties ?? {}) as OrsFeatureProperties;
      const summary = props.summary ?? null;
      const bbox: BBox | null =
        routeData?.bbox || feature.bbox || null;

      setRouteFeature(feature);
      setRouteBBox(bbox);
      setRouteSummary(
        summary
          ? { distance: summary.distance, duration: summary.duration }
          : null
      );
    } catch {
      clearRoute({ closePanel: false });
      setRouteError("Rota alınırken hata oluştu");
    } finally {
      setRouteLoading(false);
    }
  };

  const handleGoToMyLocation = () => {
    if (!navigator.geolocation) {
      setRouteError("Tarayıcınız konum desteği vermiyor");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lon: pos.coords.longitude, lat: pos.coords.latitude };
        setRouteError(null);
        setUserLocation(coords);
        flyToLocation(coords);
      },
      () => {
        setRouteError("Konum izni reddedildi");
      },
      { enableHighAccuracy: true }
    );
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
          <PoiLayer
            key={type}
            poiType={type}
            selectedPoiId={selectedPoiId}
            onSelectPoi={handleSelectPoi}
          />
        ))}

        {/* Kullanıcı konumu */}
        <UserLocationLayer location={userLocation} />

        {/* Rota */}
        <RouteLayer feature={routeFeature} bbox={routeBBox} />

        {/* Seçili POI bağımsız marker */}
        {selectedPoi && <SelectedPoiLayer poi={selectedPoi} />}
      </Map>

      <button
        onClick={handleGoToMyLocation}
        className={`fixed bottom-16 right-4 w-14 h-14 rounded-full border bg-white shadow-lg flex items-center justify-center hover:bg-gray-100 transition ${
          isDirectionsPanelOpen ? "z-40" : "z-20"
        }`}
      >
        <img
          src="/navigator.png"
          alt="Konumuma Git"
          className="w-8 h-8"
        />
      </button>

      <DirectionsSidebar
        isOpen={isDirectionsPanelOpen}
        poi={selectedPoi}
        activeMode={activeMode}
        routeSummary={routeSummary}
        routeLoading={routeLoading}
        routeError={routeError}
        hasRoute={Boolean(routeFeature)}
        onModeChange={setActiveMode}
        onRequestRoute={handleRequestDirections}
        onClearRoute={() => clearRoute({ closePanel: false })}
        onClose={() => handleSelectPoi(null)}
      />

      {/* Arama barı */}
      <SearchBar
        map={mapRef?.getMap() || null}
        onSelectPoi={handleSelectPoi}
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
                          className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={activeTypes.includes(poi.key)}
                            onChange={() => handleToggle(poi.key)}
                            className="accent-blue-600"
                          />
                          <span className="flex-1">{poi.label}</span>
                          <span
                            className="w-3 h-3 rounded-full border border-gray-200"
                            style={{ backgroundColor: POI_COLORS[poi.key] ?? "#888" }}
                            aria-hidden="true"
                          />
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
                        className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={activeTypes.includes(poi.key)}
                          onChange={() => handleToggle(poi.key)}
                          className="accent-blue-600"
                        />
                        <span className="flex-1">{poi.label}</span>
                        <span
                          className="w-3 h-3 rounded-full border border-gray-200"
                          style={{ backgroundColor: POI_COLORS[poi.key] ?? "#888" }}
                          aria-hidden="true"
                        />
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
          handleSelectPoi({
            id: poi.id,
            lon: poi.lon,
            lat: poi.lat,
            type: poi.type,
            name: poi.name,
            district_name: undefined,
            address_text: poi.address_text,
            poi_type_label: poi.poi_type_label,
            subtype: poi.subtype,
          });

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
