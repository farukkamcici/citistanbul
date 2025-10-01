# Istanbul 360 — Frontend

Interactive web UI for Istanbul 360, showing transportation, infrastructure, housing, and cultural data on a map. Built with Next.js (App Router), MapLibre GL, Tailwind CSS, and Radix-based UI primitives.

## Tech Stack

- Next.js 15 (App Router) + React 19
- MapLibre GL via `react-map-gl/maplibre`
- Tailwind CSS v4 + design tokens in `app/globals.css`
- Radix primitives wrapped as shadcn-style components (`components/ui/*`)
- Vercel Analytics

## Prerequisites

- Node.js 18+ (recommended) and npm

## Environment Variables

Create a `.env.local` (or use the provided `.env.development`) with:

```
NEXT_PUBLIC_API_URL=<backend_base_url>
NEXT_PUBLIC_MAPTILER_KEY=<maptiler_api_key>
```

Examples (see `.env.development`):

```
NEXT_PUBLIC_API_URL=https://istanbul360.vercel.app/api
NEXT_PUBLIC_MAPTILER_KEY=YOUR_KEY
```

Notes:

- The map style is loaded from MapTiler using `NEXT_PUBLIC_MAPTILER_KEY`.
- API calls go to `NEXT_PUBLIC_API_URL` for search, metrics, districts, POIs, etc.
- On Vercel, `vercel.json` provides an `/api` rewrite if desired.

## Install & Run

```bash
cd frontend
npm install
npm run dev
```

Other scripts:

- `npm run build` — production build
- `npm start` — start production server
- `npm run lint` — run ESLint

Open http://localhost:3000 to view the app.

## Project Structure

