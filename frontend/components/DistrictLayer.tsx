"use client";

import { useEffect, useState } from "react";
import { Source, Layer } from "react-map-gl/maplibre";
import type { FeatureCollection } from "geojson";

const METRICS = [
  {
    key: "population",
    label: "Nüfus",
    stops: [100000, 250000, 500000, 1000000],
    colors: ["#deebf7", "#9ecae1", "#3182bd", "#08519c"]
  },
  {
    key: "avg_rent",
    label: "Kira (₺)",
    stops: [10000, 20000, 30000, 40000],
    colors: ["#fee5d9", "#fcae91", "#fb6a4a", "#cb181d"]
  },
  {
    key: "avg_price_m2",
    label: "Konut Fiyatı (₺/m²)",
    stops: [20000, 40000, 60000, 80000],
    colors: ["#fee5d9", "#fcae91", "#fb6a4a", "#cb181d"]
  },
  {
    key: "green_per_capita_m2",
    label: "Yeşil Alan (m²/kişi)",
    stops: [2, 5, 10, 20],
    colors: ["#edf8e9", "#bae4b3", "#74c476", "#238b45"]
  },
  {
    key: "bike_lane_density",
    label: "Bisiklet Yolu Yoğunluğu",
    stops: [0.5, 1, 2, 4],
    colors: ["#efedf5", "#bcbddc", "#756bb1", "#4a1486"]
  },
  {
    key: "pedestrian_length_density",
    label: "Yaya Alanı Yoğunluğu",
    stops: [0.01, 0.05, 0.1, 0.2],
    colors: ["#feedde", "#fdbe85", "#fd8d3c", "#e6550d"]
  }
];


export default function DistrictLayer() {
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null);
  const [metric, setMetric] = useState<string | null>(null); // seçili metrik
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    async function fetchData() {
      const dRes = await fetch(`${API_URL}/districts`);
      const dJson = await dRes.json();
      const districts = dJson.data;

      const mRes = await fetch(`${API_URL}/metrics`);
      const mJson = await mRes.json();
      const metrics = mJson.data.districts;

      const joined: FeatureCollection = {
        ...districts,
        features: districts.features.map((f: any) => {
          const m = metrics.find(
            (x: any) => x.district_id === f.properties.district_id
          );
          return {
            ...f,
            properties: {
              ...f.properties,
              ...m,
            },
          };
        }),
      };
      setGeojson(joined);
    }
    fetchData();
  }, [API_URL]);

  if (!geojson) return null;

    const mConfig = metric ? METRICS.find((m) => m.key === metric)! : null;

    // Choropleth paint sadece metric seçiliyse uygulanır
    const choroplethPaint =
      !mConfig
        ? { "fill-opacity": 0 } // boş: görünmez
        : ({
            "fill-color": [
              "interpolate",
              ["linear"],
              ["get", metric],
              ...mConfig.stops.flatMap((v, i) => [v, mConfig.colors[i]])
            ],
            "fill-opacity": 0.6,
          } as any);

  return (
    <>
      {/* Metric seçimi UI */}
        <div className="absolute top-4 right-4 bg-white/90 border border-gray-300 rounded-lg shadow-md p-3 space-y-2 z-10">
          <p className="font-semibold text-sm text-gray-800">Metrik Seç</p>
          {METRICS.map((m) => (
            <label key={m.key} className="flex items-center space-x-2 text-sm text-gray-700">
              <input
                type="radio"
                name="metric"
                value={m.key}
                checked={metric === m.key}
                onChange={() => setMetric(m.key)}
                className="accent-green-600"
              />
              <span>{m.label}</span>
            </label>
          ))}
          <label className="flex items-center space-x-2 text-sm text-gray-700">
            <input
              type="radio"
              name="metric"
              value=""
              checked={metric === null}
              onChange={() => setMetric(null)}
              className="accent-red-500"
            />
            <span>Hiçbiri</span>
          </label>
        </div>


      {/* Legend: alt merkezde */}
        {metric && mConfig && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2
                          bg-white/90 border border-gray-300 rounded-lg shadow-md
                          px-4 py-2 text-xs text-gray-700 z-10">
            <p className="font-medium text-center mb-1 text-gray-800">
              {mConfig.label}
            </p>
            <div className="flex items-center space-x-3">
              {mConfig.colors.map((c, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="w-8 h-4 rounded border border-gray-400"
                    style={{ backgroundColor: c }}
                  />
                  <span className="text-[10px] mt-1">{mConfig.stops[i]}</span>
                </div>
              ))}
            </div>
          </div>
        )}



      {/* Map layer */}
      <Source id="districts" type="geojson" data={geojson}>
        <Layer id="district-fill" type="fill" paint={choroplethPaint} />
        <Layer
          id="district-outline"
          type="line"
          paint={{ "line-color": "#ffffff", "line-width": 1.5 }}
        />
      </Source>
    </>
  );
}
