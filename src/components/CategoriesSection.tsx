import categoryIcons from "@/assets/category-icons.png";

const categories = [
  { name: "tech & gadgets", position: "0% 0%" },
  { name: "banking", position: "33.33% 0%" },
  { name: "travel", position: "66.66% 0%" },
  { name: "dining", position: "100% 0%" },
  { name: "entertainment", position: "0% 33.33%" },
  { name: "photography", position: "33.33% 33.33%" },
  { name: "home & living", position: "66.66% 33.33%" },
  { name: "fitness", position: "100% 33.33%" },
  { name: "audio", position: "0% 66.66%" },
  { name: "food & grocery", position: "33.33% 66.66%" },
  { name: "electronics", position: "66.66% 66.66%" },
  { name: "fashion", position: "100% 66.66%" }
];

const CategoriesSection = () => {
  return (
    <section id="categories" className="container mx-auto px-6 lg:px-12 py-24 md:py-32 bg-card/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-playfair italic font-medium text-foreground mb-6">
            analyzed by category
          </h2>
          <p className="text-lg font-sans text-muted-foreground max-w-2xl mx-auto">
            we understand your spending across twelve distinct lifestyle categories
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12">
          {categories.map((category, index) => (
            <div 
              key={index}
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
                    backgroundPosition: category.position,
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
