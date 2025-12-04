import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { LocationInput } from "@/components/LocationInput";
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
  Infinity
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
  
  const [loading, setLoading] = useState(false);

  const dateLocale = i18n.language === 'de' ? de : enUS;

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
      <DrawerContent className="max-h-[95vh]">
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
                <Input
                  type="text"
                  placeholder={t('createEvent.eventNamePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xl font-semibold border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                  required
                />

                {/* Date & Time */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{i18n.language === 'de' ? 'Datum & Uhrzeit' : 'Date & Time'}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !eventDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {eventDate ? format(eventDate, "EEE, dd. MMM yyyy", { locale: dateLocale }) : (i18n.language === 'de' ? 'Datum wählen' : 'Select date')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={eventDate}
                          onSelect={setEventDate}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="flex items-center gap-1">
                      <div className="relative">
                        <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="pl-8 w-28"
                          required
                        />
                      </div>
                      <span className="text-muted-foreground">—</span>
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-24"
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>Location</span>
                  </div>
                  <LocationInput
                    value={location}
                    onChange={(value) => setLocation(value)}
                    placeholder={i18n.language === 'de' ? 'Ort hinzufügen (optional)' : 'Add location (optional)'}
                  />
                </div>

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
                  <Switch checked={isPaid} onCheckedChange={setIsPaid} />
                </div>

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
        </div>
      </DrawerContent>
    </Drawer>
  );
}