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
import { Clock, Shield, Wallet, ArrowRight, Check } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Landing() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('landing');
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

  const benefitIcons = [Clock, Shield, Wallet];

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://wichty.com/#website",
        "url": "https://wichty.com",
        "name": "Wichty",
        "description": lang === 'de' 
          ? "Event-App für Amateursportvereine. Turniere, Vereinsfeste und Spiele einfach organisieren. Sichere Zahlungen, nur 5% Gebühr."
          : "Event app for amateur sports clubs. Easily organize tournaments, club events and games. Secure payments, only 5% fee.",
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
        },
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Berlin",
          "addressCountry": "DE"
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://wichty.com/#app",
        "name": "Wichty",
        "url": "https://wichty.com",
        "applicationCategory": "EventApplication",
        "operatingSystem": "Web",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "EUR",
          "description": lang === 'de' ? "Kostenlos starten, 5% Gebühr pro Ticket" : "Start free, 5% fee per ticket"
        },
        "description": lang === 'de'
          ? "Die einfachste Event-App für Amateursportvereine. Turniere, Vereinsfeste und Spiele organisieren mit integriertem Ticketverkauf."
          : "The easiest event app for amateur sports clubs. Organize tournaments, club events and games with integrated ticket sales.",
        "featureList": lang === 'de' 
          ? ["Ticketverkauf", "Teilnehmerverwaltung", "Automatische Auszahlung", "QR-Code Check-in"]
          : ["Ticket sales", "Participant management", "Automatic payout", "QR code check-in"]
      },
      {
        "@type": "SportsOrganization",
        "name": "Wichty für Sportvereine",
        "description": lang === 'de'
          ? "Die Event-Plattform für Amateursportvereine in Deutschland"
          : "The event platform for amateur sports clubs in Germany"
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>{lang === 'de' ? 'Wichty – Event App für Sportvereine | Ticketing einfach gemacht' : 'Wichty – Event App for Sports Clubs | Easy Ticketing'}</title>
        <meta 
          name="description" 
          content={lang === 'de' 
            ? 'Die einfachste Event-App für Amateursportvereine. Turniere, Vereinsfeste und Spiele organisieren. Sichere Zahlungen, nur 5% Gebühr.'
            : 'The easiest event app for amateur sports clubs. Organize tournaments, club events and games. Secure payments, only 5% fee.'
          } 
        />
        <meta 
          name="keywords" 
          content={lang === 'de'
            ? 'Sportverein Event App, Turnier Ticketing, Vereinsevent organisieren, Startgeld einsammeln, Ticketverkauf Verein, Amateursport, Vereinsfest'
            : 'sports club event app, tournament ticketing, organize club event, collect entry fees, ticket sales club, amateur sports, club festival'
          }
        />
        <meta property="og:title" content={lang === 'de' ? 'Wichty – Event App für Sportvereine | Ticketing einfach gemacht' : 'Wichty – Event App for Sports Clubs | Easy Ticketing'} />
        <meta 
          property="og:description" 
          content={lang === 'de'
            ? 'Die einfachste Event-App für Amateursportvereine. Turniere, Vereinsfeste und Spiele organisieren.'
            : 'The easiest event app for amateur sports clubs. Organize tournaments, club events and games.'
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
        <Header user={user} />

        {/* Hero Section */}
        <section className="max-w-[var(--max-width-extra-wide)] mx-auto px-4 sm:px-6 pt-12 sm:pt-20 lg:pt-8 pb-12 sm:pb-16">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="space-y-2 lg:space-y-6 order-1 text-center lg:text-left">
              <h1 className="text-[32px] lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1]">
                <span className="text-foreground">{t('hero.title')}</span>
                <br />
                <span className="bg-gradient-to-r from-[#FF6788] via-[#FF8066] to-[#FFB86C] bg-clip-text text-transparent">
                  {t('hero.titleHighlight')}
                </span>
              </h1>
              
              <p className="text-[19px] lg:text-2xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                {t('hero.subtitle')}
              </p>

              <div className="py-2 lg:pt-2 flex justify-center lg:justify-start">
                <Button
                  onClick={handleCreateEvent}
                  className="h-11 px-6 text-base font-semibold bg-[#FF6788] hover:bg-[#FF5577] text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  {t('hero.cta')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="lg:hidden flex justify-center pt-1">
                <img 
                  src={heroMockup} 
                  alt={lang === 'de' ? 'Wichty App Vorschau' : 'Wichty App Preview'}
                  className="w-[50%] max-w-[180px]"
                />
              </div>

              <p className="text-sm text-muted-foreground/80">
                {t('hero.trust')}
              </p>
            </div>

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
        <section className="bg-muted/30 py-12 sm:py-16">
          <div className="max-w-[var(--max-width-extra-wide)] mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
              {t('benefits.title')}
            </h2>
            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
              {(t('benefits.items', { returnObjects: true }) as Array<{ title: string; description: string }>).map((item, index) => {
                const Icon = benefitIcons[index];
                return (
                  <div 
                    key={index} 
                    className="bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-border/50 text-center"
                  >
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#FF6788]/10 to-[#FFB86C]/10 flex items-center justify-center">
                      <Icon className="h-7 w-7 text-[#FF6788]" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-10 sm:py-12 border-y border-border/50">
          <div className="max-w-[var(--max-width-extra-wide)] mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
              <div>
                <div className="text-2xl sm:text-4xl font-bold text-foreground">100+</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">{t('stats.events')}</div>
              </div>
              <div>
                <div className="text-2xl sm:text-4xl font-bold text-foreground">50+</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">{t('stats.clubs')}</div>
              </div>
              <div>
                <div className="text-2xl sm:text-4xl font-bold text-foreground">🇩🇪</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">{t('stats.location')}</div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-12 sm:py-20">
          <div className="max-w-[var(--max-width-extra-wide)] mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 sm:mb-14">
              {t('howItWorks.title')}
            </h2>
            <div className="grid md:grid-cols-3 gap-8 sm:gap-10">
              {(t('howItWorks.steps', { returnObjects: true }) as Array<{ step: string; title: string; description: string }>).map((step, index) => (
                <div key={index} className="relative text-center">
                  <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#FF6788] to-[#FFB86C] flex items-center justify-center text-white font-bold text-lg">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-5 left-[60%] w-[80%] h-px bg-gradient-to-r from-border to-transparent" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="bg-muted/30 py-12 sm:py-16">
          <div className="max-w-[var(--max-width-extra-wide)] mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
              {t('useCases.title')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {(t('useCases.items', { returnObjects: true }) as Array<{ emoji: string; title: string; description: string }>).map((item, index) => (
                <div 
                  key={index} 
                  className="bg-background rounded-xl p-5 sm:p-6 shadow-sm border border-border/50 text-center hover:shadow-md transition-shadow"
                >
                  <div className="text-3xl sm:text-4xl mb-3">{item.emoji}</div>
                  <h3 className="font-semibold text-sm sm:text-base mb-1">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
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
        <section className="bg-gradient-to-br from-[#FF6788]/10 via-[#FF8066]/5 to-[#FFB86C]/10 py-12 sm:py-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              {t('finalCta.title')}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t('finalCta.subtitle')}
            </p>
            <Button
              onClick={handleCreateEvent}
              size="lg"
              className="h-12 px-8 text-base font-semibold bg-[#FF6788] hover:bg-[#FF5577] text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              {t('finalCta.button')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-green-500" />
                {lang === 'de' ? 'Keine Kreditkarte' : 'No credit card'}
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-green-500" />
                {lang === 'de' ? 'In 3 Minuten fertig' : 'Ready in 3 minutes'}
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-green-500" />
                {lang === 'de' ? 'Kostenlos starten' : 'Start for free'}
              </span>
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
