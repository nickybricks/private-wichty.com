import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CitySelector } from "@/components/explore/CitySelector";
import { CategoryChips } from "@/components/explore/CategoryChips";
import { EventCardUnified } from "@/components/EventCardUnified";
import { EventPreviewSheet } from "@/components/EventPreviewSheet";
import { getTagLabel } from "@/data/eventTags";
import { DEFAULT_CITY } from "@/data/cities";
import { Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";

export default function ExploreCategory() {
  const { tag } = useParams<{ tag: string }>();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation("explore");
  const navigate = useNavigate();
  const language = (i18n.language?.startsWith("de") ? "de" : "en") as "de" | "en";

  const [user, setUser] = useState<any>(null);
  const [currentCity, setCurrentCity] = useState<string>(searchParams.get("city") || DEFAULT_CITY);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

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

  // Fetch available tags
  useEffect(() => {
    const fetchAvailableTags = async () => {
      const { data } = await supabase
        .from("events")
        .select("tags")
        .eq("is_public", true);

      if (data) {
        const tags = new Set<string>();
        data.forEach(event => {
          if (event.tags) {
            event.tags.forEach((t: string) => tags.add(t));
          }
        });
        setAvailableTags(Array.from(tags));
      }
    };
    fetchAvailableTags();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!tag) return;

      setLoading(true);
      try {
        let query = supabase
          .from("events")
          .select("*")
          .eq("is_public", true)
          .contains("tags", [tag])
          .order("attendance_count", { ascending: false })
          .order("view_count", { ascending: false });

        if (currentCity) {
          query = query.ilike("city", `%${currentCity}%`);
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
  }, [tag, currentCity]);

  const handleTagToggle = (newTag: string) => {
    if (newTag !== tag) {
      navigate(`/explore/category/${newTag}?city=${encodeURIComponent(currentCity)}`);
    }
  };

  const handleSelectAll = () => {
    navigate(`/explore`);
  };

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setEventPreviewOpen(true);
  };

  const tagLabel = tag ? getTagLabel(tag, language) : "";

  return (
    <>
      <Helmet>
        <title>{tagLabel} in {currentCity} | wichty</title>
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header user={user} showBackButton />

        <main className="w-full max-w-[var(--max-width)] mx-auto p-4 md:p-8 space-y-6 flex-1">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/explore")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <button
              onClick={() => setShowCitySelector(true)}
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <span>{tagLabel}</span>
              <span className="text-muted-foreground">in</span>
              <span className="text-primary">{currentCity}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Category Chips */}
          <CategoryChips
            selectedTags={tag ? [tag] : []}
            onTagToggle={handleTagToggle}
            onSelectAll={handleSelectAll}
            availableTags={availableTags}
            language={language}
          />

          {/* Events List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {t("noEventsInCategory")}
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <EventCardUnified
                  key={event.id}
                  event={event}
                  participantCount={event.attendance_count}
                  showAvatars={false}
                  onClick={() => handleEventClick(event.id)}
                />
              ))}
            </div>
          )}
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
