import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import FeaturedWork from "@/components/featured-work";
import PortfolioGallery from "@/components/portfolio-gallery";
import AboutSection from "@/components/about-section";
import ContactSection from "@/components/contact-section";
import Footer from "@/components/footer";
import Lightbox from "@/components/lightbox";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <HeroSection />
      <FeaturedWork />
      <PortfolioGallery />
      <AboutSection />
      <ContactSection />
      <Footer />
      <Lightbox />
    </div>
  );
}
