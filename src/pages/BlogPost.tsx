import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { Sparkles, ChevronRight, Clock, Calendar, ArrowLeft, Globe } from "lucide-react";
import { Footer } from "@/components/Footer";
import { BlogCTA } from "@/components/BlogCTA";
import { BlogCard } from "@/components/BlogCard";
import { TableOfContents } from "@/components/TableOfContents";
import { getBlogPostBySlug, getAllBlogPosts, getAlternatePost } from "@/data/blogPosts";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation('blog');
  const post = slug ? getBlogPostBySlug(slug) : undefined;

  if (!post) {
    return <Navigate to="/ratgeber" replace />;
  }

  const alternatePost = getAlternatePost(post.slug);
  const lang = post.lang;
  const allPosts = getAllBlogPosts(lang);
  const relatedPosts = allPosts
    .filter(p => p.slug !== post.slug)
    .slice(0, 2);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.metaDescription,
    "image": post.coverImage,
    "datePublished": post.publishedAt,
    "inLanguage": lang,
    "author": {
      "@type": "Organization",
      "name": "Wichty"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Wichty",
      "logo": {
        "@type": "ImageObject",
        "url": "https://wichty.de/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://wichty.de/ratgeber/${post.slug}`
    }
  };

  // Custom components for ReactMarkdown with proper heading IDs
  const components = {
    h2: ({ children, ...props }: any) => {
      const text = String(children);
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9äöüß\s-]/g, "")
        .replace(/\s+/g, "-");
      return <h2 id={id} className="text-2xl sm:text-3xl font-bold mt-10 mb-4 scroll-mt-24" {...props}>{children}</h2>;
    },
    h3: ({ children, ...props }: any) => {
      const text = String(children);
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9äöüß\s-]/g, "")
        .replace(/\s+/g, "-");
      return <h3 id={id} className="text-xl sm:text-2xl font-semibold mt-8 mb-3 scroll-mt-24" {...props}>{children}</h3>;
    },
    p: ({ children, ...props }: any) => (
      <p className="text-muted-foreground leading-relaxed mb-4" {...props}>{children}</p>
    ),
    ul: ({ children, ...props }: any) => (
      <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground" {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="list-decimal list-inside space-y-2 mb-4 text-muted-foreground" {...props}>{children}</ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className="leading-relaxed" {...props}>{children}</li>
    ),
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-6" {...props}>{children}</blockquote>
    ),
    strong: ({ children, ...props }: any) => (
      <strong className="font-semibold text-foreground" {...props}>{children}</strong>
    ),
    table: ({ children, ...props }: any) => (
      <div className="overflow-x-auto my-6">
        <table className="w-full border-collapse border border-border rounded-lg" {...props}>{children}</table>
      </div>
    ),
    th: ({ children, ...props }: any) => (
      <th className="border border-border bg-muted/50 px-4 py-2 text-left font-semibold" {...props}>{children}</th>
    ),
    td: ({ children, ...props }: any) => (
      <td className="border border-border px-4 py-2 text-muted-foreground" {...props}>{children}</td>
    ),
  };

  const dateLocale = lang === 'de' ? 'de-DE' : 'en-US';
  const dateOptions: Intl.DateTimeFormatOptions = { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  };

  return (
    <>
      <Helmet>
        <html lang={lang} />
        <title>{post.title} | Wichty {lang === 'de' ? 'Ratgeber' : 'Guide'}</title>
        <meta name="description" content={post.metaDescription} />
        <meta name="keywords" content={post.keywords.join(', ')} />
        <link rel="canonical" href={`https://wichty.de/ratgeber/${post.slug}`} />
        {alternatePost && (
          <>
            <link rel="alternate" hrefLang={lang} href={`https://wichty.de/ratgeber/${post.slug}`} />
            <link rel="alternate" hrefLang={alternatePost.lang} href={`https://wichty.de/ratgeber/${alternatePost.slug}`} />
          </>
        )}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://wichty.de/ratgeber/${post.slug}`} />
        <meta property="og:image" content={post.coverImage} />
        <meta property="og:locale" content={lang === 'de' ? 'de_DE' : 'en_US'} />
        <meta property="article:published_time" content={post.publishedAt} />
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
                {lang === 'de' ? 'Zur App' : 'To App'} →
              </Link>
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <nav className="max-w-[1080px] mx-auto px-4 sm:px-6 py-4">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <li>
              <Link to="/" className="hover:text-foreground transition-colors">
                {lang === 'de' ? 'Startseite' : 'Home'}
              </Link>
            </li>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <li>
              <Link to="/ratgeber" className="hover:text-foreground transition-colors">
                {lang === 'de' ? 'Ratgeber' : 'Guide'}
              </Link>
            </li>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <li className="text-foreground font-medium truncate">{post.title}</li>
          </ol>
        </nav>

        {/* Article */}
        <article className="max-w-[1080px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {/* Back Button & Language Switch */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/ratgeber">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {lang === 'de' ? 'Alle Artikel' : 'All Articles'}
              </Link>
            </Button>
            
            {alternatePost && (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/ratgeber/${alternatePost.slug}`}>
                  <Globe className="h-4 w-4 mr-2" />
                  {lang === 'de' ? 'Read in English' : 'Auf Deutsch lesen'}
                </Link>
              </Button>
            )}
          </div>

          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(post.publishedAt).toLocaleDateString(dateLocale, dateOptions)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {lang === 'de' ? `${post.readingTime} Min. Lesezeit` : `${post.readingTime} min read`}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              {post.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {post.excerpt}
            </p>
          </header>

          {/* Cover Image */}
          <div className="aspect-[21/9] rounded-2xl overflow-hidden mb-10 shadow-medium">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-[1fr_280px] gap-10">
            {/* Main Content */}
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown components={components}>
                {post.content}
              </ReactMarkdown>

              {/* Inline CTA */}
              <div className="mt-12">
                <BlogCTA />
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start hidden lg:block">
              <TableOfContents content={post.content} />
              
              {/* Keywords */}
              <div className="p-4 rounded-xl bg-muted/50 border border-border/40">
                <div className="text-sm font-semibold mb-3">{lang === 'de' ? 'Themen' : 'Topics'}</div>
                <div className="flex flex-wrap gap-2">
                  {post.keywords.map((keyword) => (
                    <span 
                      key={keyword}
                      className="px-2.5 py-1 text-xs rounded-full bg-primary/10 text-primary"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </article>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <section className="max-w-[1080px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8">
              {lang === 'de' ? 'Weitere Artikel' : 'Related Articles'}
            </h2>
            <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
              {relatedPosts.map((relatedPost) => (
                <BlogCard key={relatedPost.slug} post={relatedPost} />
              ))}
            </div>
          </section>
        )}

        <Footer />
      </div>
    </>
  );
}
