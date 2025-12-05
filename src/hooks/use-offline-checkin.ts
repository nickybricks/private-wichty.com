import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OfflineTicket {
  id: string;
  ticket_code: string;
  status: string;
  checked_in_at: string | null;
  event_id: string;
  participant_name: string;
  ticket_type: string;
}

interface LocalCheckIn {
  ticketId: string;
  ticketCode: string;
  checkedInAt: string;
  guestName: string;
  ticketType: string;
  synced: boolean;
}

const STORAGE_KEY_TICKETS = "offline_tickets";
const STORAGE_KEY_CHECKINS = "offline_checkins";

export function useOfflineCheckIn(eventId: string, language: string) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineTickets, setOfflineTickets] = useState<OfflineTicket[]>([]);
  const [pendingCheckIns, setPendingCheckIns] = useState<LocalCheckIn[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastDownload, setLastDownload] = useState<Date | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    loadFromStorage();
    
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingCheckIns();
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [eventId]);

  const loadFromStorage = () => {
    try {
      const ticketsKey = `${STORAGE_KEY_TICKETS}_${eventId}`;
      const checkinsKey = `${STORAGE_KEY_CHECKINS}_${eventId}`;
      
      const storedTickets = localStorage.getItem(ticketsKey);
      const storedCheckIns = localStorage.getItem(checkinsKey);
      const storedLastDownload = localStorage.getItem(`${ticketsKey}_timestamp`);
      
      if (storedTickets) {
        setOfflineTickets(JSON.parse(storedTickets));
      }
      if (storedCheckIns) {
        setPendingCheckIns(JSON.parse(storedCheckIns));
      }
      if (storedLastDownload) {
        setLastDownload(new Date(storedLastDownload));
      }
    } catch (error) {
      console.error("Error loading from storage:", error);
    }
  };

  const saveToStorage = (tickets: OfflineTicket[], checkIns: LocalCheckIn[]) => {
    try {
      const ticketsKey = `${STORAGE_KEY_TICKETS}_${eventId}`;
      const checkinsKey = `${STORAGE_KEY_CHECKINS}_${eventId}`;
      
      localStorage.setItem(ticketsKey, JSON.stringify(tickets));
      localStorage.setItem(checkinsKey, JSON.stringify(checkIns));
    } catch (error) {
      console.error("Error saving to storage:", error);
    }
  };

  const downloadTicketsForOffline = async () => {
    setIsDownloading(true);
    
    try {
      const { data: tickets, error } = await supabase
        .from("tickets")
        .select(`
          id,
          ticket_code,
          status,
          checked_in_at,
          event_id,
          participant:participants(name),
          ticket_category:ticket_categories(name)
        `)
        .eq("event_id", eventId);

      if (error) throw error;

      const formattedTickets: OfflineTicket[] = (tickets || []).map(t => ({
        id: t.id,
        ticket_code: t.ticket_code,
        status: t.status,
        checked_in_at: t.checked_in_at,
        event_id: t.event_id,
        participant_name: t.participant?.name || (language === 'de' ? 'Unbekannter Gast' : 'Unknown guest'),
        ticket_type: t.ticket_category?.name || (language === 'de' ? 'Eintritt' : 'General Admission')
      }));

      setOfflineTickets(formattedTickets);
      
      const ticketsKey = `${STORAGE_KEY_TICKETS}_${eventId}`;
      localStorage.setItem(ticketsKey, JSON.stringify(formattedTickets));
      localStorage.setItem(`${ticketsKey}_timestamp`, new Date().toISOString());
      setLastDownload(new Date());

      toast.success(
        language === 'de' 
          ? `${formattedTickets.length} Tickets für Offline-Nutzung heruntergeladen`
          : `${formattedTickets.length} tickets downloaded for offline use`
      );
    } catch (error) {
      console.error("Error downloading tickets:", error);
      toast.error(
        language === 'de'
          ? 'Fehler beim Herunterladen der Tickets'
          : 'Error downloading tickets'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const checkInOffline = useCallback((ticketCode: string): { success: boolean; guestName?: string; ticketType?: string; error?: string } => {
    // Find ticket in offline data
    const ticket = offlineTickets.find(t => t.ticket_code.toLowerCase() === ticketCode.toLowerCase());
    
    if (!ticket) {
      return { 
        success: false, 
        error: language === 'de' ? 'Ticket nicht in Offline-Daten gefunden' : 'Ticket not found in offline data' 
      };
    }

    // Check if already checked in (either in original data or pending)
    const alreadyPending = pendingCheckIns.find(c => c.ticketCode.toLowerCase() === ticketCode.toLowerCase());
    if (ticket.status === 'used' || alreadyPending) {
      return { 
        success: false, 
        error: language === 'de' ? 'Ticket bereits verwendet' : 'Ticket already used' 
      };
    }

    if (ticket.status === 'cancelled') {
      return { 
        success: false, 
        error: language === 'de' ? 'Ticket wurde storniert' : 'Ticket was cancelled' 
      };
    }

    // Create local check-in record
    const newCheckIn: LocalCheckIn = {
      ticketId: ticket.id,
      ticketCode: ticket.ticket_code,
      checkedInAt: new Date().toISOString(),
      guestName: ticket.participant_name,
      ticketType: ticket.ticket_type,
      synced: false
    };

    const updatedCheckIns = [...pendingCheckIns, newCheckIn];
    setPendingCheckIns(updatedCheckIns);
    
    // Update offline ticket status locally
    const updatedTickets = offlineTickets.map(t => 
      t.id === ticket.id ? { ...t, status: 'used', checked_in_at: newCheckIn.checkedInAt } : t
    );
    setOfflineTickets(updatedTickets);
    
    saveToStorage(updatedTickets, updatedCheckIns);

    return { 
      success: true, 
      guestName: ticket.participant_name,
      ticketType: ticket.ticket_type
    };
  }, [offlineTickets, pendingCheckIns, language]);

  const syncPendingCheckIns = async () => {
    const unsyncedCheckIns = pendingCheckIns.filter(c => !c.synced);
    
    if (unsyncedCheckIns.length === 0) return;
    
    setIsSyncing(true);

    try {
      let syncedCount = 0;
      
      for (const checkIn of unsyncedCheckIns) {
        try {
          const { error } = await supabase
            .from("tickets")
            .update({
              status: 'used',
              checked_in_at: checkIn.checkedInAt
            })
            .eq("id", checkIn.ticketId)
            .eq("status", "valid"); // Only update if still valid (avoid conflicts)

          if (!error) {
            syncedCount++;
          }
        } catch (err) {
          console.error("Error syncing check-in:", checkIn.ticketCode, err);
        }
      }

      // Mark all as synced regardless of actual result (to avoid duplicate syncs)
      const updatedCheckIns = pendingCheckIns.map(c => ({ ...c, synced: true }));
      setPendingCheckIns(updatedCheckIns);
      saveToStorage(offlineTickets, updatedCheckIns);

      if (syncedCount > 0) {
        toast.success(
          language === 'de'
            ? `${syncedCount} Offline-Check-Ins synchronisiert`
            : `${syncedCount} offline check-ins synced`
        );
      }
    } catch (error) {
      console.error("Error syncing check-ins:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const clearOfflineData = () => {
    const ticketsKey = `${STORAGE_KEY_TICKETS}_${eventId}`;
    const checkinsKey = `${STORAGE_KEY_CHECKINS}_${eventId}`;
    
    localStorage.removeItem(ticketsKey);
    localStorage.removeItem(checkinsKey);
    localStorage.removeItem(`${ticketsKey}_timestamp`);
    
    setOfflineTickets([]);
    setPendingCheckIns([]);
    setLastDownload(null);
  };

  const pendingCount = pendingCheckIns.filter(c => !c.synced).length;
  const hasOfflineData = offlineTickets.length > 0;

  return {
    isOnline,
    isDownloading,
    isSyncing,
    hasOfflineData,
    offlineTicketCount: offlineTickets.length,
    pendingCount,
    lastDownload,
    downloadTicketsForOffline,
    checkInOffline,
    syncPendingCheckIns,
    clearOfflineData
  };
}
