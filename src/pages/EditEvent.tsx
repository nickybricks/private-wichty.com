import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { 
  Loader2, 
  CalendarIcon, 
  MapPin, 
  Clock, 
  Image as ImageIcon, 
  X, 
  Users,
  CreditCard,
  BarChart3,
  Settings2,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LocationInput } from "@/components/LocationInput";

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
  
  const [user, setUser] = useState<any>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasTicketSales, setHasTicketSales] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState<Date | undefined>();
  const [eventTime, setEventTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [targetParticipants, setTargetParticipants] = useState("");
  const [capacityUnlimited, setCapacityUnlimited] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [priceCents, setPriceCents] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

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
      setEventDate(eventData.event_date ? new Date(eventData.event_date) : undefined);
      setEventTime(eventData.event_time || "");
      setEndTime(eventData.end_time || "");
      setLocation(eventData.location || "");
      setTargetParticipants(eventData.target_participants.toString());
      setCapacityUnlimited(eventData.capacity_unlimited || false);
      setIsPaid(eventData.is_paid || false);
      setPriceCents(eventData.price_cents ? (eventData.price_cents / 100).toString() : "");
      setRequiresApproval(eventData.requires_approval || false);
      setImagePreview(eventData.image_url);

      // Fetch participants
      const { data: participantsData } = await supabase
        .from("participants")
        .select("id, name, user_id, created_at")
        .eq("event_id", id)
        .order("created_at", { ascending: true });

      setParticipants(participantsData || []);
      
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

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(i18n.language === 'de' ? 'Bitte gib einen Event-Namen ein' : 'Please enter an event name');
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
        event_date: eventDate ? format(eventDate, "yyyy-MM-dd") : null,
        event_time: eventTime || null,
        end_time: endTime || null,
        location: location.trim() || null,
        target_participants: parseInt(targetParticipants) || 2,
        capacity_unlimited: capacityUnlimited,
        requires_approval: requiresApproval,
        image_url: imageUrl,
      };

      // Only allow price changes if no ticket sales
      if (!hasTicketSales) {
        updateData.is_paid = isPaid;
        updateData.price_cents = isPaid ? Math.round(parseFloat(priceCents || "0") * 100) : 0;
      }

      const { error } = await supabase
        .from("events")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast.success(t('edit.success'));
      navigate(`/event/${id}`);
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
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-bold mb-6">{t('editEvent.title')}</h1>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t('editEvent.tabs.details')}</span>
              </TabsTrigger>
              <TabsTrigger value="guests" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">{t('editEvent.tabs.guests')}</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">{t('editEvent.tabs.analytics')}</span>
              </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              {/* Event Image */}
              <div className="space-y-2">
                <Label className="text-base">{t('edit.eventImage')}</Label>
                <div className="flex items-center justify-center w-full">
                  {imagePreview ? (
                    <div className="relative w-full">
                      <img
                        src={imagePreview}
                        alt="Event"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor="edit-image"
                      className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {t('edit.uploadImage')}
                      </p>
                    </label>
                  )}
                  <Input
                    id="edit-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>
                {imagePreview && (
                  <label
                    htmlFor="edit-image"
                    className="block text-center text-sm text-primary cursor-pointer hover:underline"
                  >
                    {t('edit.changeImage')}
                  </label>
                )}
              </div>

              {/* Event Name */}
              <div className="space-y-2">
                <Label htmlFor="name">{t('editEvent.name')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('editEvent.namePlaceholder')}
                  className="h-12"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">{t('editEvent.description')}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('editEvent.descriptionPlaceholder')}
                  rows={4}
                />
              </div>

              {/* Date & Time */}
              <div className="space-y-2">
                <Label>{t('edit.dateTime')}</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 h-12 justify-start text-left font-normal",
                          !eventDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-5 w-5" />
                        {eventDate ? format(eventDate, "dd.MM.yyyy", { locale: dateLocale }) : t('edit.date')}
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
                  <div className="relative w-28">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                    <Input
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label>{t('edit.location')}</Label>
                <LocationInput
                  value={location}
                  onChange={setLocation}
                  placeholder={t('edit.locationPlaceholder')}
                />
              </div>

              {/* Price Section */}
              <Card className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <Label>{t('editEvent.paidEvent')}</Label>
                  </div>
                  <Switch
                    checked={isPaid}
                    onCheckedChange={setIsPaid}
                    disabled={hasTicketSales}
                  />
                </div>
                {isPaid && (
                  <div className="space-y-2">
                    <Label htmlFor="price">{t('editEvent.price')}</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={priceCents}
                        onChange={(e) => setPriceCents(e.target.value)}
                        className="pl-8 h-12"
                        disabled={hasTicketSales}
                      />
                    </div>
                    {hasTicketSales && (
                      <p className="text-sm text-muted-foreground">
                        {t('editEvent.priceLockedHint')}
                      </p>
                    )}
                  </div>
                )}
              </Card>

              {/* Approval Required */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('editEvent.requiresApproval')}</Label>
                    <p className="text-sm text-muted-foreground">{t('editEvent.requiresApprovalHint')}</p>
                  </div>
                  <Switch
                    checked={requiresApproval}
                    onCheckedChange={setRequiresApproval}
                  />
                </div>
              </Card>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                className="w-full h-12"
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
            </TabsContent>

            {/* Guests Tab */}
            <TabsContent value="guests" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
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
    </div>
  );
}
