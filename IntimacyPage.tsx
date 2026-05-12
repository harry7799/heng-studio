import ServicePage, { GalleryImage, ServicePageConfig } from './ServicePage';

const intimacyImages: GalleryImage[] = [
  { src: '/images/intimacy/bestie/01.jpg', id: 1, category: 'bestie' },
  { src: '/images/intimacy/family/02.jpg', id: 2, category: 'family' },
  { src: '/images/intimacy/pet/03.jpg', id: 3, category: 'pet' },
  { src: '/images/intimacy/pet/04.jpg', id: 4, category: 'pet' },
];

const config: ServicePageConfig = {
  pageKey: 'intimacy',
  theme: 'light',
  eyebrow: 'Bestie / Family / Pet Portraits',
  title: '親密寫真',
  lead: '閨密、家人與寵物都值得被好好拍下來。用輕鬆的拍攝節奏，留下自然、不尷尬、有溫度的關係影像。',
  heroImage: '/images/intimacy/family/02.jpg',
  heroAlt: 'Harry Heng Studio 親密寫真作品',
  storyTitle: '真正耐看的照片，通常來自你們彼此熟悉的樣子。',
  story: [
    '親密寫真不需要像廣告大片一樣用力。它更在意你們平常互動的節奏、笑起來的樣子、靠近彼此時的安心感。',
    '拍攝前會一起討論成員、場景、服裝與想留下的畫面。拍攝中以引導取代命令，讓畫面保留關係本來的溫度。',
  ],
  services: [
    { title: '閨密寫真', body: '適合朋友、姊妹、伴娘團或想一起留下紀念的你們。' },
    { title: '全家福', body: '從小家庭到三代同堂，保留家人之間自然的互動。' },
    { title: '寵物寫真', body: '把重要陪伴一起放進畫面，用耐心捕捉自然表情。' },
  ],
  galleryTitle: '親密寫真作品',
  galleryLead: '選擇你想拍攝的關係類型，確認畫面氛圍與你想留下的記憶是否接近。',
  fallbackImages: intimacyImages,
  filters: [
    { id: 'bestie', label: '閨密' },
    { id: 'family', label: '全家福' },
    { id: 'pet', label: '寵物' },
  ],
  seo: {
    title: '高雄閨密寫真｜全家福、寵物攝影｜Harry Heng Studio',
    description: 'Harry Heng Studio 提供高雄閨密寫真、全家福與寵物攝影服務。以輕鬆自然的拍攝氛圍，留下朋友、家人與重要陪伴的溫暖畫面。',
    keywords: '高雄閨密寫真,高雄全家福,寵物攝影,家庭攝影,朋友寫真,親密寫真,Harry Heng,謝典恆',
    canonical: 'https://harryheng.studio/intimacy',
    serviceName: '親密寫真、全家福與寵物攝影',
    serviceType: 'Portrait Photography',
  },
};

export default function IntimacyPage() {
  return <ServicePage config={config} />;
}
