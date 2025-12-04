import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

interface BlogCTAProps {
  title?: string;
  description?: string;
  buttonText?: string;
}

export function BlogCTA({ title, description, buttonText }: BlogCTAProps) {
  const { t, i18n } = useTranslation('blog');
  const lang = i18n.language;
  
  const defaultTitle = lang === 'de' ? 'Bereit für dein Wichtel-Event?' : 'Ready for your Secret Santa Event?';
  const defaultDescription = lang === 'de' 
    ? 'Starte jetzt kostenfrei und organisiere dein perfektes Wichtel-Event in wenigen Sekunden.'
    : 'Start for free now and organize your perfect Secret Santa event in seconds.';
  const defaultButton = lang === 'de' ? 'Jetzt Event erstellen' : 'Create Event Now';

  return (
    <div className="relative p-6 sm:p-8 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 shadow-medium">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg sm:text-xl font-semibold mb-1">{title || defaultTitle}</h3>
          <p className="text-sm text-muted-foreground">{description || defaultDescription}</p>
        </div>
        <Button asChild size="lg" className="shadow-medium hover:shadow-strong transition-all w-full sm:w-auto">
          <Link to="/wichtel-app">
            {buttonText || defaultButton}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
