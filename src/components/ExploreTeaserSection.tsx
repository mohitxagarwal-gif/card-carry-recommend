import { useNavigate } from "react-router-dom";
import { creditCards } from "@/data/cardData";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { getIssuerBrand, getFeeStyle } from "@/lib/issuerBranding";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const ExploreTeaserSection = () => {
  const navigate = useNavigate();
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });
  const topCards = creditCards
    .filter(card => card.isActive)
    .sort((a, b) => b.popularScore - a.popularScore)
    .slice(0, 6);

  return (
    <section ref={ref} className="py-16 lg:py-24 bg-background" id="explore-cards">
      <div className="container mx-auto px-6 lg:px-12">
        <div className={`mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="text-xs font-sans tracking-wide text-primary/60 uppercase mb-3 font-semibold">
            popular picks
          </div>
          <h2 className="text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
            explore top indian credit cards
          </h2>
          <p className="text-base lg:text-lg font-sans text-muted-foreground max-w-2xl">
            browse by fees and perks. compare side-by-side.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          {topCards.map((card, idx) => {
            const issuerBrand = getIssuerBrand(card.issuer);
            const feeStyle = getFeeStyle(card.annualFee);
            
            return (
              <div
                key={card.id}
                onClick={() => navigate("/cards")}
                className={`group glass-surface glass-highlight rounded-card hover:shadow-glass-elevated transition-all duration-300 p-7 cursor-pointer hover:-translate-y-2 gloss-band relative overflow-hidden ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ 
                  transitionDelay: isVisible ? `${idx * 80 + 200}ms` : '0ms',
                  borderColor: `hsl(${issuerBrand.color} / 0.2)`,
                  background: `linear-gradient(135deg, hsl(${issuerBrand.lightBg} / 0.3) 0%, transparent 50%)`
                }}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-heading font-bold text-foreground mb-1 card-emboss-title">
                    {card.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                      style={{ 
                        backgroundColor: `hsl(${issuerBrand.lightBg})`,
                        color: `hsl(${issuerBrand.color})`,
                        borderColor: `hsl(${issuerBrand.color} / 0.2)`
                      }}
                    >
                      {card.issuer}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {card.network}
                    </Badge>
                  </div>
                </div>

                <div className="mb-4">
                  <Badge 
                    variant={feeStyle.variant}
                    className={`text-sm font-bold tabular-nums card-emboss-badge ${feeStyle.className}`}
                  >
                    {feeStyle.label}
                  </Badge>
                </div>

                <p className="text-sm font-sans text-muted-foreground leading-relaxed">
                  {card.keyPerks[0]}
                </p>
              </div>
            );
          })}
        </div>

        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Button
            variant="outline"
            onClick={() => navigate("/cards")}
            className="border-foreground/20 hover:bg-foreground/5 gloss-band"
          >
            see all cards →
          </Button>

          <p className="text-sm font-sans text-muted-foreground text-center sm:text-right">
            not sure what fits?{" "}
            <button
              onClick={() => navigate("/auth")}
              className="text-primary hover:underline font-medium"
            >
              start my match →
            </button>
          </p>
        </div>
      </div>
    </section>
  );
};

export default ExploreTeaserSection;
