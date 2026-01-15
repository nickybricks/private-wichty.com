import { useTranslation } from "react-i18next";
import { Ticket, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { EventFieldPopup } from "./EventFieldPopup";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TicketCategories } from "@/components/TicketCategories";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TicketsEditPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  isPaidEvent: boolean;
  stripeConnected: boolean | null;
  eventCapacity?: number | null;
  capacityUnlimited?: boolean;
  allowMultipleTickets?: boolean;
  onAllowMultipleChange?: (value: boolean) => void;
  onTicketModified?: () => void;
}

export function TicketsEditPopup({
  open,
  onOpenChange,
  eventId,
  isPaidEvent,
  stripeConnected,
  eventCapacity,
  capacityUnlimited,
  allowMultipleTickets = true,
  onAllowMultipleChange,
  onTicketModified,
}: TicketsEditPopupProps) {
  const { t, i18n } = useTranslation("forms");

  return (
    <EventFieldPopup
      open={open}
      onOpenChange={onOpenChange}
      title={t("eventForm.tickets", "Tickets")}
      icon={<Ticket className="h-5 w-5 text-primary" />}
      className="sm:max-w-lg"
    >
      <div className="space-y-4">
        {/* Friendly Stripe hint */}
        {stripeConnected === false && (
          <Alert className="bg-primary/5 border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              <p className="font-medium mb-1">
                {i18n.language === "de"
                  ? "💡 Kostenpflichtige Tickets aktivieren"
                  : "💡 Enable paid tickets"}
              </p>
              <p className="text-muted-foreground mb-2">
                {i18n.language === "de"
                  ? "Verbinde Stripe in nur 5 Minuten und akzeptiere Zahlungen – super einfach!"
                  : "Connect Stripe in just 5 minutes and accept payments – super easy!"}
              </p>
              <Link to="/settings">
                <Button variant="outline" size="sm">
                  {i18n.language === "de" ? "Stripe verbinden" : "Connect Stripe"}
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Allow Multiple Tickets Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/30">
          <div>
            <p className="font-medium text-sm">
              {t("eventForm.allowMultipleTickets")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("eventForm.allowMultipleTicketsHint")}
            </p>
          </div>
          <Switch
            checked={allowMultipleTickets}
            onCheckedChange={onAllowMultipleChange}
          />
        </div>

        <TicketCategories
          eventId={eventId}
          isPaidEvent={isPaidEvent}
          stripeConnected={stripeConnected}
          eventCapacity={eventCapacity}
          capacityUnlimited={capacityUnlimited}
          onTicketModified={onTicketModified}
        />

        <Button 
          onClick={() => onOpenChange(false)} 
          className="w-full"
        >
          {i18n.language === "de" ? "Fertig" : "Done"}
        </Button>
      </div>
    </EventFieldPopup>
  );
}
