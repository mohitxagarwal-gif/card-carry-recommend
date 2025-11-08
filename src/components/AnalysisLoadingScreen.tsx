import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { GlassCard } from "@/components/ui/glass-card";
import { FileText, Bot, Target, Star, CheckCircle2 } from "lucide-react";

interface AnalysisLoadingScreenProps {
  currentStep: number;
  progress: number;
  totalTransactions?: number;
}

const STEPS = [
  {
    id: 1,
    icon: FileText,
    title: "Creating analysis snapshot",
    description: "Organizing your transaction data",
  },
  {
    id: 2,
    icon: Bot,
    title: "Analyzing transactions with AI",
    description: "Processing spending patterns and categories",
  },
  {
    id: 3,
    icon: Target,
    title: "Deriving spending insights",
    description: "Calculating your financial profile",
  },
  {
    id: 4,
    icon: Star,
    title: "Generating card recommendations",
    description: "Finding your perfect credit card matches",
  },
];

const TIPS = [
  "We analyze 15+ factors to match you with the perfect card",
  "Comparing your spending against 50+ credit cards",
  "Finding cards with fee waivers for your profile",
  "Matching rewards to your lifestyle and spending habits",
  "Calculating potential annual savings for each card",
  "Our AI considers seasonal spending patterns",
];

export const AnalysisLoadingScreen = ({
  currentStep,
  progress,
  totalTransactions = 0,
}: AnalysisLoadingScreenProps) => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-2xl space-y-8">
        {/* Main Loading Card */}
        <GlassCard variant="elevated" className="p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Bot className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Analyzing Your Statements
            </h1>
            <p className="text-muted-foreground">
              {totalTransactions > 0
                ? `Processing ${totalTransactions} transactions`
                : "This will take just a moment"}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="space-y-4">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;

              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-4 p-4 rounded-lg transition-all duration-300 ${
                    isActive
                      ? "bg-primary/10 border border-primary/20 scale-[1.02]"
                      : isCompleted
                      ? "bg-muted/50 border border-transparent"
                      : "bg-transparent border border-transparent opacity-50"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? "bg-primary text-primary-foreground animate-pulse"
                        : isCompleted
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-medium transition-colors ${
                        isActive
                          ? "text-foreground"
                          : isCompleted
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Tips Section */}
        <GlassCard className="p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold text-sm">💡</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground font-medium mb-1">
                Did you know?
              </p>
              <p
                key={currentTipIndex}
                className="text-sm text-foreground animate-fade-in"
              >
                {TIPS[currentTipIndex]}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
