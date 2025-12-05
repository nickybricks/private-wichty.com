import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { EventPreviewSheet } from "@/components/EventPreviewSheet";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

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

    if (paymentSuccess === 'true' && participantName) {
      try {
        const { data, error } = await supabase
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
        
        if (data) {
          toast.success(t('joinSuccess'));
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
