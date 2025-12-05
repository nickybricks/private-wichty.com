import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Trash2, 
  Ticket, 
  Euro,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PendingTicketCategory {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  max_quantity: number | null;
  sort_order: number;
}

interface TicketCategoriesLocalProps {
  categories: PendingTicketCategory[];
  onCategoriesChange: (categories: PendingTicketCategory[]) => void;
}

export function TicketCategoriesLocal({ categories, onCategoriesChange }: TicketCategoriesLocalProps) {
  const { i18n } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    price: "",
    maxQuantity: ""
  });
  const [showNewForm, setShowNewForm] = useState(false);

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) return;

    const priceCents = newCategory.price ? Math.round(parseFloat(newCategory.price) * 100) : 0;
    
    const newCat: PendingTicketCategory = {
      id: `temp-${Date.now()}`,
      name: newCategory.name.trim(),
      description: newCategory.description.trim(),
      price_cents: priceCents,
      max_quantity: newCategory.maxQuantity ? parseInt(newCategory.maxQuantity) : null,
      sort_order: categories.length
    };

    onCategoriesChange([...categories, newCat]);
    setNewCategory({ name: "", description: "", price: "", maxQuantity: "" });
    setShowNewForm(false);
  };

  const handleUpdateCategory = (id: string, updates: Partial<PendingTicketCategory>) => {
    onCategoriesChange(categories.map(cat => 
      cat.id === id ? { ...cat, ...updates } : cat
    ));
  };

  const handleDeleteCategory = (id: string) => {
    onCategoriesChange(categories.filter(cat => cat.id !== id));
  };

  const formatPrice = (cents: number) => {
    if (cents === 0) return i18n.language === 'de' ? 'Kostenlos' : 'Free';
    return new Intl.NumberFormat(i18n.language === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  return (
    <div className="space-y-3">
      {/* Existing Categories */}
      {categories.map((category) => (
        <Card
          key={category.id}
          className={cn(
            "overflow-hidden transition-all",
            expandedId === category.id && "ring-2 ring-primary"
          )}
        >
          {/* Header - Always visible */}
          <div
            className="p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setExpandedId(expandedId === category.id ? null : category.id)}
          >
            <Ticket className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{category.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatPrice(category.price_cents)}
                {category.max_quantity && ` • ${category.max_quantity} ${i18n.language === 'de' ? 'verfügbar' : 'available'}`}
              </p>
            </div>
            {expandedId === category.id ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>

          {/* Expanded Content */}
          {expandedId === category.id && (
            <div className="px-4 pb-4 space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label className="text-sm">{i18n.language === 'de' ? 'Name' : 'Name'}</Label>
                <Input
                  value={category.name}
                  onChange={(e) => handleUpdateCategory(category.id, { name: e.target.value })}
                  placeholder={i18n.language === 'de' ? 'z.B. Standard-Ticket' : 'e.g. Standard Ticket'}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">{i18n.language === 'de' ? 'Beschreibung (optional)' : 'Description (optional)'}</Label>
                <Input
                  value={category.description}
                  onChange={(e) => handleUpdateCategory(category.id, { description: e.target.value })}
                  placeholder={i18n.language === 'de' ? 'Kurze Beschreibung...' : 'Short description...'}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">{i18n.language === 'de' ? 'Preis' : 'Price'}</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min="0"
                      step="0.50"
                      value={category.price_cents / 100 || ""}
                      onChange={(e) => handleUpdateCategory(category.id, { 
                        price_cents: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : 0 
                      })}
                      className="pl-9"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">{i18n.language === 'de' ? 'Max. Anzahl' : 'Max. quantity'}</Label>
                  <Input
                    type="number"
                    min="1"
                    value={category.max_quantity || ""}
                    onChange={(e) => handleUpdateCategory(category.id, { 
                      max_quantity: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    placeholder={i18n.language === 'de' ? 'Unbegrenzt' : 'Unlimited'}
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => handleDeleteCategory(category.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {i18n.language === 'de' ? 'Ticket löschen' : 'Delete ticket'}
              </Button>
            </div>
          )}
        </Card>
      ))}

      {/* Add New Category Form */}
      {showNewForm ? (
        <Card className="p-4 space-y-4 border-dashed border-2">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Plus className="h-4 w-4" />
            {i18n.language === 'de' ? 'Neues Ticket' : 'New Ticket'}
          </div>

          <div className="space-y-2">
            <Label className="text-sm">{i18n.language === 'de' ? 'Ticket-Name' : 'Ticket name'} *</Label>
            <Input
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder={i18n.language === 'de' ? 'z.B. Early Bird, VIP, Standard' : 'e.g. Early Bird, VIP, Standard'}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">{i18n.language === 'de' ? 'Beschreibung (optional)' : 'Description (optional)'}</Label>
            <Input
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              placeholder={i18n.language === 'de' ? 'Was ist enthalten?' : 'What\'s included?'}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm">{i18n.language === 'de' ? 'Preis' : 'Price'}</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  step="0.50"
                  value={newCategory.price}
                  onChange={(e) => setNewCategory({ ...newCategory, price: e.target.value })}
                  className="pl-9"
                  placeholder={i18n.language === 'de' ? '0 = Kostenlos' : '0 = Free'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">{i18n.language === 'de' ? 'Max. Anzahl' : 'Max. quantity'}</Label>
              <Input
                type="number"
                min="1"
                value={newCategory.maxQuantity}
                onChange={(e) => setNewCategory({ ...newCategory, maxQuantity: e.target.value })}
                placeholder={i18n.language === 'de' ? 'Unbegrenzt' : 'Unlimited'}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowNewForm(false);
                setNewCategory({ name: "", description: "", price: "", maxQuantity: "" });
              }}
            >
              {i18n.language === 'de' ? 'Abbrechen' : 'Cancel'}
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleAddCategory}
              disabled={!newCategory.name.trim()}
            >
              {i18n.language === 'de' ? 'Hinzufügen' : 'Add'}
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed"
          onClick={() => setShowNewForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {i18n.language === 'de' ? 'Ticket-Kategorie hinzufügen' : 'Add ticket category'}
        </Button>
      )}

      {categories.length === 0 && !showNewForm && (
        <p className="text-sm text-muted-foreground text-center py-2">
          {i18n.language === 'de' 
            ? 'Noch keine Ticket-Kategorien. Füge deine erste hinzu!' 
            : 'No ticket categories yet. Add your first one!'}
        </p>
      )}
    </div>
  );
}
