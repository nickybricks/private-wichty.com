import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { ImageCropper } from "@/components/ImageCropper";
import { Loader2, Users, CalendarIcon, MapPin, Clock, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

interface EditEventSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    id: string;
    target_participants: number;
    event_date: string | null;
    event_time: string | null;
    location: string | null;
    image_url: string | null;
  };
  currentParticipantCount: number;
  onSuccess: () => void;
}

export function EditEventSheet({ 
  open, 
  onOpenChange, 
  event, 
  currentParticipantCount,
  onSuccess 
}: EditEventSheetProps) {
  const { t, i18n } = useTranslation('event');
  const { t: ta } = useTranslation('auth');
  const { t: tf } = useTranslation('forms');
  const [participants, setParticipants] = useState(event.target_participants.toString());
  const [eventDate, setEventDate] = useState<Date | undefined>(
    event.event_date ? new Date(event.event_date) : undefined
  );
  const [eventTime, setEventTime] = useState(event.event_time || "");
  const [location, setLocation] = useState(event.location || "");
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(event.image_url);
  const [removeImage, setRemoveImage] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);

  const dateLocale = i18n.language === 'de' ? de : enUS;

  useEffect(() => {
    if (open) {
      setParticipants(event.target_participants.toString());
      setEventDate(event.event_date ? new Date(event.event_date) : undefined);
      setEventTime(event.event_time || "");
      setLocation(event.location || "");
      setImageFile(null);
      setImagePreview(event.image_url);
      setRemoveImage(false);
    }
  }, [open, event]);

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
      // Open cropper with the selected image
      const reader = new FileReader();
      reader.onload = (e) => {
        setTempImageSrc(e.target?.result as string);
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const file = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' });
    setImageFile(file);
    setImagePreview(URL.createObjectURL(croppedBlob));
    setRemoveImage(false);
    setTempImageSrc(null);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const participantCount = parseInt(participants);
    
    if (!participantCount || participantCount < 2) {
      toast.error(tf('errors.minParticipants'));
      return;
    }

    if (participantCount < currentParticipantCount) {
      toast.error(t('edit.minParticipants', { count: currentParticipantCount }));
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(ta('errors.pleaseLogin'));
        return;
      }

      let imageUrl = event.image_url;

      // Handle image upload
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
      } else if (removeImage) {
        imageUrl = null;
      }

      const { error } = await supabase
        .from("events")
        .update({
          target_participants: participantCount,
          event_date: eventDate ? format(eventDate, "yyyy-MM-dd") : null,
          event_time: eventTime || null,
          location: location.trim() || null,
          image_url: imageUrl,
        })
        .eq("id", event.id);

      if (error) throw error;

      toast.success(t('edit.success'));
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error(t('edit.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="mx-auto w-full max-w-md overflow-y-auto px-4 pb-8">
          <DrawerHeader className="text-center">
            <DrawerTitle className="text-2xl font-bold">{t('edit.title')}</DrawerTitle>
            <DrawerDescription>
              {t('edit.description')}
            </DrawerDescription>
          </DrawerHeader>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Event Image */}
            <div className="space-y-2">
              <Label className="text-base">{t('edit.eventImage')}</Label>
              <div className="flex items-center justify-center w-full">
                {imagePreview ? (
                  <div className="relative w-full">
                    <img
                      src={imagePreview}
                      alt="Event"
                      className="w-full h-32 object-cover rounded-lg"
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
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {t('edit.uploadImage')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('edit.imageSize')}
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

            <div className="space-y-2">
              <Label htmlFor="edit-participants" className="text-base">
                {t('edit.participants')}
              </Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="edit-participants"
                  type="number"
                  min={Math.max(2, currentParticipantCount)}
                  placeholder="5"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  className="pl-10 h-12 text-lg"
                  required
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {t('edit.currentParticipants', { count: currentParticipantCount })}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-base">{t('edit.dateTime')}</Label>
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
                <div className="relative w-32">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="edit-time"
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
              </div>
              {(eventDate || eventTime) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEventDate(undefined);
                    setEventTime("");
                  }}
                  className="text-muted-foreground"
                >
                  {t('edit.removeDatetime')}
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location" className="text-base">
                {t('edit.location')}
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="edit-location"
                  type="text"
                  placeholder={t('edit.locationPlaceholder')}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
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
                  {t('edit.saving')}
                </>
              ) : (
                t('edit.save')
              )}
            </Button>
          </form>
        </div>
      </DrawerContent>
      
      {tempImageSrc && (
        <ImageCropper
          open={cropperOpen}
          onOpenChange={setCropperOpen}
          imageSrc={tempImageSrc}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
        />
      )}
    </Drawer>
  );
}
