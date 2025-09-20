"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import Map from "react-map-gl/maplibre";
import DistrictLayer from "@/components/DistrictLayer";

export default function BaseMap() {
  return (
    <Map
      mapLib={import("maplibre-gl")}
      initialViewState={{
        longitude: 28.9744,
        latitude: 41.0128,
        zoom: 9,
      }}
      style={{ width: "100vw", height: "100vh" }}
      mapStyle={`https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`}
    >
      <DistrictLayer />
    </Map>
  );
}
