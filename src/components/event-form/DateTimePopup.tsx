import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { EventFieldPopup } from "./EventFieldPopup";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

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

// Mobile-friendly wheel-style time picker component
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
  const scrollTimeoutRef = useRef<{ hours?: NodeJS.Timeout; minutes?: NodeJS.Timeout }>({});
  const lastHourIndexRef = useRef<number>(hours);
  const lastMinuteIndexRef = useRef<number>(Math.floor(minutes / 5));

  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5);
  
  const itemHeight = 44;
  const containerHeight = 220;
  const centerOffset = (containerHeight - itemHeight) / 2;

  // Haptic feedback function
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10); // Short 10ms vibration
    }
  };

  // Initial scroll to selected values
  useEffect(() => {
    if (hoursRef.current) {
      hoursRef.current.scrollTop = hours * itemHeight;
      lastHourIndexRef.current = hours;
    }
    if (minutesRef.current) {
      const minuteIndex = Math.floor(minutes / 5);
      minutesRef.current.scrollTop = minuteIndex * itemHeight;
      lastMinuteIndexRef.current = minuteIndex;
    }
  }, []);

  const handleHourScroll = () => {
    if (hoursRef.current) {
      const scrollTop = hoursRef.current.scrollTop;
      const currentIndex = Math.round(scrollTop / itemHeight);
      const clampedIndex = Math.max(0, Math.min(currentIndex, hourOptions.length - 1));
      
      // Trigger haptic when crossing to a new index
      if (clampedIndex !== lastHourIndexRef.current) {
        triggerHaptic();
        lastHourIndexRef.current = clampedIndex;
      }
    }

    if (scrollTimeoutRef.current.hours) {
      clearTimeout(scrollTimeoutRef.current.hours);
    }
    scrollTimeoutRef.current.hours = setTimeout(() => {
      if (hoursRef.current) {
        const scrollTop = hoursRef.current.scrollTop;
        const selectedIndex = Math.round(scrollTop / itemHeight);
        const clampedIndex = Math.max(0, Math.min(selectedIndex, hourOptions.length - 1));
        const newHour = hourOptions[clampedIndex];
        
        // Snap to position
        hoursRef.current.scrollTop = clampedIndex * itemHeight;
        
        if (newHour !== hours) {
          onChange(`${newHour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`);
        }
      }
    }, 100);
  };

  const handleMinuteScroll = () => {
    if (minutesRef.current) {
      const scrollTop = minutesRef.current.scrollTop;
      const currentIndex = Math.round(scrollTop / itemHeight);
      const clampedIndex = Math.max(0, Math.min(currentIndex, minuteOptions.length - 1));
      
      // Trigger haptic when crossing to a new index
      if (clampedIndex !== lastMinuteIndexRef.current) {
        triggerHaptic();
        lastMinuteIndexRef.current = clampedIndex;
      }
    }

    if (scrollTimeoutRef.current.minutes) {
      clearTimeout(scrollTimeoutRef.current.minutes);
    }
    scrollTimeoutRef.current.minutes = setTimeout(() => {
      if (minutesRef.current) {
        const scrollTop = minutesRef.current.scrollTop;
        const selectedIndex = Math.round(scrollTop / itemHeight);
        const clampedIndex = Math.max(0, Math.min(selectedIndex, minuteOptions.length - 1));
        const newMinute = minuteOptions[clampedIndex];
        
        // Snap to position
        minutesRef.current.scrollTop = clampedIndex * itemHeight;
        
        if (newMinute !== minutes) {
          onChange(`${hours.toString().padStart(2, "0")}:${newMinute.toString().padStart(2, "0")}`);
        }
      }
    }, 100);
  };

  return (
    <div className={cn("relative py-2", className)}>
      {/* Top fade gradient */}
      <div 
        className="absolute left-0 right-0 top-2 h-16 pointer-events-none z-20"
        style={{ 
          background: 'linear-gradient(to bottom, hsl(var(--background)) 0%, hsl(var(--background) / 0.8) 30%, transparent 100%)' 
        }}
      />
      
      {/* Bottom fade gradient */}
      <div 
        className="absolute left-0 right-0 bottom-2 h-16 pointer-events-none z-20"
        style={{ 
          background: 'linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.8) 30%, transparent 100%)' 
        }}
      />
      
      {/* Selection indicator bar */}
      <div 
        className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-11 bg-muted rounded-full pointer-events-none z-0"
      />
      
      <div className="flex justify-center gap-8 relative z-10">
        {/* Hours */}
        <div
          ref={hoursRef}
          onScroll={handleHourScroll}
          className="h-[220px] w-20 overflow-y-auto snap-y snap-mandatory hide-scrollbar"
          style={{ scrollSnapType: 'y mandatory' }}
        >
          <div style={{ height: `${centerOffset}px` }} />
          {hourOptions.map((hour, index) => (
            <div
              key={hour}
              className={cn(
                "w-full h-11 flex items-center justify-center text-xl font-medium snap-center transition-all",
                hours === hour
                  ? "text-foreground"
                  : "text-muted-foreground/40"
              )}
              style={{ scrollSnapAlign: 'center' }}
            >
              {hour.toString().padStart(2, "0")}
            </div>
          ))}
          <div style={{ height: `${centerOffset}px` }} />
        </div>

        {/* Minutes */}
        <div
          ref={minutesRef}
          onScroll={handleMinuteScroll}
          className="h-[220px] w-20 overflow-y-auto snap-y snap-mandatory hide-scrollbar"
          style={{ scrollSnapType: 'y mandatory' }}
        >
          <div style={{ height: `${centerOffset}px` }} />
          {minuteOptions.map((minute, index) => (
            <div
              key={minute}
              className={cn(
                "w-full h-11 flex items-center justify-center text-xl font-medium snap-center transition-all",
                minutes === minute
                  ? "text-foreground"
                  : "text-muted-foreground/40"
              )}
              style={{ scrollSnapAlign: 'center' }}
            >
              {minute.toString().padStart(2, "0")}
            </div>
          ))}
          <div style={{ height: `${centerOffset}px` }} />
        </div>
      </div>
    </div>
  );
}

// Desktop time input component
function TimeInput({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (time: string) => void;
  className?: string;
}) {
  return (
    <Input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-[100px] text-center font-medium bg-muted border-0 rounded-full px-4 py-2 h-auto",
        className
      )}
    />
  );
}

// Date/Time button pill component (for mobile time selection)
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
  const isMobile = useIsMobile();

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
            {isMobile ? (
              <DateTimePill
                value={startTime}
                isActive={activePicker === "startTime"}
                onClick={() => togglePicker("startTime")}
              />
            ) : (
              <TimeInput value={startTime} onChange={setStartTime} />
            )}
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

        {/* Start Time Picker (mobile only) */}
        {isMobile && activePicker === "startTime" && (
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
            {isMobile ? (
              <DateTimePill
                value={endTime}
                isActive={activePicker === "endTime"}
                onClick={() => togglePicker("endTime")}
              />
            ) : (
              <TimeInput value={endTime} onChange={setEndTime} />
            )}
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

        {/* End Time Picker (mobile only) */}
        {isMobile && activePicker === "endTime" && (
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
