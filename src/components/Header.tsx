import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [currentPath, setCurrentPath] = useState("");

  useEffect(() => {
    // Check auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    // Track current path for active state
    setCurrentPath(window.location.pathname);

    return () => subscription.unsubscribe();
  }, []);

  const isActive = (path: string) => currentPath === path;

  return (
    <header className="border-b border-border/30 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-6 lg:px-12 py-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center cursor-pointer"
          >
            <h1 className="text-2xl font-playfair italic font-medium text-foreground tracking-wide">
              card & carry.
            </h1>
          </button>
          <nav className="hidden md:flex items-center gap-8">
            {user ? (
              <>
                <button
                  onClick={() => navigate("/dashboard")}
                  className={`text-sm font-sans transition-colors duration-300 ${
                    isActive("/dashboard") 
                      ? "text-foreground font-medium" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  dashboard
                </button>
                <button
                  onClick={() => navigate("/recs")}
                  className={`text-sm font-sans transition-colors duration-300 ${
                    isActive("/recs") 
                      ? "text-foreground font-medium" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  recommendations
                </button>
                <button
                  onClick={() => navigate("/cards")}
                  className={`text-sm font-sans transition-colors duration-300 ${
                    isActive("/cards") 
                      ? "text-foreground font-medium" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  explore cards
                </button>
                <button
                  onClick={() => navigate("/profile")}
                  className={`text-sm font-sans transition-colors duration-300 ${
                    isActive("/profile") 
                      ? "text-foreground font-medium" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  profile
                </button>
              </>
            ) : (
              <>
                <a 
                  href="/#how-it-works" 
                  className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors duration-300"
                >
                  how it works
                </a>
                <button
                  onClick={() => navigate("/cards")}
                  className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors duration-300"
                >
                  explore cards
                </button>
                <a 
                  href="/#faqs" 
                  className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors duration-300"
                >
                  faqs
                </a>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate("/auth")}
                  className="border-foreground/20 hover:bg-foreground/5 transition-all duration-300"
                >
                  get started
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
