import { CreditCard } from "lucide-react";
import { Button } from "./ui/button";

const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">
              C&C
            </h1>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How it works
            </a>
            <Button size="sm">Get Started</Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
