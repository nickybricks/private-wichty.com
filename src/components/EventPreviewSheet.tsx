import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import { Loader2, Calendar, MapPin, CreditCard, Share2, Pencil, X } from "lucide-react";
import { JoinEventSheet } from "@/components/JoinEventSheet";
import { LocationMapPreview } from "@/components/LocationMapPreview";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface Event {
  id: string;
  name: string;
  description: string | null;
  target_participants: number;
  status: "waiting" | "active" | "completed";
  image_url: string | null;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  user_id: string | null;
  is_paid: boolean;
  price_cents: number;
  currency: string;
  requires_approval: boolean;
}

interface Participant {
  id: string;
  name: string;
  user_id: string;
}

interface HostProfile {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface EventPreviewSheetProps {
  eventId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
}

export function EventPreviewSheet({ eventId, open, onOpenChange, user }: EventPreviewSheetProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('event');
  const isMobile = useIsMobile();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinSheet, setShowJoinSheet] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [hostProfile, setHostProfile] = useState<HostProfile | null>(null);

  const dateLocale = i18n.language === 'de' ? de : enUS;

  useEffect(() => {
    if (open && eventId) {
      setLoading(true);
      fetchEventData();
    }
  }, [open, eventId]);

  const fetchEventData = async () => {
    if (!eventId) return;
    
    try {
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (eventError) throw eventError;
      if (!eventData) {
        toast.error(t('notFound'));
        onOpenChange(false);
        return;
      }

      setEvent(eventData);

      // Fetch host profile
      if (eventData.user_id) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, display_name, first_name, last_name, username, avatar_url")
          .eq("id", eventData.user_id)
          .single();
        
        setHostProfile(profileData);
      }

      const { data: participantsData, error: participantsError } = await supabase
        .from("participants")
        .select("id, name, user_id")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (participantsError) throw participantsError;
      setParticipants(participantsData || []);

      if (user) {
        const userParticipant = participantsData?.find((p) => p.user_id === user.id);
        setIsParticipant(!!userParticipant);
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      toast.error(t('loadingError'));
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSuccess = () => {
    setIsParticipant(true);
    setShowJoinSheet(false);
    toast.success(t('joinSuccess'));
    fetchEventData();
  };

  const copyEventLink = () => {
    const link = `${window.location.origin}/event/${eventId}`;
    navigator.clipboard.writeText(link);
    toast.success(t('linkCopied'));
  };

  const formatEventDate = (date: string, time: string | null) => {
    if (i18n.language === 'de') {
      const dateStr = format(new Date(date), "EEEE, d. MMMM", { locale: de });
      return time ? `${dateStr} ${t('at')} ${time.slice(0, 5)} ${t('oclock')}` : dateStr;
    } else {
      const dateStr = format(new Date(date), "EEEE, MMMM d", { locale: enUS });
      return time ? `${dateStr} ${t('at')} ${time.slice(0, 5)}` : dateStr;
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat(i18n.language === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: currency?.toUpperCase() || 'EUR',
    }).format(cents / 100);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarColors = [
    "bg-rose-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-sky-500",
    "bg-violet-500",
  ];

  const getAvatarColor = (index: number) => {
    return avatarColors[index % avatarColors.length];
  };

  const isHost = user && event?.user_id === user.id;

  const getCTAButton = () => {
    if (!event) return null;
    
    const baseClasses = "w-full h-10 text-sm font-medium shadow-sm";
    
    if (isParticipant) {
      return (
        <Button 
          size="sm" 
          className={`${baseClasses} bg-[#1D1D1F] hover:bg-[#1D1D1F]/90 text-white border-none`}
          onClick={() => navigate(`/event/${eventId}`)}
        >
          {t('cta.joined')}
        </Button>
      );
    }

    if (event.is_paid && event.price_cents > 0) {
      return (
        <Button 
          size="sm" 
          className={baseClasses}
          onClick={() => setShowJoinSheet(true)}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          {t('cta.buyTicket')} · {formatPrice(event.price_cents, event.currency)}
        </Button>
      );
    }

    if (event.requires_approval) {
      return (
        <Button 
          size="sm" 
          className={baseClasses}
          onClick={() => setShowJoinSheet(true)}
        >
          {t('cta.requestJoin')}
        </Button>
      );
    }

    return (
      <Button 
        size="sm" 
        className={baseClasses}
        onClick={() => setShowJoinSheet(true)}
      >
        {t('cta.join')}
      </Button>
    );
  };

  const content = (
    <div className="flex-1 overflow-y-auto">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : event ? (
        <div className="space-y-4 p-4">
          {/* Event Image */}
          <div className="w-full aspect-video rounded-xl overflow-hidden shadow-medium bg-muted relative">
            {event.image_url ? (
              <img
                src={event.image_url}
                alt={event.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <Calendar className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
            
            {/* Share button on image */}
            <div className="absolute top-3 right-3">
              <Button 
                variant="secondary" 
                size="icon"
                className="h-8 w-8 bg-foreground/80 text-background backdrop-blur-sm hover:bg-foreground shadow-lg"
                onClick={copyEventLink}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Event Details */}
          <div className="space-y-3">
            {/* Title */}
            <h2 className="text-xl font-bold tracking-tight">{event.name}</h2>
            
            {/* Date */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className={`text-sm ${event.event_date ? 'text-foreground' : 'text-muted-foreground'}`}>
                {event.event_date 
                  ? formatEventDate(event.event_date, event.event_time)
                  : t('noDate')}
              </span>
            </div>
            
            {/* Location */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className={`text-sm ${event.location ? 'text-foreground' : 'text-muted-foreground'}`}>
                {event.location || t('noLocation')}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium">
                {event.is_paid && event.price_cents > 0 
                  ? formatPrice(event.price_cents, event.currency)
                  : t('free')}
              </span>
            </div>

            {/* Participants */}
            {participants.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {participants.slice(0, 5).map((participant, index) => (
                    <div
                      key={participant.id}
                      className={`w-9 h-9 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white text-xs font-medium ring-2 ring-background`}
                      title={participant.name}
                    >
                      {getInitials(participant.name)}
                    </div>
                  ))}
                  {participants.length > 5 && (
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium ring-2 ring-background">
                      +{participants.length - 5}
                    </div>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {t('participantsCount', { count: participants.length })}
                </span>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="pt-2">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* Map Preview */}
            {event.location && (
              <div className="pt-2">
                <LocationMapPreview location={event.location} />
              </div>
            )}

            {/* CTA Button */}
            <div className="pt-4 pb-2">
              {getCTAButton()}
            </div>

            {/* Edit Button for Host */}
            {isHost && (
              <Button 
                variant="outline"
                size="sm"
                className="w-full bg-[#FFB86C] hover:bg-[#FFB86C]/90 text-foreground border-none shadow-sm"
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/event/${eventId}/edit`);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                {t('editEventButton')}
              </Button>
            )}

            {/* View Full Page Link */}
            <Button 
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => {
                onOpenChange(false);
                navigate(`/event/${eventId}`);
              }}
            >
              {i18n.language === 'de' ? 'Volle Seite öffnen' : 'Open full page'}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Join Sheet */}
      {event && (
        <JoinEventSheet
          open={showJoinSheet}
          onOpenChange={setShowJoinSheet}
          eventId={event.id}
          eventName={event.name}
          isPaidEvent={event.is_paid}
          priceCents={event.price_cents}
          currency={event.currency}
          onSuccess={handleJoinSuccess}
        />
      )}
    </div>
  );

  // Mobile: Full-screen drawer from bottom
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent fullScreenOnMobile className="flex flex-col">
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Side panel from right
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-4 border-b flex-shrink-0">
          <SheetTitle className="text-left">
            {event?.name || (i18n.language === 'de' ? 'Event' : 'Event')}
          </SheetTitle>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}
