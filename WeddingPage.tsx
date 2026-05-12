import ServicePage, { GalleryImage, ServicePageConfig } from './ServicePage';

const weddingImages: GalleryImage[] = [
  ...[1, 2, 3, 6].map((n, index) => ({ src: `/images/wedding/${String(n).padStart(2, '0')}.jpg`, id: index + 1 })),
  ...Array.from({ length: 20 }, (_, index) => {
    const n = 89 + index;
    return { src: `/images/wedding/${String(n).padStart(3, '0')}.jpg`, id: index + 5 };
  }),
];

const config: ServicePageConfig = {
  pageKey: 'wedding',
  theme: 'light',
  eyebrow: 'Wedding / Pre-Wedding / Engagement',
  title: '婚紗與婚禮紀錄',
  lead: '把當天的光、擁抱、笑聲與安靜片刻都留下來。適合婚紗照、訂婚紀錄、婚禮當天紀實與親友合照。',
  heroImage: '/images/wedding/01.jpg',
  heroAlt: 'Harry Heng Studio 婚紗攝影作品',
  storyTitle: '婚禮不是只需要漂亮照片，也需要有人看懂那天的情緒。',
  story: [
    '婚紗拍攝重視兩個人的相處感，而婚禮紀錄重視現場節奏。Harry Heng Studio 會在拍攝前確認儀式、場地、重點親友與你在意的畫面，讓當天少一點不確定。',
    '拍攝中會保留自然互動，也會在需要時引導站位、角度與光線。你不用很會拍照，只要把注意力放回彼此身上。',
  ],
  services: [
    { title: '婚紗攝影', body: '適合想拍一組乾淨、有故事感、不過度制式化婚紗照的新人。' },
    { title: '婚禮紀錄', body: '從準備、儀式、宴客到親友互動，完整保留婚禮當天的節奏。' },
    { title: '訂婚與家庭儀式', body: '重視長輩、親友與家庭聚在一起的溫度，畫面自然不打擾。' },
  ],
  galleryTitle: '婚紗婚禮作品',
  galleryLead: '先看光線、構圖與情緒是否接近你期待的婚禮記憶。',
  fallbackImages: weddingImages,
  seo: {
    title: '高雄婚紗攝影｜婚禮紀錄、訂婚攝影｜Harry Heng Studio',
    description: 'Harry Heng Studio 謝典恆提供高雄婚紗攝影、婚禮紀錄與訂婚攝影服務。以自然引導、乾淨光影與紀實感，留下新人與親友最珍貴的畫面。',
    keywords: '高雄婚紗攝影,高雄婚禮紀錄,婚紗照,婚禮攝影,訂婚攝影,高雄婚攝,Harry Heng,謝典恆',
    canonical: 'https://harryheng.studio/wedding',
    serviceName: '婚紗攝影與婚禮紀錄',
    serviceType: 'Wedding Photography',
  },
};

export default function WeddingPage() {
  return <ServicePage config={config} />;
}
