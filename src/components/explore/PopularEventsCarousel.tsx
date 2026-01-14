import { useTranslation } from "react-i18next";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
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

  const maxEvents = isMobile ? 9 : 8;
  const displayEvents = events.slice(0, maxEvents);

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
      <Carousel
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
