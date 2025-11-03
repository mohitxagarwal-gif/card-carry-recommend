import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [currentPath, setCurrentPath] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

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

    // Handle scroll for glass effect
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const isActive = (path: string) => currentPath === path;

  return (
    <header className={`border-b sticky top-0 z-50 transition-all duration-220 ${
      isScrolled 
        ? 'glass-surface glass-highlight border-white/12' 
        : 'bg-canvas/95 backdrop-blur-md border-hairline'
    }`}>
      <div className="container mx-auto px-6 lg:px-12 py-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center cursor-pointer focus-ring"
          >
            <h1 className="text-2xl font-heading font-bold text-ink tracking-tight">
              card & carry.
            </h1>
          </button>
          <nav className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <button
                  onClick={() => navigate("/dashboard")}
                  className={`px-4 py-2 rounded-pill text-sm font-body underline-from-center transition-all duration-140 focus-ring ${
                    isActive("/dashboard") 
                      ? "bg-primary-ghost text-primary font-semibold border border-primary" 
                      : "text-subtle hover:bg-muted hover:text-ink border border-transparent"
                  }`}
                >
                  dashboard
                </button>
                <button
                  onClick={() => navigate("/recs")}
                  className={`px-4 py-2 rounded-pill text-sm font-body underline-from-center transition-all duration-140 focus-ring ${
                    isActive("/recs") 
                      ? "bg-primary-ghost text-primary font-semibold border border-primary" 
                      : "text-subtle hover:bg-muted hover:text-ink border border-transparent"
                  }`}
                >
                  recommendations
                </button>
                <button
                  onClick={() => navigate("/cards")}
                  className={`px-4 py-2 rounded-pill text-sm font-body underline-from-center transition-all duration-140 focus-ring ${
                    isActive("/cards") 
                      ? "bg-primary-ghost text-primary font-semibold border border-primary" 
                      : "text-subtle hover:bg-muted hover:text-ink border border-transparent"
                  }`}
                >
                  explore cards
                </button>
                <button
                  onClick={() => navigate("/profile")}
                  className={`px-4 py-2 rounded-pill text-sm font-body underline-from-center transition-all duration-140 focus-ring ${
                    isActive("/profile") 
                      ? "bg-primary-ghost text-primary font-semibold border border-primary" 
                      : "text-subtle hover:bg-muted hover:text-ink border border-transparent"
                  }`}
                >
                  profile
                </button>
              </>
            ) : (
              <>
                <a 
                  href="/#how-it-works" 
                  className="px-4 py-2 rounded-pill text-sm font-body underline-from-center text-subtle hover:bg-muted hover:text-ink transition-all duration-140 border border-transparent focus-ring"
                >
                  how it works
                </a>
                <button
                  onClick={() => navigate("/cards")}
                  className="px-4 py-2 rounded-pill text-sm font-body underline-from-center text-subtle hover:bg-muted hover:text-ink transition-all duration-140 border border-transparent focus-ring"
                >
                  explore cards
                </button>
                <button
                  onClick={() => navigate("/about")}
                  className={`px-4 py-2 rounded-pill text-sm font-body underline-from-center transition-all duration-140 border border-transparent focus-ring ${
                    isActive("/about") ? "text-ink font-semibold" : "text-subtle hover:bg-muted hover:text-ink"
                  }`}
                >
                  about us
                </button>
                <a 
                  href="/#faqs" 
                  className="px-4 py-2 rounded-pill text-sm font-body underline-from-center text-subtle hover:bg-muted hover:text-ink transition-all duration-140 border border-transparent focus-ring"
                >
                  faqs
                </a>
                <Button 
                  size="sm"
                  onClick={() => navigate("/auth")}
                  className="font-body gloss-band"
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
