import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { EventFieldPopup } from "./EventFieldPopup";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateTimePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | undefined;
  startTime: string;
  endTime: string;
  onConfirm: (date: Date | undefined, startTime: string, endTime: string) => void;
}

export function DateTimePopup({
  open,
  onOpenChange,
  date: initialDate,
  startTime: initialStartTime,
  endTime: initialEndTime,
  onConfirm,
}: DateTimePopupProps) {
  const { t, i18n } = useTranslation("forms");
  const locale = i18n.language === "de" ? de : enUS;

  const [date, setDate] = useState<Date | undefined>(initialDate);
  const [startTime, setStartTime] = useState(initialStartTime || "19:00");
  const [endTime, setEndTime] = useState(initialEndTime || "22:00");

  useEffect(() => {
    if (open) {
      setDate(initialDate);
      setStartTime(initialStartTime || "19:00");
      setEndTime(initialEndTime || "22:00");
    }
  }, [open, initialDate, initialStartTime, initialEndTime]);

  const handleConfirm = () => {
    onConfirm(date, startTime, endTime);
    onOpenChange(false);
  };

  return (
    <EventFieldPopup
      open={open}
      onOpenChange={onOpenChange}
      title={t("eventForm.dateTime", "Date & Time")}
      icon={<CalendarIcon className="h-5 w-5 text-primary" />}
      className="sm:max-w-sm"
    >
      <div className="space-y-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          locale={locale}
          className="rounded-lg border border-border/50 p-3"
          classNames={{
            day_selected: "bg-primary text-primary-foreground hover:bg-primary/90",
          }}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {t("eventForm.startTime", "Start")}
            </Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {t("eventForm.endTime", "End")}
            </Label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="h-10"
            />
          </div>
        </div>

        <Button onClick={handleConfirm} className="w-full">
          {t("eventForm.confirm", "Confirm")}
        </Button>
      </div>
    </EventFieldPopup>
  );
}

export function formatDateTime(
  date: Date | undefined,
  startTime: string,
  endTime: string,
  locale: "de" | "en" = "de"
): string {
  if (!date) return "";
  
  const dateLocale = locale === "de" ? de : enUS;
  const formattedDate = format(date, "EEEE, d. MMMM", { locale: dateLocale });
  
  if (startTime && endTime) {
    return `${formattedDate} • ${startTime} — ${endTime}`;
  }
  if (startTime) {
    return `${formattedDate} • ${startTime}`;
  }
  return formattedDate;
}
