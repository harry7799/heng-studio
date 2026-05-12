import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Image as ImageIcon,
  Mail,
  MessageCircle,
  X,
} from 'lucide-react';
import { useSEO } from './useSEO';

const LINE_URL = 'https://lin.ee/mnwrpoI';
const EMAIL = 'apple72899@gmail.com';

export type GalleryImage = {
  src: string;
  id: number;
  category?: string;
};

export type ServicePageConfig = {
  pageKey: 'wedding' | 'intimacy' | 'kunqu';
  theme: 'light' | 'dark';
  eyebrow: string;
  title: string;
  lead: string;
  heroImage: string;
  heroAlt: string;
  storyTitle: string;
  story: string[];
  services: Array<{ title: string; body: string }>;
  galleryTitle: string;
  galleryLead: string;
  fallbackImages: GalleryImage[];
  filters?: Array<{ id: string; label: string }>;
  seo: {
    title: string;
    description: string;
    keywords: string;
    canonical: string;
    serviceName: string;
    serviceType: string;
  };
};

function usePageImages(pageKey: ServicePageConfig['pageKey'], fallbackImages: GalleryImage[]) {
  const [images, setImages] = useState<GalleryImage[]>(fallbackImages);

  useEffect(() => {
    fetch('/pages.json', { cache: 'no-cache' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (Array.isArray(data?.[pageKey]) && data[pageKey].length > 0) {
          setImages(data[pageKey]);
        }
      })
      .catch(() => {});
  }, [pageKey]);

  return images;
}

function CtaLink({
  href,
  children,
  variant = 'dark',
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'dark' | 'light' | 'outline';
}) {
  const className =
    variant === 'light'
      ? 'bg-white text-black hover:bg-stone-100'
      : variant === 'outline'
        ? 'border border-current text-current hover:bg-current/10'
        : 'bg-black text-white hover:bg-stone-800';

  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noreferrer' : undefined}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-colors ${className}`}
    >
      {href.startsWith('mailto:') ? <Mail size={18} /> : href.startsWith('http') ? <MessageCircle size={18} /> : <ImageIcon size={18} />}
      <span>{children}</span>
    </a>
  );
}

