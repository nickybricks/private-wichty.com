import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { AuthDialog } from "@/components/AuthDialog";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import heroMockup from "@/assets/hero-mockup.png";
import { Clock, Shield, Wallet } from "lucide-react";
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

              {/* CTA Button */}
              <div className="py-2 lg:pt-2 flex justify-center lg:justify-start">
                <Button
                  onClick={handleCreateEvent}
                  className="h-9 px-5 text-sm font-semibold bg-[#FF6788] hover:bg-[#FF5577] text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  {t('hero.cta')}
                </Button>
              </div>

              {/* Mobile: Image after CTA button */}
              <div className="lg:hidden flex justify-center pt-1">
                <img 
                  src={heroMockup} 
                  alt={lang === 'de' ? 'Wichty App Vorschau' : 'Wichty App Preview'}
                  className="w-[50%] max-w-[180px]"
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
