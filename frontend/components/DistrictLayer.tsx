"use client";

import { useEffect, useState } from "react";
import { Source, Layer, useMap } from "react-map-gl/maplibre";
import type { FeatureCollection } from "geojson";
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

const METRICS = [
  { key: "population", label: "Nüfus", stops: [100000, 250000, 500000, 1000000], colors: ["#deebf7", "#9ecae1", "#3182bd", "#08519c"] },
  { key: "avg_rent", label: "Kira (₺)", stops: [10000, 20000, 30000, 40000], colors: ["#fee5d9", "#fcae91", "#fb6a4a", "#cb181d"] },
  { key: "avg_price_m2", label: "Konut Fiyatı (₺/m²)", stops: [20000, 40000, 60000, 80000], colors: ["#fee5d9", "#fcae91", "#fb6a4a", "#cb181d"] },
  { key: "green_per_capita_m2", label: "Yeşil Alan (m²/kişi)", stops: [2, 5, 10, 20], colors: ["#edf8e9", "#bae4b3", "#74c476", "#238b45"] },
  { key: "bike_lane_density", label: "Bisiklet Yolu Yoğunluğu", stops: [0.5, 1, 2, 4], colors: ["#efedf5", "#bcbddc", "#756bb1", "#4a1486"] },
  { key: "pedestrian_length_density", label: "Yaya Alanı Yoğunluğu", stops: [0.01, 0.05, 0.1, 0.2], colors: ["#feedde", "#fdbe85", "#fd8d3c", "#e6550d"] }
];

