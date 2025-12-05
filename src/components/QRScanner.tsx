import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ScanLine, 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  XCircle,
  Loader2,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";

interface QRScannerProps {
  eventId: string;
}

interface CheckIn {
  id: string;
  guestName: string;
  ticketType: string;
  timestamp: Date;
}

interface TicketInfo {
  id: string;
  ticket_code: string;
  status: string;
  checked_in_at: string | null;
  participant: {
    name: string;
  } | null;
  ticket_category: {
    name: string;
  } | null;
}

export function QRScanner({ eventId }: QRScannerProps) {
  const { t, i18n } = useTranslation('event');
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [successOverlay, setSuccessOverlay] = useState<{ name: string; type: string } | null>(null);
  const [errorOverlay, setErrorOverlay] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const dateLocale = i18n.language === 'de' ? de : enUS;

  useEffect(() => {
    fetchStats();
    return () => {
      stopScanner();
    };
  }, [eventId]);

  const fetchStats = async () => {
    try {
      const { data: tickets, error } = await supabase
        .from("tickets")
        .select("id, status, checked_in_at")
        .eq("event_id", eventId);

      if (error) throw error;

      setTotalTickets(tickets?.length || 0);
      setCheckedInCount(tickets?.filter(t => t.status === 'used').length || 0);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const extractTicketCode = (scannedText: string): string | null => {
    // Match ticket code from URL like https://wichty.com/ticket/EVT-XXXX-XXXX
    const urlMatch = scannedText.match(/ticket\/([A-Z0-9-]+)/i);
    if (urlMatch) return urlMatch[1];
    
    // Match direct code format EVT-XXXX-XXXX
    const directMatch = scannedText.match(/^(EVT-[A-Z0-9]+-[A-Z0-9]+)$/i);
    if (directMatch) return directMatch[1];
    
    return null;
  };

  const handleScan = async (decodedText: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    const ticketCode = extractTicketCode(decodedText);
    
    if (!ticketCode) {
      showError(t('checkIn.invalidQR'));
      setIsProcessing(false);
      return;
    }

    try {
      // Fetch ticket with participant and category info
      const { data: ticket, error } = await supabase
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
        .eq("ticket_code", ticketCode)
        .maybeSingle();

      if (error) throw error;

      if (!ticket) {
        showError(t('checkIn.notFound'));
        setIsProcessing(false);
        return;
      }

      // Check if ticket belongs to this event
      if (ticket.event_id !== eventId) {
        showError(t('checkIn.wrongEvent'));
        setIsProcessing(false);
        return;
      }

      // Check if already used
      if (ticket.status === 'used') {
        showError(t('checkIn.alreadyUsed'));
        setIsProcessing(false);
        return;
      }

      // Check if cancelled
      if (ticket.status === 'cancelled') {
        showError(t('checkIn.cancelled'));
        setIsProcessing(false);
        return;
      }

      // Perform check-in
      const { error: updateError } = await supabase
        .from("tickets")
        .update({
          status: 'used',
          checked_in_at: new Date().toISOString()
        })
        .eq("id", ticket.id);

      if (updateError) throw updateError;

      const guestName = ticket.participant?.name || t('checkIn.unknownGuest');
      const ticketType = ticket.ticket_category?.name || t('tickets.generalAdmission');

      // Show success overlay
      setSuccessOverlay({ name: guestName, type: ticketType });
      
      // Vibrate if supported
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }

      // Add to recent check-ins
      setRecentCheckIns(prev => [{
        id: ticket.id,
        guestName,
        ticketType,
        timestamp: new Date()
      }, ...prev].slice(0, 10));

      // Update stats
      setCheckedInCount(prev => prev + 1);

      // Hide overlay after 2 seconds
      setTimeout(() => {
        setSuccessOverlay(null);
      }, 2000);

    } catch (error) {
      console.error("Error processing check-in:", error);
      showError(t('checkIn.error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const showError = (message: string) => {
    setErrorOverlay(message);
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    setTimeout(() => {
      setErrorOverlay(null);
    }, 2000);
  };

  const startScanner = async () => {
    // Set scanning state first so the container is visible
    setIsScanning(true);
    
    // Small delay to ensure DOM is updated
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const html5QrCode = new Html5Qrcode("qr-reader", {
        verbose: false,
        formatsToSupport: [0] // QR_CODE only
      });
      scannerRef.current = html5QrCode;
      
      const containerWidth = document.getElementById("qr-reader")?.clientWidth || 300;
      const qrboxSize = Math.min(250, containerWidth - 50);
      
      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: qrboxSize, height: qrboxSize },
          aspectRatio: 1,
        },
        handleScan,
        () => {} // Ignore scan failures
      );
    } catch (error) {
      console.error("Error starting scanner:", error);
      setIsScanning(false);
      toast.error(t('checkIn.cameraPermission'));
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
    setIsScanning(false);
  };

  return (
    <div className="space-y-6">
      {/* Scanner Area */}
      <Card className="overflow-hidden">
        <div className="relative">
          {/* Camera Preview - must have explicit dimensions for html5-qrcode */}
          <div 
            id="qr-reader" 
            className="w-full"
            style={{ 
              display: isScanning ? 'block' : 'none',
              minHeight: isScanning ? '300px' : '0'
            }}
          />
          
          {/* Placeholder when not scanning */}
          {!isScanning && (
            <div className="w-full aspect-square bg-gradient-to-br from-muted to-muted/50 flex flex-col items-center justify-center">
              <div className="w-64 h-64 border-2 border-dashed border-muted-foreground/30 rounded-2xl flex items-center justify-center">
                <ScanLine className="h-16 w-16 text-muted-foreground/50" />
              </div>
              <p className="mt-4 text-muted-foreground">
                {t('checkIn.scanTicket')}
              </p>
            </div>
          )}

          {/* Success Overlay */}
          {successOverlay && (
            <div className="absolute inset-0 bg-emerald-500/95 flex flex-col items-center justify-center text-white animate-in fade-in zoom-in duration-200">
              <CheckCircle2 className="h-20 w-20 mb-4" />
              <p className="text-2xl font-bold mb-1">{t('checkIn.success')}</p>
              <p className="text-xl">{successOverlay.name}</p>
              <p className="text-sm opacity-80 mt-1">{successOverlay.type}</p>
            </div>
          )}

          {/* Error Overlay */}
          {errorOverlay && (
            <div className="absolute inset-0 bg-destructive/95 flex flex-col items-center justify-center text-white animate-in fade-in zoom-in duration-200">
              <XCircle className="h-20 w-20 mb-4" />
              <p className="text-xl font-bold">{errorOverlay}</p>
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && !successOverlay && !errorOverlay && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Scanner Controls */}
        <div className="p-4">
          <Button
            onClick={isScanning ? stopScanner : startScanner}
            size="lg"
            variant={isScanning ? "destructive" : "default"}
            className="w-full h-12"
          >
            {isScanning ? (
              <>
                <CameraOff className="mr-2 h-5 w-5" />
                {t('checkIn.stopScanner')}
              </>
            ) : (
              <>
                <Camera className="mr-2 h-5 w-5" />
                {t('checkIn.startScanner')}
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <UserCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{checkedInCount}</p>
              <p className="text-sm text-muted-foreground">{t('checkIn.checkedIn')}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ScanLine className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalTickets}</p>
              <p className="text-sm text-muted-foreground">{t('checkIn.total')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Check-Ins */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">{t('checkIn.recentCheckIns')}</h3>
        {recentCheckIns.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {t('checkIn.noCheckIns')}
          </p>
        ) : (
          <div className="space-y-3">
            {recentCheckIns.map((checkIn) => (
              <div 
                key={checkIn.id} 
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-emerald-500/10 rounded-full">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-medium">{checkIn.guestName}</p>
                    <p className="text-xs text-muted-foreground">{checkIn.ticketType}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(checkIn.timestamp, "HH:mm", { locale: dateLocale })}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
