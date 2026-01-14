import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useIsMobile } from "@/hooks/use-mobile";
import { EventCardUnified } from "@/components/EventCardUnified";

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
  onEventClick?: (eventId: string) => void;
}

export function PopularEventsCarousel({ events, language, onEventClick }: PopularEventsCarouselProps) {
  const { t } = useTranslation("explore");
  const isMobile = useIsMobile();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const maxEvents = isMobile ? 9 : 8;
  const displayEvents = events.slice(0, maxEvents);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {t("noEvents")}
      </div>
    );
  }

  // Mobile: Horizontal carousel with columns of 3 events each
  if (isMobile) {
    const columns: Event[][] = [];
    for (let i = 0; i < displayEvents.length; i += 3) {
      columns.push(displayEvents.slice(i, i + 3));
    }

    // Limit to max 3 pages
    const limitedColumns = columns.slice(0, 3);

    return (
      <div className="space-y-4">
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            slidesToScroll: 1,
            containScroll: "trimSnaps",
          }}
          className="-mx-4"
        >
          <CarouselContent className="ml-0">
            {limitedColumns.map((column, colIndex) => {
              const isLastPage = colIndex === limitedColumns.length - 1;
              
              return (
                <CarouselItem 
                  key={colIndex} 
                  className={`pl-4 ${isLastPage ? 'basis-full' : 'basis-[92%]'}`}
                >
                  <div className="space-y-3 pr-2">
                    {column.map((event) => (
                      <EventCardUnified
                        key={event.id}
                        event={event}
                        participantCount={event.attendance_count}
                        showAvatars={false}
                        onClick={onEventClick ? () => onEventClick(event.id) : undefined}
                      />
                    ))}
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
        
        {/* Pagination Dots */}
        {count > 1 && (
          <div className="flex justify-center gap-1.5">
            {Array.from({ length: count }).map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`h-2 rounded-full transition-all ${
                  index === current 
                    ? 'w-4 bg-primary' 
                    : 'w-2 bg-muted-foreground/30'
                }`}
                aria-label={`Go to page ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop: 2 columns, 4 per column grid
  return (
    <div className="grid grid-cols-2 gap-4">
      {displayEvents.map((event) => (
        <EventCardUnified
          key={event.id}
          event={event}
          participantCount={event.attendance_count}
          showAvatars={false}
          onClick={onEventClick ? () => onEventClick(event.id) : undefined}
        />
      ))}
    </div>
  );
}
