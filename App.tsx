import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Aperture,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  Heart,
  Image as ImageIcon,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import type { Project } from './types';
import { CATEGORY_VALUE_TO_LABEL, PROJECTS } from './constants';
import { useContent } from './useContent';
import { useSEO } from './useSEO';

const LINE_URL = 'https://lin.ee/mnwrpoI';
const INSTAGRAM_URL = 'https://www.instagram.com/harrytwstudio';
const FACEBOOK_URL = 'https://www.facebook.com/harry7797';
const EMAIL = 'apple72899@gmail.com';

type IconType = React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;

function SectionLabel({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <span className={`font-mono text-[11px] uppercase tracking-widest ${light ? 'text-white/60' : 'text-stone-500'}`}>
      {children}
    </span>
  );
}

function IconButton({
  href,
  children,
  icon: Icon,
  variant = 'dark',
}: {
  href: string;
  children: React.ReactNode;
  icon: IconType;
  variant?: 'dark' | 'light' | 'outline';
}) {
  const className =
    variant === 'light'
      ? 'bg-white text-black hover:bg-stone-100'
      : variant === 'outline'
        ? 'border border-white/25 text-white hover:border-white hover:bg-white/10'
        : 'bg-black text-white hover:bg-stone-800';

  return (
    <a
      href={href}
      target={href.startsWith('http') || href.startsWith('mailto:') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noreferrer' : undefined}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-colors ${className}`}
    >
      <Icon size={18} />
      <span>{children}</span>
    </a>
  );
}

function Header({ lightingEnabled, adminEnabled }: { lightingEnabled: boolean; adminEnabled: boolean }) {
  const nav = [
    { href: '#fashion', label: '時尚牆' },
    { href: '#services', label: '服務' },
    { href: '#work', label: '作品' },
    { href: '#process', label: '流程' },
    { href: '#contact', label: '聯絡' },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/45 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 text-white lg:px-8">
        <a href="#/" className="min-w-0 shrink font-display text-lg">
          <span className="hidden sm:inline">Harry Heng Studio</span>
          <span className="sm:hidden">HENG</span>
        </a>
        <nav className="hidden items-center gap-6 text-sm text-white/75 xl:flex">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="transition-colors hover:text-white">
              {item.label}
            </a>
          ))}
          <a href="/wedding" className="transition-colors hover:text-white">婚紗</a>
          <a href="/intimacy" className="transition-colors hover:text-white">寫真</a>
          <a href="/kunqu" className="transition-colors hover:text-white">崑曲</a>
          {lightingEnabled && <a href="/lighting" className="transition-colors hover:text-white">光位</a>}
          {adminEnabled && <a href="/admin" className="transition-colors hover:text-white">Admin</a>}
        </nav>
        <a
          href={LINE_URL}
          target="_blank"
          rel="noreferrer"
          className="hidden min-h-10 shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-stone-100 sm:inline-flex"
        >
          <MessageCircle size={17} />
          <span className="hidden sm:inline">預約討論</span>
          <span className="sm:hidden">預約</span>
        </a>
      </div>
    </header>
  );
}

