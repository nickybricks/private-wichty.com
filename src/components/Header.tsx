import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sparkles, LogOut, LayoutDashboard, Settings, Menu, ArrowLeft, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreateEventDrawer } from "@/components/CreateEventDrawer";

interface HeaderProps {
  user: any;
  showBackButton?: boolean;
}

export function Header({ user, showBackButton = false }: HeaderProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const { t: ta } = useTranslation('auth');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

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
    <>
      <header className="border-b border-border bg-card shadow-soft sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
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
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Sparkles 
                className="h-6 w-6" 
                style={{ 
                  background: 'linear-gradient(90deg, #FFB86C 0%, #FF6788 50%, #C088FF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  stroke: 'url(#icon-gradient)',
                  fill: 'none'
                }} 
              />
              <svg width="0" height="0">
                <defs>
                  <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FFB86C" />
                    <stop offset="50%" stopColor="#FF6788" />
                    <stop offset="100%" stopColor="#C088FF" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-xl font-bold tracking-tight text-foreground">Wichty</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/explore")}
            >
              🌎 {t('header.explore')}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              {t('header.myEvents')}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/settings")}
            >
              <Settings className="h-4 w-4 mr-2" />
              {t('header.settings')}
            </Button>

            <button
              onClick={() => setCreateDrawerOpen(true)}
              className="h-9 px-4 rounded-full flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:opacity-90 transition-all text-white text-sm font-medium"
              style={{ backgroundColor: '#FF6687' }}
            >
              <Plus className="h-4 w-4" />
            </button>

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
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/explore")}
              className="text-sm px-2"
            >
              🌎 {t('header.explore')}
            </Button>

            <button
              onClick={() => setCreateDrawerOpen(true)}
              className="h-9 w-9 rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:opacity-90 transition-all"
              style={{ backgroundColor: '#FF6687' }}
            >
              <Plus className="h-5 w-5 text-white" />
            </button>

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
                    🌎 <span className="ml-3">{t('header.explore')}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => handleNavigation("/dashboard")}
                  >
                    <LayoutDashboard className="h-5 w-5 mr-3" />
                    {t('header.myEvents')}
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

      <CreateEventDrawer 
        open={createDrawerOpen} 
        onOpenChange={setCreateDrawerOpen}
      />
    </>
  );
}
