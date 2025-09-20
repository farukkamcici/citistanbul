"use client";

import { useEffect, useState } from "react";
import { useMap } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";

interface PoiLayerProps {
  poiType: string;
}

// POI tiplerini Türkçe etiketlere map et
const POI_LABELS: Record<string, string> = {
  bike_parking: "Bisiklet Parkı",
  bus_stop: "Otobüs Durağı",
  ev_charger: "Elektrikli Araç Şarj",
  health: "Sağlık Tesisi",
  kiosk: "Büfe",
  metro_station: "Metro İstasyonu",
  micro_mobility_parking: "Mikro Mobilite Parkı",
  museum: "Müze",
  theater: "Tiyatro",
  toilet: "Tuvalet",
  tram_station: "Tramvay İstasyonu",
};

// POI tipine göre renk paleti
const POI_COLORS: Record<string, string> = {
  bike_parking: "#facc15", // sarı
  bus_stop: "#1d4ed8", // mavi
  ev_charger: "#22c55e", // yeşil
  health: "#ef4444", // kırmızı
  kiosk: "#94a3b8", // gri
  metro_station: "#16a34a", // koyu yeşil
  micro_mobility_parking: "#fb923c", // turuncu
  museum: "#0ea5e9", // açık mavi
  theater: "#ec4899", // pembe
  toilet: "#a855f7", // mor
  tram_station: "#14b8a6", // teal
};

export default function PoiLayer({ poiType }: PoiLayerProps) {
  const { current: mapRef } = useMap();
  const map = mapRef?.getMap();
  const [poiData, setPoiData] = useState<any>(null);

  // 1. API’den veri çek
  useEffect(() => {
    if (!poiType) return;
    fetch(`http://207.154.235.183:8000/poi?poi_type=${poiType}`)
      .then((res) => res.json())
      .then((json) => setPoiData(json.data));
  }, [poiType]);

  // 2. Source + layer ekle
  useEffect(() => {
    if (!map || !poiData) return;

    const sourceId = `pois-${poiType}`;
    const unclusteredId = `${sourceId}-unclustered`;

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as any).setData(poiData);
      return;
    }

    map.addSource(sourceId, {
      type: "geojson",
      data: poiData,
      cluster: true,
      clusterMaxZoom: 12,
      clusterRadius: 50,
    });

    // Cluster daireleri
    map.addLayer({
      id: `${sourceId}-clusters`,
      type: "circle",
      source: sourceId,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#11b4da",
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["get", "point_count"],
          1, 15,
          100, 40,
        ],
        "circle-opacity": 0.6,
      },
    });

    // Cluster üzerindeki sayı
    map.addLayer({
        id: `${sourceId}-cluster-count`,
        type: "symbol",
        source: sourceId,
        filter: ["has", "point_count"],
        layout: {
        "text-field": "{point_count_abbreviated}",
        "text-font": ["Open Sans Bold"],
        "text-size": 12,
        },
    });

    // Tekil POI noktaları (type bazlı renk)
    map.addLayer({
      id: unclusteredId,
      type: "circle",
      source: sourceId,
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": POI_COLORS[poiType] || "#888",
        "circle-radius": 9,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff",
      },
    });

    // 3. Popup event
    const onClick = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [unclusteredId],
      });
      if (!features.length) return;

      const f = features[0];
      const coords = (f.geometry as any).coordinates;
      const props = f.properties as any;

      const typeLabel = POI_LABELS[props.poi_type] || props.poi_type;
      const subtypeText =
        props.poi_type === "bus_stop" && props.subtype
          ? `Gidiş yönü: ${props.subtype}`
          : props.subtype || "";

      new maplibregl.Popup({ closeButton: false })
        .setLngLat(coords)
        .setHTML(`
          <div>
            <h3 class="poi-title">${props.name || "Unnamed"}</h3>
            <p class="poi-district">${props.district_name || ""}</p>
            <div class="poi-badges">
              <span class="poi-badge">${typeLabel}</span>
              ${subtypeText ? `<span class="poi-subtype">${subtypeText}</span>` : ""}
            </div>
            ${props.address ? `<p class="poi-address">${props.address}</p>` : ""}
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}" 
              target="_blank" 
              class="poi-directions"
            >
              Git
            </a>
          </div>
        `)
        .addTo(map);
    };

    map.on("click", onClick);

    return () => {
      map.off("click", onClick);
      if (map.getLayer(`${sourceId}-clusters`)) map.removeLayer(`${sourceId}-clusters`);
      if (map.getLayer(`${sourceId}-cluster-count`)) map.removeLayer(`${sourceId}-cluster-count`);
      if (map.getLayer(unclusteredId)) map.removeLayer(unclusteredId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, poiData, poiType]);

  return null;
}
