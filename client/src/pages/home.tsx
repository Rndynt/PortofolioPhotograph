import { useState } from "react";
import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import PortfolioGallery from "@/components/portfolio-gallery";
import AboutSection from "@/components/about-section";
import ContactSection from "@/components/contact-section";
import Lightbox from "@/components/lightbox";

export default function Home() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string; index: number }>({
    url: "",
    alt: "",
    index: 0
  });

  const handleImageClick = (imageUrl: string, altText: string, imageIndex: number) => {
    setLightboxImage({ url: imageUrl, alt: altText, index: imageIndex });
    setLightboxOpen(true);
  };

  const handleLightboxClose = () => {
    setLightboxOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <HeroSection />
      <PortfolioGallery onImageClick={handleImageClick} />
      <AboutSection />
      <ContactSection />
      <Lightbox 
        isOpen={lightboxOpen}
        imageUrl={lightboxImage.url}
        altText={lightboxImage.alt}
        imageIndex={lightboxImage.index}
        onClose={handleLightboxClose}
      />
    </div>
  );
}
