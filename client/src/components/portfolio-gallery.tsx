import { useState } from "react";
import { portfolioProjects } from "@/lib/portfolio-data";
import { motion, AnimatePresence } from "framer-motion";
import { Grid3x3, LayoutGrid } from "lucide-react";

interface PortfolioGalleryProps {
  selectedCategory?: string;
  onProjectClick?: (projectId: string, startIndex: number) => void;
}

export default function PortfolioGallery({ selectedCategory = 'all', onProjectClick }: PortfolioGalleryProps) {
  const [isMobileGrid, setIsMobileGrid] = useState(false);
  
  const filteredProjects = selectedCategory === 'all' 
    ? portfolioProjects 
    : portfolioProjects.filter(project => project.category === selectedCategory);

  const handleProjectClick = (projectId: string, coverIndex: number) => {
    if (onProjectClick) {
      onProjectClick(projectId, coverIndex);
    }
  };

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
        
        <motion.div 
          className={`grid gap-1 ${isMobileGrid ? 'grid-cols-3' : 'grid-cols-1'} md:grid-cols-2 lg:grid-cols-3`}
          layout
        >
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, index) => {
              const coverPhoto = project.photos[project.coverIndex];
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
                  onClick={() => handleProjectClick(project.id, project.coverIndex)}
                  data-testid={`project-${project.id}`}
                >
                  <img
                    src={coverPhoto.url}
                    alt={coverPhoto.alt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-end p-4">
                    <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <h3 className="font-semibold text-lg">{project.title}</h3>
                      <p className="text-sm">{project.photos.length} photos</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
