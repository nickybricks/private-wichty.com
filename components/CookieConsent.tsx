import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X, Cookie, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_CONSENT_KEY = "cookie-consent";
const COOKIE_PREFERENCES_KEY = "cookie-preferences";

export const CookieConsent = () => {
  const { t } = useTranslation("common");
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay to not show immediately on page load
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    } else {
      const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        setPreferences(parsed);
        applyPreferences(parsed);
      }
    }
  }, []);

  const applyPreferences = (prefs: CookiePreferences) => {
    // Enable/disable Google Analytics based on preferences
    if (prefs.analytics) {
      enableGoogleAnalytics();
    } else {
      disableGoogleAnalytics();
    }

    // Marketing cookies handling would go here
    if (prefs.marketing) {
      // Enable marketing scripts
    }
  };

  const enableGoogleAnalytics = () => {
    // Re-enable GA tracking
    (window as any).gtag?.("consent", "update", {
      analytics_storage: "granted",
    });
  };

  const disableGoogleAnalytics = () => {
    // Disable GA tracking
    (window as any).gtag?.("consent", "update", {
      analytics_storage: "denied",
    });
    // Delete existing GA cookies
    document.cookie.split(";").forEach((c) => {
      if (c.trim().startsWith("_ga")) {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      }
    });
  };

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    applyPreferences(prefs);
    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptAll = () => {
    saveConsent({ necessary: true, analytics: true, marketing: true });
  };

  const acceptNecessary = () => {
    saveConsent({ necessary: true, analytics: false, marketing: false });
  };

  const saveCustom = () => {
    saveConsent(preferences);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl bg-card border border-border shadow-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2 rounded-full bg-primary/10">
              <Cookie className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  {t("cookies.title", "Cookie-Einstellungen")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "cookies.description",
                    "Wir nutzen Cookies, um dein Erlebnis zu verbessern. Du kannst auswählen, welche Cookies du akzeptierst."
                  )}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={acceptAll}
                  className="flex-1 min-w-[120px]"
                  size="sm"
                >
                  {t("cookies.acceptAll", "Alle akzeptieren")}
                </Button>
                <Button
                  onClick={acceptNecessary}
                  variant="outline"
                  className="flex-1 min-w-[120px]"
                  size="sm"
                >
                  {t("cookies.acceptNecessary", "Nur notwendige")}
                </Button>
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Settings className="h-4 w-4" />
                      {t("cookies.settings", "Einstellungen")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {t("cookies.settingsTitle", "Cookie-Einstellungen")}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      {/* Necessary Cookies */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <Label className="font-medium">
                            {t("cookies.necessary", "Notwendige Cookies")}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {t(
                              "cookies.necessaryDesc",
                              "Diese Cookies sind für die Grundfunktionen erforderlich."
                            )}
                          </p>
                        </div>
                        <Switch checked disabled />
                      </div>

                      {/* Analytics Cookies */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <Label className="font-medium">
                            {t("cookies.analytics", "Analyse-Cookies")}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {t(
                              "cookies.analyticsDesc",
                              "Helfen uns zu verstehen, wie Besucher unsere Website nutzen."
                            )}
                          </p>
                        </div>
                        <Switch
                          checked={preferences.analytics}
                          onCheckedChange={(checked) =>
                            setPreferences((p) => ({ ...p, analytics: checked }))
                          }
                        />
                      </div>

                      {/* Marketing Cookies */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <Label className="font-medium">
                            {t("cookies.marketing", "Marketing-Cookies")}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {t(
                              "cookies.marketingDesc",
                              "Werden verwendet, um relevante Werbung anzuzeigen."
                            )}
                          </p>
                        </div>
                        <Switch
                          checked={preferences.marketing}
                          onCheckedChange={(checked) =>
                            setPreferences((p) => ({ ...p, marketing: checked }))
                          }
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={saveCustom} className="flex-1">
                        {t("cookies.save", "Speichern")}
                      </Button>
                      <Button
                        onClick={acceptAll}
                        variant="outline"
                        className="flex-1"
                      >
                        {t("cookies.acceptAll", "Alle akzeptieren")}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <button
              onClick={acceptNecessary}
              className="flex-shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
              aria-label="Schließen"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
