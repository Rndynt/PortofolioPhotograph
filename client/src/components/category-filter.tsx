interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = ['All', 'Wedding', 'Graduation', 'Event', 'Portrait', 'Commercial'];

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div id="portfolio" className="w-full px-6 sm:px-8 md:px-12 py-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              data-testid={`filter-chip-${category.toLowerCase()}`}
              className={`
                px-4 py-2 rounded-full text-xs font-medium tracking-wide whitespace-nowrap
                transition-all duration-300 ease-in-out
                ${selectedCategory === category
                  ? 'bg-black text-white shadow-lg scale-105'
                  : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:shadow-md'
                }
              `}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
