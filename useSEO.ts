import { useEffect } from 'react';

type SEOConfig = {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  jsonLd?: Record<string, unknown>;
};

const BASE_URL = 'https://harryheng.studio';
const SITE_NAME = 'Harry Heng Studio 謝典恆攝影';
const DEFAULT_IMAGE = `${BASE_URL}/images/hero-cover.jpg`;

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(id: string, data: Record<string, unknown>) {
  let el = document.querySelector(`script[data-seo-id="${id}"]`) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.setAttribute('type', 'application/ld+json');
    el.setAttribute('data-seo-id', id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeJsonLd(id: string) {
  const el = document.querySelector(`script[data-seo-id="${id}"]`);
  if (el) el.remove();
}

export function useSEO(config: SEOConfig) {
  useEffect(() => {
    const originalTitle = document.title;

    // Title
    document.title = config.title;

    // Meta description
    setMeta('description', config.description);

    // Keywords
    if (config.keywords) {
      setMeta('keywords', config.keywords);
    }

    // Canonical
    const canonical = config.canonical || `${BASE_URL}/`;
    setCanonical(canonical);

    // Open Graph
    setMeta('og:title', config.title, 'property');
    setMeta('og:description', config.description, 'property');
    setMeta('og:url', canonical, 'property');
    setMeta('og:type', config.ogType || 'website', 'property');
    setMeta('og:image', config.ogImage || DEFAULT_IMAGE, 'property');
    setMeta('og:site_name', SITE_NAME, 'property');
    setMeta('og:locale', 'zh_TW', 'property');

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', config.title);
    setMeta('twitter:description', config.description);
    setMeta('twitter:image', config.ogImage || DEFAULT_IMAGE);

    // JSON-LD
    if (config.jsonLd) {
      setJsonLd('page-schema', config.jsonLd);
    }

    return () => {
      document.title = originalTitle;
      removeJsonLd('page-schema');
    };
  }, [config.title, config.description]);
}
