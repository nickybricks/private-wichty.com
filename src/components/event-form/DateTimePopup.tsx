import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { EventFieldPopup } from "./EventFieldPopup";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DateTimePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | undefined;
  startTime: string;
  endTime: string;
  endDate?: Date | undefined;
  onConfirm: (date: Date | undefined, startTime: string, endTime: string, endDate?: Date) => void;
}

type ActivePicker = "none" | "startDate" | "startTime" | "endDate" | "endTime";

// Mobile-friendly time picker component
function TimePicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (time: string) => void;
  className?: string;
}) {
  const [hours, minutes] = value.split(":").map((v) => parseInt(v, 10) || 0);
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);

  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5);

  useEffect(() => {
    // Scroll to selected hour - center the selected item
    if (hoursRef.current) {
      const hourIndex = hours;
      const itemHeight = 44;
      const containerHeight = 220;
      const centerOffset = (containerHeight - itemHeight) / 2;
      hoursRef.current.scrollTop = hourIndex * itemHeight - centerOffset;
    }
    // Scroll to selected minute - center the selected item
    if (minutesRef.current) {
      const minuteIndex = Math.floor(minutes / 5);
      const itemHeight = 44;
      const containerHeight = 220;
      const centerOffset = (containerHeight - itemHeight) / 2;
      minutesRef.current.scrollTop = minuteIndex * itemHeight - centerOffset;
    }
  }, []);

  const handleHourSelect = (hour: number) => {
    onChange(`${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`);
  };

  const handleMinuteSelect = (minute: number) => {
    onChange(`${hours.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`);
  };

  return (
    <div className={cn("flex justify-center gap-4 py-2", className)}>
      {/* Hours */}
      <div
        ref={hoursRef}
        className="h-[220px] w-20 overflow-y-auto scroll-smooth snap-y snap-mandatory hide-scrollbar"
      >
        <div className="py-[88px]">
          {hourOptions.map((hour) => (
            <button
              key={hour}
              onClick={() => handleHourSelect(hour)}
              className={cn(
                "w-full h-11 flex items-center justify-center text-xl font-medium snap-center transition-all",
                hours === hour
                  ? "text-foreground bg-muted rounded-lg"
                  : "text-muted-foreground/50"
              )}
            >
              {hour.toString().padStart(2, "0")}
            </button>
          ))}
        </div>
      </div>

      {/* Minutes */}
      <div
        ref={minutesRef}
        className="h-[220px] w-20 overflow-y-auto scroll-smooth snap-y snap-mandatory hide-scrollbar"
      >
        <div className="py-[88px]">
          {minuteOptions.map((minute) => (
            <button
              key={minute}
              onClick={() => handleMinuteSelect(minute)}
              className={cn(
                "w-full h-11 flex items-center justify-center text-xl font-medium snap-center transition-all",
                minutes === minute
                  ? "text-foreground bg-muted rounded-lg"
                  : "text-muted-foreground/50"
              )}
            >
              {minute.toString().padStart(2, "0")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Date/Time button pill component
function DateTimePill({
  value,
  isActive,
  onClick,
  className,
}: {
  value: string;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium transition-all",
        isActive
          ? "bg-muted text-primary"
          : "bg-muted/60 text-foreground hover:bg-muted",
        className
      )}
    >
      {value}
    </button>
  );
}

export function DateTimePopup({
  open,
  onOpenChange,
  date: initialDate,
  startTime: initialStartTime,
  endTime: initialEndTime,
  endDate: initialEndDate,
  onConfirm,
}: DateTimePopupProps) {
  const { t, i18n } = useTranslation("forms");
  const locale = i18n.language === "de" ? de : enUS;

  const [startDate, setStartDate] = useState<Date | undefined>(initialDate);
  const [endDate, setEndDate] = useState<Date | undefined>(initialEndDate || initialDate);
  const [startTime, setStartTime] = useState(initialStartTime || "19:00");
  const [endTime, setEndTime] = useState(initialEndTime || "22:00");
  const [activePicker, setActivePicker] = useState<ActivePicker>("none");

  useEffect(() => {
    if (open) {
      setStartDate(initialDate);
      setEndDate(initialEndDate || initialDate);
      setStartTime(initialStartTime || "19:00");
      setEndTime(initialEndTime || "22:00");
      setActivePicker("none");
    }
  }, [open, initialDate, initialStartTime, initialEndTime, initialEndDate]);

  const handleConfirm = () => {
    // Validate that end time is after start time if same date
    if (startDate && endDate && startDate.toDateString() === endDate.toDateString()) {
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      
      if (endMinutes <= startMinutes) {
        toast.error(t("eventForm.endTimeError", "End time must be after start time"));
        return;
      }
    }
    
    onConfirm(startDate, startTime, endTime, endDate);
    onOpenChange(false);
  };

  const formatDateDisplay = (date: Date | undefined) => {
    if (!date) return "--.--.----";
    return format(date, "dd.MM.yyyy", { locale });
  };

  const togglePicker = (picker: ActivePicker) => {
    setActivePicker((current) => (current === picker ? "none" : picker));
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date);
    // Auto-set end date if not set or if end date is before start date
    if (date && (!endDate || endDate < date)) {
      setEndDate(date);
    }
  };

  return (
    <EventFieldPopup
      open={open}
      onOpenChange={onOpenChange}
      title={t("eventForm.dateTime", "Date & Time")}
      icon={<CalendarIcon className="h-5 w-5 text-primary" />}
      className="sm:max-w-sm"
    >
      <div className="space-y-0">
        {/* Start Row */}
        <div className="flex items-center justify-between py-4 border-b border-border/30">
          <span className="text-base font-medium text-foreground">
            {t("eventForm.startLabel", "Start")}
          </span>
          <div className="flex gap-2">
            <DateTimePill
              value={formatDateDisplay(startDate)}
              isActive={activePicker === "startDate"}
              onClick={() => togglePicker("startDate")}
            />
            <DateTimePill
              value={startTime}
              isActive={activePicker === "startTime"}
              onClick={() => togglePicker("startTime")}
            />
          </div>
        </div>

        {/* Start Date Calendar */}
        {activePicker === "startDate" && (
          <div className="py-3 border-b border-border/30">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={handleStartDateSelect}
              locale={locale}
              className="rounded-lg p-2 pointer-events-auto"
              classNames={{
                day_selected: "bg-primary text-primary-foreground hover:bg-primary/90",
                nav_button: "hover:bg-muted",
              }}
            />
          </div>
        )}

        {/* Start Time Picker */}
        {activePicker === "startTime" && (
          <div className="py-3 border-b border-border/30">
            <TimePicker value={startTime} onChange={setStartTime} />
          </div>
        )}

        {/* End Row */}
        <div className="flex items-center justify-between py-4 border-b border-border/30">
          <span className="text-base font-medium text-foreground">
            {t("eventForm.endLabel", "End")}
          </span>
          <div className="flex gap-2">
            <DateTimePill
              value={formatDateDisplay(endDate)}
              isActive={activePicker === "endDate"}
              onClick={() => togglePicker("endDate")}
            />
            <DateTimePill
              value={endTime}
              isActive={activePicker === "endTime"}
              onClick={() => togglePicker("endTime")}
            />
          </div>
        </div>

        {/* End Date Calendar */}
        {activePicker === "endDate" && (
          <div className="py-3 border-b border-border/30">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              locale={locale}
              disabled={(date) => startDate ? date < startDate : false}
              className="rounded-lg p-2 pointer-events-auto"
              classNames={{
                day_selected: "bg-primary text-primary-foreground hover:bg-primary/90",
                nav_button: "hover:bg-muted",
              }}
            />
          </div>
        )}

        {/* End Time Picker */}
        {activePicker === "endTime" && (
          <div className="py-3 border-b border-border/30">
            <TimePicker value={endTime} onChange={setEndTime} />
          </div>
        )}

        <div className="pt-4">
          <Button onClick={handleConfirm} className="w-full">
            {t("eventForm.confirm", "Confirm")}
          </Button>
        </div>
      </div>
    </EventFieldPopup>
  );
}

export function formatDateTime(
  date: Date | undefined,
  startTime: string,
  endTime: string,
  locale: "de" | "en" = "de",
  endDate?: Date
): string {
  if (!date) return "";
  
  const dateLocale = locale === "de" ? de : enUS;
  const formattedStartDate = format(date, "EEE, d. MMM", { locale: dateLocale });
  
  // Check if end date is different from start date
  const isSameDay = endDate && date.toDateString() === endDate.toDateString();
  const formattedEndDate = endDate && !isSameDay 
    ? format(endDate, "EEE, d. MMM", { locale: dateLocale })
    : null;
  
  if (startTime && endTime) {
    if (formattedEndDate) {
      return `${formattedStartDate} ${startTime} — ${formattedEndDate} ${endTime}`;
    }
    return `${formattedStartDate} • ${startTime} — ${endTime}`;
  }
  if (startTime) {
    return `${formattedStartDate} • ${startTime}`;
  }
  return formattedStartDate;
}
