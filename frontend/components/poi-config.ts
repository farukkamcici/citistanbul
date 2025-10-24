export const POI_LABELS: Record<string, string> = {
  bike_parking: "Bisiklet Park Alanı",
  bus_stop: "Otobüs Durağı",
  ev_charger: "Elektrikli Araç Şarjı",
  health: "Sağlık Tesisi",
  kiosk: "Büfe",
  metro_station: "Metro İstasyonu",
  micro_mobility_parking: "Mikro Mobilite Park Alanı",
  museum: "Müze",
  theater: "Tiyatro",
  toilet: "Tuvalet",
  tram_station: "Tramvay İstasyonu",
};

export const POI_COLORS: Record<string, string> = {
  bike_parking: "#facc15",
  bus_stop: "#1d4ed8",
  ev_charger: "#22c55e",
  health: "#ef4444",
  kiosk: "#94a3b8",
  metro_station: "#16a34a",
  micro_mobility_parking: "#fb923c",
  museum: "#0ea5e9",
  theater: "#ec4899",
  toilet: "#a855f7",
  tram_station: "#14b8a6",
};

const CATEGORY_KEYS: Record<string, string[]> = {
  "Ulaşım": ["bus_stop", "metro_station", "tram_station"],
  "Altyapı": [
    "ev_charger",
    "toilet",
    "bike_parking",
    "micro_mobility_parking",
  ],
  "Kültür & Ticaret": ["museum", "theater", "kiosk"],
  "Sağlık": ["health"],
};

export const POI_CATEGORIES: Record<string, { key: string; label: string }[]> =
  Object.fromEntries(
    Object.entries(CATEGORY_KEYS).map(([category, keys]) => [
      category,
      keys.map((key) => ({ key, label: POI_LABELS[key] ?? key })),
    ])
  );
