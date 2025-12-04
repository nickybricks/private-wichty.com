import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, Image as ImageIcon, CalendarIcon, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

interface CreateEventDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateEventDrawer({ open, onOpenChange }: CreateEventDrawerProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('forms');
  const { t: ta } = useTranslation('auth');
  const [name, setName] = useState("");
  const [participants, setParticipants] = useState("");
  const [eventDate, setEventDate] = useState<Date | undefined>();
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
    setParticipants("");
    setEventDate(undefined);
    setEventTime("");
    setLocation("");
    setImageFile(null);
    setImagePreview(null);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(ta('errors.pleaseLogin'));
        return;
      }

      let imageUrl = null;

      // Upload image if provided
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
          target_participants: participantCount,
          status: "waiting",
          user_id: user.id,
          image_url: imageUrl,
          event_date: eventDate ? format(eventDate, "yyyy-MM-dd") : null,
          event_time: eventTime || null,
          location: location.trim() || null,
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
      <DrawerContent className="max-h-[90vh]">
        <div className="mx-auto w-full max-w-md overflow-y-auto px-4 pb-8">
          <DrawerHeader className="text-center">
            <DrawerTitle className="text-2xl font-bold">{t('createEvent.drawerTitle')}</DrawerTitle>
            <DrawerDescription>
              {t('createEvent.drawerDescription')}
            </DrawerDescription>
          </DrawerHeader>

          <form onSubmit={handleCreateEvent} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="drawer-name" className="text-base">
                {t('createEvent.eventName')}
              </Label>
              <Input
                id="drawer-name"
                type="text"
                placeholder={t('createEvent.eventNamePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 text-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="drawer-participants" className="text-base">
                {t('createEvent.participants')}
              </Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="drawer-participants"
                  type="number"
                  min="2"
                  placeholder={t('createEvent.participantsPlaceholder')}
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  className="pl-10 h-12 text-lg"
                  required
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {t('createEvent.participantsHint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-base">{i18n.language === 'de' ? 'Datum & Uhrzeit (optional)' : 'Date & time (optional)'}</Label>
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
                      {eventDate ? format(eventDate, "dd.MM.yyyy", { locale: dateLocale }) : (i18n.language === 'de' ? 'Datum' : 'Date')}
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
                <div className="relative w-32">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="drawer-time"
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="drawer-location" className="text-base">
                {i18n.language === 'de' ? 'Location (optional)' : 'Location (optional)'}
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="drawer-location"
                  type="text"
                  placeholder={i18n.language === 'de' ? 'z.B. Bei Maria zuhause' : 'e.g. At Maria\'s place'}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="drawer-image" className="text-base">
                {t('createEvent.eventImage')} {t('createEvent.optional')}
              </Label>
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="drawer-image"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt={t('createEvent.preview')}
                        className="h-full w-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {t('createEvent.uploadHint')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('createEvent.imageSize')}
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
