import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TicketCategory {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  max_quantity: number | null;
}

export interface SelectedTicket {
  categoryId: string;
  quantity: number;
}

interface TicketCategorySelectorProps {
  categories: TicketCategory[];
  selectedTickets: SelectedTicket[];
  onSelectionChange: (selection: SelectedTicket[]) => void;
  allowMultiple: boolean;
  maxPerCategory?: number;
}

export function TicketCategorySelector({
  categories,
  selectedTickets,
  onSelectionChange,
  allowMultiple,
  maxPerCategory = 10,
}: TicketCategorySelectorProps) {
  const { i18n } = useTranslation();

  const formatPrice = (cents: number, currency: string) => {
    if (cents === 0) {
      return i18n.language === 'de' ? 'Kostenlos' : 'Free';
    }
    return new Intl.NumberFormat(i18n.language === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  const isSelected = (categoryId: string) => {
    return selectedTickets.some(t => t.categoryId === categoryId);
  };

  const getQuantity = (categoryId: string) => {
    return selectedTickets.find(t => t.categoryId === categoryId)?.quantity || 0;
  };

  const handleCategoryClick = (categoryId: string) => {
    if (isSelected(categoryId)) {
      // Deselect
      onSelectionChange(selectedTickets.filter(t => t.categoryId !== categoryId));
    } else {
      if (allowMultiple) {
        // Add to selection (multi-select mode)
        onSelectionChange([...selectedTickets, { categoryId, quantity: 1 }]);
      } else {
        // Single selection mode - replace current selection
        onSelectionChange([{ categoryId, quantity: 1 }]);
      }
    }
  };

  const handleQuantityChange = (categoryId: string, delta: number) => {
    const category = categories.find(c => c.id === categoryId);
    const maxQty = category?.max_quantity || maxPerCategory;
    
    const newSelection = selectedTickets.map(t => {
      if (t.categoryId === categoryId) {
        const newQty = Math.max(1, Math.min(t.quantity + delta, maxQty));
        return { ...t, quantity: newQty };
      }
      return t;
    });
    onSelectionChange(newSelection);
  };

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {categories.map((category) => {
        const selected = isSelected(category.id);
        const quantity = getQuantity(category.id);
        const maxQty = category.max_quantity || maxPerCategory;

        return (
          <div
            key={category.id}
            className={cn(
              "relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-200",
              selected
                ? "border-foreground bg-background shadow-sm"
                : "border-transparent bg-muted/50 hover:bg-muted/70"
            )}
            onClick={() => handleCategoryClick(category.id)}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Left: Checkmark + Content */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Checkmark */}
                <div
                  className={cn(
                    "flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                    selected
                      ? "border-foreground bg-foreground"
                      : "border-muted-foreground/40"
                  )}
                >
                  {selected && <Check className="h-3 w-3 text-background" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{category.name}</p>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Price */}
              <div className="flex-shrink-0 text-right">
                <p className="font-semibold">
                  {formatPrice(category.price_cents, category.currency)}
                </p>
              </div>
            </div>

            {/* Quantity Stepper - only show when selected AND multiple tickets allowed */}
            {selected && allowMultiple && (
              <div 
                className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-border/50"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-sm text-muted-foreground">
                  {i18n.language === 'de' ? 'Anzahl' : 'Quantity'}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuantityChange(category.id, -1);
                    }}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuantityChange(category.id, 1);
                    }}
                    disabled={quantity >= maxQty}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
