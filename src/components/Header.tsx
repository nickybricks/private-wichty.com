import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sparkles, LogOut, LayoutDashboard, Settings, Menu, ArrowLeft, Compass } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LanguageToggle } from "@/components/LanguageToggle";

interface HeaderProps {
  user: any;
  showBackButton?: boolean;
}

export function Header({ user, showBackButton = false }: HeaderProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const { t: ta } = useTranslation('auth');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success(ta('success.logout'));
      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(ta('errors.logoutError'));
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-border bg-card shadow-soft sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="hover:bg-accent"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <button
            onClick={() => navigate("/create")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">Wichty</span>
          </button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/explore")}
          >
            <Compass className="h-4 w-4 mr-2" />
            {t('header.explore')}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            {t('header.dashboard')}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/settings")}
          >
            <Settings className="h-4 w-4 mr-2" />
            {t('header.settings')}
          </Button>

          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t('header.logout')}
            </Button>
          )}

          <LanguageToggle />
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-2">
          <LanguageToggle />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col gap-4 mt-8">
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => handleNavigation("/explore")}
                >
                  <Compass className="h-5 w-5 mr-3" />
                  {t('header.explore')}
                </Button>

                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => handleNavigation("/dashboard")}
                >
                  <LayoutDashboard className="h-5 w-5 mr-3" />
                  {t('header.dashboard')}
                </Button>

                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => handleNavigation("/settings")}
                >
                  <Settings className="h-5 w-5 mr-3" />
                  {t('header.settings')}
                </Button>

                {user && (
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    {t('header.logout')}
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
