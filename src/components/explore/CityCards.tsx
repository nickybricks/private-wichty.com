import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { POPULAR_CITIES } from "@/data/cities";

export function CityCards() {
  const navigate = useNavigate();
  const { t } = useTranslation("explore");

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground px-1">
        {t("cities")}
      </h3>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-4">
          {POPULAR_CITIES.map((city) => (
            <button
              key={city.id}
              onClick={() => navigate(`/explore/city/${encodeURIComponent(city.name)}`)}
              className="group flex-shrink-0 w-28 h-28 relative rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              <img
                src={city.image}
                alt={city.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <span className="absolute bottom-2 left-2 right-2 text-white text-sm font-semibold truncate">
                {city.name}
              </span>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
