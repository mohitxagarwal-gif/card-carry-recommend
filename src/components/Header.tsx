import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    // Handle scroll for glass effect
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const handleLogoClick = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className={`border-b sticky top-0 z-50 transition-all duration-220 ${
      isScrolled 
        ? 'glass-surface glass-highlight border-white/12' 
        : 'bg-canvas/95 backdrop-blur-md border-hairline'
    }`}>
      <div className="container mx-auto px-4 md:px-6 lg:px-12 py-4 md:py-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleLogoClick}
            className="flex items-center cursor-pointer focus-ring"
          >
            <h1 className="text-xl md:text-2xl font-heading font-bold text-ink tracking-tight">
              card & carry.
            </h1>
          </button>

          {/* Mobile Menu Button */}
          {isMobile && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <nav className="flex flex-col gap-4 mt-8">
                  {user ? (
                    <>
                      <div className="pb-4 border-b">
                        <p className="text-sm text-muted-foreground">Signed in as</p>
                        <p className="text-sm font-medium truncate">{user.email}</p>
                      </div>
                      <Button
                        variant={isActive("/dashboard") ? "default" : "ghost"}
                        onClick={() => handleNavClick("/dashboard")}
                        className="justify-start min-h-[48px]"
                      >
                        dashboard
                      </Button>
                      <Button
                        variant={isActive("/recs") ? "default" : "ghost"}
                        onClick={() => handleNavClick("/recs")}
                        className="justify-start min-h-[48px]"
                      >
                        recommendations
                      </Button>
                      <Button
                        variant={isActive("/cards") ? "default" : "ghost"}
                        onClick={() => handleNavClick("/cards")}
                        className="justify-start min-h-[48px]"
                      >
                        explore cards
                      </Button>
                      <Button
                        variant={isActive("/profile") ? "default" : "ghost"}
                        onClick={() => handleNavClick("/profile")}
                        className="justify-start min-h-[48px]"
                      >
                        profile
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          const section = document.getElementById('how-it-works');
                          section?.scrollIntoView({ behavior: 'smooth' });
                          setMobileMenuOpen(false);
                        }}
                        className="justify-start min-h-[48px]"
                      >
                        how it works
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleNavClick("/cards")}
                        className="justify-start min-h-[48px]"
                      >
                        explore cards
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleNavClick("/about")}
                        className="justify-start min-h-[48px]"
                      >
                        about us
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          const section = document.getElementById('faqs');
                          section?.scrollIntoView({ behavior: 'smooth' });
                          setMobileMenuOpen(false);
                        }}
                        className="justify-start min-h-[48px]"
                      >
                        faqs
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => handleNavClick("/auth")}
                        className="mt-4 min-h-[48px]"
                      >
                        get started
                      </Button>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          )}

          {/* Desktop Navigation */}
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
                <button
                  onClick={() => {
                    const section = document.getElementById('how-it-works');
                    section?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4 py-2 rounded-pill text-sm font-body underline-from-center text-subtle hover:bg-muted hover:text-ink transition-all duration-140 border border-transparent focus-ring"
                >
                  how it works
                </button>
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
                <button
                  onClick={() => {
                    const section = document.getElementById('faqs');
                    section?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4 py-2 rounded-pill text-sm font-body underline-from-center text-subtle hover:bg-muted hover:text-ink transition-all duration-140 border border-transparent focus-ring"
                >
                  faqs
                </button>
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
