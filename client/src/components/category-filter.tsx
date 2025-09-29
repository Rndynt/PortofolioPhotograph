interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = ['All', 'Wedding', 'Graduation', 'Event', 'Portrait', 'Commercial'];

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="w-full px-8 md:px-12 mb-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              data-testid={`filter-chip-${category.toLowerCase()}`}
              className={`
                px-6 py-2 rounded-full text-sm tracking-wide whitespace-nowrap
                transition-all duration-300
                ${selectedCategory === category
                  ? 'bg-black text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-black'
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
