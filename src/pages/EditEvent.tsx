import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { DateTimePopup } from "@/components/event-form/DateTimePopup";
import { LocationPopup } from "@/components/event-form/LocationPopup";
import { DescriptionPopup } from "@/components/event-form/DescriptionPopup";
import { CapacityPopup } from "@/components/event-form/CapacityPopup";
import { TicketsEditPopup } from "@/components/event-form/TicketsEditPopup";
import { 
  Loader2, 
  CalendarIcon, 
  Image as ImageIcon, 
  Users,
  BarChart3,
  Settings2,
  Trash2,
  Globe,
  Lock,
  UserCheck,
  MapPin,
  Ticket,
  ChevronRight,
  FileText,
  ScanLine
} from "lucide-react";
import { QRScanner } from "@/components/QRScanner";
import { JoinRequestsList } from "@/components/JoinRequestsList";
import { toast } from "sonner";

interface JoinRequest {
  id: string;
  user_id: string;
  name: string;
  status: string;
  created_at: string;
}

interface Event {
  id: string;
  name: string;
  description: string | null;
  target_participants: number;
  status: "waiting" | "active" | "completed";
  image_url: string | null;
  event_date: string | null;
  event_time: string | null;
  end_time: string | null;
  location: string | null;
  user_id: string;
  is_paid: boolean;
  price_cents: number;
  currency: string;
  requires_approval: boolean;
  capacity_unlimited: boolean;
  is_public: boolean;
}

interface Participant {
  id: string;
  name: string;
  user_id: string | null;
  created_at: string;
}

