import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { POPULAR_CITIES } from "@/data/cities";
import { MapPin } from "lucide-react";

interface CitySelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCitySelect: (city: string) => void;
  currentCity: string;
}

export function CitySelector({ open, onOpenChange, onCitySelect, currentCity }: CitySelectorProps) {
  const { t } = useTranslation("explore");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("selectCity")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 py-4">
          {POPULAR_CITIES.map((city) => (
            <button
              key={city.id}
              onClick={() => {
                onCitySelect(city.name);
                onOpenChange(false);
              }}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                currentCity === city.name
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">{city.name}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
