import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Sparkles, Loader2, Bold, Italic, Underline, Strikethrough, List } from "lucide-react";
import { EventFieldPopup } from "./EventFieldPopup";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (open) {
      setDescription(initialDescription);
      // Set initial content in contenteditable div
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = initialDescription || "";
        }
      }, 0);
    }
  }, [open, initialDescription]);

  // Handle bullet point creation on "- " input
  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      setDescription(content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle formatting shortcuts (desktop only)
    if (!isMobile && (e.metaKey || e.ctrlKey)) {
      if (e.key === "b") {
        e.preventDefault();
        document.execCommand("bold", false);
        return;
      }
      if (e.key === "i") {
        e.preventDefault();
        document.execCommand("italic", false);
        return;
      }
      if (e.key === "u") {
        e.preventDefault();
        document.execCommand("underline", false);
        return;
      }
    }

    // Handle bullet point creation on "- " followed by space
    if (e.key === " " && editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;
        if (textNode.nodeType === Node.TEXT_NODE) {
          const text = textNode.textContent || "";
          const offset = range.startOffset;
          if (offset >= 1 && text.slice(offset - 1, offset) === "-") {
            e.preventDefault();
            // Replace "- " with bullet point
            const before = text.slice(0, offset - 1);
            const after = text.slice(offset);
            textNode.textContent = before + "• " + after;
            // Move cursor after bullet
            range.setStart(textNode, before.length + 2);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            handleInput();
          }
        }
      }
    }
  };

  const applyFormatting = (command: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false);
    handleInput();
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-event-description", {
        body: {
          eventName,
          location,
          date,
          existingText: editorRef.current?.innerText || description,
          language: i18n.language,
        },
      });

      if (error) throw error;
      
      if (data?.description) {
        setDescription(data.description);
        if (editorRef.current) {
          editorRef.current.innerHTML = data.description;
        }
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
    const content = editorRef.current?.innerHTML || description;
    onConfirm(content);
    onOpenChange(false);
  };

  const handleEditorFocus = () => {
    setIsEditorFocused(true);
  };

  const handleEditorBlur = () => {
    // Delay to allow button clicks to register before hiding toolbar
    setTimeout(() => setIsEditorFocused(false), 150);
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
        {/* Formatting toolbar - desktop only */}
        {!isMobile && (
          <div className="flex items-center gap-1 pb-2 border-b">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => applyFormatting("bold")}
              className="h-8 w-8 p-0"
              title="Bold (⌘B)"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => applyFormatting("italic")}
              className="h-8 w-8 p-0"
              title="Italic (⌘I)"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => applyFormatting("underline")}
              className="h-8 w-8 p-0"
              title="Underline (⌘U)"
            >
              <Underline className="h-4 w-4" />
            </Button>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          {i18n.language === "de"
            ? `Tipp: Tippe "- " für einen Aufzählungspunkt${!isMobile ? " • ⌘B/I/U für Formatierung" : ""}`
            : `Tip: Type "- " for a bullet point${!isMobile ? " • ⌘B/I/U for formatting" : ""}`}
        </p>

        <style>
          {`
            [contenteditable]:empty:before {
              content: attr(data-placeholder);
              color: hsl(var(--muted-foreground));
              pointer-events: none;
            }
          `}
        </style>
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={handleEditorFocus}
          onBlur={handleEditorBlur}
          className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 overflow-auto"
          style={{ whiteSpace: "pre-wrap" }}
          data-placeholder={
            i18n.language === "de"
              ? "Beschreibe dein Event... Was erwartet die Teilnehmer?"
              : "Describe your event... What can attendees expect?"
          }
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

      {/* Mobile Floating Toolbar - Liquid Glass Style */}
      {isMobile && isEditorFocused && (
        <div className="fixed bottom-0 left-0 right-0 p-3 pb-6 z-[9999]">
          <div className="mx-auto max-w-xs flex items-center justify-center gap-1 px-4 py-2.5 rounded-2xl bg-black/80 dark:bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyFormatting("bold")}
              className="h-10 w-10 rounded-xl flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors"
            >
              <Bold className="h-5 w-5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyFormatting("italic")}
              className="h-10 w-10 rounded-xl flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors"
            >
              <Italic className="h-5 w-5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyFormatting("underline")}
              className="h-10 w-10 rounded-xl flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors"
            >
              <Underline className="h-5 w-5" />
            </button>
            <div className="w-px h-6 bg-white/20 mx-1" />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyFormatting("strikeThrough")}
              className="h-10 w-10 rounded-xl flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors"
            >
              <Strikethrough className="h-5 w-5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyFormatting("insertUnorderedList")}
              className="h-10 w-10 rounded-xl flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors"
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </EventFieldPopup>
  );
}