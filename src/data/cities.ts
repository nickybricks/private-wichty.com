export const POPULAR_CITIES = [
  {
    id: "berlin",
    name: "Berlin",
    country: "Deutschland",
    image: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400&h=400&fit=crop",
  },
  {
    id: "muenchen",
    name: "München",
    country: "Deutschland",
    image: "https://images.unsplash.com/photo-1595867818082-083862f3d630?w=400&h=400&fit=crop",
  },
  {
    id: "hamburg",
    name: "Hamburg",
    country: "Deutschland",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
  },
  {
    id: "koeln",
    name: "Köln",
    country: "Deutschland",
    image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop",
  },
  {
    id: "frankfurt",
    name: "Frankfurt",
    country: "Deutschland",
    image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&h=400&fit=crop",
  },
  {
    id: "duesseldorf",
    name: "Düsseldorf",
    country: "Deutschland",
    image: "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=400&h=400&fit=crop",
  },
  {
    id: "stuttgart",
    name: "Stuttgart",
    country: "Deutschland",
    image: "https://images.unsplash.com/photo-1551522355-5c4f29207fc0?w=400&h=400&fit=crop",
  },
  {
    id: "leipzig",
    name: "Leipzig",
    country: "Deutschland",
    image: "https://images.unsplash.com/photo-1599669454699-248893623440?w=400&h=400&fit=crop",
  },
] as const;

export type CityId = typeof POPULAR_CITIES[number]["id"];

export const getCityByName = (name: string) => {
  return POPULAR_CITIES.find(
    c => c.name.toLowerCase() === name.toLowerCase()
  );
};

export const DEFAULT_CITY = "Berlin";
