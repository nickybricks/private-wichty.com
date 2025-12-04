import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, Gift } from "lucide-react";
import { toast } from "sonner";

interface JoinEventSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onSuccess: (participantId: string) => void;
}

export function JoinEventSheet({
  open,
  onOpenChange,
  eventId,
  onSuccess,
}: JoinEventSheetProps) {
  const { t } = useTranslation('event');
  const { t: ta } = useTranslation('auth');
  const [name, setName] = useState("");
  const [wish, setWish] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !wish.trim()) {
      toast.error(ta('errors.fillAllFields'));
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(ta('errors.pleaseLogin'));
        return;
      }

      const { data, error } = await supabase
        .from("participants")
        .insert({
          event_id: eventId,
          name: name.trim(),
          wish: wish.trim(),
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      onSuccess(data.id);
      setName("");
      setWish("");
    } catch (error) {
      console.error("Error joining event:", error);
      toast.error(t('join.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] sm:h-auto">
        <SheetHeader className="space-y-3 pb-6">
          <SheetTitle className="text-2xl">{t('join.title')}</SheetTitle>
          <SheetDescription>
            {t('join.description')}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="space-y-2">
            <Label htmlFor="wish" className="text-base">
              {t('join.yourWish')}
            </Label>
            <div className="relative">
              <Gift className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="wish"
                value={wish}
                onChange={(e) => setWish(e.target.value)}
                placeholder={t('join.wishPlaceholder')}
                className="pl-10 min-h-[120px] resize-none"
                required
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
                {t('join.loading')}
              </>
            ) : (
              t('join.button')
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
