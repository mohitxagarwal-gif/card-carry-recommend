import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ArrowRight } from "lucide-react";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />
      <main className="container mx-auto px-6 lg:px-12 py-24 md:py-32">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground text-center mb-4 leading-tight">
            why trust card & carry?
          </h1>
          <p className="text-lg md:text-xl font-sans text-muted-foreground text-center mb-16 max-w-3xl mx-auto">
            simple, unbiased credit card choices for india. no confusing terms. no pressure.
          </p>

          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <GlassCard 
              variant="elevated" 
              className="p-8 animate-fade-up"
              style={{ animationDelay: '0ms' }}
            >
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-4">
                our mission
              </h2>
              <p className="text-base md:text-lg font-sans text-muted-foreground leading-relaxed">
                simple, unbiased comparisons tailored to indian consumers. we believe choosing a credit card shouldn't be confusing or overwhelming.
              </p>
            </GlassCard>

            <GlassCard 
              variant="elevated" 
              className="p-8 animate-fade-up"
              style={{ animationDelay: '60ms' }}
            >
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-4">
                why trust us
              </h2>
              <ul className="space-y-3">
                <li className="text-base md:text-lg font-sans text-muted-foreground flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span><strong className="text-foreground">transparent criteria</strong> — no hidden biases or commissions affecting our recommendations</span>
                </li>
                <li className="text-base md:text-lg font-sans text-muted-foreground flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span><strong className="text-foreground">always up-to-date</strong> — we flag notable changes in benefits and issuer rules</span>
                </li>
                <li className="text-base md:text-lg font-sans text-muted-foreground flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span><strong className="text-foreground">no credit pull</strong> — viewing matches or comparisons doesn't impact your score</span>
                </li>
                <li className="text-base md:text-lg font-sans text-muted-foreground flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span><strong className="text-foreground">plain english</strong> — we explain what matters, not just what sells</span>
                </li>
              </ul>
            </GlassCard>
          </div>

          <div className="text-center animate-fade-up" style={{ animationDelay: '120ms' }}>
            <Button 
              size="lg"
              onClick={() => navigate("/auth")}
              className="group gloss-band font-sans px-8 py-6 text-base"
            >
              start my match
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
