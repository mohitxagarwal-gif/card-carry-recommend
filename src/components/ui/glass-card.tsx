import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const glassCardVariants = cva(
  "glass-surface glass-highlight rounded-card transition-all duration-220",
  {
    variants: {
      variant: {
        default: "shadow-glass",
        elevated: "shadow-glass-elevated hover:-translate-y-1.5 hover:shadow-glass-elevated",
        subtle: "backdrop-blur-[12px]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(glassCardVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
GlassCard.displayName = "GlassCard";

export { GlassCard, glassCardVariants };
