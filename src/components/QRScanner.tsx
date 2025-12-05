import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { useOfflineCheckIn } from "@/hooks/use-offline-checkin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ScanLine, 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  XCircle,
  Loader2,
  UserCheck,
  WifiOff,
  Wifi,
  Download,
  RefreshCw,
  CloudOff,
  Trash2
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
  isOffline?: boolean;
}

export function QRScanner({ eventId }: QRScannerProps) {
  const { t, i18n } = useTranslation('event');
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [successOverlay, setSuccessOverlay] = useState<{ name: string; type: string; isOffline?: boolean } | null>(null);
  const [errorOverlay, setErrorOverlay] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const dateLocale = i18n.language === 'de' ? de : enUS;

  const {
    isOnline,
    isDownloading,
    isSyncing,
    hasOfflineData,
    offlineTicketCount,
    pendingCount,
    lastDownload,
    downloadTicketsForOffline,
    checkInOffline,
    syncPendingCheckIns,
    clearOfflineData
  } = useOfflineCheckIn(eventId, i18n.language);

  useEffect(() => {
    if (isOnline) {
      fetchStats();
    }
    return () => {
      stopScanner();
    };
  }, [eventId, isOnline]);

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
    const urlMatch = scannedText.match(/ticket\/([A-Z0-9-]+)/i);
    if (urlMatch) return urlMatch[1];
    
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

    // Use offline mode if not online and has offline data
    if (!isOnline && hasOfflineData) {
      const result = checkInOffline(ticketCode);
      
      if (result.success) {
        setSuccessOverlay({ 
          name: result.guestName!, 
          type: result.ticketType!,
          isOffline: true 
        });
        
        if (navigator.vibrate) {
          navigator.vibrate(200);
        }

        setRecentCheckIns(prev => [{
          id: Date.now().toString(),
          guestName: result.guestName!,
          ticketType: result.ticketType!,
          timestamp: new Date(),
          isOffline: true
        }, ...prev].slice(0, 10));

        setCheckedInCount(prev => prev + 1);

        setTimeout(() => {
          setSuccessOverlay(null);
        }, 2000);
      } else {
        showError(result.error!);
      }
      
      setIsProcessing(false);
      return;
    }

    // Online mode - original logic
    try {
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

      if (ticket.event_id !== eventId) {
        showError(t('checkIn.wrongEvent'));
        setIsProcessing(false);
        return;
      }

      if (ticket.status === 'used') {
        showError(t('checkIn.alreadyUsed'));
        setIsProcessing(false);
        return;
      }

      if (ticket.status === 'cancelled') {
        showError(t('checkIn.cancelled'));
        setIsProcessing(false);
        return;
      }

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

      setSuccessOverlay({ name: guestName, type: ticketType });
      
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }

      setRecentCheckIns(prev => [{
        id: ticket.id,
        guestName,
        ticketType,
        timestamp: new Date()
      }, ...prev].slice(0, 10));

      setCheckedInCount(prev => prev + 1);

      setTimeout(() => {
        setSuccessOverlay(null);
      }, 2000);

    } catch (error) {
      console.error("Error processing check-in:", error);
      
      // Fallback to offline if online fails and has offline data
      if (hasOfflineData) {
        const result = checkInOffline(ticketCode);
        if (result.success) {
          setSuccessOverlay({ 
            name: result.guestName!, 
            type: result.ticketType!,
            isOffline: true 
          });
          setCheckedInCount(prev => prev + 1);
          setTimeout(() => setSuccessOverlay(null), 2000);
        } else {
          showError(t('checkIn.error'));
        }
      } else {
        showError(t('checkIn.error'));
      }
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
    setIsScanning(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const html5QrCode = new Html5Qrcode("qr-reader", {
        verbose: false,
        formatsToSupport: [0]
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
        () => {}
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
      {/* Offline Status Bar */}
      <Card className={`p-3 ${isOnline ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  {t('checkIn.online')}
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  {t('checkIn.offline')}
                </span>
              </>
            )}
          </div>
          
          {pendingCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {t('checkIn.pendingSync', { count: pendingCount })}
              </span>
              {isOnline && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={syncPendingCheckIns}
                  disabled={isSyncing}
                  className="h-7 px-2"
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Offline Data Management */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <CloudOff className="h-4 w-4" />
            {t('checkIn.offlineMode')}
          </h3>
          {hasOfflineData && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearOfflineData}
              className="h-7 px-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              {t('checkIn.clearData')}
            </Button>
          )}
        </div>
        
        {hasOfflineData ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {t('checkIn.ticketsDownloaded', { count: offlineTicketCount })}
            </p>
            {lastDownload && (
              <p className="text-xs text-muted-foreground">
                {t('checkIn.lastDownload')}: {format(lastDownload, "dd.MM.yyyy HH:mm", { locale: dateLocale })}
              </p>
            )}
            <Button
              onClick={downloadTicketsForOffline}
              disabled={isDownloading || !isOnline}
              variant="outline"
              size="sm"
              className="w-full mt-2"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {t('checkIn.refreshOfflineData')}
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              {t('checkIn.noOfflineData')}
            </p>
            <Button
              onClick={downloadTicketsForOffline}
              disabled={isDownloading || !isOnline}
              className="w-full"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {t('checkIn.downloadForOffline')}
            </Button>
          </div>
        )}
      </Card>

      {/* Scanner Area */}
      <Card className="overflow-hidden">
        <div className="relative">
          <div 
            id="qr-reader" 
            className="w-full"
            style={{ 
              display: isScanning ? 'block' : 'none',
              minHeight: isScanning ? '300px' : '0'
            }}
          />
          
          {!isScanning && (
            <div className="w-full aspect-square bg-gradient-to-br from-muted to-muted/50 flex flex-col items-center justify-center">
              <div className="w-64 h-64 border-2 border-dashed border-muted-foreground/30 rounded-2xl flex items-center justify-center">
                <ScanLine className="h-16 w-16 text-muted-foreground/50" />
              </div>
              <p className="mt-4 text-muted-foreground">
                {t('checkIn.scanTicket')}
              </p>
              {!isOnline && !hasOfflineData && (
                <p className="mt-2 text-sm text-amber-500">
                  {t('checkIn.downloadFirst')}
                </p>
              )}
            </div>
          )}

          {/* Success Overlay */}
          {successOverlay && (
            <div className="absolute inset-0 bg-emerald-500/95 flex flex-col items-center justify-center text-white animate-in fade-in zoom-in duration-200">
              <CheckCircle2 className="h-20 w-20 mb-4" />
              <p className="text-2xl font-bold mb-1">{t('checkIn.success')}</p>
              <p className="text-xl">{successOverlay.name}</p>
              <p className="text-sm opacity-80 mt-1">{successOverlay.type}</p>
              {successOverlay.isOffline && (
                <p className="text-xs opacity-60 mt-2 flex items-center gap-1">
                  <CloudOff className="h-3 w-3" />
                  {t('checkIn.savedOffline')}
                </p>
              )}
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
            disabled={!isOnline && !hasOfflineData}
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
              <p className="text-2xl font-bold">{isOnline ? totalTickets : offlineTicketCount}</p>
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
                  <div className={`p-1.5 rounded-full ${checkIn.isOffline ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                    {checkIn.isOffline ? (
                      <CloudOff className="h-4 w-4 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
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
