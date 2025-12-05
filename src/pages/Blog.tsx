import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sparkles, BookOpen, ChevronRight } from "lucide-react";
import { Footer } from "@/components/Footer";
import { BlogCard } from "@/components/BlogCard";
import { BlogCTA } from "@/components/BlogCTA";
import { getAllBlogPosts } from "@/data/blogPosts";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function Blog() {
  const { t, i18n } = useTranslation('blog');
  const lang = i18n.language as 'de' | 'en';
  const posts = getAllBlogPosts(lang);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": t('title'),
    "description": t('subtitle'),
    "url": `https://wichty.de/ratgeber`,
    "inLanguage": lang,
    "publisher": {
      "@type": "Organization",
      "name": "Wichty",
      "logo": {
        "@type": "ImageObject",
        "url": "https://wichty.de/logo.png"
      }
    },
    "blogPost": posts.map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.metaDescription,
      "datePublished": post.publishedAt,
      "url": `https://wichty.de/ratgeber/${post.slug}`,
      "image": post.coverImage,
      "inLanguage": post.lang
    }))
  };

  return (
    <>
      <Helmet>
        <html lang={lang} />
        <title>{t('metaTitle')}</title>
        <meta name="description" content={t('metaDescription')} />
        <meta name="keywords" content={lang === 'de' ? "Wichtel, Wichteln Ideen, Schrottwichteln, Secret Santa, Wichtel Budget, Online Wichteln" : "Secret Santa, gift exchange ideas, White Elephant, Secret Santa budget, online Secret Santa"} />
        <link rel="canonical" href="https://wichty.de/ratgeber" />
        <link rel="alternate" hrefLang="de" href="https://wichty.de/ratgeber" />
        <link rel="alternate" hrefLang="en" href="https://wichty.de/ratgeber" />
        <link rel="alternate" hrefLang="x-default" href="https://wichty.de/ratgeber" />
        <meta property="og:title" content={t('metaTitle')} />
        <meta property="og:description" content={t('metaDescription')} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://wichty.de/ratgeber" />
        <meta property="og:locale" content={lang === 'de' ? 'de_DE' : 'en_US'} />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {/* Header */}
        <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold tracking-tight">Wichty</span>
            </Link>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <Link 
                to="/"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {t('toApp')} →
              </Link>
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <nav className="max-w-[1080px] mx-auto px-4 sm:px-6 py-4">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link to="/" className="hover:text-foreground transition-colors">
                {t('breadcrumb.home')}
              </Link>
            </li>
            <ChevronRight className="h-4 w-4" />
            <li className="text-foreground font-medium">{t('breadcrumb.guide')}</li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="max-w-[1080px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="text-center space-y-4 mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <BookOpen className="h-4 w-4" />
              {t('badge')}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              {t('title')}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>

          {/* Blog Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-[900px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <BlogCTA />
        </section>

        <Footer />
      </div>
    </>
  );
}
