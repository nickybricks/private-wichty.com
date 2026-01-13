import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Sparkles, Loader2 } from "lucide-react";
import { EventFieldPopup } from "./EventFieldPopup";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DescriptionPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  description: string;
  eventName?: string;
  location?: string;
  date?: string;
  onConfirm: (description: string) => void;
}

export function DescriptionPopup({
  open,
  onOpenChange,
  description: initialDescription,
  eventName,
  location,
  date,
  onConfirm,
}: DescriptionPopupProps) {
  const { t, i18n } = useTranslation("forms");
  const [description, setDescription] = useState(initialDescription);
  const [isGenerating, setIsGenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setDescription(initialDescription);
    }
  }, [open, initialDescription]);

  // Handle bullet point creation on "- " input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === " ") {
      const textarea = e.currentTarget;
      const { selectionStart, value } = textarea;
      const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
      const currentLine = value.slice(lineStart, selectionStart);
      
      if (currentLine === "-") {
        e.preventDefault();
        const before = value.slice(0, lineStart);
        const after = value.slice(selectionStart);
        const newValue = before + "• " + after;
        setDescription(newValue);
        // Set cursor position after the bullet
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = lineStart + 2;
        }, 0);
      }
    }
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-event-description", {
        body: {
          eventName,
          location,
          date,
          existingText: description,
          language: i18n.language,
        },
      });

      if (error) throw error;
      
      if (data?.description) {
        setDescription(data.description);
        toast.success(
          i18n.language === "de" 
            ? "Beschreibung generiert!" 
            : "Description generated!"
        );
      }
    } catch (error: any) {
      console.error("Error generating description:", error);
      toast.error(
        i18n.language === "de"
          ? "Fehler beim Generieren der Beschreibung"
          : "Error generating description"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = () => {
    onConfirm(description);
    onOpenChange(false);
  };

  return (
    <EventFieldPopup
      open={open}
      onOpenChange={onOpenChange}
      title={t("eventForm.description", "Description")}
      icon={<FileText className="h-5 w-5 text-primary" />}
      className="sm:max-w-lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {i18n.language === "de"
            ? 'Tipp: Tippe "- " für einen Aufzählungspunkt'
            : 'Tip: Type "- " for a bullet point'}
        </p>

        <Textarea
          ref={textareaRef}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            i18n.language === "de"
              ? "Beschreibe dein Event... Was erwartet die Teilnehmer?"
              : "Describe your event... What can attendees expect?"
          }
          rows={8}
          className="resize-none"
        />

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleGenerateAI}
            disabled={isGenerating}
            className="flex-1 gap-2"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {i18n.language === "de" ? "KI erstellen" : "AI Generate"}
          </Button>
          <Button onClick={handleConfirm} className="flex-1">
            {t("eventForm.done", "Done")}
          </Button>
        </div>
      </div>
    </EventFieldPopup>
  );
}
