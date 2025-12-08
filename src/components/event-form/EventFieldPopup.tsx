import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent 
          fullScreenOnMobile 
          className="px-4 pb-8 overflow-y-auto"
        >
          <DrawerHeader className="px-0 flex-shrink-0">
            <DrawerTitle className="flex items-center gap-2 text-lg font-medium">
              {icon}
              {title}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

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
