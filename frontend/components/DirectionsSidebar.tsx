"use client";

import { X } from "lucide-react";
import type { SelectedPoi } from "@/components/SearchBar";
import {
  TRAVEL_MODES,
  formatDistance,
  formatDuration,
  type TravelMode,
} from "@/components/directions-utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface DirectionsSidebarProps {
  isOpen: boolean;
  poi: SelectedPoi | null;
  activeMode: TravelMode;
  routeSummary: { distance: number; duration: number } | null;
  routeLoading: boolean;
  routeError: string | null;
  hasRoute: boolean;
  onModeChange: (mode: TravelMode) => void;
  onRequestRoute: (mode: TravelMode) => void;
  onClearRoute: () => void;
  onClose: () => void;
}

type DirectionsContentProps = Omit<DirectionsSidebarProps, "isOpen"> & {
  layout: "desktop" | "mobile";
  showHeader?: boolean;
};

function DirectionsContent({
  poi,
  activeMode,
  routeSummary,
  routeLoading,
  routeError,
  hasRoute,
  onModeChange,
  onRequestRoute,
  onClearRoute,
  onClose,
  layout,
  showHeader = true,
}: DirectionsContentProps) {
  if (!poi) {
    return null;
  }

  const distanceText = formatDistance(routeSummary?.distance);
  const durationText = formatDuration(routeSummary?.duration);
  const containerSpacing = layout === "desktop" ? "px-4 py-4" : "px-4 pb-6 pt-4";

  return (
    <div className={`flex flex-col ${layout === "desktop" ? "h-full" : "gap-4"}`}>
      {showHeader ? (
        <div
          className={`flex items-start justify-between ${
            layout === "desktop"
              ? "border-b border-gray-200 px-4 py-3"
              : ""
          }`}
        >
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-gray-900">
              {poi.name || "İsimsiz"}
            </h2>
            {poi.district_name ? (
              <p className="text-xs text-gray-500">{poi.district_name}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex items-center justify-center rounded-md border text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 ${
              layout === "desktop"
                ? "h-8 w-8 border-gray-200 bg-white"
                : "h-9 w-9 border-gray-200 bg-white"
            }`}
            aria-label="Paneli kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className={`space-y-4 ${containerSpacing} ${layout === "desktop" ? "flex-1 overflow-y-auto" : ""}`}>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
            {poi.poi_type_label || poi.type}
          </span>
          {poi.subtype ? (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
              {poi.subtype}
            </span>
          ) : null}
        </div>

        {poi.address_text ? (
          <p className="text-xs text-gray-600">{poi.address_text}</p>
        ) : null}

        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500">Ulaşım modu</p>
          <div className="flex gap-2">
            {TRAVEL_MODES.map((mode) => (
              <button
                key={mode.key}
                type="button"
                onClick={() => onModeChange(mode.key)}
                className={`flex-1 rounded-md border px-2 py-2 text-xs font-medium transition ${
                  activeMode === mode.key
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="mr-1">{mode.icon}</span>
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onRequestRoute(activeMode)}
          disabled={routeLoading}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {routeLoading ? "Rota getiriliyor..." : "Rota Al"}
        </button>

        {routeError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {routeError}
          </p>
        ) : null}

        {!routeError && !routeSummary && routeLoading ? (
          <p className="text-xs text-gray-500">Rota hesaplanıyor...</p>
        ) : null}

        {routeSummary ? (
          <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
            {distanceText ? <p>Mesafe: {distanceText}</p> : null}
            {durationText ? <p>Süre: {durationText}</p> : null}
          </div>
        ) : null}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClearRoute}
            disabled={!hasRoute && !routeSummary && !routeError}
            className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Rotayı temizle
          </button>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lon}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-md border border-blue-200 bg-white px-3 py-2 text-center text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            Google Maps’te aç
          </a>
        </div>
      </div>
    </div>
  );
}

export default function DirectionsSidebar({
  isOpen,
  poi,
  activeMode,
  routeSummary,
  routeLoading,
  routeError,
  hasRoute,
  onModeChange,
  onRequestRoute,
  onClearRoute,
  onClose,
}: DirectionsSidebarProps) {
  if (!isOpen || !poi) {
    return null;
  }

  return (
    <div className="absolute top-0 right-0 z-30 h-full w-full max-w-sm">
      <div className="flex h-full flex-col border-l border-gray-200 bg-white shadow-xl">
        <DirectionsContent
          layout="desktop"
          poi={poi}
          activeMode={activeMode}
          routeSummary={routeSummary}
          routeLoading={routeLoading}
          routeError={routeError}
          hasRoute={hasRoute}
          onModeChange={onModeChange}
          onRequestRoute={onRequestRoute}
          onClearRoute={onClearRoute}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

export function DirectionsSheet({
  isOpen,
  poi,
  activeMode,
  routeSummary,
  routeLoading,
  routeError,
  hasRoute,
  onModeChange,
  onRequestRoute,
  onClearRoute,
  onClose,
}: DirectionsSidebarProps) {
  const open = isOpen && Boolean(poi);

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <SheetContent
        side="bottom"
        className="max-h-[80vh] min-h-[45vh] rounded-t-3xl border-t border-gray-200 bg-white px-0 pb-6"
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-gray-300" />
        <SheetHeader className="px-4 pt-2">
          <SheetTitle className="text-base font-semibold text-gray-900">
            {poi?.name || "Detay"}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-2">
          <DirectionsContent
            layout="mobile"
            showHeader={false}
            poi={poi}
            activeMode={activeMode}
            routeSummary={routeSummary}
            routeLoading={routeLoading}
            routeError={routeError}
            hasRoute={hasRoute}
            onModeChange={onModeChange}
            onRequestRoute={onRequestRoute}
            onClearRoute={onClearRoute}
            onClose={onClose}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
