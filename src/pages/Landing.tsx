import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sparkles, Users, Gift, Lock, Zap, Star, Shield, Clock, BookOpen, ArrowRight } from "lucide-react";
import { Footer } from "@/components/Footer";
import { LandingEventForm } from "@/components/LandingEventForm";
import { AuthDialog } from "@/components/AuthDialog";
import { BlogCard } from "@/components/BlogCard";
import { getAllBlogPosts } from "@/data/blogPosts";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function Landing() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('landing');
  const { t: tc } = useTranslation('common');
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const lang = i18n.language as 'de' | 'en';
  const blogPosts = getAllBlogPosts(lang).slice(0, 3);

  const handleAuthSuccess = (userId: string) => {
    setShowAuthDialog(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
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

      {/* Hero Section - Mobile First with Event Form */}
      <section className="relative max-w-[var(--max-width-extra-wide)] mx-auto px-4 sm:px-6 pt-8 sm:pt-16 pb-12 sm:pb-20">
        {/* Gradient Background Decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Mobile: Form First (above the fold) */}
          <div className="lg:hidden animate-scale-in">
            <LandingEventForm />
          </div>

          {/* Left: Content */}
          <div className="space-y-6 sm:space-y-8 animate-fade-in order-2 lg:order-1">
            <div className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Star className="h-4 w-4" />
              {t('hero.badge')}
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight">
              {t('hero.title')}{" "}
              <span className="text-gradient">
                {t('hero.titleHighlight')}
              </span>
            </h1>
            
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-lg">
              {t('hero.subtitle')}
            </p>

            {/* Key Benefits - Visible on Desktop */}
            <div className="hidden sm:grid grid-cols-3 gap-3 lg:gap-4 pt-4">
              <div className="flex flex-col items-center gap-2 p-3 lg:p-4 rounded-2xl bg-card/50 border border-border/40 shadow-soft hover:shadow-medium transition-all hover:scale-105">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Lock className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
                </div>
                <span className="text-xs lg:text-sm font-medium text-center">{t('benefits.free')}</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 lg:p-4 rounded-2xl bg-card/50 border border-border/40 shadow-soft hover:shadow-medium transition-all hover:scale-105">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
                </div>
                <span className="text-xs lg:text-sm font-medium text-center">{t('benefits.unlimited')}</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 lg:p-4 rounded-2xl bg-card/50 border border-border/40 shadow-soft hover:shadow-medium transition-all hover:scale-105">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
                </div>
                <span className="text-xs lg:text-sm font-medium text-center">{t('benefits.instant')}</span>
              </div>
            </div>

            {/* Mobile: Scroll hint */}
            <button
              onClick={() => {
                document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="sm:hidden text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('hero.learnMore')}
            </button>
          </div>

          {/* Right: Event Form (Desktop) */}
          <div className="hidden lg:block animate-scale-in order-1 lg:order-2">
            <LandingEventForm />
          </div>
        </div>
      </section>

      {/* Benefits Section - Compact */}
      <section id="benefits" className="max-w-[var(--max-width-extra-wide)] mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
        <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight">
            {t('whyUs.title')}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('whyUs.subtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-card/80 border border-border/40 shadow-medium hover:shadow-strong transition-all hover:scale-105 space-y-3 sm:space-y-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold">{t('whyUs.secure.title')}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t('whyUs.secure.description')}
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-card/80 border border-border/40 shadow-medium hover:shadow-strong transition-all hover:scale-105 space-y-3 sm:space-y-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold">{t('whyUs.fast.title')}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t('whyUs.fast.description')}
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-card/80 border border-border/40 shadow-medium hover:shadow-strong transition-all hover:scale-105 space-y-3 sm:space-y-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Gift className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold">{t('whyUs.fair.title')}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t('whyUs.fair.description')}
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-card/80 border border-border/40 shadow-medium hover:shadow-strong transition-all hover:scale-105 space-y-3 sm:space-y-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold">{t('whyUs.everyone.title')}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t('whyUs.everyone.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Blog Teaser Section */}
      <section className="max-w-[var(--max-width-extra-wide)] mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-12">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <BookOpen className="h-3.5 w-3.5" />
              {t('blog.badge')}
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              {t('blog.title')}
            </h2>
            <p className="text-muted-foreground">
              {t('blog.subtitle')}
            </p>
          </div>
          <Link 
            to="/ratgeber" 
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {t('blog.allArticles')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </section>

      {/* CTA Section - Compact */}
      <section className="max-w-[var(--max-width-wide)] mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
        <div className="relative p-8 sm:p-12 lg:p-16 text-center space-y-4 sm:space-y-6 rounded-3xl overflow-hidden shadow-strong bg-card border border-border">
          <div className="relative z-10">
            <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4" style={{ stroke: 'url(#icon-gradient)' }} />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3 sm:mb-4">
              {t('cta.title')}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-6 sm:mb-8">
              {t('cta.subtitle')}
            </p>
            <Button
              size="lg"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8 shadow-strong hover:shadow-xl hover:scale-105 transition-all"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {t('cta.button')}
            </Button>
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
  );
}
