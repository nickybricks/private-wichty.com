import { useTranslation } from "react-i18next";
import { EVENT_TAGS, getTagLabel } from "@/data/eventTags";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface CategoryChipsProps {
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onSelectAll?: () => void;
  availableTags: string[];
  language: "de" | "en";
  showAllButton?: boolean;
}

export function CategoryChips({ 
  selectedTags, 
  onTagToggle, 
  onSelectAll, 
  availableTags, 
  language,
  showAllButton = true
}: CategoryChipsProps) {
  const { t } = useTranslation("explore");

  // Filter EVENT_TAGS to only show tags that have events
  const tagsToShow = EVENT_TAGS.filter(tag => availableTags.includes(tag.id));

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">
        {t("categories")}
      </h3>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-4">
          {showAllButton && onSelectAll && (
            <button
              onClick={onSelectAll}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedTags.length === 0
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t("all")}
            </button>
          )}
          {tagsToShow.map((tag) => {
            const isSelected = selectedTags.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => onTagToggle(tag.id)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                  isSelected
                    ? `${tag.color} text-white shadow-md border-transparent`
                    : "bg-background text-foreground border-border shadow-sm hover:shadow-md hover:border-foreground/20 active:scale-95"
                }`}
              >
                {getTagLabel(tag.id, language)}
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
