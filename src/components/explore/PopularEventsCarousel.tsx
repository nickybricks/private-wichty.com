import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const navigate = useNavigate();
  const { t } = useTranslation("explore");
  const isMobile = useIsMobile();

  const maxEvents = isMobile ? 9 : 8;
  const displayEvents = events.slice(0, maxEvents);

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

  const EventCard = ({ event }: { event: Event }) => (
    <button
      onClick={() => navigate(`/event/${event.id}`)}
      className="w-full flex gap-3 p-3 bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow text-left border border-border/50"
    >
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Calendar className="h-6 w-6 md:h-8 md:w-8" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground truncate text-sm md:text-base">{event.name}</h4>
        {event.event_date && (
          <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1 mt-0.5 md:mt-1">
            <Calendar className="h-3 w-3" />
            {formatEventDate(event.event_date)}
            {event.event_time && ` · ${event.event_time}`}
          </p>
        )}
        {event.location && (
          <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </p>
        )}
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 md:mt-1">
          <Users className="h-3 w-3" />
          {event.attendance_count} {language === "de" ? "Teilnehmer" : "attendees"}
        </p>
      </div>
    </button>
  );

  // Mobile: Horizontal carousel with columns of 3 events each
  if (isMobile) {
    // Group events into columns of 3
    const columns: Event[][] = [];
    for (let i = 0; i < displayEvents.length; i += 3) {
      columns.push(displayEvents.slice(i, i + 3));
    }

    return (
      <Carousel
        opts={{
          align: "start",
          slidesToScroll: 1,
        }}
        className="-mx-4"
      >
        <CarouselContent className="ml-0">
          {columns.map((column, colIndex) => (
            <CarouselItem key={colIndex} className="basis-[85%] pl-4 first:pl-4">
              <div className="space-y-3 pr-2">
                {column.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    );
  }

  // Desktop: 2 columns, 4 per column grid
  return (
    <div className="grid grid-cols-2 gap-4">
      {displayEvents.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}