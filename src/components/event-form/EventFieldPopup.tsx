import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface EventFieldPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function EventFieldPopup({
  open,
  onOpenChange,
  title,
  icon,
  children,
  className,
}: EventFieldPopupProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-md rounded-2xl border-border/50 bg-background/95 backdrop-blur-xl shadow-xl",
          className
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-medium">
            {icon}
            {title}
          </DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
