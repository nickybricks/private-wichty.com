import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Card } from "@/components/ui/card";

interface Participant {
  id: string;
  name: string;
}

interface EventCardUnifiedProps {
  event: {
    id: string;
    name: string;
    event_date: string | null;
    event_time: string | null;
    location: string | null;
    image_url: string | null;
  };
  participants?: Participant[];
  participantCount?: number;
  showAvatars?: boolean;
  onClick?: () => void;
}

const avatarColors = [
  "bg-rose-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
];

const getAvatarColor = (index: number) => avatarColors[index % avatarColors.length];

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function EventCardUnified({
  event,
  participants = [],
  participantCount,
  showAvatars = false,
  onClick,
}: EventCardUnifiedProps) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const language = i18n.language === "de" ? "de" : "en";

  const count = participantCount ?? participants.length;

  const formatEventDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return format(date, "d. MMM", { locale: language === "de" ? de : enUS });
    } catch {
      return dateStr;
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/event/${event.id}`);
    }
  };

  return (
    <Card
      onClick={handleClick}
      className="min-w-0 p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-border/50"
    >
      <div className="flex gap-3 md:gap-4">
        {/* Image */}
        <div className="flex-shrink-0">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.name}
              className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg md:rounded-xl"
            />
          ) : (
            <div className="w-16 h-16 md:w-20 md:h-20 bg-muted rounded-lg md:rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-0.5 md:space-y-1">
          {/* Date/Time */}
          {event.event_date && (
            <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatEventDate(event.event_date)}
              {event.event_time && ` · ${event.event_time.slice(0, 5)}`}
            </p>
          )}

          {/* Title */}
          <h3 className="text-sm md:text-base font-semibold truncate">{event.name}</h3>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-1 text-muted-foreground min-w-0 overflow-hidden">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="text-xs md:text-sm truncate">{event.location}</span>
            </div>
          )}

          {/* Participants */}
          {count > 0 && (
            <div className="flex items-center pt-0.5">
              {showAvatars && participants.length > 0 ? (
                <div className="flex -space-x-1">
                  {participants.slice(0, 5).map((participant, index) => (
                    <div
                      key={participant.id}
                      className={`w-[1.125rem] h-[1.125rem] rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white text-[7px] font-medium ring-[1.5px] ring-background`}
                      title={participant.name}
                    >
                      {getInitials(participant.name)}
                    </div>
                  ))}
                  {count > 5 && (
                    <div className="h-[1.125rem] px-1 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-[7px] font-medium ring-[1.5px] ring-background">
                      +{count - 5}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {count} {language === "de" ? "Teilnehmer" : "attendees"}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
