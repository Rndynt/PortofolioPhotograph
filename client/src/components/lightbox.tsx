import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { portfolioImages } from "@/lib/portfolio-data";

interface LightboxProps {
  isOpen?: boolean;
  imageUrl?: string;
  altText?: string;
  imageIndex?: number;
  onClose?: () => void;
}

export default function Lightbox({ isOpen, imageUrl, altText, imageIndex = 0, onClose }: LightboxProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(imageIndex);
  const [currentImage, setCurrentImage] = useState({ url: imageUrl || "", alt: altText || "" });

  const allImages = portfolioImages.map(img => ({ url: img.imageUrl, alt: img.altText }));

  useEffect(() => {
    if (isOpen && imageUrl) {
      setIsVisible(true);
      setCurrentImageIndex(imageIndex);
      setCurrentImage({ url: imageUrl, alt: altText || "" });
      document.body.style.overflow = "hidden";
    } else {
      setIsVisible(false);
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, imageUrl, altText, imageIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;
      
      switch (e.key) {
        case "Escape":
          handleClose();
          break;
        case "ArrowLeft":
          handlePrevious();
          break;
        case "ArrowRight":
          handleNext();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, currentImageIndex]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const handlePrevious = () => {
    const newIndex = (currentImageIndex - 1 + allImages.length) % allImages.length;
    setCurrentImageIndex(newIndex);
    setCurrentImage(allImages[newIndex]);
  };

  const handleNext = () => {
    const newIndex = (currentImageIndex + 1) % allImages.length;
    setCurrentImageIndex(newIndex);
    setCurrentImage(allImages[newIndex]);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-[1000] flex justify-center items-center"
      onClick={handleBackgroundClick}
      data-testid="lightbox"
    >
      <div className="relative max-w-4xl max-h-full">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white text-2xl z-10 bg-black/50 w-10 h-10 rounded-full hover:bg-black/70 flex items-center justify-center"
          data-testid="button-close-lightbox"
        >
          <X className="w-6 h-6" />
        </button>
        
        <img
          src={currentImage.url}
          alt={currentImage.alt}
          className="max-w-full max-h-full object-contain"
          data-testid="lightbox-image"
        />
        
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
          <button
            onClick={handlePrevious}
            className="text-white bg-black/50 px-4 py-2 rounded hover:bg-black/70 flex items-center space-x-2"
            data-testid="button-previous-image"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          <button
            onClick={handleNext}
            className="text-white bg-black/50 px-4 py-2 rounded hover:bg-black/70 flex items-center space-x-2"
            data-testid="button-next-image"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
