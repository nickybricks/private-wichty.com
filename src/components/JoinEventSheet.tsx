import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, CreditCard, Check } from "lucide-react";
import { toast } from "sonner";

interface JoinEventSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onSuccess: () => void;
  isPaidEvent?: boolean;
  priceCents?: number;
  currency?: string;
  eventName?: string;
}

interface UserProfile {
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
}

export function JoinEventSheet({
  open,
  onOpenChange,
  eventId,
  onSuccess,
  isPaidEvent = false,
  priceCents = 0,
  currency = 'eur',
  eventName = '',
}: JoinEventSheetProps) {
  const { t, i18n } = useTranslation('event');
  const { t: ta } = useTranslation('auth');
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user profile when sheet opens
  useEffect(() => {
    if (open) {
      fetchUserProfile();
    }
  }, [open]);

  const fetchUserProfile = async () => {
    setLoadingProfile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserProfile(null);
        setUserId(null);
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, first_name, last_name, username")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
        // Pre-fill name from profile
        const profileName = getProfileDisplayName(profile);
        if (profileName) {
          setName(profileName);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const getProfileDisplayName = (profile: UserProfile | null): string => {
    if (!profile) return "";
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile.display_name) return profile.display_name;
    if (profile.first_name) return profile.first_name;
    if (profile.username) return profile.username;
    return "";
  };

  const formatPrice = (cents: number, curr: string) => {
    return new Intl.NumberFormat(i18n.language === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: curr.toUpperCase(),
    }).format(cents / 100);
  };

  const handleJoin = async () => {
    const displayName = name.trim() || getProfileDisplayName(userProfile);
    
    if (!displayName) {
      toast.error(i18n.language === 'de' ? 'Bitte gib deinen Namen ein' : 'Please enter your name');
      return;
    }

    if (!userId) {
      toast.error(ta('errors.pleaseLogin'));
      return;
    }

    setLoading(true);

    try {
      // For paid events, redirect to Stripe checkout
      if (isPaidEvent && priceCents > 0) {
        const { data: { session } } = await supabase.auth.getSession();
        
        const { data, error } = await supabase.functions.invoke('create-event-checkout', {
          body: {
            event_id: eventId,
            participant_name: displayName,
          },
          headers: session ? {
            Authorization: `Bearer ${session.access_token}`,
          } : undefined,
        });

        if (error) throw error;

        if (data?.url) {
          window.open(data.url, '_blank');
          toast.success(i18n.language === 'de' 
            ? 'Zahlung wird im neuen Tab geöffnet...' 
            : 'Opening payment in new tab...');
          onOpenChange(false);
        }
        return;
      }

      // For free events, directly add participant
      const { error } = await supabase
        .from("participants")
        .insert({
          event_id: eventId,
          name: displayName,
          user_id: userId,
        });

      if (error) throw error;

      onSuccess();
      setName("");
    } catch (error: any) {
      console.error("Error joining event:", error);
      toast.error(error.message || t('join.error'));
    } finally {
      setLoading(false);
    }
  };

  const profileName = getProfileDisplayName(userProfile);
  const hasProfile = !!profileName;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto">
        <SheetHeader className="space-y-3 pb-6">
          <SheetTitle className="text-2xl">{t('join.title')}</SheetTitle>
          {isPaidEvent && priceCents > 0 ? (
            <SheetDescription>
              {i18n.language === 'de' 
                ? 'Schließe den Kauf ab, um am Event teilzunehmen.' 
                : 'Complete your purchase to join the event.'}
            </SheetDescription>
          ) : (
            <SheetDescription>
              {hasProfile 
                ? (i18n.language === 'de' 
                    ? `Du wirst als "${profileName}" teilnehmen.` 
                    : `You'll join as "${profileName}".`)
                : t('join.description')}
            </SheetDescription>
          )}
          {isPaidEvent && priceCents > 0 && (
            <Badge variant="secondary" className="w-fit gap-1.5">
              <CreditCard className="h-3 w-3" />
              {formatPrice(priceCents, currency)}
            </Badge>
          )}
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {loadingProfile ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : hasProfile ? (
            // User has a profile - show confirmation
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{profileName}</p>
                <p className="text-sm text-muted-foreground">
                  {i18n.language === 'de' ? 'Dein Profil' : 'Your profile'}
                </p>
              </div>
              <Check className="h-5 w-5 text-green-500" />
            </div>
          ) : (
            // No profile name - ask for name
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base">
                {t('join.yourName')}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('join.namePlaceholder')}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleJoin}
            size="lg"
            className="w-full h-12 text-lg shadow-medium"
            disabled={loading || loadingProfile}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t('join.loading')}
              </>
            ) : isPaidEvent && priceCents > 0 ? (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                {i18n.language === 'de' 
                  ? `${formatPrice(priceCents, currency)} zahlen` 
                  : `Pay ${formatPrice(priceCents, currency)}`}
              </>
            ) : (
              t('join.button')
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
