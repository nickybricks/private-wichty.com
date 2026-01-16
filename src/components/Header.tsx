import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sparkles, LogOut, LayoutDashboard, Settings, Menu, ArrowLeft, Compass, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreateEventDrawer } from "@/components/CreateEventDrawer";
import { AuthDialog } from "@/components/AuthDialog";

interface HeaderProps {
  user?: any;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export function Header({ user, showBackButton = false, onBackClick }: HeaderProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const { t: ta } = useTranslation('auth');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success(ta('success.logout'));
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(ta('errors.logoutError'));
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleAuthSuccess = () => {
    setShowAuthDialog(false);
    navigate("/dashboard");
  };

  return (
    <>
      <header className="border-b border-border bg-card shadow-soft sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: Back button + Logo */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (onBackClick) {
                    onBackClick();
                  } else {
                    navigate("/dashboard");
                  }
                }}
                className="hover:bg-accent"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <button
              onClick={() => navigate(user ? "/dashboard" : "/")}
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

          {/* Right Navigation - Logged In */}
          {user ? (
            <>
              {/* Desktop Navigation - Logged In */}
              <div className="hidden lg:flex items-center gap-2">
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

                <button
                  onClick={() => setCreateDrawerOpen(true)}
                  className="h-9 px-4 rounded-full flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:opacity-90 transition-all text-white text-sm font-medium"
                  style={{ backgroundColor: '#FF6687' }}
                >
                  <Plus className="h-4 w-4" />
                  {t('header.createEvent')}
                </button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('header.logout')}
                </Button>
              </div>

              {/* Mobile Navigation - Logged In */}
              <div className="lg:hidden flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/explore")}
                  className="text-sm px-2"
                >
                  <Compass className="h-4 w-4 mr-1" />
                  {t('header.explore')}
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
                    </nav>
                  </SheetContent>
                </Sheet>
              </div>
            </>
          ) : (
            <>
              {/* Desktop Navigation - Not Logged In */}
              <div className="hidden lg:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/explore")}
                >
                  <Compass className="h-4 w-4 mr-2" />
                  {t('header.explore')}
                </Button>

                <Button
                  onClick={() => setShowAuthDialog(true)}
                  className="shadow-md hover:shadow-lg transition-all"
                >
                  {t('header.login')}
                </Button>
              </div>

              {/* Mobile Navigation - Not Logged In */}
              <div className="lg:hidden flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/explore")}
                  className="text-sm px-2"
                >
                  <Compass className="h-4 w-4 mr-1" />
                  {t('header.explore')}
                </Button>

                <Button
                  onClick={() => setShowAuthDialog(true)}
                  size="sm"
                  className="shadow-md hover:shadow-lg transition-all"
                >
                  {t('header.login')}
                </Button>
              </div>
            </>
          )}
        </div>
      </header>

      <CreateEventDrawer 
        open={createDrawerOpen} 
        onOpenChange={setCreateDrawerOpen}
      />

      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onSuccess={handleAuthSuccess}
        defaultTab="login"
      />
    </>
  );
}
