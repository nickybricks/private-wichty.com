import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, X, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";

interface JoinRequest {
  id: string;
  user_id: string;
  name: string;
  status: string;
  created_at: string;
}

interface JoinRequestsListProps {
  eventId: string;
  requests: JoinRequest[];
  onRequestProcessed: () => void;
}

export function JoinRequestsList({ eventId, requests, onRequestProcessed }: JoinRequestsListProps) {
  const { t, i18n } = useTranslation('event');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleApprove = async (request: JoinRequest) => {
    setProcessingId(request.id);
    try {
      // Update request status
      const { error: updateError } = await supabase
        .from("join_requests")
        .update({ status: 'approved' })
        .eq("id", request.id);

      if (updateError) throw updateError;

      // Create participant entry
      const { data: participantData, error: participantError } = await supabase
        .from("participants")
        .insert({
          event_id: eventId,
          user_id: request.user_id,
          name: request.name,
        })
        .select()
        .single();

      if (participantError) throw participantError;

      // Create ticket
      const ticketCode = `EVT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      await supabase
        .from("tickets")
        .insert({
          participant_id: participantData.id,
          event_id: eventId,
          ticket_code: ticketCode,
        });

      // Get event details for notification
      const { data: eventDetails } = await supabase
        .from("events")
        .select("name, event_date, event_time, location")
        .eq("id", eventId)
        .single();

      const ticketUrl = `${window.location.origin}/ticket/${ticketCode}`;
      const eventUrl = `${window.location.origin}/event/${eventId}`;

      // Send join_request_approved notification to user
      supabase.functions.invoke('send-notification', {
        body: {
          type: 'join_request_approved',
          recipientUserId: request.user_id,
          recipientName: request.name,
          language: i18n.language === 'de' ? 'de' : 'en',
          eventName: eventDetails?.name || '',
          eventDate: eventDetails?.event_date,
          eventTime: eventDetails?.event_time,
          eventLocation: eventDetails?.location,
          eventUrl,
          ticketUrl,
        },
      }).catch(err => console.error("Failed to send approval email:", err));

      toast.success(t('joinRequests.approveSuccess'));
      onRequestProcessed();
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error(t('joinRequests.error'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: JoinRequest) => {
    setProcessingId(request.id);
    try {
      // Update request status
      const { error } = await supabase
        .from("join_requests")
        .update({ status: 'rejected' })
        .eq("id", request.id);

      if (error) throw error;

      // Get event details for notification
      const { data: eventDetails } = await supabase
        .from("events")
        .select("name, event_date, event_time, location")
        .eq("id", eventId)
        .single();

      const eventUrl = `${window.location.origin}/event/${eventId}`;

      // Send join_request_rejected notification to user
      supabase.functions.invoke('send-notification', {
        body: {
          type: 'join_request_rejected',
          recipientUserId: request.user_id,
          recipientName: request.name,
          language: i18n.language === 'de' ? 'de' : 'en',
          eventName: eventDetails?.name || '',
          eventDate: eventDetails?.event_date,
          eventTime: eventDetails?.event_time,
          eventLocation: eventDetails?.location,
          eventUrl,
        },
      }).catch(err => console.error("Failed to send rejection email:", err));

      toast.success(t('joinRequests.rejectSuccess'));
      onRequestProcessed();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error(t('joinRequests.error'));
    } finally {
      setProcessingId(null);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

  if (pendingRequests.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {t('joinRequests.noRequests')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pendingRequests.map((request) => (
        <div
          key={request.id}
          className="flex items-center gap-3 p-3 rounded-lg border bg-card"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-amber-100 text-amber-700">
              {getInitials(request.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{request.name}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {new Date(request.created_at).toLocaleDateString(
                i18n.language === 'de' ? 'de-DE' : 'en-US'
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleReject(request)}
              disabled={processingId === request.id}
              className="h-8 w-8 p-0"
            >
              {processingId === request.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => handleApprove(request)}
              disabled={processingId === request.id}
              className="h-8 w-8 p-0"
            >
              {processingId === request.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
