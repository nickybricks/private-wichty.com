import { useState } from "react";
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
import { Loader2, User, CreditCard } from "lucide-react";
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

  const formatPrice = (cents: number, curr: string) => {
    return new Intl.NumberFormat(i18n.language === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: curr.toUpperCase(),
    }).format(cents / 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
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

      // For paid events, redirect to Stripe checkout
      if (isPaidEvent && priceCents > 0) {
        const { data: { session } } = await supabase.auth.getSession();
        
        const { data, error } = await supabase.functions.invoke('create-event-checkout', {
          body: {
            event_id: eventId,
            participant_name: name.trim(),
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
          name: name.trim(),
          user_id: user.id,
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto">
        <SheetHeader className="space-y-3 pb-6">
          <SheetTitle className="text-2xl">{t('join.title')}</SheetTitle>
          <SheetDescription>
            {t('join.description')}
          </SheetDescription>
          {isPaidEvent && priceCents > 0 && (
            <Badge variant="secondary" className="w-fit gap-1.5">
              <CreditCard className="h-3 w-3" />
              {formatPrice(priceCents, currency)}
            </Badge>
          )}
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pb-6">
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
            ) : isPaidEvent && priceCents > 0 ? (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                {i18n.language === 'de' 
                  ? `${formatPrice(priceCents, currency)} zahlen & beitreten` 
                  : `Pay ${formatPrice(priceCents, currency)} & join`}
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
