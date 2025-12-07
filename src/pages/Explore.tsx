import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { CitySelector } from "@/components/explore/CitySelector";
import { CategoryChips } from "@/components/explore/CategoryChips";
import { CityCards } from "@/components/explore/CityCards";
import { PopularEventsCarousel } from "@/components/explore/PopularEventsCarousel";
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

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Reverse geocoding using a simple approach
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

        // Filter by tag
        if (selectedTag) {
          query = query.contains("tags", [selectedTag]);
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
  }, [currentCity, selectedTag]);

  const handleTagSelect = (tag: string | null) => {
    if (tag) {
      navigate(`/explore/category/${tag}?city=${encodeURIComponent(currentCity)}`);
    } else {
      setSelectedTag(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t("title")} | wichty</title>
        <meta name="description" content={`${t("popularEvents")} ${currentCity}`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header user={user} />

        <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
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
            <PopularEventsCarousel events={events} language={language} />
          )}

          {/* Category Chips */}
          <CategoryChips
            selectedTag={selectedTag}
            onTagSelect={handleTagSelect}
            language={language}
          />

          {/* City Cards */}
          <CityCards />
        </main>

        <CitySelector
          open={showCitySelector}
          onOpenChange={setShowCitySelector}
          onCitySelect={setCurrentCity}
          currentCity={currentCity}
        />
      </div>
    </>
  );
}
