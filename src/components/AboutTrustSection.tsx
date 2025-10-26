import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

const AboutTrustSection = () => {
  const navigate = useNavigate();

  return (
    <section className="container mx-auto px-6 lg:px-12 py-24 md:py-32">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground text-center mb-16 leading-tight">
          why trust card & carry?
        </h2>

        <div className="grid md:grid-cols-2 gap-12 mb-12">
          <div className="bg-card/30 rounded-2xl border border-border/30 p-8">
            <h3 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-4">
              our mission
            </h3>
            <p className="text-base md:text-lg font-sans text-muted-foreground leading-relaxed">
              clear, unbiased comparisons tailored to indian consumers. we believe choosing a credit card shouldn't be confusing or overwhelming.
            </p>
          </div>

          <div className="bg-card/30 rounded-2xl border border-border/30 p-8">
            <h3 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-4">
              why trust us
            </h3>
            <ul className="space-y-3">
              <li className="text-base md:text-lg font-sans text-muted-foreground flex items-start">
                <span className="mr-3">•</span>
                <span><strong>transparent criteria</strong> — no hidden biases or commissions affecting our recommendations</span>
              </li>
              <li className="text-base md:text-lg font-sans text-muted-foreground flex items-start">
                <span className="mr-3">•</span>
                <span><strong>up-to-date benefits</strong> — we surface notable changes with disclaimers</span>
              </li>
              <li className="text-base md:text-lg font-sans text-muted-foreground flex items-start">
                <span className="mr-3">•</span>
                <span><strong>no credit pull</strong> — checking cards doesn't impact your credit score</span>
              </li>
              <li className="text-base md:text-lg font-sans text-muted-foreground flex items-start">
                <span className="mr-3">•</span>
                <span><strong>education over hype</strong> — we explain what matters, not just what sells</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center">
          <Button 
            size="lg"
            onClick={() => navigate("/auth")}
            className="group bg-primary text-primary-foreground hover:bg-primary/90 font-sans transition-all duration-300 px-8 py-6 text-base"
          >
            start my match
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default AboutTrustSection;
