import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TicketCategoriesLocal, PendingTicketCategory } from "@/components/TicketCategoriesLocal";
import { DateTimePopup, formatDateTime } from "@/components/event-form/DateTimePopup";
import { LocationPopup } from "@/components/event-form/LocationPopup";
import { 
  Loader2, 
  Image as ImageIcon, 
  CalendarIcon, 
  MapPin, 
  Clock,
  Globe,
  Lock,
  Users,
  CreditCard,
  UserCheck,
  Infinity,
  AlertCircle,
  Ticket,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface CreateEventDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateEventDrawer({ open, onOpenChange }: CreateEventDrawerProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('forms');
  const { t: ta } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  
  // Basic info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  
  // Date & Time - pre-filled with today
  const [eventDate, setEventDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState(format(new Date(), "HH:00"));
  const [endTime, setEndTime] = useState(format(new Date(Date.now() + 2 * 60 * 60 * 1000), "HH:00"));
  
  // Location & Image
  const [location, setLocation] = useState("");
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

  // Popup states
  const [dateTimePopupOpen, setDateTimePopupOpen] = useState(false);
  const [locationPopupOpen, setLocationPopupOpen] = useState(false);

  const dateLocale = i18n.language === 'de' ? de : enUS;

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
    setImageFile(null);
    setImagePreview(null);
    setIsPaid(false);
    setPrice("");
    setRequiresApproval(false);
    setCapacityUnlimited(true);
    setMaxCapacity("");
    setTicketCategories([]);
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

      const { data, error } = await supabase
        .from("events")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          is_public: isPublic,
          event_date: format(eventDate, "yyyy-MM-dd"),
          event_time: startTime || null,
          end_time: endTime || null,
          location: location.trim() || null,
          image_url: imageUrl,
          is_paid: isPaid,
          price_cents: isPaid ? Math.round(parseFloat(price) * 100) : 0,
          currency: 'eur',
          requires_approval: requiresApproval,
          capacity_unlimited: capacityUnlimited,
          target_participants: capacityUnlimited ? 999 : parseInt(maxCapacity),
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

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent fullScreenOnMobile className="md:max-h-[95vh] md:h-auto">
        <div className="mx-auto w-full max-w-lg overflow-y-auto px-4 pb-8">
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle className="text-2xl font-bold">{t('createEvent.drawerTitle')}</DrawerTitle>
          </DrawerHeader>

          <form onSubmit={handleCreateEvent} className="space-y-5">
            {/* Event Preview Card Style */}
            <div className="rounded-2xl border border-border overflow-hidden bg-card">
              {/* Image Upload Area */}
              <label
                htmlFor="drawer-image"
                className="block relative h-40 bg-gradient-to-br from-primary/20 to-primary/5 cursor-pointer hover:from-primary/30 hover:to-primary/10 transition-colors"
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

              {/* Event Details */}
              <div className="p-4 space-y-4">
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
                  placeholder={t('createEvent.eventNamePlaceholder')}
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
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {eventDate ? (
                        <>
                          <p className="font-medium truncate">
                            {format(eventDate, "EEEE, d. MMMM", { locale: dateLocale })}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {startTime} — {endTime}
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
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
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

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    {i18n.language === 'de' ? 'Beschreibung' : 'Description'}
                  </Label>
                  <Textarea
                    placeholder={i18n.language === 'de' ? 'Event-Beschreibung hinzufügen (optional)' : 'Add event description (optional)'}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Event Options */}
            <div className="rounded-2xl border border-border overflow-hidden bg-card">
              <div className="p-4 space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  {i18n.language === 'de' ? 'Eventoptionen' : 'Event Options'}
                </h3>

                {/* Paid/Free */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {i18n.language === 'de' ? 'Zahlungen akzeptieren' : 'Accept payments'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isPaid 
                          ? (i18n.language === 'de' ? 'Teilnehmer zahlen für das Event' : 'Attendees pay for the event')
                          : (i18n.language === 'de' ? 'Kostenlos' : 'Free')}
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={isPaid} 
                    onCheckedChange={handlePaidToggle}
                    disabled={checkingStripe}
                  />
                </div>

                {/* Stripe not connected warning */}
                {stripeConnected === false && (
                  <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>
                        {i18n.language === 'de' 
                          ? 'Verbinde Stripe um kostenpflichtige Events zu erstellen' 
                          : 'Connect Stripe to create paid events'}
                      </span>
                      <Link to="/settings">
                        <Button variant="outline" size="sm" className="ml-2">
                          {tc('stripe.connect')}
                        </Button>
                      </Link>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Price Input when paid */}
                {isPaid && (
                  <div className="pl-8 space-y-2">
                    <Label className="text-sm">
                      {i18n.language === 'de' ? 'Preis pro Teilnehmer' : 'Price per attendee'}
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                      <Input
                        type="number"
                        min="0.50"
                        step="0.50"
                        placeholder="10.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {i18n.language === 'de' ? '5% Plattformgebühr werden abgezogen' : '5% platform fee will be deducted'}
                    </p>
                  </div>
                )}

                {/* Ticket Categories */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <Ticket className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {i18n.language === 'de' ? 'Ticket-Kategorien' : 'Ticket Categories'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {i18n.language === 'de' ? 'Verschiedene Ticket-Arten mit unterschiedlichen Preisen' : 'Different ticket types with various prices'}
                      </p>
                    </div>
                  </div>
                  <TicketCategoriesLocal 
                    categories={ticketCategories}
                    onCategoriesChange={setTicketCategories}
                  />
                </div>

                {/* Requires Approval */}
                <div className="flex items-center justify-between">
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

                {/* Capacity */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {i18n.language === 'de' ? 'Kapazität' : 'Capacity'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {capacityUnlimited 
                            ? (i18n.language === 'de' ? 'Unbegrenzte Teilnehmer' : 'Unlimited attendees')
                            : (i18n.language === 'de' ? 'Begrenzte Plätze' : 'Limited spots')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={capacityUnlimited ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCapacityUnlimited(true)}
                      >
                        <Infinity className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={!capacityUnlimited ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCapacityUnlimited(false)}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {!capacityUnlimited && (
                    <Input
                      type="number"
                      min="1"
                      placeholder={i18n.language === 'de' ? 'Max. Teilnehmer' : 'Max attendees'}
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(e.target.value)}
                      className="w-full"
                    />
                  )}
                </div>
              </div>
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
          </form>

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
        </div>
      </DrawerContent>
    </Drawer>
  );
}