function Hero({ cover }: { cover: string }) {
  return (
    <section
      className="relative h-[88svh] min-h-[560px] max-h-[920px] overflow-hidden bg-black bg-cover bg-[position:center_38%] bg-no-repeat text-white"
      style={{ backgroundImage: `url(${cover})` }}
    >
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 to-transparent" />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-end px-5 pb-16 pt-32 lg:px-8 lg:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <SectionLabel light>Kaohsiung Photographer / Since 2016</SectionLabel>
          <h1 className="mt-6 font-display text-5xl leading-tight md:text-7xl lg:text-8xl">
            Harry Heng Studio
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80 md:text-xl">
            高雄攝影師謝典恆。以乾淨的光影、自然的引導與細膩的情緒捕捉，拍攝形象照、婚紗婚禮、全家福、寵物寫真、崑曲與舞蹈劇場紀錄。
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <IconButton href={LINE_URL} icon={MessageCircle} variant="light">LINE 詢問檔期</IconButton>
            <IconButton href="#work" icon={ImageIcon} variant="outline">看作品風格</IconButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [
    ['01', '拍攝前先整理想呈現的氣質與畫面，不讓你到現場才開始緊張。'],
    ['02', '拍攝中會引導姿勢、表情與站位，保留自然狀態。'],
    ['03', '適合個人品牌、婚紗婚禮、家庭紀念與表演藝術紀錄。'],
  ];

  return (
    <section className="border-y border-stone-200 bg-[#F7F4EF]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-stone-200 px-5 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-8">
        {items.map(([num, text]) => (
          <div key={num} className="flex gap-5 py-6 md:px-6">
            <span className="font-mono text-sm text-stone-400">{num}</span>
            <p className="text-sm leading-7 text-stone-700">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

type FashionWallItem = {
  src: string;
  number: number;
};

const fallbackFashionItems = Array.from({ length: 72 }, (_, index) => ({
  src: `/images/fashion-wall/${String(index + 1).padStart(3, '0')}.webp`,
  number: index + 1,
}));

function FashionMomentumWall() {
  const [items, setItems] = useState<FashionWallItem[]>(fallbackFashionItems);

  useEffect(() => {
    let cancelled = false;

    fetch('/fashion-wall.json', { cache: 'no-cache' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!Array.isArray(data)) return;
        const galleryItems = data
          .filter((item) => item && typeof item.src === 'string')
          .map((item) => ({
            src: String(item.src),
            number: Number(item.number || 0),
          }))
          .filter((item) => item.number > 0)
          .sort((a, b) => a.number - b.number)
          .slice(0, 36);

        if (!cancelled && galleryItems.length >= 12) {
          setItems(galleryItems);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const midpoint = Math.ceil(items.length / 2);
  const rowA = items.slice(0, midpoint);
  const rowB = items.slice(midpoint).length ? items.slice(midpoint) : items.slice(6, 24);

  const renderRow = (rowItems: FashionWallItem[], reverse = false) => {
    const repeated = [...rowItems, ...rowItems];
    return (
      <div className="overflow-hidden">
        <div className={`fashion-marquee flex w-max gap-4 ${reverse ? 'fashion-marquee-reverse' : ''}`}>
          {repeated.map((item, index) => (
            <div
              key={`${item.src}-${index}`}
              className="relative h-[250px] w-[170px] shrink-0 overflow-hidden rounded-lg bg-stone-900 sm:h-[320px] sm:w-[220px] lg:h-[390px] lg:w-[270px]"
            >
              <img
                src={item.src}
                alt={`Harry Heng Studio 時尚攝影作品 ${item.number}`}
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                loading="eager"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-70" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section id="fashion" className="scroll-mt-24 overflow-hidden bg-[#0F0F0D] py-20 text-white lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <SectionLabel light>Fashion Wall</SectionLabel>
            <h2 className="mt-4 text-4xl font-bold leading-tight md:text-6xl">
              先讓影像說話。
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-white/70 lg:justify-self-end">
            光線、造型、神情和姿態，會決定一張照片能不能被記住。這些時尚人像保留 Harry Heng Studio 的影像語彙：乾淨、俐落、有態度。
          </p>
        </div>
      </div>

      <div className="mt-12 space-y-4">
        {renderRow(rowA)}
        {renderRow(rowB, true)}
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 lg:px-8">
        <a href="#work" className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-white/70">
          <ImageIcon size={18} />
          <span>看完整作品</span>
        </a>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-white/72 hover:text-white"
        >
          <Instagram size={18} />
          <span>@harrytwstudio</span>
        </a>
      </div>

      <style>{`
        @keyframes fashion-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .fashion-marquee {
          animation: fashion-scroll 48s linear infinite;
          will-change: transform;
        }

        .fashion-marquee-reverse {
          animation-direction: reverse;
          animation-duration: 56s;
        }

        @media (prefers-reduced-motion: reduce) {
          .fashion-marquee {
            animation: none;
            transform: translateX(0);
          }
        }
      `}</style>
    </section>
  );
}

function ServicesSection() {
  const services: Array<{ title: string; body: string; href: string; icon: IconType }> = [
    {
      title: '形象照與個人品牌',
      body: '履歷、品牌頁面、講師介紹、創作者與社群頭像。拍出清楚、可信、帶有個人溫度的第一印象。',
      href: '#work',
      icon: Camera,
    },
    {
      title: '婚紗與婚禮紀錄',
      body: '從婚紗、訂婚到婚禮當天，保留關係裡最真實的動作、眼神與當天氛圍。',
      href: '/wedding',
      icon: Heart,
    },
    {
      title: '閨密、全家福、寵物寫真',
      body: '適合朋友、家人與重要陪伴一起拍攝。氛圍輕鬆，畫面乾淨，不過度擺拍。',
      href: '/intimacy',
      icon: Users,
    },
    {
      title: '崑曲與表演藝術',
      body: '熟悉舞台光與動態瞬間，適合劇照、宣傳照、演出紀錄與藝術家形象素材。',
      href: '/kunqu',
      icon: Sparkles,
    },
  ];

  return (
    <section id="services" className="bg-white px-5 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <SectionLabel>Services</SectionLabel>
          <h2 className="mt-4 text-4xl font-bold leading-tight text-stone-950 md:text-5xl">
            不是只拍漂亮照片，而是幫你留下「值得被相信」的影像。
          </h2>
          <p className="mt-5 text-base leading-8 text-stone-600">
            你可以從想留下的關係與影像氣質開始選擇：專業形象、婚禮記憶、家人陪伴，或舞台上最有力量的一瞬。
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <a
                key={service.title}
                href={service.href}
                className="group rounded-lg border border-stone-200 bg-[#FBFAF7] p-6 transition-colors hover:border-stone-950 hover:bg-white"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-stone-950 text-white">
                  <Icon size={20} />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-stone-950">{service.title}</h3>
                <p className="mt-4 text-sm leading-7 text-stone-600">{service.body}</p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-stone-950">
                  <span>查看服務</span>
                  <ArrowUpRight size={17} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  const points = [
    '2016 年起累積人像、婚紗、表演藝術與劇場紀錄拍攝經驗',
    '拍攝前協助整理服裝方向、場景與視覺氣質',
    '拍攝現場提供姿勢與表情引導，讓不常拍照的人也能放鬆',
  ];

  return (
    <section className="bg-[#111111] px-5 py-24 text-white lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="overflow-hidden rounded-lg bg-stone-900">
          <img
            src="/images/about-portrait.jpg"
            alt="攝影師謝典恆工作肖像"
            className="h-full min-h-[460px] w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div>
          <SectionLabel light>About Harry</SectionLabel>
          <h2 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
            讓人看起來有質感，也讓那個人仍然像自己。
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/70">
            Harry Heng Studio 專注在乾淨、安定、帶有故事感的影像。無論是需要建立專業形象、留下婚禮紀念，或替表演藝術保留舞台瞬間，核心都是同一件事：把人與情緒拍得可信。
          </p>
          <div className="mt-8 grid gap-4">
            {points.map((point) => (
              <div key={point} className="flex gap-3 text-sm leading-7 text-white/75">
                <CheckCircle2 className="mt-1 shrink-0 text-white" size={18} />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PortfolioSection({ projects, onSelect }: { projects: Project[]; onSelect: (project: Project) => void }) {
  return (
    <section id="work" className="bg-[#F7F4EF] px-5 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <SectionLabel>Portfolio</SectionLabel>
            <h2 className="mt-4 text-4xl font-bold leading-tight text-stone-950 md:text-5xl">
              讓光線、表情與關係先替照片說話。
            </h2>
          </div>
          <IconButton href={INSTAGRAM_URL} icon={Instagram}>更多即時作品</IconButton>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {projects.map((project, index) => (
            <button
              key={project.id}
              type="button"
              onClick={() => onSelect(project)}
              className={`group relative overflow-hidden rounded-lg bg-stone-200 text-left ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
            >
              <img
                src={project.imageUrl}
                alt={project.title}
                className={`${index === 0 ? 'h-[560px]' : 'h-[270px]'} w-full object-cover transition-transform duration-700 group-hover:scale-105`}
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="font-mono text-[11px] uppercase tracking-widest text-white/70">
                  {CATEGORY_VALUE_TO_LABEL[project.category]}
                </p>
                <h3 className="mt-2 text-lg font-semibold leading-7">{project.title}</h3>
              </div>
              <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-black opacity-0 transition-opacity group-hover:opacity-100">
                <ArrowUpRight size={17} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  const steps = [
    { title: '確認想法', body: '先聊想拍的類型、預算、時間與你期待的影像感。', icon: MessageCircle },
    { title: '企劃準備', body: '提供服裝、場景、妝髮、拍攝節奏與參考方向建議。', icon: CalendarDays },
    { title: '拍攝引導', body: '現場協助表情、姿勢與走位，不需要自己硬想動作。', icon: Aperture },
    { title: '精修交付', body: '依方案提供挑片、調色與精修，產出可直接使用的影像。', icon: CheckCircle2 },
  ];

  return (
    <section id="process" className="bg-white px-5 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionLabel>Process</SectionLabel>
            <h2 className="mt-4 text-4xl font-bold leading-tight text-stone-950 md:text-5xl">
              拍攝前把細節想清楚，拍攝當天就能把注意力放回自己和重要的人身上。
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-lg border border-stone-200 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-stone-950 text-white">
                      <Icon size={19} />
                    </div>
                    <span className="font-mono text-sm text-stone-400">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-stone-950">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{step.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function InquirySection() {
  const items = ['形象照', '婚紗婚禮', '閨密寫真', '全家福', '寵物寫真', '崑曲劇照', '舞蹈劇場', '品牌影像'];

  return (
    <footer id="contact" className="bg-black px-5 py-20 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <SectionLabel light>Booking</SectionLabel>
            <h2 className="mt-4 text-4xl font-bold leading-tight md:text-6xl">
              想拍一組讓重要的人，或未來的自己，都想多看幾眼的照片？
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/70">
              傳 LINE 或 Email 說明想拍的類型、預計月份與地點。若還沒有明確想法，也可以先從一段簡單討論開始。
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <IconButton href={LINE_URL} icon={MessageCircle} variant="light">LINE 詢問檔期</IconButton>
              <IconButton href={`mailto:${EMAIL}`} icon={Mail} variant="outline">Email 聯絡</IconButton>
            </div>
          </div>
          <div>
            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <span key={item} className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white/70">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-5 text-sm text-white/60">
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white">
                <Instagram size={17} />
                Instagram
              </a>
              <a href={FACEBOOK_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white">
                <ArrowUpRight size={17} />
                Facebook
              </a>
              <span className="inline-flex items-center gap-2">
                <MapPin size={17} />
                Kaohsiung, Taiwan
              </span>
            </div>
          </div>
        </div>
        <p className="mt-16 border-t border-white/10 pt-6 text-sm text-white/40">
          © {new Date().getFullYear()} Harry Heng Studio. Photography by 謝典恆.
        </p>
      </div>
    </footer>
  );
}

function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[70] bg-black/80 p-4 text-white backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 z-10 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-white text-black"
        aria-label="關閉作品預覽"
      >
        <X size={20} />
      </button>
      <div className="mx-auto flex h-full max-w-6xl items-center">
        <div className="grid max-h-[92vh] w-full overflow-hidden rounded-lg bg-[#111] lg:grid-cols-[1.2fr_0.8fr]">
          <img src={project.imageUrl} alt={project.title} className="h-[60vh] w-full object-cover lg:h-[92vh]" />
          <div className="flex flex-col justify-between gap-8 p-7 lg:p-10">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-white/50">
                {CATEGORY_VALUE_TO_LABEL[project.category]}
              </p>
              <h3 className="mt-4 text-3xl font-bold leading-tight">{project.title}</h3>
              <p className="mt-5 text-sm leading-7 text-white/70">
                如果你喜歡這樣的光線、情緒與構圖，詢問時可以直接截圖或告訴我作品名稱，我會依照你的狀態與拍攝情境一起調整。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <IconButton href={LINE_URL} icon={MessageCircle} variant="light">用 LINE 詢問</IconButton>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                <ArrowRight size={18} />
                <span>繼續看作品</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { content, projects: contentProjects } = useContent();
  const projects = useMemo(() => (contentProjects?.length ? contentProjects : PROJECTS), [contentProjects]);
  const heroCover = content?.assets?.heroCover || '/images/optimized/hero-cover.webp';
  const lightingEnabled = content?.features?.lighting !== false;
  const adminEnabled = content?.features?.admin === true;

  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash;
      if (!hash || hash.startsWith('#/')) return;
      const target = document.getElementById(hash.slice(1));
      if (target) target.scrollIntoView({ block: 'start' });
    };

    const timeout = window.setTimeout(scrollToHash, 50);
    window.addEventListener('hashchange', scrollToHash);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('hashchange', scrollToHash);
    };
  }, []);

  useSEO({
    title: 'Harry Heng Studio｜高雄攝影師謝典恆｜形象照、婚紗、全家福、藝術攝影',
    description:
      'Harry Heng Studio 謝典恆攝影工作室位於高雄，提供形象照、個人品牌照、婚紗婚禮、閨密寫真、全家福、寵物寫真、崑曲與舞蹈劇場紀錄。以乾淨光影與自然引導拍出值得信任的影像。',
    keywords:
      '高雄攝影師,高雄攝影工作室,形象照,個人品牌照,婚紗攝影,婚禮紀錄,全家福,閨密寫真,寵物攝影,崑曲攝影,劇場攝影,Harry Heng,謝典恆',
    canonical: 'https://harryheng.studio/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': ['LocalBusiness', 'PhotographyBusiness'],
      '@id': 'https://harryheng.studio/#business',
      name: 'Harry Heng Studio 謝典恆攝影工作室',
      alternateName: ['Harry Heng Photography', 'HENGSTUDIO', '謝典恆攝影'],
      url: 'https://harryheng.studio/',
      image: 'https://harryheng.studio/images/optimized/hero-og.jpg',
      email: EMAIL,
      address: {
        '@type': 'PostalAddress',
        addressLocality: '高雄市',
        addressCountry: 'TW',
      },
      areaServed: ['高雄', '台灣'],
      priceRange: '$$',
      description:
        '高雄攝影工作室，提供形象照、婚紗婚禮、家庭寫真、寵物寫真、崑曲藝術攝影與舞蹈劇場紀錄。',
      sameAs: [INSTAGRAM_URL, FACEBOOK_URL],
      makesOffer: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: '形象照與個人品牌攝影' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: '婚紗攝影與婚禮紀錄' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: '全家福與親密寫真' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: '崑曲與表演藝術攝影' } },
      ],
    },
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7F4EF] text-stone-950 selection:bg-black selection:text-white">
      <Header lightingEnabled={lightingEnabled} adminEnabled={adminEnabled} />
      <main>
        <Hero cover={heroCover} />
        <FashionMomentumWall />
        <TrustStrip />
        <ServicesSection />
        <AboutSection />
        <PortfolioSection projects={projects.slice(0, 8)} onSelect={setSelectedProject} />
        <ProcessSection />
        <InquirySection />
      </main>
      <AnimatePresence>
        {selectedProject && <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />}
      </AnimatePresence>
    </div>
  );
}
