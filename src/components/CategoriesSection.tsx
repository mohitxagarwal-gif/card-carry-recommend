import categoryIcons from "@/assets/category-icons.png";
import { useCategories } from "@/hooks/useCategories";
import { useSiteContent } from "@/hooks/useSiteContent";

interface SiteContent {
  content: any;
}

const CategoriesSection = () => {
  const { categories = [] } = useCategories();
  const { siteContent } = useSiteContent("categories");

  const content = (siteContent as SiteContent | null)?.content || {
    title: "analyzed by category",
    description: "we understand your spending across twelve distinct lifestyle categories"
  };

  return (
    <section id="categories" className="container mx-auto px-6 lg:px-12 py-24 md:py-32 bg-card/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-6">
            {content.title}
          </h2>
          <p className="text-lg font-sans text-muted-foreground max-w-2xl mx-auto">
            {content.description}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12">
          {categories.map((category, index) => (
            <div 
              key={category.id}
              className="group flex flex-col items-center gap-4 p-6 rounded-2xl hover:bg-background/50 transition-all duration-500 cursor-pointer"
              style={{ 
                animation: 'scale-in 0.5s ease-out',
                animationDelay: `${index * 0.05}s`,
                animationFillMode: 'both'
              }}
            >
              <div className="relative w-24 h-24 overflow-hidden">
                <div 
                  className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                  style={{
                    backgroundImage: `url(${categoryIcons})`,
                    backgroundSize: '400% 300%',
                    backgroundPosition: category.icon_position || '0% 0%',
                    backgroundRepeat: 'no-repeat'
                  }}
                />
              </div>
              <span className="text-sm font-sans text-muted-foreground group-hover:text-foreground transition-colors duration-300 text-center">
                {category.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
