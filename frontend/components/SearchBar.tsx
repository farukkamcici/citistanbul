"use client";

import { useState, useEffect, useRef } from "react";
import type { Map } from "maplibre-gl";

interface SearchResult {
  type: "district" | "poi";
  district_id?: string;
  district_name?: string;
  poi_id?: string;
  name?: string;
  poi_type?: string;
  poi_type_label?: string;
  subtype?: string | null;
  address_text?: string | null;
  lon?: number;
  lat?: number;
  bbox?: [number, number, number, number];
}

export interface SelectedPoi {
  id: string;
  lon: number;
  lat: number;
  type: string;
  name?: string;
  district_name?: string;
  address_text?: string | null;
  poi_type_label?: string;
  subtype?: string | null;
}

export default function SearchBar({
  map,
  onSelectPoi,
}: {
  map: Map | null;
  onSelectPoi?: (poi: SelectedPoi | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const containerRef = useRef<HTMLDivElement>(null);

  // dışa tıklama → sonuçları kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setResults([]);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // debounce arama
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const handler = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${API_URL}/search?q=${encodeURIComponent(query)}&size=15`
        );
        const json = await res.json();
        setResults(json.data.results || []);
      } catch (e) {
        console.error("Search error:", e);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [query, API_URL]);

  const handleCancel = () => {
    setQuery("");
    setResults([]);
    setHighlightIndex(-1);
    onSelectPoi?.(null);
  };

  // ✅ district sonuçlarını üste al
  const sortedResults = [...results].sort((a, b) => {
    if (a.type === "district" && b.type !== "district") return -1;
    if (a.type !== "district" && b.type === "district") return 1;
    return 0;
  });

  // ✅ bir sonucu çalıştır
  const handleSelect = (r: SearchResult) => {
    if (!map) return;
    if (r.type === "district" && r.bbox) {
      map.fitBounds(
        [
          [r.bbox[0], r.bbox[1]],
          [r.bbox[2], r.bbox[3]],
        ],
        { padding: 40, duration: 1000 }
      );
    } else if (r.type === "poi" && r.lon && r.lat && r.poi_id) {
      map.flyTo({
        center: [r.lon, r.lat],
        zoom: 16,
        speed: 1.2,
      });
      onSelectPoi?.({
        id: r.poi_id,
        lon: r.lon,
        lat: r.lat,
        type: r.poi_type || "",
        name: r.name,
        district_name: r.district_name,
        address_text: r.address_text,
        poi_type_label: r.poi_type_label,
        subtype: r.subtype,
      });
    }
    setResults([]);
    setHighlightIndex(-1);
  };

  // ✅ klavye olayları
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!sortedResults.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < sortedResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : sortedResults.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < sortedResults.length) {
        handleSelect(sortedResults[highlightIndex]);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute top-4 left-1/2 -translate-x-1/2
                 w-[240px] sm:w-[360px]
                 bg-white/95 backdrop-blur-md
                 shadow-lg rounded-xl border border-gray-200 z-30"
    >
      <div className="flex items-center px-4 py-2">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlightIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder="İlçe veya mekan ara..."
          className="flex-1 bg-transparent focus:outline-none text-sm text-gray-800"
        />
        {query && (
          <button
            onClick={handleCancel}
            className="ml-2 text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className="border-t border-gray-100 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
          {loading && (
            <p className="px-4 py-2 text-sm text-gray-400">Aranıyor...</p>
          )}
          {!loading &&
            sortedResults.map((r, i) => (
              <div
                key={i}
                className={`px-4 py-2 text-sm cursor-pointer flex flex-col border-b border-gray-50 ${
                  i === highlightIndex ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
                onClick={() => handleSelect(r)}
              >
                {r.type === "district" ? (
                  <span className="font-semibold text-blue-600">
                    {r.district_name}
                  </span>
                ) : (
                  <>
                    <span className="font-medium text-gray-800">{r.name}</span>
                    <span className="text-xs text-gray-500">
                      {r.district_name} • {r.poi_type_label || r.poi_type}
                    </span>
                  </>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
