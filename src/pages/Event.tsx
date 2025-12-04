import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Calendar, MapPin, CreditCard, Share2, User, Pencil } from "lucide-react";
import { JoinEventSheet } from "@/components/JoinEventSheet";
import { LocationMapPreview } from "@/components/LocationMapPreview";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";

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

export default function Event() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation('event');
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinSheet, setShowJoinSheet] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [showParticipantsList, setShowParticipantsList] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [hostProfile, setHostProfile] = useState<HostProfile | null>(null);

  const dateLocale = i18n.language === 'de' ? de : enUS;

  useEffect(() => {
    if (!id) {
      navigate("/");
      return;
    }

    checkAuth();
    fetchEventData();
    subscribeToChanges();
    
    handlePaymentSuccess();
  }, [id]);

  const handlePaymentSuccess = async () => {
    const paymentSuccess = searchParams.get('payment_success');
    const participantName = searchParams.get('name');

    if (paymentSuccess === 'true' && participantName) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("participants")
          .insert({
            event_id: id,
            name: decodeURIComponent(participantName),
            user_id: user.id,
          })
          .select()
          .single();

        if (error) {
          if (error.code !== '23505') {
            throw error;
          }
        } else if (data) {
          setIsParticipant(true);
          toast.success(t('joinSuccess'));
        }

        window.history.replaceState({}, '', `/event/${id}`);
        fetchEventData();
      } catch (error) {
        console.error('Error adding participant after payment:', error);
      }
    }

    if (searchParams.get('payment_cancelled') === 'true') {
      toast.error(i18n.language === 'de' ? 'Zahlung abgebrochen' : 'Payment cancelled');
      window.history.replaceState({}, '', `/event/${id}`);
    }
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate(`/auth?redirect=/event/${id}`);
      return;
    }
    setUser(session.user);
  };

  const fetchEventData = async () => {
    try {
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (eventError) throw eventError;
      if (!eventData) {
        toast.error(t('notFound'));
        navigate("/");
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
        .eq("event_id", id)
        .order("created_at", { ascending: true });

      if (participantsError) throw participantsError;
      setParticipants(participantsData || []);

      const { data: { user } } = await supabase.auth.getUser();
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

  const subscribeToChanges = () => {
    const channel = supabase
      .channel(`event-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `event_id=eq.${id}`,
        },
        () => {
          fetchEventData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "events",
          filter: `id=eq.${id}`,
        },
        () => {
          fetchEventData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleJoinSuccess = () => {
    setIsParticipant(true);
    setShowJoinSheet(false);
    toast.success(t('joinSuccess'));
    fetchEventData();
  };

  const copyEventLink = () => {
    const link = window.location.href;
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

  const handleLeaveEvent = async () => {
    if (!user || !id) return;
    
    setIsLeaving(true);
    try {
      const { error } = await supabase
        .from("participants")
        .delete()
        .eq("event_id", id)
        .eq("user_id", user.id);

      if (error) throw error;

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

  const getCTAButton = () => {
    if (isParticipant) {
      return (
        <Button 
          size="lg" 
          className="w-full h-14 text-lg" 
          variant="outline"
          onClick={() => setShowLeaveConfirm(true)}
        >
          {t('cta.leave')}
        </Button>
      );
    }

    if (event?.is_paid && event.price_cents > 0) {
      return (
        <Button 
          size="lg" 
          className="w-full h-14 text-lg shadow-medium"
          onClick={() => setShowJoinSheet(true)}
        >
          <CreditCard className="mr-2 h-5 w-5" />
          {t('cta.buyTicket')} · {formatPrice(event.price_cents, event.currency)}
        </Button>
      );
    }

    if (event?.requires_approval) {
      return (
        <Button 
          size="lg" 
          className="w-full h-14 text-lg shadow-medium"
          onClick={() => setShowJoinSheet(true)}
        >
          {t('cta.requestJoin')}
        </Button>
      );
    }

    return (
      <Button 
        size="lg" 
        className="w-full h-14 text-lg shadow-medium"
        onClick={() => setShowJoinSheet(true)}
      >
        {t('cta.join')}
      </Button>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const isHost = user && event.user_id === user.id;

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} showBackButton={true} />
      <div className="p-4 md:p-8">
        <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
        
        {/* Edit Event Button for Host */}
        {isHost && (
          <div className="flex justify-end">
            <Button 
              variant="outline"
              size="sm"
              className="bg-[#FFB86C] hover:bg-[#FFB86C]/90 text-foreground border-none shadow-sm"
              onClick={() => navigate(`/event/${id}/edit`)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {t('editEventButton')}
            </Button>
          </div>
        )}

        {/* Event Image - Square */}
        <div className="w-full aspect-square rounded-xl overflow-hidden shadow-strong bg-muted relative">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <Calendar className="h-24 w-24 text-muted-foreground" />
            </div>
          )}
          
          {/* Share button on image */}
          <div className="absolute top-4 right-4">
            <Button 
              variant="secondary" 
              size="icon"
              className="bg-foreground/80 text-background backdrop-blur-sm hover:bg-foreground shadow-lg"
              onClick={copyEventLink}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Event Details - New Hierarchy */}
        <div className="space-y-4">
          {/* Title */}
          <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
          
          {/* Date */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className={`text-sm ${event.event_date ? 'text-foreground' : 'text-muted-foreground'}`}>
              {event.event_date 
                ? formatEventDate(event.event_date, event.event_time)
                : t('noDate')}
            </span>
          </div>
          
          {/* Location (just address, map at bottom) */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
              <MapPin className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className={`text-sm ${event.location ? 'text-foreground' : 'text-muted-foreground'}`}>
              {event.location || t('noLocation')}
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium">
              {event.is_paid && event.price_cents > 0 
                ? formatPrice(event.price_cents, event.currency)
                : t('free')}
            </span>
          </div>

          {/* Participants */}
          {participants.length > 0 && (
            <div 
              className={`flex items-center gap-3 ${isParticipant ? 'cursor-pointer' : ''}`}
              onClick={() => isParticipant && setShowParticipantsList(true)}
            >
              <div className="flex -space-x-2">
                {participants.slice(0, 5).map((participant, index) => (
                  <div
                    key={participant.id}
                    className={`w-10 h-10 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white text-xs font-medium ring-2 ring-background`}
                    title={participant.name}
                  >
                    {getInitials(participant.name)}
                  </div>
                ))}
                {participants.length > 5 && (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium ring-2 ring-background">
                    +{participants.length - 5}
                  </div>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {t('participantsCount', { count: participants.length })}
              </span>
            </div>
          )}

          {/* CTA Button */}
          <div className="pt-2 flex justify-center">
            <div className="w-full max-w-sm">
              {getCTAButton()}
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Host */}
          {hostProfile && (
            <Card 
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate(`/host/${hostProfile.id}`)}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  {hostProfile.avatar_url ? (
                    <AvatarImage src={hostProfile.avatar_url} alt={getHostDisplayName() || 'Host'} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {t('host.title')}
                  </p>
                  <p className="font-medium truncate">
                    {getHostDisplayName() || (i18n.language === 'de' ? 'Unbekannt' : 'Unknown')}
                  </p>
                  {hostProfile.username && hostProfile.first_name && (
                    <p className="text-sm text-muted-foreground">@{hostProfile.username}</p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Map at the bottom */}
          {event.location && (
            <LocationMapPreview location={event.location} showMapOnly />
          )}
        </div>
        </div>
      </div>

      {/* Join Sheet */}
      <JoinEventSheet
        open={showJoinSheet}
        onOpenChange={setShowJoinSheet}
        eventId={id!}
        onSuccess={handleJoinSuccess}
        isPaidEvent={event.is_paid}
        priceCents={event.price_cents}
        currency={event.currency}
        eventName={event.name}
      />

      {/* Participants List Sheet */}
      <Sheet open={showParticipantsList} onOpenChange={setShowParticipantsList}>
        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader>
            <SheetTitle>{t('participantsList.title')}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2 overflow-y-auto max-h-[calc(70vh-100px)]">
            {participants.map((participant, index) => (
              <div key={participant.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div
                  className={`w-10 h-10 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white text-xs font-medium`}
                >
                  {getInitials(participant.name)}
                </div>
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

      <Footer />
    </div>
  );
}
