
export type Category = 'Fashion' | 'Wedding' | 'Kunqu Opera' | 'Dance/Theater' | 'Styling';

export interface Project {
  id: string;
  title: string;
  category: Category;
  imageUrl: string;
  metadata?: {
    iso: string;
    aperture: string;
    shutter: string;
    date: string;
  };
}

export interface StylingProject {
  id: string;
  title: string;
  beforeImg: string;
  afterImg: string;
  description: string;
}
