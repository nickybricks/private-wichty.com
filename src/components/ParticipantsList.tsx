import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Check, Pencil, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EditWishDialog } from "./EditWishDialog";

interface Participant {
  id: string;
  name: string;
  wish: string;
  has_spun: boolean;
  assigned_to: string | null;
  user_id: string;
}

interface ParticipantsListProps {
  participants: Participant[];
  eventStatus: "waiting" | "active" | "completed";
  onUpdate: () => void;
}

export function ParticipantsList({ participants, eventStatus, onUpdate }: ParticipantsListProps) {
  const { t } = useTranslation('event');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isAnonymous = (name: string) => {
    return name.toLowerCase() === 'anonym' || name.toLowerCase() === 'anonymous';
  };
  
  const currentParticipant = currentUserId 
    ? participants.find((p) => p.user_id === currentUserId)
    : null;

  const assignedParticipant = currentParticipant?.assigned_to
    ? participants.find((p) => p.id === currentParticipant.assigned_to)
    : null;

  const canEditWish = currentParticipant && 
    !currentParticipant.has_spun && 
    eventStatus !== "completed";

  return (
    <div className="space-y-4">
      {/* Show assigned person if user has drawn */}
      {currentParticipant?.has_spun && assignedParticipant && (
        <Card className="p-6 shadow-strong bg-primary/5 border-primary/20 animate-scale-in">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <Gift className="h-5 w-5" />
              <span className="font-semibold">{t('youGift')}</span>
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {getInitials(assignedParticipant.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-lg">{assignedParticipant.name}</p>
                <p className="text-sm text-muted-foreground">
                  {t('wish')}: {assignedParticipant.wish}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Participants list */}
      <Card className="p-6 shadow-medium">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            {t('participants')}
          </h3>
          {canEditWish && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {t('editWish')}
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {participants.map((participant, index) => {
            const isCurrentUser = participant.id === currentParticipant?.id;
            const shouldShowWish = isCurrentUser;
            
            return (
              <div
                key={participant.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Avatar className={`h-10 w-10 border-2 ${isAnonymous(participant.name) ? 'border-muted bg-muted' : 'border-border'}`}>
                  <AvatarFallback className={`font-medium ${isAnonymous(participant.name) ? 'bg-muted text-muted-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                    {isAnonymous(participant.name) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      getInitials(participant.name)
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium truncate ${isAnonymous(participant.name) ? 'text-muted-foreground italic' : ''}`}>
                      {participant.name}
                    </p>
                    {isAnonymous(participant.name) && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 text-muted-foreground border-muted">
                        <EyeOff className="h-3 w-3 mr-1" />
                        {t('anonymous', 'Anonym')}
                      </Badge>
                    )}
                    {isCurrentUser && (
                      <span className="text-xs text-muted-foreground">({t('you')})</span>
                    )}
                  </div>
                  {shouldShowWish && (
                    <p className="text-sm text-muted-foreground truncate">
                      {t('wish')}: {participant.wish}
                    </p>
                  )}
                </div>
                {participant.has_spun && (
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {currentParticipant && (
        <EditWishDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          participantId={currentParticipant.id}
          currentWish={currentParticipant.wish}
          onSuccess={onUpdate}
        />
      )}
    </div>
  );
}
