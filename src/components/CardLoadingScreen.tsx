import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  CreditCardChipIcon,
  CardPaymentIcon,
  CardToGiftIcon,
  RewardUnlockedIcon,
} from "@/components/icons/card-loading-icons";
import { cn } from "@/lib/utils";

interface CardLoadingScreenProps {
  message?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  variant?: "fullPage" | "inline";
}

const LOADING_ICONS = [
  CreditCardChipIcon,
  CardPaymentIcon,
  CardToGiftIcon,
  RewardUnlockedIcon,
];

export const CardLoadingScreen = ({
  message = "Loading...",
  showRetry = false,
  onRetry,
  variant = "fullPage",
}: CardLoadingScreenProps) => {
  const [iconIndex, setIconIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(false);
      setTimeout(() => {
        setIconIndex((prev) => (prev + 1) % LOADING_ICONS.length);
        setIsAnimating(true);
      }, 150); // Brief pause between icons
    }, 1500); // Change icon every 1.5 seconds

    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = LOADING_ICONS[iconIndex];

  const containerClasses = cn(
    "flex items-center justify-center",
    variant === "fullPage" ? "min-h-screen bg-gradient-to-b from-background to-secondary/10" : "min-h-[60vh]"
  );

  return (
    <div className={containerClasses}>
      <div className="text-center space-y-6 px-4">
        {/* Animated icon */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          {/* Subtle pulse background */}
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
          
          {/* Icon with fade animation */}
          <CurrentIcon
            className={cn(
              "w-16 h-16 text-primary transition-all duration-300",
              isAnimating
                ? "opacity-100 scale-100"
                : "opacity-0 scale-90"
            )}
          />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <p className="text-lg font-medium text-foreground">
            {message}
          </p>
          <div className="flex items-center justify-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
          </div>
        </div>

        {/* Optional retry button */}
        {showRetry && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-4"
          >
            Taking too long? Click to retry
          </Button>
        )}
      </div>
    </div>
  );
};
