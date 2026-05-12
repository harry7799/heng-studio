import { Project, StylingProject, Category } from './types';

export const CATEGORIES: string[] = ['全部', '形象人像', '婚紗婚禮', '崑曲藝術', '舞蹈劇場', '造型影像'];

export const CATEGORY_VALUES: Category[] = ['Fashion', 'Wedding', 'Kunqu Opera', 'Dance/Theater', 'Styling'];

export const CATEGORY_LABEL_MAP: Record<string, Category> = {
  '形象人像': 'Fashion',
  '婚紗婚禮': 'Wedding',
  '崑曲藝術': 'Kunqu Opera',
  '舞蹈劇場': 'Dance/Theater',
  '造型影像': 'Styling',
};

export const CATEGORY_VALUE_TO_LABEL: Record<Category, string> = {
  Fashion: '形象人像',
  Wedding: '婚紗婚禮',
  'Kunqu Opera': '崑曲藝術',
  'Dance/Theater': '舞蹈劇場',
  Styling: '造型影像',
};

export const PROJECTS: Project[] = [
  {
    id: 'portrait-brand',
    title: '形象照｜把專業感拍得自然',
    category: 'Fashion',
    imageUrl: '/images/projects/01.jpg',
    metadata: { iso: '100', aperture: 'f/2.8', shutter: '1/160', date: 'Portrait' },
  },
  {
    id: 'wedding-vows',
    title: '婚紗攝影｜城市裡的安靜承諾',
    category: 'Wedding',
    imageUrl: '/images/wedding/01.jpg',
    metadata: { iso: '200', aperture: 'f/2.8', shutter: '1/250', date: 'Wedding' },
  },
  {
    id: 'wedding-day',
    title: '婚禮紀錄｜留下那天真正的情緒',
    category: 'Wedding',
    imageUrl: '/images/wedding/089.jpg',
    metadata: { iso: '400', aperture: 'f/2.0', shutter: '1/200', date: 'Wedding Day' },
  },
  {
    id: 'kunqu-stage',
    title: '崑曲藝術｜身段、眼神與舞台光',
    category: 'Kunqu Opera',
    imageUrl: '/images/kunqu/01.jpg',
    metadata: { iso: '1600', aperture: 'f/2.8', shutter: '1/320', date: 'Kunqu' },
  },
  {
    id: 'dance-theater',
    title: '劇場紀錄｜凝住動作最有力量的一秒',
    category: 'Dance/Theater',
    imageUrl: '/images/projects/05.jpg',
    metadata: { iso: '1250', aperture: 'f/2.0', shutter: '1/400', date: 'Theater' },
  },
  {
    id: 'bestie',
    title: '閨密寫真｜一起笑得很像自己的樣子',
    category: 'Fashion',
    imageUrl: '/images/intimacy/bestie/01.jpg',
    metadata: { iso: '200', aperture: 'f/2.8', shutter: '1/160', date: 'Bestie' },
  },
  {
    id: 'family',
    title: '全家福｜把日常的溫度拍成紀念',
    category: 'Fashion',
    imageUrl: '/images/intimacy/family/02.jpg',
    metadata: { iso: '400', aperture: 'f/4.0', shutter: '1/125', date: 'Family' },
  },
  {
    id: 'styling-editorial',
    title: '造型影像｜為品牌與個人建立視覺印象',
    category: 'Styling',
    imageUrl: '/images/projects/10.jpg',
    metadata: { iso: '100', aperture: 'f/2.8', shutter: '1/200', date: 'Styling' },
  },
];

export const STYLING_PROJECTS: StylingProject[] = [
  {
    id: 's1',
    title: '個人形象造型',
    beforeImg: '/images/projects/01.jpg',
    afterImg: '/images/projects/02.jpg',
    description: '從服裝、姿態到光線方向，整理出清楚、自然、能被記住的專業形象。',
  },
  {
    id: 's2',
    title: '品牌視覺企劃',
    beforeImg: '/images/projects/03.jpg',
    afterImg: '/images/projects/04.jpg',
    description: '協助品牌把氛圍、人物與服務價值拍成可延伸到品牌頁面、社群與宣傳版面的影像。',
  },
];
