import { useState } from "react";
import { motion } from "framer-motion";
import { portfolioImages } from "@/lib/portfolio-data";

interface PortfolioGalleryProps {
  onImageClick?: (imageUrl: string, altText: string, imageIndex: number) => void;
}

export default function PortfolioGallery({ onImageClick }: PortfolioGalleryProps) {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  
  const categories = ["all", "portrait", "landscape", "urban", "wedding"];
  
  const filteredImages = activeFilter === "all" 
    ? portfolioImages 
    : portfolioImages.filter(img => img.category === activeFilter);

  const handleImageClick = (imageUrl: string, altText: string) => {
    if (onImageClick) {
      const visibleImages = filteredImages.map(img => ({ url: img.imageUrl, alt: img.altText }));
      const imageIndex = portfolioImages.findIndex(img => img.imageUrl === imageUrl);
      onImageClick(imageUrl, altText, imageIndex);
    }
  };

  return (
    <section id="portfolio" className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-light mb-4"
            data-testid="portfolio-title"
          >
            Portfolio
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
            data-testid="portfolio-subtitle"
          >
            Explore my complete collection of photography work
          </motion.p>
          
          {/* Category Filter */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4 mb-12"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveFilter(category)}
                className={`px-6 py-2 rounded-full transition-colors ${
                  activeFilter === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                }`}
                data-testid={`filter-${category}`}
              >
                {category === "all" ? "All" : category.charAt(0).toUpperCase() + category.slice(1)}s
              </button>
            ))}
          </motion.div>
        </div>
        
        <div className="masonry-grid">
          {filteredImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="masonry-item gallery-item cursor-pointer"
              onClick={() => handleImageClick(image.imageUrl, image.altText)}
              data-testid={`portfolio-image-${image.id}`}
            >
              <img
                src={image.imageUrl}
                alt={image.altText}
                className="w-full rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
