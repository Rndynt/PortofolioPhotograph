import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Grid3x3, LayoutGrid, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Project, Category } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PortfolioGalleryProps {
  selectedCategory?: string;
  onProjectClick?: (projectId: string, startIndex: number) => void;
}

export default function PortfolioGallery({ selectedCategory = 'all', onProjectClick }: PortfolioGalleryProps) {
  const [isMobileGrid, setIsMobileGrid] = useState(false);
  
  const { data: projects, isLoading, error } = useQuery<Project[]>({
    queryKey: ['/api/projects', { published: true }],
    queryFn: async () => {
      const response = await fetch('/api/projects?published=true');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    }
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const getCategorySlug = (categoryId: string | null) => {
    if (!categoryId || !categories) return null;
    const category = categories.find(cat => cat.id === categoryId);
    return category?.slug || null;
  };

  const filteredProjects = selectedCategory === 'all' 
    ? projects || []
    : (projects || []).filter(project => {
        const slug = getCategorySlug(project.categoryId);
        return slug === selectedCategory;
      });

  const handleProjectClick = (projectSlug: string) => {
    if (onProjectClick) {
      onProjectClick(projectSlug, 0);
    }
  };

  if (error) {
    return (
      <section id="portfolio" className="py-20 bg-white">
        <div className="px-8 md:px-12">
          <Alert variant="destructive" data-testid="error-loading-projects">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load projects. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section id="portfolio" className="py-20 bg-white">
        <div className="px-8 md:px-12">
          <div className={`grid gap-1 grid-cols-2 md:grid-cols-2 lg:grid-cols-3`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square" data-testid={`skeleton-project-${i}`} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="portfolio" className="py-20 bg-white">
      <div className="px-8 md:px-12">
        {/* Mobile Grid Toggle Button */}
        <div className="flex justify-end mb-4 md:hidden">
          <button
            onClick={() => setIsMobileGrid(!isMobileGrid)}
            className="p-2 text-black hover:bg-gray-100 rounded-lg transition-colors"
            data-testid="toggle-grid-view"
            aria-label={isMobileGrid ? "Switch to single column" : "Switch to grid view"}
          >
            {isMobileGrid ? <LayoutGrid className="h-5 w-5" /> : <Grid3x3 className="h-5 w-5" />}
          </button>
        </div>
        
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12" data-testid="no-projects-message">
            <p className="text-gray-500">No projects found in this category.</p>
          </div>
        ) : (
          <motion.div 
            className={`grid gap-1 ${isMobileGrid ? 'grid-cols-3' : 'grid-cols-2'} md:grid-cols-2 lg:grid-cols-3`}
            layout
          >
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, index) => {
                return (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: index * 0.03,
                      ease: "easeOut" 
                    }}
                    className="aspect-square overflow-hidden cursor-pointer group relative"
                    onClick={() => handleProjectClick(project.slug)}
                    data-testid={`project-${project.slug}`}
                  >
                    <img
                      src={project.mainImageUrl}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-end p-4">
                      <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <h3 className="font-semibold text-sm sm:text-lg">{project.title}</h3>
                        {project.clientName && (
                          <p className="text-xs sm:text-sm">{project.clientName}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
}
