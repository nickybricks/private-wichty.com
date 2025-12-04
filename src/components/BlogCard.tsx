import { Link } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";
import type { BlogPost } from "@/data/blogPosts";

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const dateLocale = post.lang === 'de' ? 'de-DE' : 'en-US';
  const readTimeText = post.lang === 'de' ? `${post.readingTime} Min. Lesezeit` : `${post.readingTime} min read`;
  const readMoreText = post.lang === 'de' ? 'Weiterlesen' : 'Read more';

  return (
    <Link 
      to={`/ratgeber/${post.slug}`}
      className="group block rounded-2xl bg-card border border-border/40 shadow-medium hover:shadow-strong transition-all hover:scale-[1.02] overflow-hidden"
    >
      <div className="aspect-[16/10] overflow-hidden">
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{readTimeText}</span>
          <span className="mx-1">•</span>
          <span>{new Date(post.publishedAt).toLocaleDateString(dateLocale, { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          })}</span>
        </div>
        <h3 className="text-lg sm:text-xl font-semibold leading-tight group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-1 text-sm font-medium text-primary pt-1">
          {readMoreText}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