export default function ServicePage({ config }: { config: ServicePageConfig }) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const images = usePageImages(config.pageKey, config.fallbackImages);
  const dark = config.theme === 'dark';

  const filteredImages = useMemo(() => {
    if (!config.filters || activeFilter === 'all') return images;
    return images.filter((image) => image.category === activeFilter);
  }, [activeFilter, config.filters, images]);

  useSEO({
    title: config.seo.title,
    description: config.seo.description,
    keywords: config.seo.keywords,
    canonical: config.seo.canonical,
    ogImage: `https://harryheng.studio${config.heroImage}`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: config.seo.serviceName,
      serviceType: config.seo.serviceType,
      provider: { '@id': 'https://harryheng.studio/#business' },
      areaServed: { '@type': 'City', name: '高雄市' },
      description: config.seo.description,
    },
  });

  return (
    <div className={`${dark ? 'bg-[#0E0D0C] text-white' : 'bg-[#FBFAF7] text-stone-950'} min-h-screen overflow-x-hidden selection:bg-black selection:text-white`}>
      <header className={`fixed inset-x-0 top-0 z-50 border-b ${dark ? 'border-white/10 bg-black/45' : 'border-black/10 bg-white/70'} backdrop-blur-md`}>
        <div className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 py-4 lg:px-8">
          <a href="/" className={`inline-flex justify-self-start items-center gap-2 text-sm font-semibold ${dark ? 'text-white/75 hover:text-white' : 'text-stone-600 hover:text-black'}`}>
            <ArrowLeft size={18} />
            <span>回首頁</span>
          </a>
          <span className="font-display text-lg">
            <span className="hidden sm:inline">Harry Heng Studio</span>
            <span className="sm:hidden">HENG</span>
          </span>
          <a
            href={LINE_URL}
            target="_blank"
            rel="noreferrer"
            className={`hidden min-h-10 items-center gap-2 justify-self-end rounded-lg px-4 py-2 text-sm font-semibold sm:inline-flex ${dark ? 'bg-white text-black' : 'bg-black text-white'}`}
          >
            <MessageCircle size={17} />
            <span>詢問</span>
          </a>
        </div>
      </header>

      <main>
        <section className="relative min-h-[88vh] overflow-hidden bg-black text-white">
          <img
            src={config.heroImage}
            alt={config.heroAlt}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/82 via-black/58 to-black/22" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/45 to-transparent" />
          <div className="relative z-10 mx-auto flex min-h-[88vh] max-w-7xl items-end px-5 pb-16 pt-28 lg:px-8">
            <div className="max-w-4xl">
              <p className="font-mono text-[11px] uppercase tracking-widest text-white/60">{config.eyebrow}</p>
              <h1 className="mt-5 text-5xl font-bold leading-tight text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.55)] md:text-7xl">
                {config.title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)]">
                {config.lead}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <CtaLink href={LINE_URL} variant="light">LINE 詢問檔期</CtaLink>
                <CtaLink href="#gallery" variant="outline">看作品</CtaLink>
              </div>
            </div>
          </div>
        </section>

        <section className={`px-5 py-20 lg:px-8 ${dark ? 'border-y border-white/10 bg-[#151312]' : 'border-y border-stone-200 bg-white'}`}>
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className={`font-mono text-[11px] uppercase tracking-widest ${dark ? 'text-white/50' : 'text-stone-500'}`}>Approach</p>
              <h2 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">{config.storyTitle}</h2>
            </div>
            <div className="space-y-5">
              {config.story.map((paragraph) => (
                <p key={paragraph} className={`text-base leading-8 ${dark ? 'text-white/70' : 'text-stone-600'}`}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-5 md:grid-cols-3">
              {config.services.map((service, index) => (
                <div key={service.title} className={`rounded-lg border p-6 ${dark ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-white'}`}>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${dark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                    <CheckCircle2 size={19} />
                  </div>
                  <p className={`mt-6 font-mono text-sm ${dark ? 'text-white/40' : 'text-stone-400'}`}>{String(index + 1).padStart(2, '0')}</p>
                  <h3 className="mt-3 text-xl font-semibold">{service.title}</h3>
                  <p className={`mt-3 text-sm leading-7 ${dark ? 'text-white/70' : 'text-stone-600'}`}>{service.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="gallery" className={`px-5 py-20 lg:px-8 ${dark ? 'bg-black/25' : 'bg-[#F7F4EF]'}`}>
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-3xl">
                <p className={`font-mono text-[11px] uppercase tracking-widest ${dark ? 'text-white/50' : 'text-stone-500'}`}>Gallery</p>
                <h2 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">{config.galleryTitle}</h2>
                <p className={`mt-4 max-w-2xl text-base leading-8 ${dark ? 'text-white/70' : 'text-stone-600'}`}>{config.galleryLead}</p>
              </div>

              {config.filters && (
                <div className="flex flex-wrap gap-2">
                  {[{ id: 'all', label: '全部' }, ...config.filters].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setActiveFilter(filter.id)}
                      className={`min-h-10 rounded-lg border px-4 py-2 text-sm transition-colors ${
                        activeFilter === filter.id
                          ? dark ? 'border-white bg-white text-black' : 'border-black bg-black text-white'
                          : dark ? 'border-white/15 text-white/70 hover:border-white' : 'border-stone-300 text-stone-700 hover:border-black'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-12 columns-1 gap-5 sm:columns-2 lg:columns-3">
              {filteredImages.map((image, index) => (
                <button
                  key={`${image.src}-${image.id}`}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className="mb-5 block w-full break-inside-avoid overflow-hidden rounded-lg bg-stone-200 text-left"
                >
                  <img
                    src={image.src}
                    alt={`${config.title}作品 ${index + 1}`}
                    className="w-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className={`px-5 py-20 lg:px-8 ${dark ? 'bg-[#151312]' : 'bg-white'}`}>
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-center">
            <div>
              <p className={`font-mono text-[11px] uppercase tracking-widest ${dark ? 'text-white/50' : 'text-stone-500'}`}>Booking</p>
              <h2 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">喜歡這個風格，可以先聊想拍的月份、地點與畫面感。</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <CtaLink href={LINE_URL} variant={dark ? 'light' : 'dark'}>LINE 詢問</CtaLink>
              <CtaLink href={`mailto:${EMAIL}`} variant="outline">Email</CtaLink>
            </div>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-lg bg-white text-black"
              aria-label="關閉照片"
            >
              <X size={20} />
            </button>
            <img src={selectedImage.src} alt="作品放大檢視" className="max-h-[92vh] max-w-full rounded-lg object-contain" />
          </motion.div>
        )}
      </AnimatePresence>

      <footer className={`px-5 py-8 text-sm lg:px-8 ${dark ? 'border-t border-white/10 text-white/50' : 'border-t border-stone-200 text-stone-500'}`}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} Harry Heng Studio</span>
          <a href="/" className="inline-flex items-center gap-2 hover:opacity-70">
            <ArrowUpRight size={16} />
            回到首頁
          </a>
        </div>
      </footer>
    </div>
  );
}
