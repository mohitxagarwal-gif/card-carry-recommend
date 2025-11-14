import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, User, Settings, AlertCircle, FileText, CreditCard, Shield } from "lucide-react";
import { TimelineEvent } from "@/hooks/useUserTimeline";
import { format } from "date-fns";

interface TimelineEventCardProps {
  event: TimelineEvent;
}

export default function TimelineEventCard({ event }: TimelineEventCardProps) {
  const getIconForCategory = (category: string) => {
    const icons = {
      auth: <User className="h-4 w-4" />,
      onboarding: <FileText className="h-4 w-4" />,
      statement: <FileText className="h-4 w-4" />,
      recommendation: <CreditCard className="h-4 w-4" />,
      card_action: <CreditCard className="h-4 w-4" />,
      data_rights: <Shield className="h-4 w-4" />,
      admin: <Settings className="h-4 w-4" />,
      error: <AlertCircle className="h-4 w-4" />,
      system: <Settings className="h-4 w-4" />
    };
    return icons[category as keyof typeof icons] || icons.system;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      auth: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      onboarding: "bg-green-500/10 text-green-700 dark:text-green-400",
      statement: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
      recommendation: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
      card_action: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
      data_rights: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
      admin: "bg-red-500/10 text-red-700 dark:text-red-400",
      error: "bg-red-500/10 text-red-700 dark:text-red-400",
      system: "bg-gray-500/10 text-gray-700 dark:text-gray-400"
    };
    return colors[category as keyof typeof colors] || colors.system;
  };

  const getActorBadge = (actor: string) => {
    const variants: Record<string, any> = {
      user: { className: "bg-primary/10 text-primary", text: "User" },
      system: { className: "bg-secondary/10 text-secondary-foreground", text: "System" },
      admin: { className: "bg-destructive/10 text-destructive", text: "Admin" }
    };
    const variant = variants[actor] || variants.system;
    return <Badge className={variant.className}>{variant.text}</Badge>;
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-full ${getCategoryColor(event.event_category)}`}>
          {getIconForCategory(event.event_category)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium truncate">{event.description}</h3>
                {getActorBadge(event.actor)}
                {event.severity && event.severity !== 'info' && (
                  <Badge variant={event.severity === 'error' ? 'destructive' : 'default'}>
                    {event.severity}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {format(new Date(event.timestamp), "PPpp")}
              </p>
            </div>

            <Badge variant="outline" className={getCategoryColor(event.event_category)}>
              {event.event_category}
            </Badge>
          </div>

          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <Collapsible className="mt-3">
              <CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown className="h-4 w-4" />
                View metadata
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </Card>
  );
}
