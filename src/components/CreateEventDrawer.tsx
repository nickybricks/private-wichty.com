import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { PendingTicketCategory } from "@/components/TicketCategoriesLocal";
import { DateTimePopup } from "@/components/event-form/DateTimePopup";
import { LocationPopup } from "@/components/event-form/LocationPopup";
import { DescriptionPopup } from "@/components/event-form/DescriptionPopup";
import { TicketsPopup } from "@/components/event-form/TicketsPopup";
import { CapacityPopup } from "@/components/event-form/CapacityPopup";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Loader2, 
  Image as ImageIcon, 
  CalendarIcon, 
  MapPin, 
  Globe,
  Lock,
  Users,
  UserCheck,
  Ticket,
  ChevronRight,
  FileText,
  X
} from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface CreateEventDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateEventDrawer({ open, onOpenChange }: CreateEventDrawerProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('forms');
  const { t: ta } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const isMobile = useIsMobile();
  
  // Basic info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  
  // Date & Time - pre-filled with today
  const [eventDate, setEventDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState(format(new Date(), "HH:00"));
  const [endTime, setEndTime] = useState(format(new Date(Date.now() + 2 * 60 * 60 * 1000), "HH:00"));
  
  // Location & Image
  const [location, setLocation] = useState("");
  const [city, setCity] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Event options
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [capacityUnlimited, setCapacityUnlimited] = useState(true);
  const [maxCapacity, setMaxCapacity] = useState("");
  const [ticketCategories, setTicketCategories] = useState<PendingTicketCategory[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [stripeConnected, setStripeConnected] = useState<boolean | null>(null);
  const [checkingStripe, setCheckingStripe] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [isAutoTagging, setIsAutoTagging] = useState(false);
  const autoTagTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Popup states
  const [dateTimePopupOpen, setDateTimePopupOpen] = useState(false);
  const [locationPopupOpen, setLocationPopupOpen] = useState(false);
  const [descriptionPopupOpen, setDescriptionPopupOpen] = useState(false);
  const [ticketsPopupOpen, setTicketsPopupOpen] = useState(false);
  const [capacityPopupOpen, setCapacityPopupOpen] = useState(false);
  const [waitlistEnabled, setWaitlistEnabled] = useState(false);

  const dateLocale = i18n.language === 'de' ? de : enUS;

  // AI Auto-Tagging function
  const triggerAutoTagging = useCallback(async (title: string, desc: string) => {
    if (!title.trim() || !desc.trim()) return;
    
    setIsAutoTagging(true);
    try {
      const { data, error } = await supabase.functions.invoke('auto-tag-event', {
        body: { 
          title: title.trim(), 
          description: desc.trim(),
          language: i18n.language 
        }
      });

      if (error) {
        console.error('Auto-tag error:', error);
        return;
      }

      if (data?.tag) {
        setTags([data.tag]);
      }
    } catch (err) {
      console.error('Auto-tag failed:', err);
    } finally {
      setIsAutoTagging(false);
    }
  }, [i18n.language]);

  // Debounced auto-tagging when both title and description are present
  useEffect(() => {
    if (autoTagTimeoutRef.current) {
      clearTimeout(autoTagTimeoutRef.current);
    }

    if (name.trim() && description.trim() && tags.length === 0) {
      autoTagTimeoutRef.current = setTimeout(() => {
        triggerAutoTagging(name, description);
      }, 1000); // 1 second debounce
    }

    return () => {
      if (autoTagTimeoutRef.current) {
        clearTimeout(autoTagTimeoutRef.current);
      }
    };
  }, [name, description, tags.length, triggerAutoTagging]);

  // Check Stripe connection status when drawer opens
  useEffect(() => {
    if (open) {
      checkStripeStatus();
    }
  }, [open]);

  const checkStripeStatus = async () => {
    setCheckingStripe(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStripeConnected(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-connect-status', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
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

  const handlePaidToggle = (checked: boolean) => {
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

  const resetForm = () => {
    setName("");
    setDescription("");
    setIsPublic(true);
    setEventDate(new Date());
    setStartTime(format(new Date(), "HH:00"));
    setEndTime(format(new Date(Date.now() + 2 * 60 * 60 * 1000), "HH:00"));
    setLocation("");
    setCity(null);
    setCountry(null);
    setImageFile(null);
    setImagePreview(null);
    setIsPaid(false);
    setPrice("");
    setRequiresApproval(false);
    setCapacityUnlimited(true);
    setMaxCapacity("");
    setTicketCategories([]);
    setTags([]);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error(t('errors.enterEventName'));
      return;
    }
    
    if (!eventDate) {
      toast.error(i18n.language === 'de' ? 'Bitte wähle ein Datum aus' : 'Please select a date');
      return;
    }

    if (!capacityUnlimited && (!maxCapacity || parseInt(maxCapacity) < 1)) {
      toast.error(i18n.language === 'de' ? 'Bitte gib eine gültige Kapazität ein' : 'Please enter a valid capacity');
      return;
    }

    if (isPaid && (!price || parseFloat(price) <= 0)) {
      toast.error(i18n.language === 'de' ? 'Bitte gib einen gültigen Preis ein' : 'Please enter a valid price');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(ta('errors.pleaseLogin'));
        return;
      }

      let imageUrl = null;

      if (imageFile) {
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
      }

      // Determine if event is paid based on ticket categories
      const hasPaidTickets = ticketCategories.some(cat => cat.price_cents > 0);

      const { data, error } = await supabase
        .from("events")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          is_public: isPublic,
          event_date: format(eventDate, "yyyy-MM-dd"),
          end_date: endDate ? format(endDate, "yyyy-MM-dd") : format(eventDate, "yyyy-MM-dd"),
          event_time: startTime || null,
          end_time: endTime || null,
          location: location.trim() || null,
          city: city || null,
          country: country || null,
          tags: tags.length > 0 ? tags : null,
          image_url: imageUrl,
          is_paid: hasPaidTickets,
          price_cents: 0,
          currency: 'eur',
          requires_approval: requiresApproval,
          capacity_unlimited: capacityUnlimited,
          target_participants: capacityUnlimited ? 999 : parseInt(maxCapacity),
          waitlist_enabled: waitlistEnabled,
          status: "waiting",
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Create ticket categories if any
      if (ticketCategories.length > 0) {
        const ticketInserts = ticketCategories.map((cat, index) => ({
          event_id: data.id,
          name: cat.name,
          description: cat.description || null,
          price_cents: cat.price_cents,
          currency: 'eur',
          max_quantity: cat.max_quantity,
          sort_order: index
        }));

        const { error: ticketError } = await supabase
          .from("ticket_categories")
          .insert(ticketInserts);

        if (ticketError) {
          console.error("Error creating ticket categories:", ticketError);
          // Don't throw - event was created successfully
        }
      }

      // Send event_created notification to host (fire and forget)
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, first_name, language, notify_organizing")
        .eq("id", user.id)
        .single();

      if (profile?.notify_organizing !== false) {
        const eventUrl = `${window.location.origin}/event/${data.id}`;
        supabase.functions.invoke('send-notification', {
          body: {
            type: 'event_created',
            recipientUserId: user.id,
            recipientName: profile?.first_name || profile?.display_name || 'Host',
            language: profile?.language === 'en' ? 'en' : 'de',
            eventName: name.trim(),
            eventDate: format(eventDate, "yyyy-MM-dd"),
            eventTime: startTime || null,
            eventLocation: location.trim() || null,
            eventUrl,
          },
        }).catch(err => console.error("Failed to send event created email:", err));
      }

      toast.success(t('createEvent.success'));
      resetForm();
      onOpenChange(false);
      navigate(`/event/${data.id}`);
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error(t('errors.createError'));
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <>
      <form onSubmit={handleCreateEvent} className="space-y-6">
        {/* Desktop: Two-column layout */}
        <div className="md:grid md:grid-cols-[330px_1fr] md:gap-8">
          {/* Left Column: Image Upload */}
          <div>
            <label
              htmlFor="drawer-image"
              className="block relative aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 cursor-pointer hover:from-primary/30 hover:to-primary/10 transition-colors overflow-hidden"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt={t('createEvent.preview')}
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
                id="drawer-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          </div>

          {/* Right Column: Event Details */}
          <div className="space-y-4 mt-6 md:mt-0">
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
            <Input
              placeholder={t('createEvent.eventNamePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xl font-semibold border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary h-auto py-2"
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
                    <div className="space-y-0.5">
                      {/* Start date & time */}
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">
                          {format(eventDate, "EEE, d. MMM", { locale: dateLocale })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {startTime}
                        </p>
                      </div>
                      {/* End date & time */}
                      {(endTime || (endDate && endDate.toDateString() !== eventDate.toDateString())) && (
                        <div className="flex items-center justify-between text-muted-foreground">
                          <p className="text-sm truncate">
                            {endDate && endDate.toDateString() !== eventDate.toDateString()
                              ? format(endDate, "EEE, d. MMM", { locale: dateLocale })
                              : format(eventDate, "EEE, d. MMM", { locale: dateLocale })}
                          </p>
                          <p className="text-sm">
                            {endTime}
                          </p>
                        </div>
                      )}
                    </div>
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
                  {description ? (
                    <>
                      <p className="font-medium truncate">
                        {i18n.language === 'de' ? 'Beschreibung' : 'Description'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">{description}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-muted-foreground truncate">
                        {i18n.language === 'de' ? 'Beschreibung hinzufügen' : 'Add description'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {i18n.language === 'de' ? 'Was erwartet die Teilnehmer?' : 'What can attendees expect?'}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
            </button>

            {/* Event Options */}
            <div className="space-y-4 pt-4">
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
                      {ticketCategories.length > 0
                        ? `${ticketCategories.length} ${i18n.language === 'de' ? 'Kategorie(n)' : 'category(ies)'}`
                        : (i18n.language === 'de' ? 'Kostenlos' : 'Free')}
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

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 text-lg shadow-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t('createEvent.loading')}
                </>
              ) : (
                t('createEvent.button')
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Popups */}
      <DateTimePopup
        open={dateTimePopupOpen}
        onOpenChange={setDateTimePopupOpen}
        date={eventDate}
        startTime={startTime}
        endTime={endTime}
        endDate={endDate}
        onConfirm={(date, start, end, eDate) => {
          setEventDate(date);
          setStartTime(start);
          setEndTime(end);
          setEndDate(eDate);
        }}
      />
      <LocationPopup
        open={locationPopupOpen}
        onOpenChange={setLocationPopupOpen}
        location={location}
        onConfirm={(loc, c, co) => {
          setLocation(loc);
          setCity(c);
          setCountry(co);
        }}
      />
      <DescriptionPopup
        open={descriptionPopupOpen}
        onOpenChange={setDescriptionPopupOpen}
        description={description}
        eventName={name}
        location={location}
        date={eventDate ? format(eventDate, "EEEE, d. MMMM yyyy", { locale: dateLocale }) : undefined}
        onConfirm={setDescription}
      />
      <TicketsPopup
        open={ticketsPopupOpen}
        onOpenChange={setTicketsPopupOpen}
        ticketCategories={ticketCategories}
        stripeConnected={stripeConnected}
        onConfirm={setTicketCategories}
        eventCapacity={maxCapacity ? parseInt(maxCapacity) : null}
        capacityUnlimited={capacityUnlimited}
      />
      <CapacityPopup
        open={capacityPopupOpen}
        onOpenChange={setCapacityPopupOpen}
        capacityUnlimited={capacityUnlimited}
        maxCapacity={maxCapacity}
        waitlistEnabled={waitlistEnabled}
        onConfirm={(unlimited, capacity, waitlist) => {
          setCapacityUnlimited(unlimited);
          setMaxCapacity(capacity);
          setWaitlistEnabled(waitlist);
        }}
      />
    </>
  );

  // Mobile: Use Drawer (bottom sheet)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent fullScreenOnMobile className="flex flex-col">
          <DrawerHeader className="text-center pb-2 flex-shrink-0 px-4">
            <DrawerTitle className="text-2xl font-bold">{t('createEvent.drawerTitle')}</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-safe">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use Dialog (centered modal like Notion)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[960px] max-h-[90vh] overflow-y-auto p-0 rounded-2xl animate-scale-in">
        <div className="px-6 py-6">
          {formContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}