```
frontend/
├─ app/
│  ├─ layout.tsx        # Root layout: fonts, global styles, Vercel Analytics
│  ├─ page.tsx          # Entry page rendering <BaseMap />
│  └─ globals.css       # Tailwind setup, theme tokens, shared UI patterns
├─ components/
│  ├─ BaseMap.tsx               # Main map container and UI shell
│  ├─ DistrictLayer.tsx         # District choropleth and metric selector
│  ├─ PoiLayer.tsx              # Generic POI layer (by type) with clustering
│  ├─ SelectedPoiLayer.tsx      # Single selected POI highlight + popup
│  ├─ UserLocationLayer.tsx     # User geolocation marker + helper controls
│  ├─ GreenAreasLayer.tsx       # Dynamic green areas layer (by map bbox)
│  ├─ SearchBar.tsx             # Search & Assistant bar (districts/POIs/RAG)
│  ├─ NearbyPanel.tsx           # “Yakınımda” grouped POIs around user
│  └─ ui/                       # Radix-based UI components (sheet, dialog...)
│     ├─ button.tsx
│     ├─ card.tsx
│     ├─ collapsible.tsx
│     ├─ dialog.tsx
│     └─ sheet.tsx
├─ lib/
│  └─ utils.ts          # `cn()` helper for className merging
├─ public/              # Static assets (icons, images)
├─ package.json         # Dependencies and scripts
├─ next.config.ts       # Next config
├─ tsconfig.json        # TS config (paths alias `@/*`)
└─ vercel.json          # Optional API rewrites for hosting
```

## Core Components and How They Work

### app/layout.tsx
- Imports global CSS and Vercel Analytics.
- Sets project metadata and fonts.

### app/page.tsx
- Renders `BaseMap` as the main UI.

### components/BaseMap.tsx
- The top-level map container using `react-map-gl/maplibre` with MapLibre GL.
- Holds key UI state:
  - `activeTypes`: enabled POI types (persisted in `localStorage`).
  - `mapRef`: reference to the map instance for child interactions.
  - `selectedPoi` / `selectedPoiId`: currently selected POI (for highlight and popup).
  - `userLocation`: updated by `UserLocationLayer`.
- Composes the map layers and UI:
  - `DistrictLayer` for choropleth by metrics.
  - `PoiLayer` for each active POI type in `activeTypes`.
  - `UserLocationLayer` to track and show the user’s location.
  - `SelectedPoiLayer` to highlight a single selected POI independently of clusters.
  - `SearchBar` for locating districts/POIs and querying the assistant.
  - `NearbyPanel` to list nearby POIs by category, driven by `userLocation`.
- Layer selector:
  - Mobile: `Sheet` bottom drawer with category toggles.
  - Desktop: `Collapsible` side panel with category and item toggles.

Tips:
- Add or remove categories in `POI_CATEGORIES` inside `BaseMap.tsx`.
- The map style uses MapTiler via `NEXT_PUBLIC_MAPTILER_KEY`.

### components/DistrictLayer.tsx
- Fetches districts (`GET /districts`) and district metrics (`GET /metrics`).
- Joins district polygons with metric values and renders a choropleth fill.
- Metric selector:
  - Mobile: `Sheet` bottom drawer.
  - Desktop: `Collapsible` panel.
- Click interaction: clicking a district triggers a targeted metrics fetch and updates panel data.
- Choropleth driven by a configurable metric list (`METRICS`) with stops and colors.

How it’s used:
- Mounted inside `BaseMap` so it has access to the live map via `useMap()`.

### components/PoiLayer.tsx
- Displays POIs for a given `poiType` prop.
- Fetches data from `GET /poi?poi_type={type}&bbox={minx,miny,maxx,maxy}` whenever the map’s viewport changes (`moveend`).
- Uses MapLibre GL clustering for performance at low zooms.
- Draws unclustered POIs as styled circles; colors are defined in `POI_COLORS`.
- Highlights a POI when its id matches `selectedPoiId`.
- Click on an unclustered point shows a richly styled popup with name, district, subtype, address, and a Google Maps directions link.

How to add a new POI type:
1) Add a label and color in `POI_LABELS` and `POI_COLORS`.
2) Add the type to `POI_CATEGORIES` in `BaseMap.tsx` for toggling.
3) Ensure backend supports the new `poi_type` in `GET /poi`.

### components/SelectedPoiLayer.tsx
- Renders a single highlighted POI with a prominent circle and popup.
- Accepts a `poi` object with coordinates and metadata.
- Cleans up layer, source, and popup on prop change/unmount; calls `onClear` on popup close.

### components/UserLocationLayer.tsx
- Requests geolocation permission and marks the user’s current location.
- Emits location updates to the parent via `onLocationUpdate`.
- Provides a “go to my location” helper that recenters the map.

### components/GreenAreasLayer.tsx
- Dynamically fetches green areas within the current map `bbox` (`GET /green_areas`) on load and `moveend`.
- Renders semi-transparent fill + outline layers.

### components/SearchBar.tsx
- Two modes: standard search and assistant mode (RAG).
- Standard search:
  - Debounced queries to `GET /search?q=...&size=15`.
  - Results prioritize districts first, then POIs.
  - Selecting a district fits its bbox; selecting a POI flies to it and calls `onSelectPoi` in `BaseMap`.
- Assistant mode:
  - Sends questions to `POST /rag/query` and displays answers with sources.

### components/NearbyPanel.tsx
- Toggleable panel (mobile bottom sheet / side panel) showing nearby POIs grouped by category.
- Fetches from `GET /poi/nearby?lon={}&lat={}&r={radius}` when open and `userLocation` is known.
- Selecting a POI calls `onSelectPoi` to highlight and center it on the map.

### components/ui/* (Radix wrappers)
- `sheet.tsx`: responsive panels (used for mobile layer selector and Nearby panel).
- `collapsible.tsx`: collapsible sections (used for desktop panels).
- `dialog.tsx`: modal dialog wrapper (available if needed later).
- `button.tsx`, `card.tsx`: styled primitives used across UI.

## Styling & Theming

- Tailwind v4 configured via `app/globals.css` using CSS design tokens and `@theme`.
- MapLibre GL CSS is imported globally.
- Shared patterns for cards, buttons, and popups defined in `globals.css`.

## API Endpoints Used

- `GET /search?q=&size=` — full-text search returning districts and POIs.
- `POST /rag/query` — assistant Q&A endpoint.
- `GET /districts` — district polygons (GeoJSON FeatureCollection).
- `GET /metrics` — district metric values (optionally filtered by `?district=`).
- `GET /poi?poi_type=&bbox=` — POIs for current viewport and type.
- `GET /poi/nearby?lon=&lat=&r=` — nearby POIs around user.
- `GET /green_areas?bbox=` — green areas within viewport.

All are requested from `NEXT_PUBLIC_API_URL`.

## Extending the Frontend

- Add a new metric layer: extend `METRICS` in `DistrictLayer.tsx` (key, label, stops, colors) and ensure backend provides corresponding values in `/metrics`.
- Add a new POI type: update `POI_LABELS`/`POI_COLORS` in `PoiLayer.tsx` and `POI_CATEGORIES` in `BaseMap.tsx`; ensure backend supports it in `/poi` and `/poi/nearby`.
- Add a new map overlay: create a component similar to `GreenAreasLayer` that fetches data by `bbox` and adds sources/layers to the map.

## Deployment

- Build: `npm run build` then `npm start`.
- Vercel: add env vars and deploy. `vercel.json` can proxy `/api/*` to a backend if desired.

## Notes

- The app stores layer selections in `localStorage` (key: `activeTypes`).
- Component communication leverages React props and `useMap()` from `react-map-gl` to reach the MapLibre instance.
