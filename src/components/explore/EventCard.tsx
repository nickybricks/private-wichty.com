import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Users } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { getTagLabel, getTagColor } from "@/data/eventTags";

interface EventCardProps {
  event: {
    id: string;
    name: string;
    event_date: string | null;
    event_time: string | null;
    location: string | null;
    image_url: string | null;
    attendance_count: number;
    tags: string[] | null;
  };
  language: "de" | "en";
}

export function EventCard({ event, language }: EventCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation("explore");

  const formatEventDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isToday(date)) return t("today");
      if (isTomorrow(date)) return t("tomorrow");
      return format(date, "EEEE, d. MMMM", { locale: language === "de" ? de : enUS });
    } catch {
      return dateStr;
    }
  };

  return (
    <button
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
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            {event.attendance_count}
          </span>
          {event.tags && event.tags.length > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full text-white ${getTagColor(event.tags[0])}`}>
              {getTagLabel(event.tags[0], language)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
