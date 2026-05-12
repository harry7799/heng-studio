import ServicePage, { GalleryImage, ServicePageConfig } from './ServicePage';

const knownFiles = [
  '01', '02', '03', '003', '005', '009', '013', '014', '017', '019',
  '023', '025', '026', '029', '031', '033', '034', '040', '041', '047',
  '049', '056', '059', '060', '062', '067', '069', '073', '075', '076',
  '081', '086', '241',
];

const kunquImages: GalleryImage[] = knownFiles.map((file, index) => ({
  src: `/images/kunqu/${file}.jpg`,
  id: index + 1,
}));

const config: ServicePageConfig = {
  pageKey: 'kunqu',
  theme: 'dark',
  eyebrow: 'Kunqu Opera / Stage Photography',
  title: '崑曲藝術攝影',
  lead: '在舞台光、身段與眼神之間，凝住表演者最有韻味的一瞬。適合劇照、宣傳照、演出紀錄與藝術家形象素材。',
  heroImage: '/images/kunqu/01.jpg',
  heroAlt: 'Harry Heng Studio 崑曲藝術攝影作品',
  storyTitle: '舞台攝影需要等，也需要預判。',
  story: [
    '崑曲的美在細節：水袖、眼神、轉身、手勢與舞台光的交會。拍攝時不只追求清楚，更重視那一瞬間是否留下角色的氣息。',
    'Harry Heng Studio 熟悉表演藝術節奏，能在不干擾演出的前提下，為劇團、演員與藝術活動留下可用於宣傳、典藏與社群的影像。',
  ],
  services: [
    { title: '演出劇照', body: '保留舞台當下的光線、身段與場面調度，適合紀錄與宣傳。' },
    { title: '藝術家形象', body: '為演員、舞者與表演者拍攝具有角色感與專業質感的形象照片。' },
    { title: '活動宣傳素材', body: '提供劇團、展演單位與文化活動可直接使用的影像素材。' },
  ],
  galleryTitle: '崑曲與舞台作品',
  galleryLead: '看見舞台光線、動態捕捉與角色神韻的處理方式。',
  fallbackImages: kunquImages,
  seo: {
    title: '崑曲藝術攝影｜戲曲攝影、舞台劇照｜Harry Heng Studio 高雄',
    description: 'Harry Heng Studio 提供崑曲藝術攝影、戲曲攝影、舞台劇照與表演藝術紀錄。擅長在舞台光與動態之中捕捉身段、眼神與角色氣韻。',
    keywords: '崑曲攝影,戲曲攝影,舞台攝影,劇照攝影,表演藝術攝影,高雄藝術照,Harry Heng,謝典恆',
    canonical: 'https://harryheng.studio/kunqu',
    serviceName: '崑曲藝術攝影與舞台劇照',
    serviceType: 'Stage Photography',
  },
};

export default function KunquPage() {
  return <ServicePage config={config} />;
}
