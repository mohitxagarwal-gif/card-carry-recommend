import { useNavigate } from "react-router-dom";
import { creditCards } from "@/data/cardData";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const ExploreTeaserSection = () => {
  const navigate = useNavigate();
  const topCards = creditCards
    .filter(card => card.isActive)
    .sort((a, b) => b.popularScore - a.popularScore)
    .slice(0, 6);

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="mb-8">
          <h2 className="text-3xl lg:text-4xl font-playfair italic font-medium text-foreground mb-3">
            Explore top Indian credit cards
          </h2>
          <p className="text-base lg:text-lg font-sans text-muted-foreground">
            Browse by fees and perks. Compare side-by-side.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {topCards.map((card) => (
            <div
              key={card.id}
              onClick={() => navigate("/cards")}
              className="group bg-card/30 hover:bg-card rounded-2xl border border-border/30 hover:border-border/60 transition-all duration-300 p-6 cursor-pointer"
            >
              <div className="mb-4">
                <h3 className="text-lg font-playfair italic font-medium text-foreground mb-1">
                  {card.name}
                </h3>
                <p className="text-sm font-sans text-muted-foreground">
                  {card.issuer} • {card.network}
                </p>
              </div>

              <div className="mb-4">
                <Badge variant="secondary" className="text-xs">
                  {card.annualFee === 0 ? "No Fee" : `₹${card.annualFee.toLocaleString('en-IN')}/yr`}
                </Badge>
              </div>

              <p className="text-sm font-sans text-muted-foreground">
                {card.keyPerks[0]}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/cards")}
            className="border-foreground/20 hover:bg-foreground/5"
          >
            See all cards →
          </Button>

          <p className="text-sm font-sans text-muted-foreground text-center sm:text-right">
            Not sure what fits?{" "}
            <button
              onClick={() => navigate("/auth")}
              className="text-primary hover:underline font-medium"
            >
              Start my match in under 2 minutes
            </button>
          </p>
        </div>
      </div>
    </section>
  );
};

export default ExploreTeaserSection;
