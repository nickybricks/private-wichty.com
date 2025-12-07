import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// German translations
import deCommon from './locales/de/common.json';
import deLanding from './locales/de/landing.json';
import deDashboard from './locales/de/dashboard.json';
import deAuth from './locales/de/auth.json';
import deEvent from './locales/de/event.json';
import deForms from './locales/de/forms.json';
import deBlog from './locales/de/blog.json';
import deExplore from './locales/de/explore.json';

// English translations
import enCommon from './locales/en/common.json';
import enLanding from './locales/en/landing.json';
import enDashboard from './locales/en/dashboard.json';
import enAuth from './locales/en/auth.json';
import enEvent from './locales/en/event.json';
import enForms from './locales/en/forms.json';
import enBlog from './locales/en/blog.json';
import enExplore from './locales/en/explore.json';

const resources = {
  de: {
    common: deCommon,
    landing: deLanding,
    dashboard: deDashboard,
    auth: deAuth,
    event: deEvent,
    forms: deForms,
    blog: deBlog,
    explore: deExplore,
  },
  en: {
    common: enCommon,
    landing: enLanding,
    dashboard: enDashboard,
    auth: enAuth,
    event: enEvent,
    forms: enForms,
    blog: enBlog,
    explore: enExplore,
  },
};

// Custom language detection: German for DACH region, English for everyone else
const customLanguageDetector = {
  name: 'customDetector',
  lookup() {
    // Check localStorage first for manual selection
    const stored = localStorage.getItem('i18nextLng');
    if (stored) return stored;

    // Get browser language
    const browserLang = navigator.language.toLowerCase();
    
    // German for DACH countries (de, de-DE, de-AT, de-CH)
    if (browserLang.startsWith('de')) {
      return 'de';
    }
    
    // English for everyone else
    return 'en';
  },
  cacheUserLanguage(lng: string) {
    localStorage.setItem('i18nextLng', lng);
  },
};

const languageDetector = new LanguageDetector();
languageDetector.addDetector(customLanguageDetector);

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'landing', 'dashboard', 'auth', 'event', 'forms', 'blog', 'explore'],
    
    detection: {
      order: ['customDetector', 'localStorage', 'navigator'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
