import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, Image as ImageIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AuthDialog } from "./AuthDialog";

interface PendingEvent {
  name: string;
  participants: number;
  imageFile?: string;
}

export function LandingEventForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation('forms');
  const [name, setName] = useState("");
  const [participants, setParticipants] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  // Handle OAuth callback
  useEffect(() => {
    const isAuthCallback = searchParams.get("auth_callback") === "true";
    if (isAuthCallback) {
      // Check for pending event after OAuth
      const checkAuthAndCreateEvent = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const pendingEventStr = localStorage.getItem('pendingEvent');
          if (pendingEventStr) {
            await createEventFromPending(session.user.id);
          } else {
            navigate("/dashboard");
          }
        }
      };
      checkAuthAndCreateEvent();
    }
  }, [searchParams]);

  const createEventFromPending = async (userId: string) => {
    const pendingEventStr = localStorage.getItem('pendingEvent');
    if (!pendingEventStr) return;

    setLoading(true);
    try {
      const pendingEvent: PendingEvent = JSON.parse(pendingEventStr);
      
      let imageUrl = null;

      if (pendingEvent.imageFile) {
        const response = await fetch(pendingEvent.imageFile);
        const blob = await response.blob();
        const fileName = `${userId}/${Date.now()}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(fileName, blob);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('event-images')
            .getPublicUrl(fileName);
          imageUrl = publicUrl;
        }
      }

      const { data, error } = await supabase
        .from("events")
        .insert({
          name: pendingEvent.name,
          target_participants: pendingEvent.participants,
          status: "waiting",
          user_id: userId,
          image_url: imageUrl,
        })
        .select()
        .single();

      if (error) throw error;

      // Send event_created notification
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, language")
        .eq("id", userId)
        .single();

      const hostName = profile?.display_name || "Host";
      const language = profile?.language || "de";

      supabase.functions.invoke("send-notification", {
        body: {
          type: "event_created",
          recipientUserId: userId,
          recipientName: hostName,
          language,
          eventName: pendingEvent.name,
          eventUrl: `${window.location.origin}/event/${data.id}`,
        },
      }).catch((err) => console.error("Failed to send event_created notification:", err));

      localStorage.removeItem('pendingEvent');
      toast.success(t('createEvent.successCreated'));
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error(t('errors.createError'));
      localStorage.removeItem('pendingEvent');
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error(t('errors.selectImage'));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('errors.imageSize'));
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const participantCount = parseInt(participants);
    
    if (!name.trim()) {
      toast.error(t('errors.enterEventName'));
      return;
    }
    
    if (!participantCount || participantCount < 2) {
      toast.error(t('errors.minParticipants'));
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Save pending event to localStorage and show auth dialog
        const pendingEvent: PendingEvent = {
          name: name.trim(),
          participants: participantCount,
          imageFile: imagePreview || undefined,
        };
        localStorage.setItem('pendingEvent', JSON.stringify(pendingEvent));
        setLoading(false);
        setShowAuthDialog(true);
        return;
      }

      // User is logged in, create event directly
      let imageUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('event-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { data, error } = await supabase
        .from("events")
        .insert({
          name: name.trim(),
          target_participants: participantCount,
          status: "waiting",
          user_id: session.user.id,
          image_url: imageUrl,
        })
        .select()
        .single();

      if (error) throw error;

      // Send event_created notification
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, language")
        .eq("id", session.user.id)
        .single();

      const hostName = profile?.display_name || "Host";
      const language = profile?.language || "de";

      supabase.functions.invoke("send-notification", {
        body: {
          type: "event_created",
          recipientUserId: session.user.id,
          recipientName: hostName,
          language,
          eventName: name.trim(),
          eventUrl: `${window.location.origin}/event/${data.id}`,
        },
      }).catch((err) => console.error("Failed to send event_created notification:", err));

      toast.success(t('createEvent.success'));
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error(t('errors.createError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (userId: string) => {
    setShowAuthDialog(false);
    await createEventFromPending(userId);
  };

  return (
    <>
      <Card className="p-6 sm:p-8 shadow-strong bg-card/95 backdrop-blur-sm border-border/50">
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-1">{t('createEvent.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('createEvent.subtitle')}</p>
        </div>
        
        <form onSubmit={handleCreateEvent} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="landing-name" className="text-sm font-medium">
              {t('createEvent.eventName')}
            </Label>
            <Input
              id="landing-name"
              type="text"
              placeholder={t('createEvent.eventNamePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 sm:h-14 text-base"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="landing-participants" className="text-sm font-medium">
              {t('createEvent.participants')}
            </Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="landing-participants"
                type="number"
                inputMode="numeric"
                min="2"
                placeholder={t('createEvent.participantsPlaceholder')}
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                className="pl-10 h-12 sm:h-14 text-base"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="landing-image" className="text-sm font-medium">
              {t('createEvent.eventImage')} <span className="text-muted-foreground font-normal">{t('createEvent.optional')}</span>
            </Label>
            <label
              htmlFor="landing-image"
              className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt={t('createEvent.preview')}
                  className="h-full w-full object-cover rounded-xl"
                />
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-sm">{t('createEvent.uploadImage')}</span>
                </div>
              )}
              <Input
                id="landing-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-12 sm:h-14 text-base sm:text-lg shadow-strong hover:shadow-xl hover:scale-[1.02] transition-all"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t('createEvent.loading')}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                {t('createEvent.button')}
              </>
            )}
          </Button>
        </form>
      </Card>

      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onSuccess={handleAuthSuccess}
        defaultTab="signup"
      />
    </>
  );
}
