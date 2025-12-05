import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Ticket, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { EventFieldPopup } from "./EventFieldPopup";
import { Button } from "@/components/ui/button";
import { TicketCategoriesLocal, PendingTicketCategory } from "@/components/TicketCategoriesLocal";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TicketsPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketCategories: PendingTicketCategory[];
  stripeConnected: boolean | null;
  onConfirm: (categories: PendingTicketCategory[]) => void;
}

export function TicketsPopup({
  open,
  onOpenChange,
  ticketCategories: initialCategories,
  stripeConnected,
  onConfirm,
}: TicketsPopupProps) {
  const { t, i18n } = useTranslation("forms");
  const [categories, setCategories] = useState<PendingTicketCategory[]>(initialCategories);

  useEffect(() => {
    if (open) {
      setCategories(initialCategories);
    }
  }, [open, initialCategories]);

  const handleConfirm = () => {
    onConfirm(categories);
    onOpenChange(false);
  };

  const hasPaidTickets = categories.some(c => c.price_cents > 0);

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

        {hasPaidTickets && stripeConnected === false && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
            <AlertDescription>
              {i18n.language === "de"
                ? "Verbinde zuerst Stripe um kostenpflichtige Tickets zu erstellen."
                : "Connect Stripe first to create paid tickets."}
            </AlertDescription>
          </Alert>
        )}

        <TicketCategoriesLocal
          categories={categories}
          onCategoriesChange={setCategories}
        />

        <Button 
          onClick={handleConfirm} 
          className="w-full"
          disabled={hasPaidTickets && stripeConnected === false}
        >
          {t("eventForm.confirm", "Confirm")}
        </Button>
      </div>
    </EventFieldPopup>
  );
}
