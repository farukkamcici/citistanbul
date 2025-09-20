"use client";

import { useEffect, useState } from "react";
import { Source, Layer } from "react-map-gl/maplibre";
import type { FeatureCollection } from "geojson";

export default function DistrictLayer() {
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
      fetch(`${API_URL}/districts`)
        .then((res) => res.json())
        .then((resp) => setGeojson(resp.data))
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
