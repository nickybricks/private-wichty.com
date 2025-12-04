import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Gift, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CreateEventDrawer } from "@/components/CreateEventDrawer";

interface Event {
  id: string;
  name: string;
  target_participants: number;
  status: "waiting" | "active" | "completed";
  created_at: string;
  user_id: string;
  image_url: string | null;
  event_date: string | null;
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

  const formatDate = (dateString: string) => {
    const locale = i18n.language === 'de' ? 'de-DE' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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
      
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 animate-fade-in">
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
                <Gift className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
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
            <div className="grid gap-4">
              {filteredEvents.map((event) => (
              <Card
                key={event.id}
                className="p-5 shadow-medium hover:shadow-strong transition-shadow cursor-pointer"
                onClick={() => navigate(`/event/${event.id}`)}
              >
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    {event.image_url ? (
                      <img
                        src={event.image_url}
                        alt={event.name}
                        className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-20 h-20 md:w-24 md:h-24 bg-muted rounded-xl flex items-center justify-center">
                        <Gift className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Date/Time */}
                    {event.event_date && (
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.event_date)}
                      </p>
                    )}

                    {/* Title */}
                    <h3 className="text-lg font-semibold truncate">{event.name}</h3>

                    {/* Location */}
                    {event.location && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm truncate">{event.location}</span>
                      </div>
                    )}

                    {/* Participant Avatars */}
                    {event.participant_count > 0 && (
                      <div className="flex items-center pt-1">
                        <div className="flex -space-x-1">
                          {event.participants.slice(0, 5).map((participant, index) => (
                            <div
                              key={participant.id}
                              className={`w-[1.125rem] h-[1.125rem] rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white text-[7px] font-medium ring-[1.5px] ring-background`}
                              title={participant.name}
                            >
                              {getInitials(participant.name)}
                            </div>
                          ))}
                          {event.participant_count > 5 && (
                            <div className="h-[1.125rem] px-1 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-[7px] font-medium ring-[1.5px] ring-background">
                              +{event.participant_count - 5}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
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
    </div>
  );
}
