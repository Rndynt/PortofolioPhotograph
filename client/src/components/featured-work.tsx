import { motion } from "framer-motion";
import { portfolioImages } from "@/lib/portfolio-data";

interface FeaturedWorkProps {
  onImageClick?: (imageUrl: string, altText: string, imageIndex: number) => void;
}

export default function FeaturedWork({ onImageClick }: FeaturedWorkProps) {
  const featuredImages = portfolioImages.filter(img => img.featured);

  const handleImageClick = (imageUrl: string, altText: string) => {
    if (onImageClick) {
      const allImages = portfolioImages.map(img => ({ url: img.imageUrl, alt: img.altText }));
      const imageIndex = allImages.findIndex(img => img.url === imageUrl);
      onImageClick(imageUrl, altText, imageIndex);
    }
  };

  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-light mb-4 text-card-foreground"
            data-testid="featured-work-title"
          >
            Featured Work
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            data-testid="featured-work-subtitle"
          >
            A curated selection of my best photography across different genres and styles
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="gallery-item group cursor-pointer"
              onClick={() => handleImageClick(image.imageUrl, image.altText)}
              data-testid={`featured-image-${image.id}`}
            >
              <img
                src={image.imageUrl}
                alt={image.altText}
                className="w-full h-80 object-cover rounded-lg shadow-lg group-hover:shadow-xl transition-shadow duration-300"
              />
              <div className="mt-4">
                <h3 className="text-xl font-medium text-card-foreground" data-testid={`featured-title-${image.id}`}>
                  {image.title}
                </h3>
                <p className="text-muted-foreground capitalize" data-testid={`featured-category-${image.id}`}>
                  {image.category}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
