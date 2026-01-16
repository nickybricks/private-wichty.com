import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { AuthDialog } from "@/components/AuthDialog";
import { CreateEventDrawer } from "@/components/CreateEventDrawer";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import heroMockup from "@/assets/hero-mockup.png";
import { Clock, Shield, Wallet, Compass, Check, CalendarPlus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  const handleCreateEvent = () => {
    // Open the create drawer for everyone - auth check happens on save
    setCreateDrawerOpen(true);
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

      <div className="min-h-screen bg-dynamic-gradient">
        {/* Inner wrapper for third color spot */}
        <div className="relative z-10 bg-dynamic-gradient-inner">
        {/* Header */}
        <Header user={user} />

        {/* Hero Section */}
        <section className="max-w-[var(--max-width-extra-wide)] mx-auto px-4 sm:px-6 pt-12 sm:pt-20 lg:pt-8 pb-16 sm:pb-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left: Text Content (Desktop) / Center Content (Mobile) */}
            <div className="space-y-2 lg:space-y-6 order-1 text-center lg:text-left">
              {/* Headline */}
              <h1 className="text-[32px] lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1]">
                <span className="text-foreground">{t('hero.title')}</span>
                <br />
                <span className="bg-gradient-to-r from-[#FF6788] via-[#FF8066] to-[#FFB86C] bg-clip-text text-transparent">
                  {t('hero.titleHighlight')}
                </span>
              </h1>
              
              {/* Subline */}
              <p className="text-[19px] lg:text-2xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                {t('hero.subtitle')}
              </p>

              {/* CTA Buttons */}
              <div className="py-2 lg:pt-2 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <button
                  onClick={handleCreateEvent}
                  className="group relative h-14 px-8 text-lg font-semibold text-white rounded-full overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 active:scale-[0.98] whitespace-nowrap"
                  style={{
                    background: 'linear-gradient(135deg, #ff6b8b 0%, #ff8e72 100%)',
                    boxShadow: '0 8px 24px -8px rgba(255, 107, 139, 0.5), 0 1px 2px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                  }}
                >
                  {/* Shimmer effect */}
                  <span className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  
                  {/* Button content */}
                  <span className="relative flex items-center justify-center gap-2">
                    <CalendarPlus className="w-5 h-5" />
                    {t('hero.cta')}
                  </span>
                </button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/explore")}
                  className="h-12 px-8 text-base font-semibold border-foreground/20 hover:bg-foreground/5 transition-all"
                >
                  <Compass className="w-5 h-5 mr-2" />
                  {t('hero.explore')}
                </Button>
              </div>

              {/* Mobile: Image after CTA button */}
              <div className="lg:hidden flex justify-center pt-1">
                <img 
                  src={heroMockup} 
                  alt={lang === 'de' ? 'Wichty App Vorschau' : 'Wichty App Preview'}
                  className="w-[50%] max-w-[180px] drop-shadow-2xl"
                  style={{ filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.15))' }}
                />
              </div>

              {/* Trust Claims */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center lg:justify-start text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-500" />
                  {t('hero.trustFree')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-500" />
                  {t('hero.trustBerlin')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-500" />
                  {t('hero.trustGdpr')}
                </span>
              </div>
            </div>

            {/* Right: Image (Desktop only) */}
            <div className="hidden lg:flex justify-center order-2">
              <img 
                src={heroMockup} 
                alt={lang === 'de' ? 'Wichty App Vorschau' : 'Wichty App Preview'}
                className="w-full max-w-md xl:max-w-lg drop-shadow-2xl"
                style={{ filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.15))' }}
              />
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="max-w-[var(--max-width)] mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Benefit 1: Ready in 3 minutes */}
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-muted/30">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-1">{t('benefits.ready.title')}</h3>
              <p className="text-muted-foreground text-sm">{t('benefits.ready.description')}</p>
            </div>

            {/* Benefit 2: Secure payments */}
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-muted/30">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-1">{t('benefits.secure.title')}</h3>
              <p className="text-muted-foreground text-sm">{t('benefits.secure.description')}</p>
            </div>

            {/* Benefit 3: Only 5% fee */}
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-muted/30">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-1">{t('benefits.fair.title')}</h3>
              <p className="text-muted-foreground text-sm">{t('benefits.fair.description')}</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
            {t('faq.title')}
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {(t('faq.items', { returnObjects: true }) as Array<{ question: string; answer: string }>).map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-base sm:text-lg font-medium">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Final CTA Section */}
        <section className="max-w-[var(--max-width)] mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
          <div className="bg-gradient-to-r from-[#FF6788]/10 via-[#FF8066]/10 to-[#FFB86C]/10 rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">
              {t('cta.title')}
            </h2>
            <button
              onClick={handleCreateEvent}
              className="group relative h-14 px-8 text-lg font-semibold text-white rounded-full overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 active:scale-[0.98] min-w-[200px]"
              style={{
                background: 'linear-gradient(135deg, #ff6b8b 0%, #ff8e72 100%)',
                boxShadow: '0 8px 24px -8px rgba(255, 107, 139, 0.5), 0 1px 2px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
              }}
            >
              {/* Shimmer effect */}
              <span className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              
              {/* Button content */}
              <span className="relative flex items-center justify-center gap-2">
                <CalendarPlus className="w-5 h-5" />
                {t('cta.button')}
              </span>
            </button>
          </div>
        </section>

        <Footer />

        <AuthDialog
          open={showAuthDialog}
          onOpenChange={setShowAuthDialog}
          onSuccess={handleAuthSuccess}
          defaultTab="login"
        />

        <CreateEventDrawer 
          open={createDrawerOpen} 
          onOpenChange={setCreateDrawerOpen}
        />
        </div>
      </div>
    </>
  );
}
