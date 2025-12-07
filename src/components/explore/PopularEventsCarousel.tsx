import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Calendar, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";

interface Event {
  id: string;
  name: string;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  image_url: string | null;
  attendance_count: number;
}

interface PopularEventsCarouselProps {
  events: Event[];
  language: "de" | "en";
}

export function PopularEventsCarousel({ events, language }: PopularEventsCarouselProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation("explore");

  const eventsPerPage = 3;
  const maxEvents = Math.min(events.length, 9);
  const displayEvents = events.slice(0, maxEvents);
  const totalPages = Math.ceil(displayEvents.length / eventsPerPage);

  const currentEvents = displayEvents.slice(
    currentPage * eventsPerPage,
    (currentPage + 1) * eventsPerPage
  );

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  const formatEventDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return format(date, "d. MMM", { locale: language === "de" ? de : enUS });
    } catch {
      return dateStr;
    }
  };

  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {t("noEvents")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {currentEvents.map((event) => (
          <button
            key={event.id}
            onClick={() => navigate(`/event/${event.id}`)}
            className="w-full flex gap-3 p-3 bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow text-left border border-border/50"
          >
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
              {event.image_url ? (
                <img
                  src={event.image_url}
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Calendar className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground truncate">{event.name}</h4>
              {event.event_date && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  {formatEventDate(event.event_date)}
                  {event.event_time && ` · ${event.event_time}`}
                </p>
              )}
              {event.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{event.location}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Users className="h-3 w-3" />
                {event.attendance_count} Teilnehmer
              </p>
            </div>
          </button>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            {t("previous")}
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            {currentPage + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentPage === totalPages - 1}
          >
            {t("next")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
