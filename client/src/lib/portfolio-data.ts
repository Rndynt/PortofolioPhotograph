import img8023 from '@assets/IMG_8023_1759174260301.jpeg';
import img8024 from '@assets/IMG_8024_1759174260300.jpeg';

export interface PortfolioImageData {
  id: string;
  title: string;
  category: 'portrait' | 'landscape' | 'urban' | 'wedding';
  imageUrl: string;
  altText: string;
  description?: string;
  featured: boolean;
}

export const portfolioImages: PortfolioImageData[] = [
  {
    id: '1',
    title: 'Professional Portrait',
    category: 'portrait',
    imageUrl: img8024,
    altText: 'Professional portrait photograph showcasing natural lighting and composition',
    featured: true
  },
  {
    id: '2',
    title: 'Artistic Composition',
    category: 'portrait',
    imageUrl: img8023,
    altText: 'Creative portrait photography with artistic lighting and mood',
    featured: true
  },
  {
    id: '3',
    title: 'City Lines',
    category: 'urban',
    imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    altText: 'Urban architectural details and city life',
    featured: true
  },
  {
    id: '4',
    title: 'Bridal Portrait',
    category: 'portrait',
    imageUrl: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    altText: 'Beautiful bridal portrait with soft natural lighting',
    featured: false
  },
  {
    id: '5',
    title: 'Lake Reflection',
    category: 'landscape',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    altText: 'Serene lake reflection with mountain backdrop',
    featured: false
  },
  {
    id: '6',
    title: 'Street Photography',
    category: 'urban',
    imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    altText: 'Dynamic street scene with motion blur',
    featured: false
  },
  {
    id: '7',
    title: 'Professional Portrait',
    category: 'portrait',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    altText: 'Professional headshot with clean background',
    featured: false
  },
  {
    id: '8',
    title: 'Wedding Ceremony',
    category: 'wedding',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    altText: 'Romantic wedding ceremony moment',
    featured: false
  },
  {
    id: '9',
    title: 'Coastal Landscape',
    category: 'landscape',
    imageUrl: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    altText: 'Dramatic coastal scene with crashing waves',
    featured: false
  },
  {
    id: '10',
    title: 'Modern Architecture',
    category: 'urban',
    imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    altText: 'Modern architectural detail with geometric patterns',
    featured: false
  },
  {
    id: '11',
    title: 'Artistic Portrait',
    category: 'portrait',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    altText: 'Artistic portrait with creative lighting',
    featured: false
  },
  {
    id: '12',
    title: 'Wedding Dance',
    category: 'wedding',
    imageUrl: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    altText: 'Happy couple\'s first dance at wedding reception',
    featured: false
  }
];
