export type TravelMode = "walk" | "bike" | "car";

export const TRAVEL_MODES: { key: TravelMode; label: string; icon: string }[] = [
  { key: "walk", label: "Yürü", icon: "🚶" },
  { key: "bike", label: "Bisiklet", icon: "🚲" },
  { key: "car", label: "Araç", icon: "🚗" },
];

export function formatDistance(distance: number | null | undefined) {
  if (!Number.isFinite(distance ?? NaN)) return null;
  const value = distance as number;
  return value >= 1000 ? `${(value / 1000).toFixed(1)} km` : `${Math.round(value)} m`;
}

export function formatDuration(duration: number | null | undefined) {
  if (!Number.isFinite(duration ?? NaN)) return null;
  const minutes = Math.round((duration as number) / 60);
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours} sa ${mins} dk` : `${hours} sa`;
}