function InfoHelper() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <span
        className="text-gray-400 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        ℹ️
      </span>
      {open && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-56
                        bg-white text-gray-700 text-xs rounded-lg shadow-lg border p-3 z-30">
          <p className="mb-1 font-semibold">Sıralama Metodolojisi</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Yeşil Alan & Yaya: kişi başı yeşil alan + yaya yoğunluğu</li>
            <li>Ulaşım & Erişim: bisiklet yolları + hizmetlere erişim</li>
            <li>Konut Uygunluğu: kira ve fiyat uygunluğu</li>
            <li>Genel Yaşam Skoru: tüm kategorilerin ortalaması</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default function DistrictLayer() {
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null);
  const [metric, setMetric] = useState<string | null>(null);
  const [districtData, setDistrictData] = useState<any>(null);
  const [loadingDistrict, setLoadingDistrict] = useState(false);
  const [openCollapsible, setOpenCollapsible] = useState(true);

  const { current: mapRef } = useMap();
  const map = mapRef?.getMap();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // District + metrics join
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
          const m = metrics.find((x: any) => x.district_id === f.properties.district_id);
          return { ...f, properties: { ...f.properties, ...m } };
        }),
      };
      setGeojson(joined);
    }
    fetchData();
  }, [API_URL]);

  // Map click event
  useEffect(() => {
    if (!map) return;
    const handleClick = (e: any) => {
      const original = e.originalEvent as (MouseEvent & { __poiHandled?: boolean }) | undefined;
      if (original?.__poiHandled) {
        return;
      }
      const props = e.features?.[0]?.properties;
      if (!props) {
        setDistrictData(null);
        return;
      }
      setLoadingDistrict(true);
      setDistrictData(null);
      fetch(`${API_URL}/metrics?district=${encodeURIComponent(props.district_name)}`)
        .then(res => res.json())
        .then(json => setDistrictData(json.data.districts?.[0] || null))
        .catch(() => setDistrictData(null))
        .finally(() => setLoadingDistrict(false));
    };
    map.on("click", "district-fill", handleClick);
    return () => {
      if (map.getLayer("district-fill")) {
        map.off("click", "district-fill", handleClick);
      }
    };
  }, [map, API_URL]);

  if (!geojson) return null;

  const mConfig = metric ? METRICS.find((m) => m.key === metric)! : null;
  const choroplethPaint = !mConfig
    ? { "fill-color": "#bdc7d6", "fill-opacity": 0.4 }
    : ({
      "fill-color": [
        "interpolate",
        ["linear"],
        ["get", metric],
        ...mConfig.stops.flatMap((v, i) => [v, mConfig.colors[i]])
      ],
      "fill-opacity": 0.7,
    } as any);

  return (
    <>
      {/* === Metric seçimi === */}
    {/* Mobile: bottom-sheet */}
    <div className="lg:hidden absolute top-3 right-3 z-20">
      <Sheet>
        <SheetTrigger asChild>
          <button
            className="
              bg-white border border-gray-300 rounded-full p-2 shadow-md
              hover:bg-gray-50 flex items-center justify-center
            "
          >
            <img
              src="/metrics.svg"
              alt="Metrik Seç"
              className="w-5 h-5"
            />
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[70vh] flex flex-col">
          <SheetHeader className="border-b pb-2">
            <SheetTitle className="font-semibold text-gray-900">
              İlçe Yoğunluk Haritası
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 px-4 py-2 space-y-3">
            {METRICS.map((m) => (
              <label
                key={m.key}
                className="flex items-center space-x-2 text-sm p-2 rounded-md hover:bg-gray-50"
              >
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
            <label className="flex items-center space-x-2 text-sm p-2 rounded-md hover:bg-gray-50">
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
        </SheetContent>
      </Sheet>
    </div>



    {/* Desktop: collapsible */}
    <div className="hidden lg:block absolute top-4 right-4 z-20 w-64">
      <Collapsible open={openCollapsible} onOpenChange={setOpenCollapsible}>
        <CollapsibleTrigger asChild>
          <button
            className="
              w-full bg-white border border-gray-300 rounded-lg px-4 py-2 shadow-md
              flex items-center justify-between hover:bg-gray-50 font-medium text-gray-800
            "
          >
            <div className="flex items-center gap-2">
              <img
                src="/metrics.svg"
                alt="Metrik"
                className="w-5 h-5"
              />
              <span className="text-base font-medium text-gray-800">İlçe Yoğunluk Haritası</span>
            </div>
            <span>{openCollapsible ? "▲" : "▼"}</span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 bg-white border rounded-lg shadow-md p-3 space-y-2">
          {METRICS.map((m) => (
            <label key={m.key} className="flex items-center space-x-2 text-sm">
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
          <label className="flex items-center space-x-2 text-sm">
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
        </CollapsibleContent>
      </Collapsible>
    </div>

      {/* === Legend === */}
      {metric && mConfig && (
        <div
          className="
            absolute bottom-32 left-1/2 -translate-x-1/2
            sm:bottom-4
            bg-white/90 border border-gray-300 rounded-lg shadow-md
            px-3 py-2 text-[11px] sm:text-xs text-gray-700 z-10
          "
        >
          <p className="font-medium text-center mb-1 text-gray-800">
            {mConfig.label}
          </p>
          <div className="flex items-center space-x-3">
            {mConfig.colors.map((c, i) => (
              <div key={i} className="flex flex-col items-center">
                <div
                  className="w-6 sm:w-8 h-3 sm:h-4 rounded border border-gray-400"
                  style={{ backgroundColor: c }}
                />
                <span className="text-[9px] sm:text-[10px] mt-1">
                  {mConfig.stops[i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === Map layer === */}
      <Source id="districts" type="geojson" data={geojson}>
        <Layer id="district-fill" type="fill" paint={choroplethPaint} />
        <Layer id="district-outline" type="line" paint={{ "line-color": "#ffffff", "line-width": 2.5 }} />
      </Source>

      {/* === District info card === */}
      {loadingDistrict && (
        <div className="
          fixed bottom-0 right-0 w-full sm:w-80 sm:bottom-4 sm:right-4
          bg-white/95 rounded-t-xl sm:rounded-xl shadow-xl border p-5 z-20
          flex items-center justify-center h-32
        ">
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm">Yükleniyor...</p>
          </div>
        </div>
      )}

      {!loadingDistrict && districtData && (
        <div
          className="
            absolute bottom-0 right-0 w-full max-h-[60%] overflow-y-auto
            sm:w-80 sm:bottom-4 sm:right-4 sm:max-h-none sm:overflow-visible
            bg-white/95 rounded-t-xl sm:rounded-xl
            shadow-xl border p-5 z-20
          "
        >
          {/* Başlık */}
          <div className="flex items-center justify-between mb-3 border-b pb-2">
            <h3 className="text-lg font-bold text-gray-900">
              {districtData.district_name} | 2024 Yılı
            </h3>
            <button
              onClick={() => setDistrictData(null)}
              className="text-gray-400 hover:text-gray-700 font-bold text-lg cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Ana metrikler */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700 mb-3">
            <div>
              <p className="text-gray-500">Nüfus</p>
              <p className="font-semibold">{districtData.population?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Ortalama Kira</p>
              <p className="font-semibold">₺{districtData.avg_rent?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Konut Fiyatı</p>
              <p className="font-semibold">₺{districtData.avg_price_m2?.toLocaleString()}/m²</p>
            </div>
            <div>
              <p className="text-gray-500">Yeşil Alan</p>
              <p className="font-semibold">{districtData.green_per_capita_m2} m²/kişi</p>
            </div>
          </div>

          {/* Sıralamalar */}
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-semibold text-gray-600">Sıralamalar</p>
              <InfoHelper />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="px-2 py-1 rounded-lg bg-green-100 text-green-800 font-medium">
                Yeşil Alan & Yaya: {districtData.rank_environment}
              </span>
              <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-800 font-medium">
                Ulaşım & Erişim: {districtData.rank_mobility}
              </span>
              <span className="px-2 py-1 rounded-lg bg-purple-100 text-purple-800 font-medium">
                Konut Uygunluğu: {districtData.rank_housing}
              </span>
              <span className="px-2 py-1 rounded-lg bg-orange-100 text-orange-800 font-medium">
                Genel Yaşam: {districtData.rank_overall}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
