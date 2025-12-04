import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User, Calendar, MapPin } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface HostProfile {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface Event {
  id: string;
  name: string;
  event_date: string | null;
  location: string | null;
  image_url: string | null;
}

export default function HostProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('event');
  const [profile, setProfile] = useState<HostProfile | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!id) {
      navigate("/");
      return;
    }
    checkAuth();
    fetchHostData();
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
    }
  };

  const fetchHostData = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name, first_name, last_name, username, avatar_url")
        .eq("id", id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("id, name, event_date, location, image_url")
        .eq("user_id", id)
        .eq("is_public", true)
        .order("event_date", { ascending: false });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);
    } catch (error) {
      console.error("Error fetching host data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getHostDisplayName = () => {
    if (!profile) return null;
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile.display_name) return profile.display_name;
    if (profile.username) return `@${profile.username}`;
    return i18n.language === 'de' ? 'Unbekannt' : 'Unknown';
  };

  const formatDate = (dateString: string) => {
    const locale = i18n.language === 'de' ? 'de-DE' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} showBackButton={true} />
      <div className="p-4 md:p-8">
        <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
          {/* Host Header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              {profile.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={getHostDisplayName() || 'Host'} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{getHostDisplayName()}</h1>
              {profile.username && profile.first_name && (
                <p className="text-muted-foreground">@{profile.username}</p>
              )}
            </div>
          </div>

          {/* Events */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              {i18n.language === 'de' ? 'Events' : 'Events'}
            </h2>
            
            {events.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  {i18n.language === 'de' ? 'Keine öffentlichen Events' : 'No public events'}
                </p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {events.map((event) => (
                  <Card
                    key={event.id}
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/event/${event.id}`)}
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        {event.image_url ? (
                          <img
                            src={event.image_url}
                            alt={event.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        {event.event_date && (
                          <p className="text-sm text-muted-foreground">
                            {formatDate(event.event_date)}
                          </p>
                        )}
                        <h3 className="font-semibold truncate">{event.name}</h3>
                        {event.location && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="text-sm truncate">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
