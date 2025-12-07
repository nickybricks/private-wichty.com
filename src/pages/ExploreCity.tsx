import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { CitySelector } from "@/components/explore/CitySelector";
import { CategoryChips } from "@/components/explore/CategoryChips";
import { EventCard } from "@/components/explore/EventCard";
import { DEFAULT_CITY } from "@/data/cities";
import { Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { de, enUS } from "date-fns/locale";

export default function ExploreCity() {
  const { cityName } = useParams<{ cityName: string }>();
  const { t, i18n } = useTranslation("explore");
  const navigate = useNavigate();
  const language = (i18n.language?.startsWith("de") ? "de" : "en") as "de" | "en";

  const [user, setUser] = useState<any>(null);
  const [currentCity, setCurrentCity] = useState<string>(decodeURIComponent(cityName || DEFAULT_CITY));
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (cityName) {
      setCurrentCity(decodeURIComponent(cityName));
    }
  }, [cityName]);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("events")
          .select("*")
          .eq("is_public", true)
          .ilike("city", `%${currentCity}%`)
          .order("event_date", { ascending: true });

        if (selectedTag) {
          query = query.contains("tags", [selectedTag]);
        }

        const { data, error } = await query;

        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [currentCity, selectedTag]);

  const handleCityChange = (city: string) => {
    setCurrentCity(city);
    navigate(`/explore/city/${encodeURIComponent(city)}`, { replace: true });
  };

  const handleTagSelect = (tag: string | null) => {
    setSelectedTag(tag);
  };

  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const dateKey = event.event_date || "no-date";
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(event);
    return groups;
  }, {} as Record<string, any[]>);

  const formatDateHeader = (dateStr: string) => {
    if (dateStr === "no-date") return "";
    try {
      const date = parseISO(dateStr);
      if (isToday(date)) return t("today");
      if (isTomorrow(date)) return t("tomorrow");
      return format(date, "EEEE, d. MMMM yyyy", { locale: language === "de" ? de : enUS });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <Helmet>
        <title>{t("eventsIn")} {currentCity} | wichty</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header user={user} showBackButton />

        <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/explore")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <button
              onClick={() => setShowCitySelector(true)}
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <span>{t("eventsIn")}</span>
              <span className="text-primary">{currentCity}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Category Chips */}
          <CategoryChips
            selectedTag={selectedTag}
            onTagSelect={handleTagSelect}
            language={language}
          />

          {/* Events List grouped by date */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {t("noEventsInCity", { city: currentCity })}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedEvents).map(([dateKey, dateEvents]) => (
                <div key={dateKey} className="space-y-3">
                  {dateKey !== "no-date" && (
                    <h3 className="text-sm font-semibold text-muted-foreground sticky top-0 bg-background py-2">
                      {formatDateHeader(dateKey)}
                    </h3>
                  )}
                  {(dateEvents as any[]).map((event) => (
                    <EventCard key={event.id} event={event} language={language} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </main>

        <CitySelector
          open={showCitySelector}
          onOpenChange={setShowCitySelector}
          onCitySelect={handleCityChange}
          currentCity={currentCity}
        />
      </div>
    </>
  );
}
