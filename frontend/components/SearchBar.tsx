"use client";

import { useState, useEffect, useRef } from "react";
import type { Map } from "maplibre-gl";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Loader2, SendHorizontal, X } from "lucide-react";

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

interface RagResponse {
  question: string;
  answer: string;
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
  const [assistantMode, setAssistantMode] = useState(false);
  const [chat, setChat] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const containerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // search debounce
  useEffect(() => {
    if (!query.trim() || assistantMode) {
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
        setResults(json.data?.results || []);
      } catch (e) {
        console.error("Search error:", e);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [query, API_URL, assistantMode]);

  const handleCancel = () => {
    setQuery("");
    setResults([]);
    setHighlightIndex(-1);
    onSelectPoi?.(null);
  };

  const sortedResults = [...results].sort((a, b) => {
    if (a.type === "district" && b.type !== "district") return -1;
    if (a.type !== "district" && b.type === "district") return 1;
    return 0;
  });

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

  // asistan query gönder
  const handleAssistantQuery = async () => {
    if (!query.trim()) return;
    const userMsg = query;
    setChat((prev) => [...prev, { role: "user", content: userMsg }]);
    setQuery("");
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/rag/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg }),
      });
      const json: RagResponse = await res.json();
      setChat((prev) => [
        ...prev,
        { role: "assistant", content: json.answer },
      ]);
    } catch (e) {
      console.error("RAG error:", e);
      setChat((prev) => [
        ...prev,
        { role: "assistant", content: "Üzgünüm, bir hata oluştu." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (assistantMode) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAssistantQuery();
      }
      return;
    }
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

  const AssistantAvatar = () => (
    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white text-sm border-2 border-white ring-2 ring-purple-950"></div>
  );

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 w-full px-2 sm:px-0 pointer-events-none">
      {/* mobilde bağımsız AI toggle */}
      <div className="absolute top-12 left-3 z-40 sm:hidden pointer-events-auto">
        <button
          onClick={() => setAssistantMode(!assistantMode)}
          className={`w-10 h-10 flex items-center justify-center rounded-full shadow-md transition 
            ${assistantMode ? "bg-blue-600 text-white border-2 border-white" : "bg-gray-200 text-gray-700 border-2 border-gray-500"}`}
        >
          AI
        </button>
      </div>

      {/* üst satır: toggle (desktop) + bar */}
      <div className="flex items-center gap-3 w-full max-w-[70%] sm:max-w-[575px] pointer-events-auto">
        <div
          className="flex items-center h-10 sm:h-12 flex-1
                     bg-white/95 backdrop-blur-md
                     shadow-lg rounded-xl border border-gray-200 overflow-hidden"
        >
          {/* sadece desktop toggle */}
          <div className="hidden sm:flex items-center gap-2 px-3 h-full bg-blue-100 border-r border-gray-200 min-w-[120px]">
            <span className="text-sm font-medium text-gray-700">
              asIstan
            </span>
            <Switch
              checked={assistantMode}
              onCheckedChange={setAssistantMode}
              className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-blue-300 cursor-pointer"
            />
          </div>

          {/* input */}
          <div className="flex items-center flex-1 px-3 gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                assistantMode ? "asIstan'a soru sor..." : "İlçe veya mekan ara..."
              }
              className="flex-1 bg-transparent focus:outline-none text-sm text-gray-800"
            />

            {/* butonlar */}
            {assistantMode ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleAssistantQuery}
                  className="p-2 rounded-lg bg-blue-600 text-white cursor-pointer"
                >
                  <SendHorizontal size={16} />
                </button>
                <button
                  onClick={() => setAssistantMode(false)}
                  className="p-2 rounded-lg bg-gray-200 text-gray-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              query && (
                <button
                  onClick={handleCancel}
                  className="p-2 rounded-lg bg-gray-200 text-gray-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* normal search sonuç listesi */}
      {!assistantMode && results.length > 0 && (
        <div className="bg-white/95 backdrop-blur-md shadow-lg rounded-xl border border-gray-200 w-full max-w-[75%] sm:max-w-[575px] max-h-60 overflow-y-auto pointer-events-auto">
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

      {/* assistant chat panel */}
      {assistantMode && (
        <div className="bg-white/95 backdrop-blur-md shadow-lg rounded-xl border border-gray-200 w-full max-w-[70%] sm:max-w-[575px] max-h-96 overflow-y-auto p-3 space-y-3 text-sm pointer-events-auto">
          {chat.length === 0 && !loading && (
            <div className="flex items-center justify-center h-full text-gray-700 text-sm italic gap-2">
              <Loader2 size={18} className="animate-spin text-blue-500" />
              <span>asIstan’a soru sorabilirsin...</span>
            </div>
          )}
          <AnimatePresence initial={false}>
            {chat.map((m, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: "spring", stiffness: 240, damping: 22 }}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex gap-2 ${
                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                  } max-w-[85%] sm:max-w-[60%]`}
                >
                  {m.role === "assistant" && (
                    <div className="flex-shrink-0">
                      <AssistantAvatar />
                    </div>
                  )}
                  <div
                    className={`px-3 py-2 rounded-2xl shadow-sm whitespace-pre-wrap break-words leading-relaxed ${
                      m.role === "user"
                        ? "bg-blue-100 text-gray-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={chatEndRef} />
          {loading && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <AssistantAvatar />
              Düşünüyorum...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
