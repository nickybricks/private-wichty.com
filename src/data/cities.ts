import { supabase } from "@/integrations/supabase/client";

export interface City {
  id: string;
  name: string;
  country: string;
  image_url: string | null;
}

// Fallback cities for when DB is not available
export const FALLBACK_CITIES: City[] = [
  { id: "berlin", name: "Berlin", country: "Deutschland", image_url: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400&h=400&fit=crop" },
  { id: "muenchen", name: "München", country: "Deutschland", image_url: "https://images.unsplash.com/photo-1595867818082-083862f3d630?w=400&h=400&fit=crop" },
  { id: "hamburg", name: "Hamburg", country: "Deutschland", image_url: "https://images.unsplash.com/photo-1518176258769-f227c798150e?w=400&h=400&fit=crop" },
  { id: "koeln", name: "Köln", country: "Deutschland", image_url: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop" },
  { id: "frankfurt", name: "Frankfurt", country: "Deutschland", image_url: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&h=400&fit=crop" },
  { id: "duesseldorf", name: "Düsseldorf", country: "Deutschland", image_url: "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=400&h=400&fit=crop" },
  { id: "stuttgart", name: "Stuttgart", country: "Deutschland", image_url: "https://images.unsplash.com/photo-1551522355-5c4f29207fc0?w=400&h=400&fit=crop" },
  { id: "leipzig", name: "Leipzig", country: "Deutschland", image_url: "https://images.unsplash.com/photo-1599669454699-248893623440?w=400&h=400&fit=crop" },
];

// For backwards compatibility
export const POPULAR_CITIES = FALLBACK_CITIES.map(c => ({
  id: c.id,
  name: c.name,
  country: c.country,
  image: c.image_url || "",
}));

export type CityId = typeof FALLBACK_CITIES[number]["id"];

export const getCityByName = (name: string) => {
  return FALLBACK_CITIES.find(
    c => c.name.toLowerCase() === name.toLowerCase()
  );
};

export const DEFAULT_CITY = "Berlin";

// Fetch cities from database
export async function fetchCities(): Promise<City[]> {
  const { data, error } = await supabase
    .from("cities")
    .select("id, name, country, image_url")
    .order("name");

  if (error) {
    console.error("Error fetching cities:", error);
    return FALLBACK_CITIES;
  }

  return data || FALLBACK_CITIES;
}
