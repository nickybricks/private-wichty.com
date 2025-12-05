import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Users } from "lucide-react";
import { EventFieldPopup } from "./EventFieldPopup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CapacityPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capacityUnlimited: boolean;
  maxCapacity: string;
  waitlistEnabled: boolean;
  onConfirm: (capacityUnlimited: boolean, maxCapacity: string, waitlistEnabled: boolean) => void;
}

export function CapacityPopup({
  open,
  onOpenChange,
  capacityUnlimited: initialUnlimited,
  maxCapacity: initialMaxCapacity,
  waitlistEnabled: initialWaitlist,
  onConfirm,
}: CapacityPopupProps) {
  const { t, i18n } = useTranslation("forms");
  const [capacityUnlimited, setCapacityUnlimited] = useState(initialUnlimited);
  const [maxCapacity, setMaxCapacity] = useState(initialMaxCapacity);
  const [waitlistEnabled, setWaitlistEnabled] = useState(initialWaitlist);

  useEffect(() => {
    if (open) {
      setCapacityUnlimited(initialUnlimited);
      setMaxCapacity(initialMaxCapacity);
      setWaitlistEnabled(initialWaitlist);
    }
  }, [open, initialUnlimited, initialMaxCapacity, initialWaitlist]);

  const handleConfirm = () => {
    onConfirm(capacityUnlimited, maxCapacity, waitlistEnabled);
    onOpenChange(false);
  };

  return (
    <EventFieldPopup
      open={open}
      onOpenChange={onOpenChange}
      title={t("eventForm.capacity", "Capacity")}
      icon={<Users className="h-5 w-5 text-primary" />}
    >
      <div className="space-y-5">
        {/* Limited Capacity Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="font-medium">
              {i18n.language === "de" ? "Begrenzte Plätze" : "Limited capacity"}
            </Label>
            <p className="text-sm text-muted-foreground">
              {i18n.language === "de"
                ? "Maximale Teilnehmeranzahl festlegen"
                : "Set a maximum number of attendees"}
            </p>
          </div>
          <Switch
            checked={!capacityUnlimited}
            onCheckedChange={(checked) => setCapacityUnlimited(!checked)}
          />
        </div>

        {/* Max Capacity Input */}
        {!capacityUnlimited && (
          <div className="space-y-2">
            <Label>
              {i18n.language === "de" ? "Maximale Teilnehmer" : "Maximum attendees"}
            </Label>
            <Input
              type="number"
              min="1"
              placeholder={i18n.language === "de" ? "z.B. 50" : "e.g. 50"}
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
            />
          </div>
        )}

        {/* Waitlist Toggle */}
        {!capacityUnlimited && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              <Label className="font-medium">
                {i18n.language === "de" ? "Warteliste" : "Waitlist"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {i18n.language === "de"
                  ? "Teilnehmer können sich auf die Warteliste setzen"
                  : "Allow attendees to join a waitlist when full"}
              </p>
            </div>
            <Switch
              checked={waitlistEnabled}
              onCheckedChange={setWaitlistEnabled}
            />
          </div>
        )}

        <Button onClick={handleConfirm} className="w-full">
          {t("eventForm.confirm", "Confirm")}
        </Button>
      </div>
    </EventFieldPopup>
  );
}
