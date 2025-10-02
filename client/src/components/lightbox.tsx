import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ProjectImage } from "@shared/schema";

interface LightboxImage {
  url: string;
  alt: string;
}

interface LightboxProps {
  isOpen: boolean;
  projectSlug: string | null;
  startIndex?: number;
  onClose: () => void;
  images?: LightboxImage[];
}

export default function Lightbox({ isOpen, projectSlug, startIndex = 0, onClose, images }: LightboxProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(startIndex);

  const { data: projectImages, isLoading, error } = useQuery<ProjectImage[]>({
    queryKey: ['/api/projects', projectSlug, 'images'],
    queryFn: async () => {
      if (!projectSlug) throw new Error('Project slug is required');
      const response = await fetch(`/api/projects/${projectSlug}/images`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Project not found');
        }
        throw new Error('Failed to fetch project images');
      }
      return response.json();
    },
    enabled: !!projectSlug && isOpen && !images,
  });

  const projectPhotos: LightboxImage[] = images || (projectImages?.map(img => ({
    url: img.url,
    alt: img.caption || 'Project image'
  })) || []);

  useEffect(() => {
    if (isOpen && projectSlug) {
      setCurrentPhotoIndex(startIndex);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, projectSlug, startIndex]);

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

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div 
        className="fixed inset-0 bg-black/90 z-[1000] flex items-center justify-center"
        data-testid="lightbox-loading"
      >
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="fixed inset-0 bg-black/90 z-[1000] flex items-center justify-center"
        onClick={handleBackgroundClick}
        data-testid="lightbox-error"
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white text-2xl z-20 bg-black/50 w-10 h-10 rounded-full hover:bg-black/70 flex items-center justify-center transition-colors"
          data-testid="button-close-lightbox"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="text-center text-white p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2">Error Loading Images</h3>
          <p className="text-white/70">{error.message}</p>
        </div>
      </div>
    );
  }

  if (projectPhotos.length === 0) {
    return (
      <div 
        className="fixed inset-0 bg-black/90 z-[1000] flex items-center justify-center"
        onClick={handleBackgroundClick}
        data-testid="lightbox-empty"
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white text-2xl z-20 bg-black/50 w-10 h-10 rounded-full hover:bg-black/70 flex items-center justify-center transition-colors"
          data-testid="button-close-lightbox"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="text-center text-white p-8">
          <div className="text-6xl mb-4">📷</div>
          <h3 className="text-xl font-semibold mb-2">No Images Available</h3>
          <p className="text-white/70">This project doesn't have any images yet.</p>
        </div>
      </div>
    );
  }

  const currentPhoto = projectPhotos[currentPhotoIndex];

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
          <h3 className="text-white font-semibold text-lg">Photo Gallery</h3>
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
