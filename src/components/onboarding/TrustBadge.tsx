import { LucideIcon } from "lucide-react";

interface TrustBadgeProps {
  icon: LucideIcon;
  text: string;
}

export const TrustBadge = ({ icon: Icon, text }: TrustBadgeProps) => {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 text-sm">
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-foreground">{text}</span>
    </div>
  );
};
