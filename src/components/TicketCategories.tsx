import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Trash2,
  Ticket,
  GripVertical,
  Euro,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Helper to block "e", "E", "+", "-" in number inputs
const blockInvalidChars = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (["e", "E", "+", "-"].includes(e.key)) {
    e.preventDefault();
  }
};

interface TicketCategory {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  max_quantity: number | null;
  sort_order: number;
}

interface TicketCategoriesProps {
  eventId: string;
  isPaidEvent: boolean;
  stripeConnected?: boolean | null;
  onCategoriesChange?: (categories: TicketCategory[]) => void;
  onTicketModified?: () => void;
  eventCapacity?: number | null;
  capacityUnlimited?: boolean;
}

export function TicketCategories({ 
  eventId, 
  isPaidEvent, 
  stripeConnected, 
  onCategoriesChange,
  onTicketModified,
  eventCapacity,
  capacityUnlimited 
}: TicketCategoriesProps) {
  const { i18n } = useTranslation();
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    price: "",
    maxQuantity: ""
  });
  const [showNewForm, setShowNewForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [eventId]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("ticket_categories")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
      onCategoriesChange?.(data || []);
    } catch (error) {
      console.error("Error fetching ticket categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error(i18n.language === 'de' ? 'Bitte gib einen Ticket-Namen ein' : 'Please enter a ticket name');
      return;
    }

    const priceCents = newCategory.price ? Math.round(parseFloat(newCategory.price) * 100) : 0;
    
    if (isPaidEvent && priceCents < 0) {
      toast.error(i18n.language === 'de' ? 'Preis darf nicht negativ sein' : 'Price cannot be negative');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("ticket_categories")
        .insert({
          event_id: eventId,
          name: newCategory.name.trim(),
          description: newCategory.description.trim() || null,
          price_cents: priceCents,
          currency: "eur",
          max_quantity: newCategory.maxQuantity ? parseInt(newCategory.maxQuantity) : null,
          sort_order: categories.length
        })
        .select()
        .single();

      if (error) throw error;

      const updatedCategories = [...categories, data];
      setCategories(updatedCategories);
      onCategoriesChange?.(updatedCategories);
      onTicketModified?.();
      setNewCategory({ name: "", description: "", price: "", maxQuantity: "" });
      setShowNewForm(false);
      toast.success(i18n.language === 'de' ? 'Ticket-Kategorie erstellt' : 'Ticket category created');
    } catch (error) {
      console.error("Error creating ticket category:", error);
      toast.error(i18n.language === 'de' ? 'Fehler beim Erstellen' : 'Error creating category');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCategory = async (id: string, updates: Partial<TicketCategory>) => {
    try {
      const { error } = await supabase
        .from("ticket_categories")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      const updatedCategories = categories.map(cat => 
        cat.id === id ? { ...cat, ...updates } : cat
      );
      setCategories(updatedCategories);
      onCategoriesChange?.(updatedCategories);
      onTicketModified?.();
    } catch (error) {
      console.error("Error updating ticket category:", error);
      toast.error(i18n.language === 'de' ? 'Fehler beim Aktualisieren' : 'Error updating category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ticket_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;

      const updatedCategories = categories.filter(cat => cat.id !== id);
      setCategories(updatedCategories);
      onCategoriesChange?.(updatedCategories);
      onTicketModified?.();
      toast.success(i18n.language === 'de' ? 'Ticket-Kategorie gelöscht' : 'Ticket category deleted');
    } catch (error) {
      console.error("Error deleting ticket category:", error);
      toast.error(i18n.language === 'de' ? 'Fehler beim Löschen' : 'Error deleting category');
    }
  };

  const formatPrice = (cents: number) => {
    if (cents === 0) return i18n.language === 'de' ? 'Kostenlos' : 'Free';
    return new Intl.NumberFormat(i18n.language === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-16 bg-muted rounded-lg" />
        <div className="h-16 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Existing Categories */}
      {categories.map((category, index) => (
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
            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
                  value={category.description || ""}
                  onChange={(e) => handleUpdateCategory(category.id, { description: e.target.value || null })}
                  placeholder={i18n.language === 'de' ? 'Kurze Beschreibung...' : 'Short description...'}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">{i18n.language === 'de' ? 'Preis' : 'Price'}</Label>
                  <div className="relative">
                    <Euro className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
                      stripeConnected === false ? "text-muted-foreground/40" : "text-muted-foreground"
                    )} />
                    <Input
                      type="number"
                      min="0"
                      step="0.50"
                      value={category.price_cents / 100 || ""}
                      onChange={(e) => handleUpdateCategory(category.id, { 
                        price_cents: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : 0 
                      })}
                      onKeyDown={blockInvalidChars}
                      className={cn("pl-9", stripeConnected === false && "bg-muted cursor-not-allowed")}
                      placeholder="0.00"
                      disabled={stripeConnected === false}
                      title={stripeConnected === false ? (i18n.language === 'de' ? 'Stripe verbinden um Preise zu setzen' : 'Connect Stripe to set prices') : undefined}
                    />
                  </div>
                  {stripeConnected === false && (
                    <p className="text-xs text-muted-foreground">
                      {i18n.language === 'de' ? 'Stripe erforderlich' : 'Stripe required'}
                    </p>
                  )}
                  {category.price_cents > 0 && (
                    <div className="flex items-center justify-between gap-2 pt-2">
                      <Label className="text-sm text-muted-foreground">
                        {i18n.language === 'de' ? '5% Gebühr an Käufer weitergeben' : 'Pass 5% fee to buyer'}
                      </Label>
                      <Switch
                        checked={false}
                        onCheckedChange={() => {}}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">{i18n.language === 'de' ? 'Max. Anzahl' : 'Max. quantity'}</Label>
                  <Input
                    type="number"
                    min="1"
                    max={!capacityUnlimited && eventCapacity ? eventCapacity : undefined}
                    value={category.max_quantity || ""}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : null;
                      const clampedValue = value && !capacityUnlimited && eventCapacity && value > eventCapacity 
                        ? eventCapacity 
                        : value;
                      handleUpdateCategory(category.id, { max_quantity: clampedValue });
                    }}
                    onKeyDown={blockInvalidChars}
                    placeholder={i18n.language === 'de' ? 'Unbegrenzt' : 'Unlimited'}
                  />
                  {!capacityUnlimited && eventCapacity && (
                    <p className="text-xs text-muted-foreground">
                      {i18n.language === 'de' ? `Max. ${eventCapacity} (Event-Kapazität)` : `Max. ${eventCapacity} (event capacity)`}
                    </p>
                  )}
                </div>
              </div>

              <Button
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
                <Euro className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
                  stripeConnected === false ? "text-muted-foreground/40" : "text-muted-foreground"
                )} />
                <Input
                  type="number"
                  min="0"
                  step="0.50"
                  value={newCategory.price}
                  onChange={(e) => setNewCategory({ ...newCategory, price: e.target.value })}
                  onKeyDown={blockInvalidChars}
                  className={cn("pl-9", stripeConnected === false && "bg-muted cursor-not-allowed")}
                  placeholder={stripeConnected === false 
                    ? (i18n.language === 'de' ? 'Stripe verbinden' : 'Connect Stripe')
                    : (i18n.language === 'de' ? '0 = Kostenlos' : '0 = Free')
                  }
                  disabled={stripeConnected === false}
                />
              </div>
              {stripeConnected === false && (
                <p className="text-xs text-muted-foreground">
                  {i18n.language === 'de' ? 'Stripe erforderlich' : 'Stripe required'}
                </p>
              )}
              {parseFloat(newCategory.price) > 0 && (
                <div className="flex items-center justify-between gap-2 pt-2">
                  <Label className="text-sm text-muted-foreground">
                    {i18n.language === 'de' ? '5% Gebühr an Käufer weitergeben' : 'Pass 5% fee to buyer'}
                  </Label>
                  <Switch
                    checked={false}
                    onCheckedChange={() => {}}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm">{i18n.language === 'de' ? 'Max. Anzahl' : 'Max. quantity'}</Label>
              <Input
                type="number"
                min="1"
                max={!capacityUnlimited && eventCapacity ? eventCapacity : undefined}
                value={newCategory.maxQuantity}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value && !capacityUnlimited && eventCapacity && parseInt(value) > eventCapacity) {
                    setNewCategory({ ...newCategory, maxQuantity: eventCapacity.toString() });
                  } else {
                    setNewCategory({ ...newCategory, maxQuantity: value });
                  }
                }}
                onKeyDown={blockInvalidChars}
                placeholder={i18n.language === 'de' ? 'Unbegrenzt' : 'Unlimited'}
              />
              {!capacityUnlimited && eventCapacity && (
                <p className="text-xs text-muted-foreground">
                  {i18n.language === 'de' ? `Max. ${eventCapacity} (Event-Kapazität)` : `Max. ${eventCapacity} (event capacity)`}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
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
              className="flex-1"
              onClick={handleAddCategory}
              disabled={saving}
            >
              {saving ? (i18n.language === 'de' ? 'Speichern...' : 'Saving...') : (i18n.language === 'de' ? 'Hinzufügen' : 'Add')}
            </Button>
          </div>
        </Card>
      ) : (
        <Button
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
