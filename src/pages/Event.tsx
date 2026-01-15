import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { EventPreviewSheet } from "@/components/EventPreviewSheet";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface SelectedTicket {
  categoryId: string;
  quantity: number;
}

export default function Event() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation('event');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate("/dashboard");
      return;
    }

    checkAuthAndHandlePayment();
  }, [id]);

  const checkAuthAndHandlePayment = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate(`/auth?redirect=/event/${id}`);
      return;
    }
    
    setUser(session.user);

    // Handle payment success/cancel from Stripe redirect
    const paymentSuccess = searchParams.get('payment_success');
    const participantName = searchParams.get('name');
    const ticketsParam = searchParams.get('tickets');

    if (paymentSuccess === 'true' && participantName) {
      try {
        // Parse selected tickets from URL
        let selectedTickets: SelectedTicket[] = [];
        if (ticketsParam) {
          try {
            selectedTickets = JSON.parse(decodeURIComponent(ticketsParam));
          } catch (e) {
            console.error("Failed to parse tickets param:", e);
          }
        }

        // Create participant
        const { data: participantData, error } = await supabase
          .from("participants")
          .insert({
            event_id: id,
            name: decodeURIComponent(participantName),
            user_id: session.user.id,
          })
          .select()
          .single();

        if (error && error.code !== '23505') {
          throw error;
        }
        
        if (participantData) {
          // Calculate total tickets to create
          const totalTickets = selectedTickets.length > 0
            ? selectedTickets.reduce((sum, t) => sum + t.quantity, 0)
            : 1;

          // Create tickets for the participant
          const ticketCodes: string[] = [];
          const ticketInserts: any[] = [];
          
          // Generate a unique batch ID for this purchase
          const batchId = Date.now().toString(36).toUpperCase();

          for (let i = 0; i < totalTickets; i++) {
            // Generate truly unique ticket code with random component for each ticket
            const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
            const ticketCode = `EVT-${batchId}${randomPart}-${i.toString().padStart(2, '0')}`;
            ticketCodes.push(ticketCode);
            
            // Find which category this ticket belongs to
            let categoryId: string | null = null;
            if (selectedTickets.length > 0) {
              let ticketIndex = 0;
              for (const selected of selectedTickets) {
                if (i >= ticketIndex && i < ticketIndex + selected.quantity) {
                  categoryId = selected.categoryId;
                  break;
                }
                ticketIndex += selected.quantity;
              }
            }

            ticketInserts.push({
              participant_id: participantData.id,
              event_id: id,
              ticket_code: ticketCode,
              ticket_category_id: categoryId,
            });
          }

          console.log("[Event] Creating tickets:", { totalTickets, ticketCodes, ticketInserts });

          const { error: ticketError } = await supabase.from("tickets").insert(ticketInserts);
          if (ticketError) {
            console.error("[Event] Error creating tickets:", ticketError);
            throw ticketError;
          }
          console.log("[Event] Tickets created successfully:", ticketCodes);

          // Get event details for confirmation email
          const { data: eventDetails } = await supabase
            .from("events")
            .select("name, event_date, event_time, location, user_id")
            .eq("id", id)
            .single();

          // Send ONE ticket purchase confirmation email with ALL tickets
          if (session.user.email) {
            const decodedName = decodeURIComponent(participantName);
            // Use production URL for emails (not preview URL)
            const baseUrl = window.location.hostname.includes('lovable.app') 
              ? 'https://wichty.com' 
              : window.location.origin;
            const eventUrl = `${baseUrl}/event/${id}`;
            
            // Build ticket URLs - use first ticket as main, include count
            const mainTicketUrl = `${baseUrl}/ticket/${ticketCodes[0]}`;

            supabase.functions.invoke('send-notification', {
              body: {
                type: 'ticket_purchased',
                recipientEmail: session.user.email,
                recipientName: decodedName,
                language: i18n.language === 'de' ? 'de' : 'en',
                eventName: eventDetails?.name || '',
                eventDate: eventDetails?.event_date,
                eventTime: eventDetails?.event_time,
                eventLocation: eventDetails?.location,
                eventUrl,
                ticketUrl: mainTicketUrl,
                ticketCount: totalTickets,
              },
            }).catch(err => console.error("Failed to send ticket email:", err));

            // Send notification to host (new purchase)
            if (eventDetails?.user_id && eventDetails.user_id !== session.user.id) {
              const { data: hostProfile } = await supabase
                .from("profiles")
                .select("display_name, first_name, last_name, notify_organizing")
                .eq("id", eventDetails.user_id)
                .single();

              if (hostProfile?.notify_organizing !== false) {
                supabase.functions.invoke('send-notification', {
                  body: {
                    type: 'new_purchase',
                    recipientUserId: eventDetails.user_id,
                    recipientName: hostProfile?.first_name || hostProfile?.display_name || 'Host',
                    language: i18n.language === 'de' ? 'de' : 'en',
                    eventName: eventDetails?.name || '',
                    eventDate: eventDetails?.event_date,
                    eventTime: eventDetails?.event_time,
                    eventLocation: eventDetails?.location,
                    eventUrl,
                    participantName: decodedName,
                    ticketCount: totalTickets,
                  },
                }).catch(err => console.error("Failed to send host notification:", err));
              }
            }
          }

          toast.success(totalTickets > 1 
            ? (i18n.language === 'de' ? `${totalTickets} Tickets erfolgreich gekauft!` : `${totalTickets} tickets purchased successfully!`)
            : t('joinSuccess'));
        }

        window.history.replaceState({}, '', `/event/${id}`);
      } catch (error) {
        console.error('Error adding participant after payment:', error);
      }
    }

    if (searchParams.get('payment_cancelled') === 'true') {
      toast.error(i18n.language === 'de' ? 'Zahlung abgebrochen' : 'Payment cancelled');
      window.history.replaceState({}, '', `/event/${id}`);
    }

    setLoading(false);
    setShowPreview(true);
  };

  const handleClose = () => {
    setShowPreview(false);
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <EventPreviewSheet
        eventId={id || null}
        open={showPreview}
        onOpenChange={(open) => {
          if (!open) {
            handleClose();
          }
        }}
        user={user}
      />
    </div>
  );
}
