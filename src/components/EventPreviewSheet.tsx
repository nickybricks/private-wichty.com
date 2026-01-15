import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Calendar, MapPin, CreditCard, Share2, Pencil, Ticket, User } from "lucide-react";
import { getTagLabel } from "@/data/eventTags";
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
  end_date: string | null;
  event_time: string | null;
  end_time: string | null;
  location: string | null;
  user_id: string | null;
  is_paid: boolean;
  price_cents: number;
  currency: string;
  requires_approval: boolean;
  tags: string[] | null;
  allow_multiple_tickets?: boolean;
}

interface Participant {
  id: string;
  name: string;
  user_id: string;
  avatar_url?: string | null;
}

interface HostProfile {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface TicketCategory {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  max_quantity: number | null;
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
  const [ticketCategories, setTicketCategories] = useState<TicketCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinSheet, setShowJoinSheet] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [showParticipantsList, setShowParticipantsList] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
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

      // Fetch ticket categories
      const { data: ticketsData } = await supabase
        .from("ticket_categories")
        .select("id, name, description, price_cents, currency, max_quantity")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      
      setTicketCategories(ticketsData || []);

      const { data: participantsData, error: participantsError } = await supabase
        .from("participants")
        .select("id, name, user_id")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (participantsError) throw participantsError;
      
      // Fetch profile avatars for participants with user_id
      const participantsWithAvatars = await Promise.all(
        (participantsData || []).map(async (p) => {
          if (p.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("avatar_url")
              .eq("id", p.user_id)
              .single();
            return { ...p, avatar_url: profile?.avatar_url };
          }
          return p;
        })
      );
      
      setParticipants(participantsWithAvatars);

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

  const getHostDisplayName = () => {
    if (!hostProfile) return null;
    if (hostProfile.first_name && hostProfile.last_name) {
      return `${hostProfile.first_name} ${hostProfile.last_name}`;
    }
    if (hostProfile.display_name) return hostProfile.display_name;
    if (hostProfile.username) return `@${hostProfile.username}`;
    return null;
  };

