import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="border-b border-border/30 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-6 lg:px-12 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-playfair italic font-medium text-foreground tracking-wide">
              card & carry.
            </h1>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a 
              href="#how-it-works" 
              className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              how it works
            </a>
            <a 
              href="#categories" 
              className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              categories
            </a>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/auth")}
              className="border-foreground/20 hover:bg-foreground/5 transition-all duration-300"
            >
              get started
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
