import { useState } from "react";
import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import CategoryFilter from "@/components/category-filter";
import PortfolioGallery from "@/components/portfolio-gallery";
import PricingSection from "@/components/pricing-section";
import AboutSection from "@/components/about-section";
import ContactSection from "@/components/contact-section";
import SocialMediaSection from "@/components/social-media-section";
import Lightbox from "@/components/lightbox";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxProject, setLightboxProject] = useState<{ projectId: string | null; startIndex: number }>({
    projectId: null,
    startIndex: 0
  });

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleProjectClick = (projectId: string, startIndex: number) => {
    setLightboxProject({ projectId, startIndex });
    setLightboxOpen(true);
  };

  const handleLightboxClose = () => {
    setLightboxOpen(false);
  };

  const categoryMapping: Record<string, string> = {
    'All': 'all',
    'Wedding': 'wedding',
    'Graduation': 'graduation',
    'Event': 'event',
    'Portrait': 'portrait',
    'Commercial': 'commercial'
  };

  const mappedCategory = categoryMapping[selectedCategory] || 'all';

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <HeroSection />
      <CategoryFilter 
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
      />
      <PortfolioGallery 
        selectedCategory={mappedCategory}
        onProjectClick={handleProjectClick} 
      />
      <PricingSection />
      <AboutSection />
      <ContactSection />
      <SocialMediaSection />
      <Lightbox 
        isOpen={lightboxOpen}
        projectId={lightboxProject.projectId}
        startIndex={lightboxProject.startIndex}
        onClose={handleLightboxClose}
      />
    </div>
  );
}