  const openGoogleMaps = (location: string) => {
    const encodedLocation = encodeURIComponent(location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank');
  };

  const handleLeaveEvent = async () => {
    if (!user || !eventId) return;
    
    setIsLeaving(true);
    try {
      // Get participant name before deleting
      const { data: participantData } = await supabase
        .from("participants")
        .select("name")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .single();

      const { error } = await supabase
        .from("participants")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Send cancellation email (fire and forget)
      if (user.email && event) {
        supabase.functions.invoke('send-notification', {
          body: {
            type: 'ticket_cancelled',
            recipientEmail: user.email,
            recipientName: participantData?.name || user.email,
            language: i18n.language === 'de' ? 'de' : 'en',
            eventName: event.name,
            eventDate: event.event_date,
            eventTime: event.event_time,
            eventLocation: event.location,
          },
        }).catch(err => console.error("Failed to send cancellation email:", err));
      }

      setIsParticipant(false);
      setShowLeaveConfirm(false);
      toast.success(t('leaveSuccess'));
      fetchEventData();
    } catch (error) {
      console.error("Error leaving event:", error);
      toast.error(t('leaveError'));
    } finally {
      setIsLeaving(false);
    }
  };

  const isHost = user && event?.user_id === user.id;

  const getCTAButton = () => {
    if (!event) return null;
    
    const baseClasses = "w-full h-12 text-sm font-medium shadow-sm";
    
    if (isParticipant) {
      return (
        <Button 
          size="lg" 
          className={`${baseClasses} bg-[#1D1D1F] hover:bg-[#1D1D1F]/90 text-white border-none`}
          onClick={() => setShowLeaveConfirm(true)}
        >
          {t('cta.leave')}
        </Button>
      );
    }

    if (event.is_paid && (event.price_cents > 0 || ticketCategories.length > 0)) {
      const lowestPrice = ticketCategories.length > 0 
        ? Math.min(...ticketCategories.map(tc => tc.price_cents))
        : event.price_cents;
      const currency = ticketCategories.length > 0 
        ? ticketCategories[0].currency 
        : event.currency;

      return (
        <Button 
          size="lg" 
          className={baseClasses}
          onClick={() => setShowJoinSheet(true)}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          {t('cta.buyTicket')} · {ticketCategories.length > 1 ? `${i18n.language === 'de' ? 'ab' : 'from'} ` : ''}{formatPrice(lowestPrice, currency)}
        </Button>
      );
    }

    if (event.requires_approval) {
      return (
        <Button 
          size="lg" 
          className={baseClasses}
          onClick={() => setShowJoinSheet(true)}
        >
          {t('cta.requestJoin')}
        </Button>
      );
    }

    return (
      <Button 
        size="lg" 
        className={baseClasses}
        onClick={() => setShowJoinSheet(true)}
      >
        {t('cta.join')}
      </Button>
    );
  };

  const content = (
    <div className="flex-1 overflow-y-auto overscroll-contain bg-background">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : event ? (
        <div className="space-y-4 p-4 pb-8">
          {/* 1. Edit Button for Host - above image, right-aligned */}
          {isHost && (
            <div className="flex justify-end">
              <Button 
                variant="outline"
                size="sm"
                className="bg-[#FFB86C] hover:bg-[#FFB86C]/90 text-foreground border-none shadow-sm"
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/event/${eventId}/edit`);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                {t('editEventButton')}
              </Button>
            </div>
          )}

          {/* 2. Event Image - Square with side padding */}
          <div className="px-4">
            <div className="aspect-square w-full max-w-[280px] mx-auto rounded-xl overflow-hidden shadow-medium bg-muted relative">
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
          </div>
          
          {/* Event Details - New Layout Order */}
          <div className="space-y-3">
            {/* 3. Title */}
            <h2 className="text-xl font-bold tracking-tight">{event.name}</h2>
            
            {/* 4. Date & Time - styled like CreateEventDrawer */}
            <div className="w-full flex items-center p-3 rounded-xl border border-border/50 bg-background">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  {event.event_date ? (
                    <div className="space-y-1">
                      {/* Start date & time */}
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">
                          {format(new Date(event.event_date), "EEE, d. MMM", { locale: dateLocale })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {event.event_time 
                            ? `${event.event_time.slice(0, 5)} ${i18n.language === 'de' ? 'Uhr' : ''}`
                            : (i18n.language === 'de' ? 'Ganztägig' : 'All day')}
                        </p>
                      </div>
                      {/* End date & time - show if end_date is different or end_time exists */}
                      {(event.end_time || (event.end_date && event.end_date !== event.event_date)) && (
                        <div className="flex items-center justify-between text-muted-foreground">
                          <p className="text-sm truncate">
                            {event.end_date && event.end_date !== event.event_date
                              ? format(new Date(event.end_date), "EEE, d. MMM", { locale: dateLocale })
                              : format(new Date(event.event_date), "EEE, d. MMM", { locale: dateLocale })}
                          </p>
                          <p className="text-sm">
                            {event.end_time 
                              ? `${event.end_time.slice(0, 5)} ${i18n.language === 'de' ? 'Uhr' : ''}`
                              : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="font-medium text-muted-foreground truncate">
                      {t('noDate')}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* 5. Address/Location - clickable to open Google Maps, styled like CreateEventDrawer */}
            <button 
              className="w-full flex items-center p-3 rounded-xl border border-border/50 hover:bg-accent/50 transition-colors text-left"
              onClick={() => event.location && openGoogleMaps(event.location)}
              disabled={!event.location}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  {event.location ? (
                    <>
                      <p className="font-medium truncate">{event.location.split(',')[0]}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {event.location.split(',').slice(1).join(',').trim() || (i18n.language === 'de' ? 'Veranstaltungsort' : 'Event location')}
                      </p>
                    </>
                  ) : (
                    <p className="font-medium text-muted-foreground truncate">
                      {t('noLocation')}
                    </p>
                  )}
                </div>
              </div>
            </button>

            {/* 6. Tickets Section - bordered card with categories and CTA */}
            <Card className="p-4 border-2 space-y-4">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">{t('tickets.title')}</h3>
              </div>
              
              {ticketCategories.length > 0 ? (
                <div className="space-y-2">
                  {ticketCategories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{category.name}</p>
                        {category.description && (
                          <p className="text-xs text-muted-foreground truncate">{category.description}</p>
                        )}
                      </div>
                      <span className="font-semibold text-sm ml-4">
                        {category.price_cents === 0 
                          ? t('free') 
                          : formatPrice(category.price_cents, category.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{t('tickets.generalAdmission')}</span>
                  <span className="font-semibold text-sm">
                    {event.is_paid && event.price_cents > 0 
                      ? formatPrice(event.price_cents, event.currency)
                      : t('free')}
                  </span>
                </div>
              )}

              {/* CTA Button inside tickets card */}
              {getCTAButton()}
            </Card>

            {/* 7. Description */}
            {event.description && (
              <div className="pt-2">
                <div 
                  className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-strong:font-semibold"
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </div>
            )}

            {/* 8. Address + Google Maps Card */}
            {event.location && (
              <div className="pt-2">
                <LocationMapPreview location={event.location} />
              </div>
            )}

            {/* 9. Host Section */}
            {hostProfile && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  {t('host.title')}
                </p>
                <button
                  className="flex items-center gap-3 w-full text-left hover:bg-muted/50 rounded-lg p-2 -ml-2 transition-colors"
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/host/${hostProfile.id}`);
                  }}
                >
                  <Avatar className="h-10 w-10">
                    {hostProfile.avatar_url ? (
                      <AvatarImage src={hostProfile.avatar_url} alt={getHostDisplayName() || 'Host'} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {hostProfile.username 
                        ? `@${hostProfile.username}` 
                        : getHostDisplayName() || (i18n.language === 'de' ? 'Unbekannt' : 'Unknown')}
                    </p>
                  </div>
                </button>
              </div>
            )}

            {/* 10. Participants Section - 5 icons + "+X nehmen teil" */}
            {participants.length > 0 && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  {t('participants')}
                </p>
                <button 
                  className="flex items-center gap-3 w-full text-left hover:bg-muted/50 rounded-lg p-2 -ml-2 transition-colors"
                  onClick={() => setShowParticipantsList(true)}
                >
                  <div className="flex -space-x-2">
                    {participants.slice(0, 5).map((participant, index) => (
                      <Avatar 
                        key={participant.id} 
                        className="w-10 h-10 ring-2 ring-background"
                        title={participant.name}
                      >
                        {participant.avatar_url ? (
                          <AvatarImage src={participant.avatar_url} alt={participant.name} />
                        ) : null}
                        <AvatarFallback className={`${getAvatarColor(index)} text-white text-xs font-medium`}>
                          {getInitials(participant.name)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  {participants.length > 5 ? (
                    <span className="text-sm font-medium">
                      +{participants.length - 5} {i18n.language === 'de' ? 'nehmen teil' : 'attending'}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {t('participantsCount', { count: participants.length })}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* 11. Event-Kategorie Tag - ganz unten, dezent */}
            {event.tags && event.tags.length > 0 && (
              <div className="pt-4 pb-2">
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground/70">
                  {getTagLabel(event.tags[0], i18n.language as "de" | "en")}
                </span>
              </div>
            )}
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
          requiresApproval={event.requires_approval}
          onSuccess={handleJoinSuccess}
          ticketCategories={ticketCategories}
          allowMultipleTickets={event.allow_multiple_tickets ?? true}
        />
      )}

      {/* Participants List Sheet */}
      <Sheet open={showParticipantsList} onOpenChange={setShowParticipantsList}>
        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader>
            <SheetTitle>{t('participantsList.title')}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2 overflow-y-auto max-h-[calc(70vh-100px)]">
            {participants.map((participant, index) => (
              <div key={participant.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar className="w-10 h-10">
                  {participant.avatar_url ? (
                    <AvatarImage src={participant.avatar_url} alt={participant.name} />
                  ) : null}
                  <AvatarFallback className={`${getAvatarColor(index)} text-white text-xs font-medium`}>
                    {getInitials(participant.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{participant.name}</span>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Leave Event Confirmation */}
      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('leave.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('leave.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('leave.no')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLeaveEvent}
              disabled={isLeaving}
            >
              {isLeaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('leave.yes')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  // Mobile: Full-screen drawer from bottom
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent fullScreenOnMobile className="flex flex-col bg-background">
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Side panel from right (floating popup)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[500px] p-0 flex flex-col shadow-2xl">
        {content}
      </SheetContent>
    </Sheet>
  );
}
