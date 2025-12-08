import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CitySelector } from "@/components/explore/CitySelector";
import { CategoryChips } from "@/components/explore/CategoryChips";
import { CityCards } from "@/components/explore/CityCards";
import { PopularEventsCarousel } from "@/components/explore/PopularEventsCarousel";
import { EventPreviewSheet } from "@/components/EventPreviewSheet";
import { DEFAULT_CITY } from "@/data/cities";
import { Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function Explore() {
  const { t, i18n } = useTranslation("explore");
  const navigate = useNavigate();
  const language = (i18n.language?.startsWith("de") ? "de" : "en") as "de" | "en";

  const [user, setUser] = useState<any>(null);
  const [currentCity, setCurrentCity] = useState<string>(DEFAULT_CITY);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  
  // Event Preview Sheet state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventPreviewOpen, setEventPreviewOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, []);

  // Fetch available tags and cities from events
  useEffect(() => {
    const fetchAvailableFilters = async () => {
      const { data } = await supabase
        .from("events")
        .select("tags, city")
        .eq("is_public", true);

      if (data) {
        const tags = new Set<string>();
        const cities = new Set<string>();

        data.forEach(event => {
          if (event.tags) {
            event.tags.forEach((tag: string) => tags.add(tag));
          }
          if (event.city) {
            cities.add(event.city);
          }
        });

        setAvailableTags(Array.from(tags));
        setAvailableCities(Array.from(cities));
      }
    };

    fetchAvailableFilters();
  }, []);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
            );
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.village || DEFAULT_CITY;
            setCurrentCity(city);
          } catch (error) {
            console.log("Geocoding failed, using default city");
            setCurrentCity(DEFAULT_CITY);
          }
        },
        () => {
          console.log("Location denied, using default city");
          setCurrentCity(DEFAULT_CITY);
        }
      );
    }
  }, []);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("events")
          .select("*")
          .eq("is_public", true)
          .order("attendance_count", { ascending: false })
          .order("view_count", { ascending: false });

        // Filter by city if not "All"
        if (currentCity) {
          query = query.ilike("city", `%${currentCity}%`);
        }

        // Filter by multiple tags (OR logic)
        if (selectedTags.length > 0) {
          query = query.overlaps("tags", selectedTags);
        }

        const { data, error } = await query.limit(50);

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
  }, [currentCity, selectedTags]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSelectAll = () => {
    setSelectedTags([]);
  };

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setEventPreviewOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>{t("title")} | wichty</title>
        <meta name="description" content={`${t("popularEvents")} ${currentCity}`} />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header user={user} />

        <main className="max-w-[var(--max-width)] mx-auto p-4 md:p-8 space-y-6 flex-1">
          {/* City Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowCitySelector(true)}
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <span>{t("popularEvents")}</span>
              <span className="text-primary">{currentCity}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => navigate(`/explore/city/${encodeURIComponent(currentCity)}`)}
              className="text-sm text-primary font-medium"
            >
              {t("showAll")}
            </button>
          </div>

          {/* Popular Events */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <PopularEventsCarousel 
              events={events} 
              language={language} 
              onEventClick={handleEventClick}
            />
          )}

          {/* Category Chips */}
          <CategoryChips
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
            onSelectAll={handleSelectAll}
            availableTags={availableTags}
            language={language}
          />

          {/* City Cards */}
          <CityCards availableCities={availableCities} />
        </main>

        <Footer />

        <CitySelector
          open={showCitySelector}
          onOpenChange={setShowCitySelector}
          onCitySelect={setCurrentCity}
          currentCity={currentCity}
        />

        {selectedEventId && (
          <EventPreviewSheet
            eventId={selectedEventId}
            open={eventPreviewOpen}
            onOpenChange={setEventPreviewOpen}
            user={user}
          />
        )}
      </div>
    </>
  );
}
