export const EVENT_TAGS = [
  { id: "hockey", label: { de: "Hockey", en: "Hockey" }, color: "bg-blue-500" },
  { id: "fussball", label: { de: "Fußball", en: "Football" }, color: "bg-green-500" },
  { id: "padel", label: { de: "Padel", en: "Padel" }, color: "bg-emerald-500" },
  { id: "volleyball", label: { de: "Volleyball", en: "Volleyball" }, color: "bg-yellow-500" },
  { id: "basketball", label: { de: "Basketball", en: "Basketball" }, color: "bg-orange-500" },
  { id: "tennis", label: { de: "Tennis", en: "Tennis" }, color: "bg-lime-500" },
  { id: "schwimmen", label: { de: "Schwimmen", en: "Swimming" }, color: "bg-cyan-500" },
  { id: "laufen", label: { de: "Laufen", en: "Running" }, color: "bg-red-500" },
  { id: "fitness", label: { de: "Fitness", en: "Fitness" }, color: "bg-purple-500" },
  { id: "yoga", label: { de: "Yoga", en: "Yoga" }, color: "bg-pink-500" },
  { id: "tanzen", label: { de: "Tanzen", en: "Dancing" }, color: "bg-fuchsia-500" },
  { id: "musik", label: { de: "Musik", en: "Music" }, color: "bg-violet-500" },
  { id: "kunst", label: { de: "Kunst", en: "Art" }, color: "bg-rose-500" },
  { id: "gaming", label: { de: "Gaming", en: "Gaming" }, color: "bg-indigo-500" },
  { id: "networking", label: { de: "Networking", en: "Networking" }, color: "bg-teal-500" },
  { id: "workshop", label: { de: "Workshop", en: "Workshop" }, color: "bg-amber-500" },
  { id: "party", label: { de: "Party", en: "Party" }, color: "bg-emerald-500" },
  { id: "outdoor", label: { de: "Outdoor", en: "Outdoor" }, color: "bg-sky-500" },
  { id: "wandern", label: { de: "Wandern", en: "Hiking" }, color: "bg-stone-500" },
  { id: "radfahren", label: { de: "Radfahren", en: "Cycling" }, color: "bg-slate-500" },
  { id: "sonstiges", label: { de: "Sonstiges", en: "Other" }, color: "bg-gray-500" },
] as const;

export type EventTagId = typeof EVENT_TAGS[number]["id"];

export const getTagLabel = (tagId: string, language: "de" | "en" = "de"): string => {
  const tag = EVENT_TAGS.find(t => t.id === tagId);
  return tag ? tag.label[language] : tagId;
};

export const getTagColor = (tagId: string): string => {
  const tag = EVENT_TAGS.find(t => t.id === tagId);
  return tag ? tag.color : "bg-gray-500";
};

export const TAG_IDS = EVENT_TAGS.map(t => t.id);
