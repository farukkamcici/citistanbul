"use client";

import { useEffect, useState } from "react";
import { useMap } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";

export default function UserLocationLayer({
  onLocationUpdate,
}: {
  onLocationUpdate?: (coords: { lon: number; lat: number }) => void;
}) {
  const { current: mapRef } = useMap();
  const map = mapRef?.getMap();

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [geoAllowed, setGeoAllowed] = useState<"granted" | "prompt" | "denied" | null>(null);

  // izin durumunu kontrol et
  useEffect(() => {
    if (!navigator.geolocation) return;

    if (navigator.permissions) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((res) => {
          setGeoAllowed(res.state as any);
          res.onchange = () => setGeoAllowed(res.state as any);
        });
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];

        // 🔑 aynı koordinatsa set etme
        if (!userLocation || userLocation[0] !== coords[0] || userLocation[1] !== coords[1]) {
          setUserLocation(coords);
          onLocationUpdate?.({ lon: coords[0], lat: coords[1] });
        }

        setGeoAllowed("granted");
      },
      () => setGeoAllowed("denied"),
      { enableHighAccuracy: true }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onLocationUpdate]); // userLocation dependency ekleme → sonsuz döngü engellenir

  // User marker ekle
  useEffect(() => {
    if (!map || !userLocation) return;

    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.style.width = "28px";
    wrapper.style.height = "28px";

    const halo = document.createElement("div");
    halo.style.width = "28px";
    halo.style.height = "28px";
    halo.style.borderRadius = "50%";
    halo.style.background = "rgba(0, 122, 255, 0.25)";
    halo.style.position = "absolute";
    halo.style.top = "0";
    halo.style.left = "0";

    const dot = document.createElement("div");
    dot.style.width = "16px";
    dot.style.height = "16px";
    dot.style.borderRadius = "50%";
    dot.style.background = "#007AFF";
    dot.style.border = "3px solid white";
    dot.style.position = "absolute";
    dot.style.top = "6px";
    dot.style.left = "6px";

    wrapper.appendChild(halo);
    wrapper.appendChild(dot);

    const marker = new maplibregl.Marker({ element: wrapper })
      .setLngLat(userLocation)
      .addTo(map);

    return () => {
      marker.remove();
    };
  }, [map, userLocation]);

  const handleGoToLocation = () => {
    if (!navigator.geolocation) {
      alert("Tarayıcınız konum desteği vermiyor.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];

        // 🔑 aynı koordinatsa set etme
        if (!userLocation || userLocation[0] !== coords[0] || userLocation[1] !== coords[1]) {
          setUserLocation(coords);
          onLocationUpdate?.({ lon: coords[0], lat: coords[1] });
        }

        setGeoAllowed("granted");
        if (map) map.flyTo({ center: coords, zoom: 15 });
      },
      () => {
        setGeoAllowed("denied");
        alert("Konum izni reddedildi. Lütfen tarayıcı ayarlarından açın.");
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <button
      onClick={handleGoToLocation}
      className="fixed bottom-16 right-4 w-14 h-14 bg-white rounded-full shadow-lg border flex items-center justify-center hover:bg-gray-100 z-30"
    >
      <img
        src="navigator.png"
        alt="Konumuma Git"
        className="w-8 h-8"
      />
    </button>
  );
}
