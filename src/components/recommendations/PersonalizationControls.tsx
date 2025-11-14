import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InlinePreferencesModal } from "./InlinePreferencesModal";

interface PersonalizationControlsProps {
  userPreferences: any;
  onPreferenceChange: (prefs: any) => void;
}

export const PersonalizationControls = ({
  userPreferences,
  onPreferenceChange
}: PersonalizationControlsProps) => {
  const [modalOpen, setModalOpen] = useState(false);

  const preferences = [
    {
      label: "Fee Sensitivity",
      value: userPreferences?.fee_sensitivity || 'medium',
      icon: "💰"
    },
    {
      label: "Travel Frequency",
      value: userPreferences?.travel_frequency || 'occasional',
      icon: "✈️"
    },
    {
      label: "Lounge Access",
      value: userPreferences?.lounge_importance || 'medium',
      icon: "🛋️"
    },
    {
      label: "Reward Type",
      value: userPreferences?.preference_type || 'cashback',
      icon: "🎁"
    }
  ];

  return (
    <>
      <Card>
      <CardHeader>
        <CardTitle className="text-xl font-heading flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Your Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {preferences.map((pref, idx) => (
            <div key={idx} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{pref.icon}</span>
                <div>
                  <p className="text-sm font-medium text-foreground font-sans">
                    {pref.label}
                  </p>
                  <p className="text-xs text-muted-foreground font-sans capitalize">
                    {pref.value}
                  </p>
                </div>
              </div>
              <Check className="w-4 h-4 text-primary" />
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => setModalOpen(true)}
        >
          <Settings className="w-4 h-4 mr-2" />
          Edit Preferences
        </Button>

        <div className="pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground font-sans mb-3">
            Quick Filters
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
              No Annual Fee
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
              Travel Cards
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
              Cashback
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
              Premium
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>

    <InlinePreferencesModal
      isOpen={modalOpen}
      onClose={() => setModalOpen(false)}
      onSave={() => {
        onPreferenceChange(userPreferences);
      }}
    />
    </>
  );
};
