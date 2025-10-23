"use client";

import { useEffect } from "react";
import { useMap } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";

export default function UserLocationLayer({
  location,
}: {
  location: { lon: number; lat: number } | null;
}) {
  const { current: mapRef } = useMap();
  const map = mapRef?.getMap();

  useEffect(() => {
    if (!map || !location) return;

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
      .setLngLat([location.lon, location.lat])
      .addTo(map);

    return () => {
      marker.remove();
    };
  }, [map, location]);

  return null;
}
