import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { Footer } from "@/components/Footer";
import { AuthDialog } from "@/components/AuthDialog";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import heroMockup from "@/assets/hero-mockup.png";

export default function Landing() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('landing');
  const { t: tc } = useTranslation('common');
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [user, setUser] = useState<any>(null);
  const lang = i18n.language as 'de' | 'en';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthSuccess = (userId: string) => {
    setShowAuthDialog(false);
    navigate("/dashboard");
  };

  const handleCreateEvent = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      setShowAuthDialog(true);
    }
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://wichty.com/#website",
        "url": "https://wichty.com",
        "name": "Wichty",
        "description": lang === 'de' 
          ? "Die einfachste App für Sportvereine, Turniere und private Partys. Events organisieren ohne Chaos."
          : "The easiest app for sports clubs, tournaments and private parties. Organize events without chaos.",
        "inLanguage": lang === 'de' ? "de-DE" : "en-US"
      },
      {
        "@type": "Organization",
        "@id": "https://wichty.com/#organization",
        "name": "Wichty",
        "url": "https://wichty.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://wichty.com/favicon.ico"
        }
      },
      {
        "@type": "WebApplication",
        "@id": "https://wichty.com/#app",
        "name": "Wichty",
        "url": "https://wichty.com",
        "applicationCategory": "EventApplication",
        "operatingSystem": "Web",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "EUR"
        },
        "description": lang === 'de'
          ? "Events organisieren ohne Chaos. Die einfachste App für Sportvereine, Turniere und private Partys."
          : "Organize events without chaos. The easiest app for sports clubs, tournaments and private parties."
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>{lang === 'de' ? 'Wichty - Events organisieren ohne Chaos' : 'Wichty - Organize Events Without Chaos'}</title>
        <meta 
          name="description" 
          content={lang === 'de' 
            ? 'Die einfachste App für Sportvereine, Turniere und private Partys. In 3 Minuten startklar.'
            : 'The easiest app for sports clubs, tournaments and private parties. Ready in 3 minutes.'
          } 
        />
        <meta property="og:title" content={lang === 'de' ? 'Wichty - Events organisieren ohne Chaos' : 'Wichty - Organize Events Without Chaos'} />
        <meta 
          property="og:description" 
          content={lang === 'de'
            ? 'Die einfachste App für Sportvereine, Turniere und private Partys.'
            : 'The easiest app for sports clubs, tournaments and private parties.'
          }
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://wichty.com" />
        <link rel="canonical" href="https://wichty.com" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        {user ? (
          <Header user={user} />
        ) : (
          <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="max-w-[var(--max-width-extra-wide)] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg width="0" height="0" className="absolute">
                  <defs>
                    <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FFB86C" />
                      <stop offset="50%" stopColor="#FF6788" />
                      <stop offset="100%" stopColor="#C088FF" />
                    </linearGradient>
                  </defs>
                </svg>
                <Sparkles className="h-6 w-6" style={{ stroke: 'url(#icon-gradient)' }} />
                <span className="text-xl font-bold tracking-tight">Wichty</span>
              </div>
              <div className="flex items-center gap-3">
                <LanguageToggle />
                <Button
                  onClick={() => setShowAuthDialog(true)}
                  className="shadow-medium hover:shadow-strong transition-all"
                >
                  {tc('header.login')}
                </Button>
              </div>
            </div>
          </header>
        )}

        {/* Hero Section */}
        <section className="max-w-[var(--max-width-extra-wide)] mx-auto px-4 sm:px-6 pt-12 sm:pt-20 lg:pt-28 pb-16 sm:pb-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left: Text Content (Desktop) / Center Content (Mobile) */}
            <div className="space-y-6 sm:space-y-8 order-1 text-center lg:text-left">
              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1]">
                <span className="text-foreground">{t('hero.title')}</span>
                <br />
                <span className="bg-gradient-to-r from-[#FF6788] via-[#FF8066] to-[#FFB86C] bg-clip-text text-transparent">
                  {t('hero.titleHighlight')}
                </span>
              </h1>
              
              {/* Subline */}
              <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                {t('hero.subtitle')}
              </p>

              {/* CTA Button */}
              <div className="pt-2 flex justify-center lg:justify-start">
                <Button
                  onClick={handleCreateEvent}
                  className="h-11 px-6 text-base font-semibold bg-[#FF6788] hover:bg-[#FF5577] text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  {t('hero.cta')}
                </Button>
              </div>

              {/* Mobile: Image after CTA button */}
              <div className="lg:hidden flex justify-center pt-4">
                <img 
                  src={heroMockup} 
                  alt={lang === 'de' ? 'Wichty App Vorschau' : 'Wichty App Preview'}
                  className="w-[60%] max-w-xs"
                />
              </div>

              {/* Trust Line */}
              <p className="text-sm text-muted-foreground/80">
                {t('hero.trust')}
              </p>
            </div>

            {/* Right: Image (Desktop only) */}
            <div className="hidden lg:flex justify-center order-2">
              <img 
                src={heroMockup} 
                alt={lang === 'de' ? 'Wichty App Vorschau' : 'Wichty App Preview'}
                className="w-full max-w-md xl:max-w-lg"
              />
            </div>
          </div>
        </section>

        <Footer />

        <AuthDialog
          open={showAuthDialog}
          onOpenChange={setShowAuthDialog}
          onSuccess={handleAuthSuccess}
          defaultTab="login"
        />
      </div>
    </>
  );
}
