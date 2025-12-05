import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import { EventFieldPopup } from "./EventFieldPopup";
import { Button } from "@/components/ui/button";
import { LocationInput } from "@/components/LocationInput";

interface LocationPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: string;
  onConfirm: (location: string) => void;
}

export function LocationPopup({
  open,
  onOpenChange,
  location: initialLocation,
  onConfirm,
}: LocationPopupProps) {
  const { t } = useTranslation("forms");
  const [location, setLocation] = useState(initialLocation);

  useEffect(() => {
    if (open) {
      setLocation(initialLocation);
    }
  }, [open, initialLocation]);

  const handleConfirm = () => {
    onConfirm(location);
    onOpenChange(false);
  };

  return (
    <EventFieldPopup
      open={open}
      onOpenChange={onOpenChange}
      title={t("eventForm.location", "Location")}
      icon={<MapPin className="h-5 w-5 text-primary" />}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t("eventForm.locationHint", "Enter an address or online meeting link")}
        </p>
        
        <LocationInput
          value={location}
          onChange={setLocation}
          placeholder={t("eventForm.locationPlaceholder", "Search for a location...")}
        />

        <Button onClick={handleConfirm} className="w-full">
          {t("eventForm.confirm", "Confirm")}
        </Button>
      </div>
    </EventFieldPopup>
  );
}
