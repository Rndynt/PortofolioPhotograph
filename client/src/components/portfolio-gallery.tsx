import { portfolioProjects } from "@/lib/portfolio-data";

interface PortfolioGalleryProps {
  selectedCategory?: string;
  onProjectClick?: (projectId: string, startIndex: number) => void;
}

export default function PortfolioGallery({ selectedCategory = 'all', onProjectClick }: PortfolioGalleryProps) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
          {filteredProjects.map((project) => {
            const coverPhoto = project.photos[project.coverIndex];
            return (
              <div
                key={project.id}
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
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
