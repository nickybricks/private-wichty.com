import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CreateEventDrawer } from "@/components/CreateEventDrawer";
import { EventPreviewSheet } from "@/components/EventPreviewSheet";
import { EventCardUnified } from "@/components/EventCardUnified";

interface Event {
  id: string;
  name: string;
  target_participants: number;
  status: "waiting" | "active" | "completed";
  created_at: string;
  user_id: string;
  image_url: string | null;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
}

interface Participant {
  id: string;
  name: string;
}

interface EventWithParticipants extends Event {
  participant_count: number;
  is_creator: boolean;
  user_has_joined: boolean;
  participants: Participant[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');
  const { t: tc, i18n } = useTranslation('common');
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventWithParticipants[]>([]);
  const [user, setUser] = useState<any>(null);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventPreviewOpen, setEventPreviewOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchEvents();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
  };

  const fetchEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch events created by user
      const { data: createdEvents, error: createdError } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (createdError) throw createdError;

      // Fetch events where user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from("participants")
        .select("event_id")
        .eq("user_id", user.id);

      if (participantError) throw participantError;

      const participantEventIds = participantData.map((p) => p.event_id);

      let joinedEvents: Event[] = [];
      if (participantEventIds.length > 0) {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .in("id", participantEventIds)
          .order("created_at", { ascending: false });

        if (error) throw error;
        joinedEvents = data || [];
      }

      // Combine and deduplicate events
      const allEventIds = new Set([
        ...createdEvents.map((e) => e.id),
        ...joinedEvents.map((e) => e.id),
      ]);

      const eventsWithDetails = await Promise.all(
        Array.from(allEventIds).map(async (eventId) => {
          const event = createdEvents.find((e) => e.id === eventId) || 
                        joinedEvents.find((e) => e.id === eventId);
          
          if (!event) return null;

          // Get participants with names
          const { data: participantsData, count } = await supabase
            .from("participants")
            .select("id, name", { count: "exact" })
            .eq("event_id", eventId)
            .limit(5);

          return {
            ...event,
            participant_count: count || 0,
            participants: participantsData || [],
            is_creator: event.user_id === user.id,
            user_has_joined: participantEventIds.includes(eventId),
          };
        })
      );

      // Sort by event_date ascending (upcoming first), events without date at the end
      const sortedEvents = eventsWithDetails
        .filter(Boolean)
        .sort((a, b) => {
          if (!a!.event_date && !b!.event_date) return 0;
          if (!a!.event_date) return 1;
          if (!b!.event_date) return -1;
          return new Date(a!.event_date).getTime() - new Date(b!.event_date).getTime();
        });

      setEvents(sortedEvents as EventWithParticipants[]);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error(t('errors.loadingEvents'));
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      
      <div className="max-w-[var(--max-width)] mx-auto p-4 md:p-8 space-y-6 animate-fade-in">
        {/* Dashboard Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('subtitle')}
            </p>
          </div>
          
          {/* Filter Toggle */}
          <div className="inline-flex rounded-xl bg-muted p-1">
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                filter === 'upcoming'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('filter.upcoming')}
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                filter === 'past'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('filter.past')}
            </button>
          </div>
        </div>

        {/* Events List */}
        {(() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const filteredEvents = events.filter(event => {
            if (!event.event_date) return filter === 'upcoming';
            const eventDate = new Date(event.event_date);
            return filter === 'upcoming' ? eventDate >= today : eventDate < today;
          });

          if (filteredEvents.length === 0) {
            return (
              <Card className="p-12 text-center shadow-medium">
                <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {filter === 'upcoming' ? t('empty.title') : t('empty.pastTitle')}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {filter === 'upcoming' ? t('empty.subtitle') : t('empty.pastSubtitle')}
                </p>
                {filter === 'upcoming' && (
                  <Button onClick={() => setCreateDrawerOpen(true)}>
                    {t('empty.button')}
                  </Button>
                )}
              </Card>
            );
          }

          return (
            <div className="grid gap-3 md:gap-4">
              {filteredEvents.map((event) => (
                <EventCardUnified
                  key={event.id}
                  event={event}
                  participants={event.participants}
                  participantCount={event.participant_count}
                  showAvatars={true}
                  onClick={() => {
                    setSelectedEventId(event.id);
                    setEventPreviewOpen(true);
                  }}
                />
              ))}
            </div>
          );
        })()}

        {/* New Event Button */}
        <Button
          size="lg"
          onClick={() => setCreateDrawerOpen(true)}
          className="w-full shadow-medium"
        >
          <Plus className="mr-2 h-5 w-5" />
          {t('newEvent')}
        </Button>
      </div>
      <Footer />
      
      <CreateEventDrawer 
        open={createDrawerOpen} 
        onOpenChange={setCreateDrawerOpen} 
      />
      
      <EventPreviewSheet
        eventId={selectedEventId}
        open={eventPreviewOpen}
        onOpenChange={setEventPreviewOpen}
        user={user}
      />
    </div>
  );
}
