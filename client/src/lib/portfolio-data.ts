import wedding1 from '@assets/stock_images/wedding_ceremony_bri_0e5b3642.jpg';
import wedding2 from '@assets/stock_images/wedding_ceremony_bri_2c5b531a.jpg';
import wedding3 from '@assets/stock_images/wedding_ceremony_bri_35b64858.jpg';
import wedding4 from '@assets/stock_images/wedding_ceremony_bri_41ca4d67.jpg';
import wedding5 from '@assets/stock_images/wedding_ceremony_bri_ad01dd1d.jpg';
import wedding6 from '@assets/stock_images/wedding_ceremony_bri_aff38db9.jpg';
import wedding7 from '@assets/stock_images/wedding_ceremony_bri_be334cba.jpg';
import wedding8 from '@assets/stock_images/wedding_ceremony_bri_d064ddef.jpg';
import wedding9 from '@assets/stock_images/wedding_ceremony_bri_efdb88c7.jpg';
import wedding10 from '@assets/stock_images/wedding_ceremony_bri_ffa8468a.jpg';

import graduation1 from '@assets/stock_images/graduation_ceremony__00bb3d97.jpg';
import graduation2 from '@assets/stock_images/graduation_ceremony__2a6f8a1b.jpg';
import graduation3 from '@assets/stock_images/graduation_ceremony__48d4c359.jpg';
import graduation4 from '@assets/stock_images/graduation_ceremony__6d4d2161.jpg';
import graduation5 from '@assets/stock_images/graduation_ceremony__71a0a0f5.jpg';
import graduation6 from '@assets/stock_images/graduation_ceremony__7851d433.jpg';
import graduation7 from '@assets/stock_images/graduation_ceremony__bcb38c5d.jpg';
import graduation8 from '@assets/stock_images/graduation_ceremony__dea58b62.jpg';
import graduation9 from '@assets/stock_images/graduation_ceremony__eb23f4c9.jpg';
import graduation10 from '@assets/stock_images/graduation_ceremony__ee5431ef.jpg';

import event1 from '@assets/stock_images/corporate_event_busi_0db875ef.jpg';
import event2 from '@assets/stock_images/corporate_event_busi_2a28aa39.jpg';
import event3 from '@assets/stock_images/corporate_event_busi_2d1cbadc.jpg';
import event4 from '@assets/stock_images/corporate_event_busi_3fc81dfc.jpg';
import event5 from '@assets/stock_images/corporate_event_busi_605b8afb.jpg';
import event6 from '@assets/stock_images/corporate_event_busi_627caaf0.jpg';
import event7 from '@assets/stock_images/corporate_event_busi_6da841c6.jpg';
import event8 from '@assets/stock_images/corporate_event_busi_78a44101.jpg';
import event9 from '@assets/stock_images/corporate_event_busi_86d50f4e.jpg';
import event10 from '@assets/stock_images/corporate_event_busi_9c41b0e8.jpg';

import portrait1 from '@assets/stock_images/professional_busines_0079e7f3.jpg';
import portrait2 from '@assets/stock_images/professional_busines_0f66a8c5.jpg';
import portrait3 from '@assets/stock_images/professional_busines_10afe1de.jpg';
import portrait4 from '@assets/stock_images/professional_busines_16bad572.jpg';
import portrait5 from '@assets/stock_images/professional_busines_4bcc34fe.jpg';
import portrait6 from '@assets/stock_images/professional_busines_b4a44c9b.jpg';
import portrait7 from '@assets/stock_images/professional_busines_d0443287.jpg';
import portrait8 from '@assets/stock_images/professional_busines_d46384a3.jpg';

import professionalPortrait1 from '@assets/stock_images/professional_portrai_03ca58cd.jpg';
import professionalPortrait2 from '@assets/stock_images/professional_portrai_2cee816f.jpg';
import professionalPortrait3 from '@assets/stock_images/professional_portrai_428c14cd.jpg';
import professionalPortrait4 from '@assets/stock_images/professional_portrai_4a5b38db.jpg';
import professionalPortrait5 from '@assets/stock_images/professional_portrai_83a4099f.jpg';
import professionalPortrait6 from '@assets/stock_images/professional_portrai_e2fa21d0.jpg';
import professionalPortrait7 from '@assets/stock_images/professional_portrai_e32a0d08.jpg';
import professionalPortrait8 from '@assets/stock_images/professional_portrai_e583df9a.jpg';

