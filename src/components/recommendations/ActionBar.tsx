import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, GitCompare } from "lucide-react";

interface ActionBarProps {
  selectedCards: string[];
  onClearSelection: () => void;
  onCompare: () => void;
}

export const ActionBar = ({
  selectedCards,
  onClearSelection,
  onCompare
}: ActionBarProps) => {
  return (
    <Card className="border-primary/50 bg-primary/5 sticky bottom-6 z-30">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-foreground font-sans">
              {selectedCards.length} card{selectedCards.length !== 1 ? 's' : ''} selected
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="h-8"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>

          <Button
            onClick={onCompare}
            disabled={selectedCards.length < 2}
            size="sm"
          >
            <GitCompare className="w-4 h-4 mr-2" />
            Compare Selected
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
