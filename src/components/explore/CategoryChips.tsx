import { useTranslation } from "react-i18next";
import { EVENT_TAGS, getTagLabel } from "@/data/eventTags";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface CategoryChipsProps {
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
  language: "de" | "en";
}

export function CategoryChips({ selectedTag, onTagSelect, language }: CategoryChipsProps) {
  const { t } = useTranslation("explore");

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground px-1">
        {t("categories")}
      </h3>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex flex-wrap gap-2 pb-2 max-h-24">
          <button
            onClick={() => onTagSelect(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedTag === null
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t("all")}
          </button>
          {EVENT_TAGS.map((tag) => (
            <button
              key={tag.id}
              onClick={() => onTagSelect(tag.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedTag === tag.id
                  ? `${tag.color} text-white shadow-md`
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {getTagLabel(tag.id, language)}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
