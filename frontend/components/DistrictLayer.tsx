"use client";

import { useEffect, useState } from "react";
import { Source, Layer } from "react-map-gl/maplibre";

export default function DistrictLayer() {
  const [geojson, setGeojson] = useState<any>(null);

  useEffect(() => {
    fetch("http://207.154.235.183:8000/districts")
      .then((res) => res.json())
      .then((resp) => {
        // API response: {status: "success", data: {...FeatureCollection...}}
        setGeojson(resp.data);
      })
      .catch((err) => console.error("District fetch error:", err));
  }, []);

  if (!geojson) return null;

  return (
    <Source id="districts" type="geojson" data={geojson}>
      <Layer
        id="district-fill"
        type="fill"
        paint={{
          "fill-color": "#088",
          "fill-opacity": 0.2,
        }}
      />
      <Layer
        id="district-outline"
        type="line"
        paint={{
          "line-color": "#000",
          "line-width": 1,
        }}
      />
    </Source>
  );
}
