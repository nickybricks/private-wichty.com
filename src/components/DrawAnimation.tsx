import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

interface DrawAnimationProps {
  participantId: string;
  onComplete: () => void;
}

export function DrawAnimation({ participantId, onComplete }: DrawAnimationProps) {
  const [stage, setStage] = useState<"animating" | "result">("animating");
  const [assignedName, setAssignedName] = useState("");
  const [assignedWish, setAssignedWish] = useState("");

  useEffect(() => {
    performDraw();
  }, []);

  const performDraw = async () => {
    try {
      // Call the spin function
      const { data, error } = await supabase.rpc("spin_wheel", {
        p_participant_id: participantId,
      });

      if (error) throw error;

      if (!data) {
        toast.error("Keine verfügbaren Teilnehmer mehr");
        onComplete();
        return;
      }

      // Fetch the assigned participant details
      const { data: participant, error: participantError } = await supabase
        .from("participants")
        .select("name, wish")
        .eq("id", data as string)
        .single();

      if (participantError) throw participantError;

      setAssignedName(participant?.name || "");
      setAssignedWish(participant?.wish || "");

      // Show animation for 2 seconds before revealing result
      setTimeout(() => {
        setStage("result");
      }, 2000);
    } catch (error) {
      console.error("Error performing draw:", error);
      toast.error("Fehler bei der Zulosung");
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {stage === "animating" && (
          <Card className="p-12 shadow-strong text-center animate-scale-in">
            <div className="space-y-6">
              <div className="relative">
                <Gift className="h-24 w-24 mx-auto text-primary animate-spin-slow" />
                <Sparkles className="h-8 w-8 absolute top-0 right-1/4 text-primary animate-pulse" />
                <Sparkles className="h-6 w-6 absolute bottom-0 left-1/4 text-primary animate-pulse" style={{ animationDelay: "0.5s" }} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Zulosung läuft...</h2>
                <p className="text-muted-foreground">
                  Einen Moment, wir ermitteln deinen Wichtel-Partner
                </p>
              </div>
            </div>
          </Card>
        )}

        {stage === "result" && (
          <Card className="p-8 shadow-strong animate-scale-in">
            <div className="space-y-6">
              <button
                onClick={onComplete}
                className="absolute top-4 right-4 p-2 hover:bg-secondary rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <Gift className="h-8 w-8 text-primary" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Du beschenkst:</h2>
                  <p className="text-3xl font-bold text-primary">
                    {assignedName}
                  </p>
                </div>

                <div className="pt-4 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Geschenkwunsch:
                  </p>
                  <Card className="p-4 bg-secondary/50">
                    <p className="text-base">{assignedWish}</p>
                  </Card>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={onComplete}
              >
                Verstanden
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
