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
import { Loader2, User, CreditCard, Check, Clock, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { AuthDialog } from "@/components/AuthDialog";
import { SelectedTicket } from "@/components/TicketCategorySelector";

interface JoinEventSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onSuccess: () => void;
  isPaidEvent?: boolean;
  priceCents?: number;
  currency?: string;
  eventName?: string;
  requiresApproval?: boolean;
  selectedTickets?: SelectedTicket[];
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
  requiresApproval = false,
  selectedTickets = [],
}: JoinEventSheetProps) {
  const { t, i18n } = useTranslation('event');
  const { t: tf } = useTranslation('forms');
  const { t: ta } = useTranslation('auth');
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [existingRequest, setExistingRequest] = useState<{ status: string } | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Check auth when sheet opens
  useEffect(() => {
    if (open) {
      setAuthChecked(false);
      checkAuthAndFetchProfile();
    }
  }, [open]);

  useEffect(() => {
    if (open && authChecked && userId && requiresApproval) {
      checkExistingRequest();
    }
  }, [open, authChecked, userId, requiresApproval]);

  const checkAuthAndFetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // User not logged in - show auth dialog
      setAuthChecked(true);
      setShowAuthDialog(true);
      return;
    }

    setUserId(user.id);
    setAuthChecked(true);
    
    // Fetch profile
    setLoadingProfile(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, first_name, last_name, username")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
        if (profile.first_name) {
          setFirstName(profile.first_name);
        }
        if (profile.last_name) {
          setLastName(profile.last_name);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleAuthSuccess = async () => {
    setShowAuthDialog(false);
    // Re-check auth and fetch profile after successful login
    await checkAuthAndFetchProfile();
  };

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
        // Pre-fill names from profile
        if (profile.first_name) {
          setFirstName(profile.first_name);
        }
        if (profile.last_name) {
          setLastName(profile.last_name);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const checkExistingRequest = async () => {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from("join_requests")
        .select("status")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .single();
      
      setExistingRequest(data);
    } else {
      const { data } = await supabase
        .from("join_requests")
        .select("status")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .single();
      
      setExistingRequest(data);
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

  // Price is now passed from parent (already calculated)
  const totalPrice = priceCents;
  const totalCurrency = currency;
  const hasSelectedTickets = selectedTickets.length > 0;

  const handleJoinRequest = async (displayName: string) => {
    // Create join request instead of direct participant
    const { error } = await supabase
      .from("join_requests")
      .insert({
        event_id: eventId,
        user_id: userId!,
        name: displayName,
        status: 'pending',
      });

    if (error) {
      if (error.code === '23505') {
        toast.error(t('joinRequests.alreadyRequested'));
      } else {
        throw error;
      }
      return;
    }

    // Get event details for notifications
    const { data: eventDetails } = await supabase
      .from("events")
      .select("name, event_date, event_time, location, user_id")
      .eq("id", eventId)
      .single();

    const eventUrl = `${window.location.origin}/event/${eventId}`;
    const { data: { user } } = await supabase.auth.getUser();

    // Send join_request_sent notification to guest
    if (user?.email) {
      supabase.functions.invoke('send-notification', {
        body: {
          type: 'join_request_sent',
          recipientEmail: user.email,
          recipientName: displayName,
          language: i18n.language === 'de' ? 'de' : 'en',
          eventName: eventDetails?.name || eventName,
          eventDate: eventDetails?.event_date,
          eventTime: eventDetails?.event_time,
          eventLocation: eventDetails?.location,
          eventUrl,
        },
      }).catch(err => console.error("Failed to send join request email:", err));
    }

    // Send new_join_request notification to host
    if (eventDetails?.user_id) {
      const { data: hostProfile } = await supabase
        .from("profiles")
        .select("display_name, first_name, notify_organizing")
        .eq("id", eventDetails.user_id)
        .single();

      if (hostProfile?.notify_organizing !== false) {
        supabase.functions.invoke('send-notification', {
          body: {
            type: 'new_join_request',
            recipientUserId: eventDetails.user_id,
            recipientName: hostProfile?.first_name || hostProfile?.display_name || 'Host',
            language: i18n.language === 'de' ? 'de' : 'en',
            eventName: eventDetails?.name || eventName,
            eventDate: eventDetails?.event_date,
            eventTime: eventDetails?.event_time,
            eventLocation: eventDetails?.location,
            eventUrl,
            participantName: displayName,
          },
        }).catch(err => console.error("Failed to send host notification:", err));
      }
    }

    toast.success(t('joinRequests.requestSent'));
    onOpenChange(false);
  };

  const handleJoin = async () => {
    let displayName = "";
    
    // If anonymous, use "Anonym" as display name
    if (isAnonymous) {
      displayName = i18n.language === 'de' ? 'Anonym' : 'Anonymous';
    } else {
      const firstNameTrimmed = firstName.trim();
      const lastNameTrimmed = lastName.trim();
      
      // Build display name from first/last or fallback to profile
      if (firstNameTrimmed && lastNameTrimmed) {
        displayName = `${firstNameTrimmed} ${lastNameTrimmed}`;
      } else if (firstNameTrimmed) {
        displayName = firstNameTrimmed;
      } else {
        displayName = getProfileDisplayName(userProfile);
      }
      
      if (!displayName) {
        toast.error(i18n.language === 'de' ? 'Bitte gib deinen Vor- und Nachnamen ein' : 'Please enter your first and last name');
        return;
      }
    }

    if (!userId) {
      toast.error(ta('errors.pleaseLogin'));
      return;
    }

    setLoading(true);

    try {
      // If user entered names and didn't have them before, save to their profile (only if not anonymous)
      if (!isAnonymous && firstName.trim() && !hasProfile && userId) {
        await supabase
          .from("profiles")
          .update({ 
            first_name: firstName.trim(),
            last_name: lastName.trim() || null
          })
          .eq("id", userId);
      }

      // For events requiring approval (non-paid), create a join request
      if (requiresApproval && !isPaidEvent) {
        await handleJoinRequest(displayName);
        return;
      }

      // For paid events, redirect to Stripe checkout
      if (isPaidEvent && totalPrice > 0) {

        const { data: { session } } = await supabase.auth.getSession();
        
        const { data, error } = await supabase.functions.invoke('create-event-checkout', {
          body: {
            event_id: eventId,
            participant_name: displayName,
            selected_tickets: selectedTickets,
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
      const { data: participantData, error } = await supabase
        .from("participants")
        .insert({
          event_id: eventId,
          name: displayName,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;

      // Create ticket for the participant
      const ticketCode = `EVT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      await supabase
        .from("tickets")
        .insert({
          participant_id: participantData.id,
          event_id: eventId,
          ticket_code: ticketCode,
        });

      // Get user email and event details for confirmation email
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const { data: eventDetails } = await supabase
          .from("events")
          .select("name, event_date, event_time, location, user_id")
          .eq("id", eventId)
          .single();

        // Use production URL for emails (not preview URL)
        const baseUrl = window.location.hostname.includes('lovable.app') 
          ? 'https://wichty.com' 
          : window.location.origin;
        const ticketUrl = `${baseUrl}/ticket/${ticketCode}`;
        const eventUrl = `${baseUrl}/event/${eventId}`;

        // Send RSVP confirmation email to guest (fire and forget)
        supabase.functions.invoke('send-notification', {
          body: {
            type: 'ticket_rsvp',
            recipientEmail: user.email,
            recipientName: displayName,
            language: i18n.language === 'de' ? 'de' : 'en',
            eventName: eventDetails?.name || '',
            eventDate: eventDetails?.event_date,
            eventTime: eventDetails?.event_time,
            eventLocation: eventDetails?.location,
            eventUrl,
            ticketUrl,
          },
        }).catch(err => console.error("Failed to send RSVP email:", err));

        // Send notification to host (if they have notifications enabled)
        if (eventDetails?.user_id) {
          const { data: hostProfile } = await supabase
            .from("profiles")
            .select("display_name, first_name, last_name, notify_organizing")
            .eq("id", eventDetails.user_id)
            .single();

          // Since we can't get host email from client, we'll use send-notification with user_id
          if (hostProfile?.notify_organizing !== false) {
            supabase.functions.invoke('send-notification', {
              body: {
                type: 'new_rsvp',
                recipientUserId: eventDetails.user_id,
                recipientName: hostProfile?.first_name || hostProfile?.display_name || 'Host',
                language: i18n.language === 'de' ? 'de' : 'en',
                eventName: eventDetails?.name || '',
                eventDate: eventDetails?.event_date,
                eventTime: eventDetails?.event_time,
                eventLocation: eventDetails?.location,
                eventUrl,
                participantName: displayName,
              },
            }).catch(err => console.error("Failed to send host notification:", err));
          }
        }
      }

      onSuccess();
      setFirstName("");
      setLastName("");
    } catch (error: any) {
      console.error("Error joining event:", error);
      toast.error(error.message || t('join.error'));
    } finally {
      setLoading(false);
    }
  };

  const profileName = getProfileDisplayName(userProfile);
  const hasProfile = !!profileName;

  // If user has a pending request, show status
  if (existingRequest?.status === 'pending') {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader className="space-y-3 pb-6">
            <SheetTitle className="text-2xl">{t('join.title')}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <p className="text-lg font-medium text-center">{t('joinRequests.requestPending')}</p>
            <p className="text-muted-foreground text-center">
              {i18n.language === 'de' 
                ? 'Der Veranstalter wird deine Anfrage prüfen.' 
                : 'The host will review your request.'}
            </p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
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
          ) : requiresApproval ? (
            <SheetDescription>
              {i18n.language === 'de' 
                ? 'Deine Anfrage wird vom Veranstalter geprüft.' 
                : 'Your request will be reviewed by the host.'}
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
          {isPaidEvent && totalPrice > 0 && (
            <Badge variant="secondary" className="w-fit gap-1.5">
              <CreditCard className="h-3 w-3" />
              {formatPrice(totalPrice, totalCurrency)}
            </Badge>
          )}
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* Anonymous Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">
                  {i18n.language === 'de' ? 'Anonym teilnehmen' : 'Join anonymously'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {i18n.language === 'de' ? 'Dein Name wird nicht angezeigt' : 'Your name won\'t be shown'}
                </p>
              </div>
            </div>
            <Switch
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
          </div>

          {loadingProfile ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className={`transition-opacity duration-200 ${isAnonymous ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              {hasProfile ? (
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
                // No profile name - ask for first and last name
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-sm text-amber-800">
                      {i18n.language === 'de' 
                        ? 'Du hast noch keinen Namen in deinem Profil hinterlegt. Der Name wird automatisch gespeichert.' 
                        : "You haven't set a name in your profile yet. The name will be saved automatically."}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-base">
                        {i18n.language === 'de' ? 'Vorname' : 'First name'}
                      </Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder={i18n.language === 'de' ? 'Max' : 'John'}
                        disabled={isAnonymous}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-base">
                        {i18n.language === 'de' ? 'Nachname' : 'Last name'}
                      </Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder={i18n.language === 'de' ? 'Mustermann' : 'Doe'}
                        disabled={isAnonymous}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
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
                {requiresApproval && !isPaidEvent ? t('join.requestLoading') : t('join.loading')}
              </>
            ) : isPaidEvent && priceCents > 0 ? (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                {i18n.language === 'de' 
                  ? `${formatPrice(priceCents, currency)} zahlen` 
                  : `Pay ${formatPrice(priceCents, currency)}`}
              </>
            ) : requiresApproval ? (
              t('join.requestButton')
            ) : (
              t('join.button')
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>

    <AuthDialog
      open={showAuthDialog}
      onOpenChange={(open) => {
        setShowAuthDialog(open);
        // If user closes auth dialog without logging in, close the sheet too
        if (!open && !userId) {
          onOpenChange(false);
        }
      }}
      onSuccess={handleAuthSuccess}
      defaultTab="signup"
    />
  </>
  );
}
