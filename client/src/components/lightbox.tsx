import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { portfolioProjects } from "@/lib/portfolio-data";

interface LightboxImage {
  url: string;
  alt: string;
}

interface LightboxProps {
  isOpen: boolean;
  projectId: string | null;
  startIndex?: number;
  onClose: () => void;
  images?: LightboxImage[];
}

export default function Lightbox({ isOpen, projectId, startIndex = 0, onClose, images }: LightboxProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(startIndex);

  const project = projectId ? portfolioProjects.find(p => p.id === projectId) : null;
  const projectPhotos = images || project?.photos || [];

  useEffect(() => {
    if (isOpen && projectId) {
      setCurrentPhotoIndex(startIndex);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, projectId, startIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
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
  }, [isOpen, currentPhotoIndex, projectPhotos.length]);

  const handleClose = () => {
    onClose();
  };

  const handlePrevious = () => {
    if (projectPhotos.length === 0) return;
    setCurrentPhotoIndex((prev) => (prev - 1 + projectPhotos.length) % projectPhotos.length);
  };

  const handleNext = () => {
    if (projectPhotos.length === 0) return;
    setCurrentPhotoIndex((prev) => (prev + 1) % projectPhotos.length);
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentPhotoIndex(index);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen || (projectPhotos.length === 0)) return null;

  const currentPhoto = projectPhotos[currentPhotoIndex];
  const displayTitle = project?.title || "Photo Gallery";

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-[1000] flex flex-col justify-center items-center p-4"
      onClick={handleBackgroundClick}
      data-testid="lightbox"
    >
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 text-white text-2xl z-20 bg-black/50 w-10 h-10 rounded-full hover:bg-black/70 flex items-center justify-center transition-colors"
        data-testid="button-close-lightbox"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="flex-1 flex items-center justify-center w-full max-w-6xl mb-4">
        <button
          onClick={handlePrevious}
          className="text-white bg-black/50 p-3 rounded-full hover:bg-black/70 flex items-center justify-center transition-all mr-4"
          data-testid="button-previous-image"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex-1 flex items-center justify-center">
          <img
            src={currentPhoto.url}
            alt={currentPhoto.alt}
            className="max-w-full max-h-[70vh] object-contain transition-opacity duration-300"
            data-testid="lightbox-image"
          />
        </div>

        <button
          onClick={handleNext}
          className="text-white bg-black/50 p-3 rounded-full hover:bg-black/70 flex items-center justify-center transition-all ml-4"
          data-testid="button-next-image"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="w-full max-w-6xl bg-black/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-lg">{displayTitle}</h3>
          <span className="text-white/70 text-sm">
            {currentPhotoIndex + 1} / {projectPhotos.length}
          </span>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2" data-testid="thumbnail-strip">
          {projectPhotos.map((photo, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded cursor-pointer transition-all ${
                index === currentPhotoIndex
                  ? 'ring-2 ring-white opacity-100 scale-105'
                  : 'opacity-60 hover:opacity-100'
              }`}
              data-testid={`thumbnail-${index}`}
            >
              <img
                src={photo.url}
                alt={photo.alt}
                className="w-full h-full object-cover rounded"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
