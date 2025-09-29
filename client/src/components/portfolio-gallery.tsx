import { useState } from "react";
import { portfolioImages } from "@/lib/portfolio-data";

interface PortfolioGalleryProps {
  onImageClick?: (imageUrl: string, altText: string, imageIndex: number) => void;
}

export default function PortfolioGallery({ onImageClick }: PortfolioGalleryProps) {
  const handleImageClick = (imageUrl: string, altText: string) => {
    if (onImageClick) {
      const imageIndex = portfolioImages.findIndex(img => img.imageUrl === imageUrl);
      onImageClick(imageUrl, altText, imageIndex);
    }
  };

  return (
    <section id="portfolio" className="py-20 bg-white">
      <div className="px-8 md:px-12">
        {/* Simple grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
          {portfolioImages.slice(0, 12).map((image, index) => (
            <div
              key={image.id}
              className="aspect-square overflow-hidden cursor-pointer group"
              onClick={() => handleImageClick(image.imageUrl, image.altText)}
              data-testid={`portfolio-image-${image.id}`}
            >
              <img
                src={image.imageUrl}
                alt={image.altText}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
