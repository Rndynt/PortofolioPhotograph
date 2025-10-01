import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Project, ProjectImage, Category } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Calendar, User, FolderOpen } from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { useState } from "react";
import Lightbox from "@/components/lightbox";

export default function ProjectDetail() {
  const [, params] = useRoute("/project/:slug");
  const slug = params?.slug;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { data: project, isLoading: projectLoading, error: projectError } = useQuery<Project>({
    queryKey: ['/api/projects', slug],
    enabled: !!slug,
  });

  const { data: images, isLoading: imagesLoading } = useQuery<ProjectImage[]>({
    queryKey: ['/api/projects', project?.id, 'images'],
    enabled: !!project?.id,
  });

  const { data: category } = useQuery<Category>({
    queryKey: ['/api/categories', project?.categoryId],
    enabled: !!project?.categoryId,
  });

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (projectError) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <Alert variant="destructive" data-testid="error-loading-project">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load project. Please try again later.
            </AlertDescription>
          </Alert>
          <Link href="/">
            <a className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black mt-4" data-testid="link-back-home">
              <ArrowLeft className="h-4 w-4" />
              Back to Gallery
            </a>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <Skeleton className="h-8 w-48 mb-4" data-testid="skeleton-back-link" />
          <Skeleton className="h-12 w-96 mb-2" data-testid="skeleton-title" />
          <Skeleton className="h-6 w-64 mb-8" data-testid="skeleton-meta" />
          <Skeleton className="w-full h-96 mb-8" data-testid="skeleton-main-image" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square" data-testid={`skeleton-image-${i}`} />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <Alert data-testid="project-not-found">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Project not found.
            </AlertDescription>
          </Alert>
          <Link href="/">
            <a className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black mt-4" data-testid="link-back-home">
              <ArrowLeft className="h-4 w-4" />
              Back to Gallery
            </a>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const allImages = [
    { url: project.mainImageUrl, caption: project.title, sortOrder: 0 },
    ...(images || []).sort((a, b) => a.sortOrder - b.sortOrder)
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="container mx-auto px-4 py-20">
        <Link href="/">
          <a className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-8" data-testid="link-back-home">
            <ArrowLeft className="h-4 w-4" />
            Back to Gallery
          </a>
        </Link>

        <h1 className="text-4xl font-bold mb-4" data-testid="text-project-title">{project.title}</h1>
        
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-8">
          {category && (
            <div className="flex items-center gap-2" data-testid="text-category">
              <FolderOpen className="h-4 w-4" />
              <span>{category.name}</span>
            </div>
          )}
          {project.clientName && (
            <div className="flex items-center gap-2" data-testid="text-client">
              <User className="h-4 w-4" />
              <span>{project.clientName}</span>
            </div>
          )}
          {project.happenedAt && (
            <div className="flex items-center gap-2" data-testid="text-date">
              <Calendar className="h-4 w-4" />
              <span>{new Date(project.happenedAt).toLocaleDateString('id-ID', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          )}
        </div>

        <div className="mb-8">
          <div 
            className="w-full h-[500px] cursor-pointer group relative overflow-hidden rounded-lg"
            onClick={() => handleImageClick(0)}
            data-testid="image-main"
          >
            <img
              src={project.mainImageUrl}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
          </div>
        </div>

        {imagesLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square" data-testid={`skeleton-additional-${i}`} />
            ))}
          </div>
        ) : images && images.length > 0 ? (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Additional Photos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="aspect-square cursor-pointer group relative overflow-hidden rounded-lg"
                  onClick={() => handleImageClick(index + 1)}
                  data-testid={`image-additional-${index}`}
                >
                  <img
                    src={image.url}
                    alt={image.caption || `Photo ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <Lightbox
        isOpen={lightboxOpen}
        projectId={null}
        startIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        images={allImages.map(img => ({ 
          url: img.url, 
          alt: img.caption || project.title 
        }))}
      />

      <Footer />
    </div>
  );
}
