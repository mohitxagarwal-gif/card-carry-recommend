import { Upload, BarChart3, Sparkles } from "lucide-react";
import { Card } from "./ui/card";

const steps = [
  {
    icon: Upload,
    title: "Upload Your Statements",
    description: "Securely upload your bank or credit card statements. We support all major Indian banks and formats.",
    step: "01"
  },
  {
    icon: BarChart3,
    title: "Analyze & Categorize",
    description: "Our system analyzes your spending patterns and categorizes your expenses automatically.",
    step: "02"
  },
  {
    icon: Sparkles,
    title: "Get Recommendations",
    description: "Receive personalized credit card recommendations optimized for your spending categories.",
    step: "03"
  }
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="container mx-auto px-6 py-20 md:py-28">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How it works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to discover credit cards that maximize your rewards
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="p-8 border border-border hover:border-primary/50 transition-colors">
              <div className="flex flex-col items-start">
                <span className="text-5xl font-bold text-primary/20 mb-4">{step.step}</span>
                <div className="bg-primary/10 p-3 rounded-lg mb-6">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
