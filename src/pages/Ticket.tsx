import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Calendar, Clock, ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";

interface TicketData {
  id: string;
  ticket_code: string;
  status: string;
  created_at: string;
  event: {
    id: string;
    name: string;
    event_date: string | null;
    event_time: string | null;
    location: string | null;
    image_url: string | null;
  };
  participant: {
    name: string;
  };
  ticket_category: {
    name: string;
    price_cents: number;
    currency: string;
  } | null;
}

export default function Ticket() {
  const { ticketCode } = useParams<{ ticketCode: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('event');
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ticketCode) {
      fetchTickets();
    }
  }, [ticketCode]);

  const fetchTickets = async () => {
    try {
      // First get the ticket by code
      const { data: ticketData, error: ticketError } = await supabase
        .from("tickets")
        .select("*, participant_id, event_id, ticket_category_id")
        .eq("ticket_code", ticketCode)
        .maybeSingle();

      if (ticketError) throw ticketError;
      if (!ticketData) {
        setError(i18n.language === 'de' ? 'Ticket nicht gefunden' : 'Ticket not found');
        return;
      }

      // Get all tickets for same participant and event
      const { data: allTickets, error: allError } = await supabase
        .from("tickets")
        .select("*")
        .eq("participant_id", ticketData.participant_id)
        .eq("event_id", ticketData.event_id);

      if (allError) throw allError;

      // Get event data
      const { data: eventData } = await supabase
        .from("events")
        .select("id, name, event_date, event_time, location, image_url")
        .eq("id", ticketData.event_id)
        .single();

      // Get participant data
      const { data: participantData } = await supabase
        .from("participants")
        .select("name")
        .eq("id", ticketData.participant_id)
        .single();

      // Get ticket category if exists
      let categoryData = null;
      if (ticketData.ticket_category_id) {
        const { data } = await supabase
          .from("ticket_categories")
          .select("name, price_cents, currency")
          .eq("id", ticketData.ticket_category_id)
          .single();
        categoryData = data;
      }

      const formattedTickets: TicketData[] = (allTickets || [ticketData]).map(t => ({
        id: t.id,
        ticket_code: t.ticket_code,
        status: t.status,
        created_at: t.created_at,
        event: eventData || { id: '', name: '', event_date: null, event_time: null, location: null, image_url: null },
        participant: participantData || { name: '' },
        ticket_category: categoryData,
      }));

      setTickets(formattedTickets);
      
      // Set current index to the requested ticket
      const requestedIndex = formattedTickets.findIndex(t => t.ticket_code === ticketCode);
      if (requestedIndex >= 0) setCurrentIndex(requestedIndex);
    } catch (err: any) {
      console.error("Error fetching ticket:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return format(date, "EEEE, d. MMMM yyyy", {
      locale: i18n.language === 'de' ? de : enUS,
    });
  };

  const openDirections = () => {
    const ticket = tickets[currentIndex];
    if (ticket?.event.location) {
      const encodedLocation = encodeURIComponent(ticket.event.location);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank');
    }
  };

  const addToCalendar = () => {
    const ticket = tickets[currentIndex];
    if (!ticket) return;

    const event = ticket.event;
    const title = encodeURIComponent(event.name);
    const location = encodeURIComponent(event.location || '');
    
    let dateStr = '';
    if (event.event_date) {
      const date = new Date(event.event_date);
      if (event.event_time) {
        const [hours, minutes] = event.event_time.split(':');
        date.setHours(parseInt(hours), parseInt(minutes));
      }
      dateStr = date.toISOString().replace(/-|:|\.\d{3}/g, '');
    }

    const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&location=${location}&dates=${dateStr}/${dateStr}`;
    window.open(calUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || tickets.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
        <p className="text-lg text-muted-foreground mb-4">{error || t('notFound')}</p>
        <Button onClick={() => navigate('/')}>
          {i18n.language === 'de' ? 'Zur Startseite' : 'Go to Home'}
        </Button>
      </div>
    );
  }

  const ticket = tickets[currentIndex];
  const ticketUrl = `${window.location.origin}/ticket/${ticket.ticket_code}`;

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Stacked tickets indicator */}
        {tickets.length > 1 && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {i18n.language === 'de' 
                ? `Ticket ${currentIndex + 1} von ${tickets.length}`
                : `Ticket ${currentIndex + 1} of ${tickets.length}`}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentIndex(Math.min(tickets.length - 1, currentIndex + 1))}
              disabled={currentIndex === tickets.length - 1}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Ticket Card */}
        <div className="bg-background rounded-3xl shadow-2xl overflow-hidden relative">
          {/* Stacked effect for multiple tickets */}
          {tickets.length > 1 && currentIndex < tickets.length - 1 && (
            <>
              <div className="absolute -bottom-2 left-2 right-2 h-full bg-background/80 rounded-3xl -z-10" />
              {currentIndex < tickets.length - 2 && (
                <div className="absolute -bottom-4 left-4 right-4 h-full bg-background/60 rounded-3xl -z-20" />
              )}
            </>
          )}

          {/* Ticket Badge */}
          <div className="flex justify-center pt-6">
            <Badge variant="secondary" className="text-xs font-semibold tracking-wider">
              TICKET
            </Badge>
          </div>

          {/* Event Name */}
          <div className="px-6 pt-4 pb-2 text-center">
            <h1 className="text-2xl font-bold">{ticket.event.name}</h1>
          </div>

          {/* Date & Time */}
          {ticket.event.event_date && (
            <div className="px-6 py-2 flex items-center justify-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">{formatDate(ticket.event.event_date)}</span>
              {ticket.event.event_time && (
                <>
                  <Clock className="h-4 w-4 ml-2" />
                  <span className="text-sm">{ticket.event.event_time} Uhr</span>
                </>
              )}
            </div>
          )}

          {/* Location */}
          {ticket.event.location && (
            <div className="px-6 py-2 flex items-center justify-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{ticket.event.location}</span>
            </div>
          )}

          {/* QR Code */}
          <div className="px-6 py-8 flex justify-center">
            <div className="bg-white p-4 rounded-2xl">
              <QRCodeSVG
                value={ticketUrl}
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>

          {/* Guest Info */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between py-3 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {i18n.language === 'de' ? 'Gast' : 'Guest'}
                </p>
                <p className="font-medium">{ticket.participant.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Status
                </p>
                <Badge variant="default" className="bg-green-500 hover:bg-green-500">
                  {ticket.status === 'valid' 
                    ? (i18n.language === 'de' ? 'Dabei' : 'Going')
                    : ticket.status === 'used'
                    ? (i18n.language === 'de' ? 'Eingecheckt' : 'Checked in')
                    : ticket.status}
                </Badge>
              </div>
            </div>

            {/* Ticket Type */}
            {ticket.ticket_category && (
              <div className="py-3 border-t border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Ticket
                </p>
                <p className="font-medium">1× {ticket.ticket_category.name}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 space-y-3">
            {ticket.event.location && (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={openDirections}
              >
                <MapPin className="h-4 w-4 mr-2" />
                {i18n.language === 'de' ? 'Route planen' : 'Get Directions'}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={addToCalendar}
            >
              <Wallet className="h-4 w-4 mr-2" />
              {i18n.language === 'de' ? 'Zum Kalender hinzufügen' : 'Add to Calendar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}