import commercial1 from '@assets/stock_images/commercial_product_p_202da34e.jpg';
import commercial2 from '@assets/stock_images/commercial_product_p_20b226a5.jpg';
import commercial3 from '@assets/stock_images/commercial_product_p_21134919.jpg';
import commercial4 from '@assets/stock_images/commercial_product_p_5ad300f1.jpg';
import commercial5 from '@assets/stock_images/commercial_product_p_66e97c3c.jpg';
import commercial6 from '@assets/stock_images/commercial_product_p_cd54256f.jpg';
import commercial7 from '@assets/stock_images/commercial_product_p_da3b125a.jpg';
import commercial8 from '@assets/stock_images/commercial_product_p_e04a339a.jpg';

export interface ProjectPhoto {
  id: string;
  url: string;
  alt: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  category: 'wedding' | 'graduation' | 'event' | 'portrait' | 'commercial';
  description?: string;
  photos: ProjectPhoto[];
  coverIndex: number;
}

export const portfolioProjects: PortfolioProject[] = [
  {
    id: 'wedding-elegant-ceremony',
    title: 'Elegant Wedding Ceremony',
    category: 'wedding',
    description: 'A beautiful outdoor wedding ceremony captured in golden hour lighting',
    coverIndex: 0,
    photos: [
      { id: 'w1-1', url: wedding1, alt: 'Bride and groom exchanging vows during outdoor ceremony' },
      { id: 'w1-2', url: wedding2, alt: 'Bride walking down the aisle with bouquet' },
      { id: 'w1-3', url: wedding3, alt: 'Wedding ceremony setup with floral decorations' },
      { id: 'w1-4', url: wedding4, alt: 'Couple sharing first kiss as newlyweds' },
      { id: 'w1-5', url: wedding5, alt: 'Wedding party group photo' },
      { id: 'w1-6', url: wedding6, alt: 'Bride and groom portrait during golden hour' },
      { id: 'w1-7', url: wedding7, alt: 'Wedding reception venue setup' },
      { id: 'w1-8', url: wedding8, alt: 'Romantic couple portrait at sunset' },
    ],
  },
  {
    id: 'graduation-class-2024',
    title: 'Class of 2024 Graduation',
    category: 'graduation',
    description: 'Celebrating academic achievements and new beginnings',
    coverIndex: 2,
    photos: [
      { id: 'g1-1', url: graduation1, alt: 'Graduate tossing cap in celebration' },
      { id: 'g1-2', url: graduation2, alt: 'Proud graduate holding diploma' },
      { id: 'g1-3', url: graduation3, alt: 'Graduation ceremony processional' },
      { id: 'g1-4', url: graduation4, alt: 'Graduate with family after ceremony' },
      { id: 'g1-5', url: graduation5, alt: 'Group of graduates celebrating together' },
      { id: 'g1-6', url: graduation6, alt: 'Graduate portrait with academic regalia' },
      { id: 'g1-7', url: graduation7, alt: 'Graduates walking across stage' },
      { id: 'g1-8', url: graduation8, alt: 'Candid graduation celebration moment' },
    ],
  },
  {
    id: 'corporate-annual-conference',
    title: 'Annual Corporate Conference',
    category: 'event',
    description: 'Professional event photography capturing keynote speakers and networking',
    coverIndex: 1,
    photos: [
      { id: 'e1-1', url: event1, alt: 'Keynote speaker presenting to large audience' },
      { id: 'e1-2', url: event2, alt: 'Conference attendees networking during break' },
      { id: 'e1-3', url: event3, alt: 'Panel discussion with industry experts' },
      { id: 'e1-4', url: event4, alt: 'Corporate event venue overview' },
      { id: 'e1-5', url: event5, alt: 'Attendees engaged in workshop session' },
      { id: 'e1-6', url: event6, alt: 'Evening reception with cocktails' },
      { id: 'e1-7', url: event7, alt: 'Award ceremony moment' },
      { id: 'e1-8', url: event8, alt: 'Team collaboration during breakout session' },
    ],
  },
  {
    id: 'business-portraits-suite',
    title: 'Professional Business Portraits',
    category: 'portrait',
    description: 'Executive headshots and professional portraits for corporate clients',
    coverIndex: 3,
    photos: [
      { id: 'p1-1', url: portrait1, alt: 'Professional business headshot with natural lighting' },
      { id: 'p1-2', url: portrait2, alt: 'Executive portrait in office setting' },
      { id: 'p1-3', url: portrait3, alt: 'Confident professional business portrait' },
      { id: 'p1-4', url: portrait4, alt: 'Corporate headshot with clean background' },
      { id: 'p1-5', url: portrait5, alt: 'Business professional outdoor portrait' },
      { id: 'p1-6', url: portrait6, alt: 'Team member headshot for website' },
      { id: 'p1-7', url: portrait7, alt: 'Creative professional portrait' },
      { id: 'p1-8', url: portrait8, alt: 'Senior executive portrait' },
    ],
  },
  {
    id: 'commercial-product-photography',
    title: 'Commercial Product Photography',
    category: 'commercial',
    description: 'High-quality product photography for e-commerce and marketing',
    coverIndex: 0,
    photos: [
      { id: 'c1-1', url: commercial1, alt: 'Product photography with dramatic lighting' },
      { id: 'c1-2', url: commercial2, alt: 'Clean product shot on white background' },
      { id: 'c1-3', url: commercial3, alt: 'Lifestyle product photography' },
      { id: 'c1-4', url: commercial4, alt: 'Commercial product detail shot' },
      { id: 'c1-5', url: commercial5, alt: 'Creative product composition' },
      { id: 'c1-6', url: commercial6, alt: 'Product packaging photography' },
      { id: 'c1-7', url: commercial7, alt: 'E-commerce product image' },
      { id: 'c1-8', url: commercial8, alt: 'Marketing campaign product shot' },
    ],
  },
  {
    id: 'romantic-wedding-celebration',
    title: 'Romantic Wedding Celebration',
    category: 'wedding',
    description: 'Intimate wedding celebration with family and friends',
    coverIndex: 1,
    photos: [
      { id: 'w2-1', url: wedding9, alt: 'Intimate wedding ceremony moment' },
      { id: 'w2-2', url: wedding10, alt: 'Wedding couple romantic portrait' },
      { id: 'w2-3', url: wedding1, alt: 'Outdoor wedding venue setup' },
      { id: 'w2-4', url: wedding2, alt: 'Bridal party candid moments' },
      { id: 'w2-5', url: wedding3, alt: 'Wedding reception celebration' },
      { id: 'w2-6', url: wedding4, alt: 'Couple first dance' },
      { id: 'w2-7', url: wedding5, alt: 'Wedding detail shots' },
      { id: 'w2-8', url: wedding6, alt: 'Evening wedding celebration' },
    ],
  },
  {
    id: 'creative-portrait-sessions',
    title: 'Creative Portrait Sessions',
    category: 'portrait',
    description: 'Artistic portraits with creative lighting and composition',
    coverIndex: 0,
    photos: [
      { id: 'p2-1', url: professionalPortrait1, alt: 'Creative portrait with artistic lighting' },
      { id: 'p2-2', url: professionalPortrait2, alt: 'Professional portrait session' },
      { id: 'p2-3', url: professionalPortrait3, alt: 'Natural light portrait photography' },
      { id: 'p2-4', url: professionalPortrait4, alt: 'Studio portrait with dramatic lighting' },
      { id: 'p2-5', url: professionalPortrait5, alt: 'Environmental portrait session' },
      { id: 'p2-6', url: professionalPortrait6, alt: 'Contemporary portrait photography' },
      { id: 'p2-7', url: professionalPortrait7, alt: 'Artistic headshot portrait' },
      { id: 'p2-8', url: professionalPortrait8, alt: 'Professional creative portrait' },
    ],
  },
  {
    id: 'tech-industry-event',
    title: 'Tech Industry Summit',
    category: 'event',
    description: 'Technology conference with keynotes and product launches',
    coverIndex: 0,
    photos: [
      { id: 'e2-1', url: event9, alt: 'Tech conference keynote presentation' },
      { id: 'e2-2', url: event10, alt: 'Product launch event' },
      { id: 'e2-3', url: event1, alt: 'Industry networking session' },
      { id: 'e2-4', url: event2, alt: 'Tech expo booth photography' },
      { id: 'e2-5', url: event3, alt: 'Innovation showcase event' },
      { id: 'e2-6', url: event4, alt: 'Conference attendee engagement' },
      { id: 'e2-7', url: event5, alt: 'Tech summit panel discussion' },
      { id: 'e2-8', url: event6, alt: 'Evening networking reception' },
    ],
  },
];

export interface PortfolioImageData {
  id: string;
  title: string;
  category: 'wedding' | 'graduation' | 'event' | 'portrait' | 'commercial';
  imageUrl: string;
  altText: string;
  description?: string;
  featured: boolean;
}

export const portfolioImages: PortfolioImageData[] = portfolioProjects.flatMap((project, projectIndex) =>
  project.photos.map((photo, photoIndex) => ({
    id: photo.id,
    title: `${project.title} - Photo ${photoIndex + 1}`,
    category: project.category,
    imageUrl: photo.url,
    altText: photo.alt,
    description: project.description,
    featured: projectIndex < 3 && photoIndex === project.coverIndex,
  }))
);
