import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Sparkles, Loader2 } from "lucide-react";
import { EventFieldPopup } from "./EventFieldPopup";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/RichTextEditor";
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

  useEffect(() => {
    if (open) {
      setDescription(initialDescription);
    }
  }, [open, initialDescription]);

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
          {t('richText.tip', i18n.language === "de"
            ? 'Cmd+B für Fett, Cmd+I für Kursiv, oder Text markieren'
            : 'Cmd+B for Bold, Cmd+I for Italic, or select text to format')}
        </p>

        <RichTextEditor
          value={description}
          onChange={setDescription}
          placeholder={
            i18n.language === "de"
              ? "Beschreibe dein Event... Was erwartet die Teilnehmer?"
              : "Describe your event... What can attendees expect?"
          }
          rows={8}
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
