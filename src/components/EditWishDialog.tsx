import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const wishSchema = z.object({
  wish: z
    .string()
    .trim()
    .min(1, { message: "Wunsch darf nicht leer sein" })
    .max(200, { message: "Wunsch darf maximal 200 Zeichen lang sein" }),
});

type WishFormValues = z.infer<typeof wishSchema>;

interface EditWishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participantId: string;
  currentWish: string;
  onSuccess: () => void;
}

export function EditWishDialog({
  open,
  onOpenChange,
  participantId,
  currentWish,
  onSuccess,
}: EditWishDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<WishFormValues>({
    resolver: zodResolver(wishSchema),
    defaultValues: {
      wish: currentWish,
    },
  });

  const onSubmit = async (values: WishFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("participants")
        .update({ wish: values.wish.trim() })
        .eq("id", participantId);

      if (error) throw error;

      toast.success("Wunsch erfolgreich aktualisiert!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating wish:", error);
      toast.error("Fehler beim Aktualisieren des Wunsches");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Wunsch bearbeiten</DialogTitle>
          <DialogDescription>
            Ändere deinen Geschenkwunsch, solange das Spiel noch nicht
            abgeschlossen ist.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="wish"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dein Wunsch</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Was wünschst du dir?"
                      {...field}
                      disabled={isSubmitting}
                      maxLength={200}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