export default function EditEvent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('event');
  const { t: tf } = useTranslation('forms');
  const { t: tc } = useTranslation('common');
  
  const [user, setUser] = useState<any>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasTicketSales, setHasTicketSales] = useState(false);
  const [stripeConnected, setStripeConnected] = useState<boolean | null>(null);
  const [checkingStripe, setCheckingStripe] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [eventDate, setEventDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [capacityUnlimited, setCapacityUnlimited] = useState(true);
  const [maxCapacity, setMaxCapacity] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  // Popup states
  const [dateTimePopupOpen, setDateTimePopupOpen] = useState(false);
  const [locationPopupOpen, setLocationPopupOpen] = useState(false);
  const [descriptionPopupOpen, setDescriptionPopupOpen] = useState(false);
  const [capacityPopupOpen, setCapacityPopupOpen] = useState(false);
  const [ticketsPopupOpen, setTicketsPopupOpen] = useState(false);
  const [waitlistEnabled, setWaitlistEnabled] = useState(false);
  const [ticketCategoriesCount, setTicketCategoriesCount] = useState(0);

  const dateLocale = i18n.language === 'de' ? de : enUS;

  useEffect(() => {
    checkAuth();
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate(`/auth?redirect=/event/${id}/edit`);
      return;
    }
    setUser(session.user);
    fetchEventData(session.user.id);
    checkStripeStatus(session.access_token);
  };

  const checkStripeStatus = async (accessToken: string) => {
    setCheckingStripe(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-connect-status', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) {
        console.error('Error checking Stripe status:', error);
        setStripeConnected(false);
        return;
      }

      setStripeConnected(data?.charges_enabled === true);
    } catch (error) {
      console.error('Error checking Stripe status:', error);
      setStripeConnected(false);
    } finally {
      setCheckingStripe(false);
    }
  };

  const fetchEventData = async (userId: string) => {
    try {
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (eventError) throw eventError;
      if (!eventData) {
        toast.error(t('notFound'));
        navigate("/");
        return;
      }

      // Check if user is the host
      if (eventData.user_id !== userId) {
        toast.error(i18n.language === 'de' ? 'Keine Berechtigung' : 'Not authorized');
        navigate(`/event/${id}`);
        return;
      }

      setEvent(eventData);
      
      // Set form state
      setName(eventData.name);
      setDescription(eventData.description || "");
      setIsPublic(eventData.is_public ?? true);
      setEventDate(eventData.event_date ? new Date(eventData.event_date) : undefined);
      setStartTime(eventData.event_time || "");
      setEndTime(eventData.end_time || "");
      setLocation(eventData.location || "");
      setCapacityUnlimited(eventData.capacity_unlimited ?? true);
      setMaxCapacity(eventData.capacity_unlimited ? "" : eventData.target_participants.toString());
      setIsPaid(eventData.is_paid || false);
      setPrice(eventData.price_cents ? (eventData.price_cents / 100).toString() : "");
      setRequiresApproval(eventData.requires_approval || false);
      setImagePreview(eventData.image_url);
      setWaitlistEnabled(eventData.waitlist_enabled || false);

      // Fetch participants
      const { data: participantsData } = await supabase
        .from("participants")
        .select("id, name, user_id, created_at")
        .eq("event_id", id)
        .order("created_at", { ascending: true });

      setParticipants(participantsData || []);

      // Fetch join requests if approval is required
      if (eventData.requires_approval) {
        const { data: requestsData } = await supabase
          .from("join_requests")
          .select("id, user_id, name, status, created_at")
          .eq("event_id", id)
          .order("created_at", { ascending: false });

        setJoinRequests(requestsData || []);
      }
      
      // Check if there are any ticket sales (for now just check if paid event has participants)
      if (eventData.is_paid && participantsData && participantsData.length > 0) {
        setHasTicketSales(true);
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      toast.error(t('loadingError'));
    } finally {
      setLoading(false);
    }
  };

  const handlePaidToggle = (checked: boolean) => {
    if (hasTicketSales) return;
    if (checked && stripeConnected === false) {
      toast.error(
        i18n.language === 'de' 
          ? 'Bitte verbinde zuerst Stripe in den Einstellungen' 
          : 'Please connect Stripe in settings first'
      );
      return;
    }
    setIsPaid(checked);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error(tf('errors.selectImage'));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(tf('errors.imageSize'));
        return;
      }
      setImageFile(file);
      setRemoveImage(false);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(i18n.language === 'de' ? 'Bitte gib einen Event-Namen ein' : 'Please enter an event name');
      return;
    }

    if (!capacityUnlimited && (!maxCapacity || parseInt(maxCapacity) < 1)) {
      toast.error(i18n.language === 'de' ? 'Bitte gib eine gültige Kapazität ein' : 'Please enter a valid capacity');
      return;
    }

    if (isPaid && !hasTicketSales && (!price || parseFloat(price) <= 0)) {
      toast.error(i18n.language === 'de' ? 'Bitte gib einen gültigen Preis ein' : 'Please enter a valid price');
      return;
    }

    setSaving(true);

    try {
      let imageUrl = event?.image_url || null;

      // Handle image upload
      if (imageFile && user) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('event-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      } else if (removeImage) {
        imageUrl = null;
      }

      const updateData: any = {
        name: name.trim(),
        description: description.trim() || null,
        is_public: isPublic,
        event_date: eventDate ? format(eventDate, "yyyy-MM-dd") : null,
        event_time: startTime || null,
        end_time: endTime || null,
        location: location.trim() || null,
        capacity_unlimited: capacityUnlimited,
        target_participants: capacityUnlimited ? 999 : parseInt(maxCapacity),
        requires_approval: requiresApproval,
        image_url: imageUrl,
        waitlist_enabled: waitlistEnabled,
      };

      // Only allow price changes if no ticket sales
      if (!hasTicketSales) {
        updateData.is_paid = isPaid;
        updateData.price_cents = isPaid ? Math.round(parseFloat(price || "0") * 100) : 0;
      }

      const { error } = await supabase
        .from("events")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast.success(t('edit.success'));
      
      // Update local event state with new data
      setEvent(prev => prev ? { ...prev, ...updateData } : null);
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error(t('edit.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      const { error } = await supabase
        .from("participants")
        .delete()
        .eq("id", participantId);

      if (error) throw error;

      setParticipants(prev => prev.filter(p => p.id !== participantId));
      toast.success(i18n.language === 'de' ? 'Teilnehmer entfernt' : 'Participant removed');
    } catch (error) {
      console.error("Error removing participant:", error);
      toast.error(i18n.language === 'de' ? 'Fehler beim Entfernen' : 'Error removing participant');
    }
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

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat(i18n.language === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: currency?.toUpperCase() || 'EUR',
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} showBackButton={true} />
      <div className="p-4 md:p-8">
        <div className="mx-auto max-w-[820px]">
          <h1 className="text-2xl font-bold mb-6">{t('editEvent.title')}</h1>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="flex justify-start gap-2 mb-6 w-auto bg-muted p-1 rounded-lg overflow-x-auto">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t('editEvent.tabs.details')}</span>
              </TabsTrigger>
              <TabsTrigger value="guests" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">{t('editEvent.tabs.guests')}</span>
              </TabsTrigger>
              <TabsTrigger value="checkin" className="flex items-center gap-2">
                <ScanLine className="h-4 w-4" />
                <span className="hidden sm:inline">{t('checkIn.title')}</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">{t('editEvent.tabs.analytics')}</span>
              </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              {/* Desktop: Two-column layout */}
              <div className="md:grid md:grid-cols-2 md:gap-8">
                {/* Left Column: Image Upload */}
                <div>
                  <label
                    htmlFor="edit-image"
                    className="block relative aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 cursor-pointer hover:from-primary/30 hover:to-primary/10 transition-colors overflow-hidden"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt={t('edit.eventImage')}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {i18n.language === 'de' ? 'Event-Bild hinzufügen' : 'Add event image'}
                        </p>
                      </div>
                    )}
                    <Input
                      id="edit-image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>

                {/* Right Column: Event Details */}
                <div className="space-y-6 mt-6 md:mt-0">
                  {/* Event Details */}
                  <div className="space-y-4">
                    {/* Public/Private Toggle */}
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={isPublic ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsPublic(true)}
                        className="gap-1.5"
                      >
                        <Globe className="h-4 w-4" />
                        {i18n.language === 'de' ? 'Öffentlich' : 'Public'}
                      </Button>
                      <Button
                        type="button"
                        variant={!isPublic ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsPublic(false)}
                        className="gap-1.5"
                      >
                        <Lock className="h-4 w-4" />
                        {i18n.language === 'de' ? 'Privat' : 'Private'}
                      </Button>
                    </div>

                    {/* Event Name */}
                    <Textarea
                      placeholder={tf('createEvent.eventNamePlaceholder')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-xl font-semibold border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary min-h-[2.5rem] resize-none overflow-hidden"
                      rows={1}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                      required
                    />

                    {/* Date & Time - Clickable Field */}
                    <button
                      type="button"
                      onClick={() => setDateTimePopupOpen(true)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-accent/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <CalendarIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          {eventDate ? (
                            <>
                              <p className="font-medium truncate">
                                {format(eventDate, "EEEE, d. MMMM", { locale: dateLocale })}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {startTime || "00:00"} — {endTime || "00:00"}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium text-muted-foreground truncate">
                                {i18n.language === 'de' ? 'Datum & Uhrzeit hinzufügen' : 'Add date & time'}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {i18n.language === 'de' ? 'Wann findet das Event statt?' : 'When does the event take place?'}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                    </button>

                    {/* Location - Clickable Field */}
                    <button
                      type="button"
                      onClick={() => setLocationPopupOpen(true)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-accent/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          {location ? (
                            <>
                              <p className="font-medium truncate">{location.split(',')[0]}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {location.split(',').slice(1).join(',').trim() || (i18n.language === 'de' ? 'Veranstaltungsort' : 'Event location')}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium text-muted-foreground truncate">
                                {i18n.language === 'de' ? 'Veranstaltungsort hinzufügen' : 'Add location'}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {i18n.language === 'de' ? 'Offline-Standort oder Link' : 'Offline location or link'}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                    </button>

                    {/* Description - Clickable Field */}
                    <button
                      type="button"
                      onClick={() => setDescriptionPopupOpen(true)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-accent/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">
                            {i18n.language === 'de' ? 'Beschreibung' : 'Description'}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {description || (i18n.language === 'de' ? 'Beschreibung hinzufügen' : 'Add description')}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                    </button>
                  </div>

                  {/* Event Options */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      {i18n.language === 'de' ? 'Eventoptionen' : 'Event Options'}
                    </h3>

                    {/* Tickets - Clickable Field */}
                    <button
                      type="button"
                      onClick={() => setTicketsPopupOpen(true)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-accent/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Ticket className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">
                            {i18n.language === 'de' ? 'Tickets' : 'Tickets'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {i18n.language === 'de' ? 'Ticket-Kategorien verwalten' : 'Manage ticket categories'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                    </button>

                    {/* Requires Approval */}
                    <div className="flex items-center justify-between p-3 rounded-xl border border-border/50">
                      <div className="flex items-center gap-3">
                        <UserCheck className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {i18n.language === 'de' ? 'Genehmigung erforderlich' : 'Requires approval'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {i18n.language === 'de' ? 'Du genehmigst jeden Teilnehmer' : 'You approve each attendee'}
                          </p>
                        </div>
                      </div>
                      <Switch checked={requiresApproval} onCheckedChange={setRequiresApproval} />
                    </div>

                    {/* Capacity - Clickable Field */}
                    <button
                      type="button"
                      onClick={() => setCapacityPopupOpen(true)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-accent/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Users className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">
                            {i18n.language === 'de' ? 'Kapazität' : 'Capacity'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {capacityUnlimited 
                              ? (i18n.language === 'de' ? 'Unbegrenzt' : 'Unlimited')
                              : `${maxCapacity || '0'} ${i18n.language === 'de' ? 'Plätze' : 'spots'}`}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                    </button>
                  </div>

                  {/* Save Button */}
                  <Button
                    onClick={handleSave}
                    size="lg"
                    className="w-full h-12 text-lg shadow-medium"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t('edit.saving')}
                      </>
                    ) : (
                      t('edit.save')
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Guests Tab */}
            <TabsContent value="guests" className="space-y-6">
              {/* Join Requests Section - Only show if requires approval and has pending requests */}
              {requiresApproval && joinRequests.filter(r => r.status === 'pending').length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      {t('joinRequests.title')}
                      <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                        {joinRequests.filter(r => r.status === 'pending').length}
                      </span>
                    </h2>
                  </div>
                  <JoinRequestsList
                    eventId={id!}
                    requests={joinRequests}
                    onRequestProcessed={() => {
                      // Refresh data after processing a request
                      if (user) fetchEventData(user.id);
                    }}
                  />
                </div>
              )}

              {/* Participants Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {t('editEvent.guestList')} ({participants.length})
                  </h2>
                </div>

                {participants.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">{t('editEvent.noGuests')}</p>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {participants.map((participant, index) => (
                      <Card key={participant.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className={cn("h-10 w-10", getAvatarColor(index))}>
                              <AvatarFallback className="bg-transparent text-white text-sm">
                                {getInitials(participant.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{participant.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(participant.created_at), "dd.MM.yyyy", { locale: dateLocale })}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveParticipant(participant.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Check-In Tab */}
            <TabsContent value="checkin">
              <QRScanner eventId={id!} />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">{t('editEvent.overview')}</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">{t('editEvent.totalGuests')}</p>
                    <p className="text-2xl font-bold">{participants.length}</p>
                  </div>
                  {event.is_paid && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">{t('editEvent.revenue')}</p>
                      <p className="text-2xl font-bold">
                        {formatPrice(participants.length * event.price_cents, event.currency)}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6 text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('editEvent.analyticsComingSoon')}</p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Popups */}
      <DateTimePopup
        open={dateTimePopupOpen}
        onOpenChange={setDateTimePopupOpen}
        date={eventDate}
        startTime={startTime}
        endTime={endTime}
        onConfirm={(date, start, end) => {
          setEventDate(date);
          setStartTime(start);
          setEndTime(end);
        }}
      />
      <LocationPopup
        open={locationPopupOpen}
        onOpenChange={setLocationPopupOpen}
        location={location}
        onConfirm={setLocation}
      />
      <DescriptionPopup
        open={descriptionPopupOpen}
        onOpenChange={setDescriptionPopupOpen}
        description={description}
        eventName={name}
        onConfirm={setDescription}
      />
      <CapacityPopup
        open={capacityPopupOpen}
        onOpenChange={setCapacityPopupOpen}
        capacityUnlimited={capacityUnlimited}
        maxCapacity={maxCapacity}
        waitlistEnabled={waitlistEnabled}
        onConfirm={(unlimited, max, waitlist) => {
          setCapacityUnlimited(unlimited);
          setMaxCapacity(max);
          setWaitlistEnabled(waitlist);
        }}
      />
      <TicketsEditPopup
        open={ticketsPopupOpen}
        onOpenChange={setTicketsPopupOpen}
        eventId={id!}
        isPaidEvent={isPaid}
        stripeConnected={stripeConnected}
      />
    </div>
  );
}
