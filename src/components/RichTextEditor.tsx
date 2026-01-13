import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Bold, Italic, Underline, Strikethrough } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

interface ToolbarPosition {
  top: number;
  left: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  rows = 8,
  className,
}: RichTextEditorProps) {
  const { t } = useTranslation("forms");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition | null>(null);
  const [hasSelection, setHasSelection] = useState(false);

  // Wrap selected text with markdown syntax
  const wrapSelection = useCallback((prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const selectedText = value.slice(selectionStart, selectionEnd);
    
    if (selectedText.length === 0) return;

    const before = value.slice(0, selectionStart);
    const after = value.slice(selectionEnd);
    const newValue = before + prefix + selectedText + suffix + after;
    
    onChange(newValue);

    // Restore selection after state update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        selectionStart + prefix.length,
        selectionEnd + prefix.length
      );
    }, 0);

    setHasSelection(false);
    setToolbarPosition(null);
  }, [value, onChange]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMod = e.metaKey || e.ctrlKey;
    
    if (isMod && e.key === 'b') {
      e.preventDefault();
      wrapSelection('**', '**');
      return;
    }
    
    if (isMod && e.key === 'i') {
      e.preventDefault();
      wrapSelection('*', '*');
      return;
    }
    
    if (isMod && e.key === 'u') {
      e.preventDefault();
      wrapSelection('<u>', '</u>');
      return;
    }
    
    if (isMod && e.shiftKey && e.key === 's') {
      e.preventDefault();
      wrapSelection('~~', '~~');
      return;
    }

    // Handle bullet point creation on "- " input
    if (e.key === " ") {
      const textarea = e.currentTarget;
      const { selectionStart, value: currentValue } = textarea;
      const lineStart = currentValue.lastIndexOf("\n", selectionStart - 1) + 1;
      const currentLine = currentValue.slice(lineStart, selectionStart);
      
      if (currentLine === "-") {
        e.preventDefault();
        const before = currentValue.slice(0, lineStart);
        const after = currentValue.slice(selectionStart);
        const newValue = before + "• " + after;
        onChange(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = lineStart + 2;
        }, 0);
      }
    }
  }, [wrapSelection, onChange]);

  // Handle text selection
  const handleSelect = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const selectedText = value.slice(selectionStart, selectionEnd);

    if (selectedText.length > 0) {
      // Calculate position for toolbar
      const textareaRect = textarea.getBoundingClientRect();
      
      // Get approximate position based on selection
      // We'll position it above the textarea, centered
      const lineHeight = 24; // approximate line height
      const charsPerLine = Math.floor(textarea.clientWidth / 8); // approximate
      const startLine = Math.floor(selectionStart / charsPerLine);
      
      const top = textareaRect.top + window.scrollY + (startLine * lineHeight) - 40;
      const left = textareaRect.left + window.scrollX + (textareaRect.width / 2);

      setToolbarPosition({ top, left });
      setHasSelection(true);
    } else {
      setHasSelection(false);
      setToolbarPosition(null);
    }
  }, [value]);

  // Hide toolbar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        toolbarRef.current && 
        !toolbarRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setHasSelection(false);
        setToolbarPosition(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toolbarButtons = [
    { icon: Bold, action: () => wrapSelection('**', '**'), label: t('richText.bold', 'Bold') },
    { icon: Italic, action: () => wrapSelection('*', '*'), label: t('richText.italic', 'Italic') },
    { icon: Underline, action: () => wrapSelection('<u>', '</u>'), label: t('richText.underline', 'Underline') },
    { icon: Strikethrough, action: () => wrapSelection('~~', '~~'), label: t('richText.strikethrough', 'Strikethrough') },
  ];

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onMouseUp={handleSelect}
        placeholder={placeholder}
        rows={rows}
        className={cn("resize-none", className)}
      />

      {/* Floating Toolbar */}
      {hasSelection && toolbarPosition && (
        <div
          ref={toolbarRef}
          className="fixed z-50 flex items-center gap-0.5 bg-foreground text-background rounded-lg shadow-lg p-1 animate-in fade-in-0 zoom-in-95 duration-150"
          style={{
            top: `${toolbarPosition.top}px`,
            left: `${toolbarPosition.left}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {toolbarButtons.map((button, index) => (
            <Button
              key={button.label}
              type="button"
              variant="ghost"
              size="sm"
              onClick={button.action}
              className={cn(
                "h-8 w-8 p-0 text-background hover:bg-background/10 hover:text-background",
                index < toolbarButtons.length - 1 && "border-r border-background/20"
              )}
              title={button.label}
            >
              <button.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
