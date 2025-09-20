"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import Map from "react-map-gl/maplibre";

export default function BaseMap() {
  return (
    <Map
      mapLib={import("maplibre-gl")}
      initialViewState={{
        longitude: 28.9744,
        latitude: 41.0128,
        zoom: 8,
      }}
      style={{ width: "100vw", height: "100vh" }}
      mapStyle="https://demotiles.maplibre.org/style.json"
    />
  );
}
