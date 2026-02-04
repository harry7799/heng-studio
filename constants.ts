
import { Project, StylingProject } from './types';

export const CATEGORIES: string[] = ['全部', '時尚', '婚紗', '戲曲', '舞蹈/劇場', '造型'];

export const PROJECTS: Project[] = [
  {
    id: '1',
    title: '專業時尚人像',
    category: 'Fashion',
    imageUrl: 'https://custom-images.strikinglycdn.com/res/hrscywv4p/image/upload/c_limit,fl_lossy,h_1440,w_720,f_auto,q_auto/14194393/988013_40225.jpg',
    metadata: { iso: '100', aperture: 'f/2.8', shutter: '1/125', date: '2024年' }
  },
  {
    id: '5',
    title: '婚禮紀錄',
    category: 'Dance/Theater',
    imageUrl: 'https://custom-images.strikinglycdn.com/res/hrscywv4p/image/upload/c_limit,fl_lossy,h_9000,w_1200,f_auto,q_1/14194393/118649_641015.jpg',
    metadata: { iso: '800', aperture: 'f/2.8', shutter: '1/250', date: '2021年' }
  },
  {
    id: '4',
    title: '層中隙',
    category: 'Dance/Theater',
    imageUrl: 'https://custom-images.strikinglycdn.com/res/hrscywv4p/image/upload/c_limit,fl_lossy,h_9000,w_1200,f_auto,q_1/14194393/403491_197820.jpeg',
    metadata: { iso: '1600', aperture: 'f/2.0', shutter: '1/500', date: '2019年' }
  },
  {
    id: '6',
    title: '牡丹亭｜拾翠坊崑劇團',
    category: 'Kunqu Opera',
    imageUrl: 'https://custom-images.strikinglycdn.com/res/hrscywv4p/image/upload/c_limit,fl_lossy,h_9000,w_1200,f_auto,q_1/14194393/218457_608677.jpeg',
    metadata: { iso: '3200', aperture: 'f/2.8', shutter: '1/320', date: '2023年' }
  },
  {
    id: '7',
    title: '孤獨國｜紅樓詩社',
    category: 'Dance/Theater',
    imageUrl: 'https://custom-images.strikinglycdn.com/res/hrscywv4p/image/upload/c_limit,fl_lossy,h_9000,w_1200,f_auto,q_1/14194393/293362_692595.jpeg',
    metadata: { iso: '1250', aperture: 'f/2.0', shutter: '1/400', date: '2019年' }
  },
  {
    id: '8',
    title: '斷代｜公視文學劇場',
    category: 'Dance/Theater',
    imageUrl: 'https://custom-images.strikinglycdn.com/res/hrscywv4p/image/upload/c_limit,fl_lossy,h_9000,w_1200,f_auto,q_1/14194393/196455_796761.jpeg',
    metadata: { iso: '1000', aperture: 'f/2.8', shutter: '1/200', date: '2017年' }
  },
  {
    id: '9',
    title: '第25小時｜臺北藝穗節',
    category: 'Dance/Theater',
    imageUrl: 'https://custom-images.strikinglycdn.com/res/hrscywv4p/image/upload/c_limit,fl_lossy,h_9000,w_1200,f_auto,q_1/14194393/340432_752026.png',
    metadata: { iso: '2000', aperture: 'f/2.0', shutter: '1/250', date: '2018年' }
  },
  {
    id: '10',
    title: '歡迎光臨自助吧',
    category: 'Dance/Theater',
    imageUrl: 'https://custom-images.strikinglycdn.com/res/hrscywv4p/image/upload/c_limit,fl_lossy,h_9000,w_1200,f_auto,q_1/14194393/753328_322375.jpeg',
    metadata: { iso: '1600', aperture: 'f/2.8', shutter: '1/320', date: '2020年' }
  }
];

export const STYLING_PROJECTS: StylingProject[] = [
  {
    id: 's1',
    title: '時尚人像',
    beforeImg: 'https://custom-images.strikinglycdn.com/res/hrscywv4p/image/upload/c_limit,fl_lossy,h_9000,w_1920,f_auto,q_auto/14194393/523347_526287.jpeg',
    afterImg: 'https://custom-images.strikinglycdn.com/res/hrscywv4p/image/upload/c_limit,fl_lossy,h_9000,w_1920,f_auto,q_auto/14194393/446346_443202.png',
    description: '在光與空氣的縫隙間，留下屬於你的故事。'
  },
  {
    id: 's2',
    title: '形象寫真',
    beforeImg: 'https://custom-images.strikinglycdn.com/res/hrscywv4p/image/upload/c_limit,fl_lossy,h_9000,w_1920,f_auto,q_auto/14194393/117722_665359.jpeg',
    afterImg: 'https://custom-images.strikinglycdn.com/res/hrscywv4p/image/upload/c_limit,fl_lossy,h_9000,w_1920,f_auto,q_auto/14194393/75460_512901.jpeg',
    description: '讓你的風格成為一種宣言，定格在光影之間。'
  }
];
