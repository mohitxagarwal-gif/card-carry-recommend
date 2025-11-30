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
  onCancel?: () => void;
  variant?: "fullPage" | "inline";
  timeout?: number; // milliseconds until timeout, default 15000
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
  onCancel,
  variant = "fullPage",
  timeout = 15000,
}: CardLoadingScreenProps) => {
  const [iconIndex, setIconIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [timedOut, setTimedOut] = useState(false);

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

  // Timeout handler
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTimedOut(true);
    }, timeout);

    return () => clearTimeout(timeoutId);
  }, [timeout]);

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
            {timedOut ? "This is taking longer than expected..." : message}
          </p>
          {!timedOut && (
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
            </div>
          )}
        </div>

        {/* Timeout or retry actions */}
        {(timedOut || showRetry) && (
          <div className="flex gap-2 mt-4">
            {onRetry && (
              <Button
                variant="default"
                size="sm"
                onClick={onRetry}
              >
                Retry
              </Button>
            )}
            {onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
