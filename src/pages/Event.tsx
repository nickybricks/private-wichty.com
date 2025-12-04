import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Users, Gift, Settings, Calendar, MapPin } from "lucide-react";
import { JoinEventSheet } from "@/components/JoinEventSheet";
import { ParticipantsList } from "@/components/ParticipantsList";
import { DrawAnimation } from "@/components/DrawAnimation";
import { EditEventSheet } from "@/components/EditEventSheet";
import { LocationMapPreview } from "@/components/LocationMapPreview";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";

interface Event {
  id: string;
  name: string;
  target_participants: number;
  status: "waiting" | "active" | "completed";
  image_url: string | null;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  user_id: string | null;
}

interface Participant {
  id: string;
  name: string;
  wish: string;
  has_spun: boolean;
  assigned_to: string | null;
  user_id: string;
}

export default function Event() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('event');
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinSheet, setShowJoinSheet] = useState(false);
  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null);
  const [showDraw, setShowDraw] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [user, setUser] = useState<any>(null);

  const dateLocale = i18n.language === 'de' ? de : enUS;

  useEffect(() => {
    if (!id) {
      navigate("/");
      return;
    }

    checkAuth();
    fetchEventData();
    subscribeToChanges();
  }, [id]);

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

      const { data: participantsData, error: participantsError } = await supabase
        .from("participants")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: true });

      if (participantsError) throw participantsError;
      setParticipants(participantsData || []);

      // Check if current user is a participant
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userParticipant = participantsData?.find((p) => p.user_id === user.id);
        if (userParticipant) {
          setCurrentParticipantId(userParticipant.id);
          localStorage.setItem(`participant_${id}`, userParticipant.id);
        } else {
          setShowJoinSheet(true);
        }
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

  const handleJoinSuccess = (participantId: string) => {
    setCurrentParticipantId(participantId);
    localStorage.setItem(`participant_${id}`, participantId);
    setShowJoinSheet(false);
    toast.success(t('joinSuccess'));
    fetchEventData();
  };

  const handleStartDraw = () => {
    if (!currentParticipantId) return;
    setShowDraw(true);
  };

  const handleDrawComplete = () => {
    setShowDraw(false);
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

  const isEventReady = event.status === "active";
  const hasUserSpun = participants.find((p) => p.id === currentParticipantId)?.has_spun;
  const canDraw = isEventReady && !hasUserSpun;
  const isHost = user && event.user_id === user.id;
  const waitingCount = event.target_participants - participants.length;

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} showBackButton={true} />
      <div className="p-4 md:p-8">
        <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
        
        {/* Event Image - Square */}
        <div className="w-full aspect-square rounded-xl overflow-hidden shadow-strong bg-muted">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Gift className="h-24 w-24 text-muted-foreground" />
            </div>
          )}
        </div>
        
        {/* Event Title & Details */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
            {isHost && (
              <Button 
                variant="ghost" 
                size="icon"
                className="shrink-0"
                onClick={() => setShowEditSheet(true)}
              >
                <Settings className="h-5 w-5 text-muted-foreground" />
              </Button>
            )}
          </div>
          
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
          
          {/* Location with Map */}
          {event.location ? (
            <LocationMapPreview location={event.location} />
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">
                {t('noLocation')}
              </span>
            </div>
          )}
        </div>

        {/* Event Status Card */}
        <Card className="p-6 shadow-medium">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {participants.length} / {event.target_participants} {t('participants')}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={copyEventLink}>
                {t('shareLink')}
              </Button>
            </div>

            {!isEventReady && (
              <p className="text-sm text-muted-foreground">
                {t('waitingFor', { count: waitingCount })}
              </p>
            )}

            {isEventReady && (
              <div className="flex items-center gap-2 text-primary">
                <Gift className="h-5 w-5" />
                <span className="font-medium">{t('readyToPlay')}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Participants List */}
        <ParticipantsList 
          participants={participants} 
          eventStatus={event.status}
          onUpdate={fetchEventData}
        />

        {/* Draw Button */}
        {canDraw && currentParticipantId && (
          <Button
            size="lg"
            className="w-full h-14 text-lg shadow-medium"
            onClick={handleStartDraw}
          >
            <Gift className="mr-2 h-5 w-5" />
            {t('startDraw')}
          </Button>
        )}

        {hasUserSpun && (
          <Card className="p-6 shadow-medium bg-secondary/50">
            <p className="text-center text-muted-foreground">
              {t('alreadyDrawn')}
            </p>
          </Card>
        )}
        </div>
      </div>

      {/* Join Sheet */}
      <JoinEventSheet
        open={showJoinSheet}
        onOpenChange={setShowJoinSheet}
        eventId={id!}
        onSuccess={handleJoinSuccess}
      />

      {/* Draw Animation */}
      {showDraw && currentParticipantId && (
        <DrawAnimation
          participantId={currentParticipantId}
          onComplete={handleDrawComplete}
        />
      )}

      {/* Edit Event Sheet */}
      {isHost && (
        <EditEventSheet
          open={showEditSheet}
          onOpenChange={setShowEditSheet}
          event={{
            id: event.id,
            target_participants: event.target_participants,
            event_date: event.event_date,
            event_time: event.event_time,
            location: event.location,
            image_url: event.image_url,
          }}
          currentParticipantCount={participants.length}
          onSuccess={fetchEventData}
        />
      )}
      <Footer />
    </div>
  );
}
