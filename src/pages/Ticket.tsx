import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Calendar, Clock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import useEmblaCarousel from "embla-carousel-react";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false,
    align: 'center',
    containScroll: 'trimSnaps'
  });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Scroll to requested ticket when tickets are loaded
  useEffect(() => {
    if (emblaApi && tickets.length > 0 && ticketCode) {
      const requestedIndex = tickets.findIndex(t => t.ticket_code === ticketCode);
      if (requestedIndex >= 0) {
        emblaApi.scrollTo(requestedIndex, true);
      }
    }
  }, [emblaApi, tickets, ticketCode]);

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

      // Get all ticket categories for the tickets
      const categoryIds = [...new Set((allTickets || [ticketData]).map(t => t.ticket_category_id).filter(Boolean))];
      const categoriesMap: Record<string, { name: string; price_cents: number; currency: string }> = {};
      
      if (categoryIds.length > 0) {
        const { data: categories } = await supabase
          .from("ticket_categories")
          .select("id, name, price_cents, currency")
          .in("id", categoryIds);
        
        categories?.forEach(cat => {
          categoriesMap[cat.id] = { name: cat.name, price_cents: cat.price_cents, currency: cat.currency };
        });
      }

      const formattedTickets: TicketData[] = (allTickets || [ticketData]).map(t => ({
        id: t.id,
        ticket_code: t.ticket_code,
        status: t.status,
        created_at: t.created_at,
        event: eventData || { id: '', name: '', event_date: null, event_time: null, location: null, image_url: null },
        participant: participantData || { name: '' },
        ticket_category: t.ticket_category_id ? categoriesMap[t.ticket_category_id] || null : null,
      }));

      setTickets(formattedTickets);
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
    // Shorter format for compact display: "Sa, 15. Jan 2026"
    return format(date, "EEE, d. MMM yyyy", {
      locale: i18n.language === 'de' ? de : enUS,
    });
  };

  const openDirections = (ticket: TicketData) => {
    if (ticket?.event.location) {
      const encodedLocation = encodeURIComponent(ticket.event.location);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank');
    }
  };

  const addToGoogleCalendar = (ticket: TicketData) => {
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

  const addToAppleCalendar = (ticket: TicketData) => {
    if (!ticket) return;

    const event = ticket.event;
    
    // Format date for ICS (YYYYMMDDTHHMMSS)
    const formatICSDate = (dateStr: string | null, timeStr: string | null): string => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (timeStr) {
        const [hours, minutes] = timeStr.split(':');
        date.setHours(parseInt(hours), parseInt(minutes));
      }
      return date.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, -1);
    };

    const startDate = formatICSDate(event.event_date, event.event_time);
    // End date: 2 hours after start as default
    let endDate = startDate;
    if (event.event_date) {
      const date = new Date(event.event_date);
      if (event.event_time) {
        const [hours, minutes] = event.event_time.split(':');
        date.setHours(parseInt(hours) + 2, parseInt(minutes));
      } else {
        date.setHours(date.getHours() + 2);
      }
      endDate = date.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, -1);
    }

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Wichty//Event Ticket//EN',
      'BEGIN:VEVENT',
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${event.name}`,
      `LOCATION:${event.location || ''}`,
      `DESCRIPTION:Ticket für ${event.name}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.name.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
          {t('ticketPage.goHome')}
        </Button>
      </div>
    );
  }

  // For single ticket, render directly without carousel
  if (tickets.length === 1) {
    const ticket = tickets[0];
    const ticketUrl = `${window.location.origin}/ticket/${ticket.ticket_code}`;
    
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <TicketCard 
            ticket={ticket} 
            ticketUrl={ticketUrl}
            t={t}
            i18n={i18n}
            formatDate={formatDate}
            openDirections={openDirections}
          />
        </div>
      </div>
    );
  }

  // For multiple tickets, use carousel
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        {/* Ticket Counter at top */}
        <p className="text-center text-sm text-muted-foreground mb-4">
          {t('ticketPage.ticketOf', { current: selectedIndex + 1, total: tickets.length })}
        </p>

        {/* Carousel */}
        <div className="overflow-visible" ref={emblaRef}>
          <div className="flex">
            {tickets.map((ticket) => {
              const ticketUrl = `${window.location.origin}/ticket/${ticket.ticket_code}`;
              
              return (
                <div 
                  key={ticket.id} 
                  className="flex-[0_0_100%] min-w-0 px-2"
                >
                  <TicketCard 
                    ticket={ticket} 
                    ticketUrl={ticketUrl}
                    t={t}
                    i18n={i18n}
                    formatDate={formatDate}
                    openDirections={openDirections}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {tickets.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                selectedIndex === index
                  ? "bg-foreground w-6"
                  : "bg-foreground/30 hover:bg-foreground/50"
              }`}
              aria-label={`Go to ticket ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Extracted TicketCard component
interface TicketCardProps {
  ticket: TicketData;
  ticketUrl: string;
  t: (key: string) => string;
  i18n: { language: string };
  formatDate: (dateStr: string | null) => string | null;
  openDirections: (ticket: TicketData) => void;
}

function TicketCard({ ticket, ticketUrl, t, i18n, formatDate, openDirections }: TicketCardProps) {
  return (
    <div className="bg-background rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden">
      {/* Header: Badge + Event Name */}
      <div className="px-5 pt-4 pb-2 text-center">
        <Badge variant="secondary" className="text-[10px] font-semibold tracking-wider mb-2">
          {t('ticketPage.badge')}
        </Badge>
        <h1 className="text-lg font-bold leading-tight line-clamp-2">{ticket.event.name}</h1>
      </div>

      {/* Date, Time & Location - Compact single line each */}
      <div className="px-5 py-1 space-y-0.5">
        {ticket.event.event_date && (
          <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-xs">{formatDate(ticket.event.event_date)}</span>
            {ticket.event.event_time && (
              <>
                <span className="text-xs mx-1">•</span>
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs">
                  {ticket.event.event_time.slice(0, 5)} {i18n.language === 'de' ? 'Uhr' : ''}
                </span>
              </>
            )}
          </div>
        )}
        {ticket.event.location && (
          <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs text-center line-clamp-1">{ticket.event.location}</span>
          </div>
        )}
      </div>

      {/* QR Code - Smaller on mobile */}
      <div className="px-5 py-4 flex justify-center">
        <div className="bg-white p-3 rounded-xl shadow-sm">
          <QRCodeSVG
            value={ticketUrl}
            size={140}
            level="H"
            includeMargin={false}
          />
        </div>
      </div>

      {/* Guest Info - Horizontal compact layout */}
      <div className="px-5 pb-3">
        <div className="flex items-center justify-between py-2 border-t border-border">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {t('ticketPage.guest')}
            </p>
            <p className="text-sm font-medium truncate">{ticket.participant.name}</p>
          </div>
          {ticket.ticket_category && (
            <div className="text-center px-3 border-l border-border min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {t('ticketPage.ticket')}
              </p>
              <p className="text-sm font-medium truncate">{ticket.ticket_category.name}</p>
            </div>
          )}
          <div className="text-right pl-3 border-l border-border shrink-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {t('ticketPage.status')}
            </p>
            <Badge variant="default" className="bg-green-500 hover:bg-green-500 text-xs px-2 py-0">
              {ticket.status === 'valid' 
                ? t('ticketPage.going')
                : ticket.status === 'used'
                ? t('ticketPage.checkedIn')
                : ticket.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Actions */}
      {ticket.event.location && (
        <div className="px-5 pb-5">
          <Button 
            variant="outline" 
            size="sm"
            className="w-full text-xs h-9" 
            onClick={() => openDirections(ticket)}
          >
            <MapPin className="h-3.5 w-3.5 mr-1.5" />
            {t('ticketPage.getDirections')}
          </Button>
        </div>
      )}
    </div>
  );
}