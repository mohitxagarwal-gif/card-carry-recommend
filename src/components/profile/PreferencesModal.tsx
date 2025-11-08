import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CityCombobox } from "@/components/onboarding/CityCombobox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useDeriveFeatures } from "@/hooks/useDeriveFeatures";

interface PreferencesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: string;
  onSaveComplete?: () => void;
}

export const PreferencesModal = ({ open, onOpenChange, initialTab = "basics", onSaveComplete }: PreferencesModalProps) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const deriveFeatures = useDeriveFeatures();

  // Profile fields
  const [ageRange, setAgeRange] = useState<string>("");
  const [incomeBand, setIncomeBand] = useState<string>("");
  const [city, setCity] = useState<string>("");

  // Preference fields
  const [feeSensitivity, setFeeSensitivity] = useState<string>("");
  const [travelFrequency, setTravelFrequency] = useState<string>("");
  const [loungeImportance, setLoungeImportance] = useState<string>("");
  const [rewardPreference, setRewardPreference] = useState<string>("");

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      loadData();
    }
  }, [open, initialTab]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("age_range, income_band_inr, city")
        .eq("id", user.id)
        .single();

      const { data: preferences } = await supabase
        .from("user_preferences")
        .select("fee_sensitivity, travel_frequency, lounge_importance, reward_preference")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        setAgeRange(profile.age_range || "");
        setIncomeBand(profile.income_band_inr || "");
        setCity(profile.city || "");
      }

      if (preferences) {
        setFeeSensitivity(preferences.fee_sensitivity || "");
        setTravelFrequency(preferences.travel_frequency || "");
        setLoungeImportance(preferences.lounge_importance || "");
        setRewardPreference(preferences.reward_preference || "");
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          age_range: ageRange || null,
          income_band_inr: incomeBand || null,
          city: city || null,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Check if preferences exist
      const { data: existingPrefs } = await supabase
        .from("user_preferences")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      // Upsert preferences
      if (existingPrefs) {
        const { error: prefsError } = await supabase
          .from("user_preferences")
          .update({
            fee_sensitivity: feeSensitivity || null,
            travel_frequency: travelFrequency || null,
            lounge_importance: loungeImportance || null,
            reward_preference: rewardPreference || null,
          })
          .eq("user_id", user.id);

        if (prefsError) throw prefsError;
      } else {
        const { error: prefsError } = await supabase
          .from("user_preferences")
          .insert({
            user_id: user.id,
            fee_sensitivity: feeSensitivity || null,
            travel_frequency: travelFrequency || null,
            lounge_importance: loungeImportance || null,
            reward_preference: rewardPreference || null,
          });

        if (prefsError) throw prefsError;
      }

      // Derive features to update recommendations
      await deriveFeatures.mutateAsync({
        userId: user.id,
      });

      toast.success("Profile updated successfully! Your recommendations may improve.");
      onOpenChange(false);
      if (onSaveComplete) onSaveComplete();
    } catch (error: any) {
      console.error("Error saving:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Help us improve your card recommendations by providing more details about your preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="spending">Spending</TabsTrigger>
            <TabsTrigger value="travel">Travel</TabsTrigger>
          </TabsList>

          <TabsContent value="basics" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Age Range</Label>
              <Select value={ageRange} onValueChange={setAgeRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your age range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18-25">18-25</SelectItem>
                  <SelectItem value="26-35">26-35</SelectItem>
                  <SelectItem value="36-45">36-45</SelectItem>
                  <SelectItem value="46-60">46-60</SelectItem>
                  <SelectItem value="60+">60+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Monthly Income</Label>
              <Select value={incomeBand} onValueChange={setIncomeBand}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your income range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-25000">₹0 - ₹25,000</SelectItem>
                  <SelectItem value="25000-50000">₹25,000 - ₹50,000</SelectItem>
                  <SelectItem value="50000-100000">₹50,000 - ₹1,00,000</SelectItem>
                  <SelectItem value="100000-200000">₹1,00,000 - ₹2,00,000</SelectItem>
                  <SelectItem value="200000+">₹2,00,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>City</Label>
              <CityCombobox value={city} onChange={setCity} />
              <p className="text-xs text-muted-foreground">
                Helps us find location-specific offers and acceptance
              </p>
            </div>
          </TabsContent>

          <TabsContent value="spending" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Fee Sensitivity</Label>
              <Select value={feeSensitivity} onValueChange={setFeeSensitivity}>
                <SelectTrigger>
                  <SelectValue placeholder="How do you feel about annual fees?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Avoid fees - prefer lifetime free cards</SelectItem>
                  <SelectItem value="moderate">Okay with fees if value is clear</SelectItem>
                  <SelectItem value="low">Premium cards worth the investment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reward Preference</Label>
              <Select value={rewardPreference} onValueChange={setRewardPreference}>
                <SelectTrigger>
                  <SelectValue placeholder="What rewards do you prefer?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashback">Cashback - direct savings</SelectItem>
                  <SelectItem value="points">Reward Points - flexibility</SelectItem>
                  <SelectItem value="travel">Travel Miles - for flights</SelectItem>
                  <SelectItem value="mixed">Mixed - depends on the deal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="travel" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Travel Frequency</Label>
              <Select value={travelFrequency} onValueChange={setTravelFrequency}>
                <SelectTrigger>
                  <SelectValue placeholder="How often do you travel?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frequent">Frequent - 6+ times/year</SelectItem>
                  <SelectItem value="occasional">Occasional - 2-5 times/year</SelectItem>
                  <SelectItem value="rare">Rare - once a year or less</SelectItem>
                  <SelectItem value="none">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Lounge Access Importance</Label>
              <Select value={loungeImportance} onValueChange={setLoungeImportance}>
                <SelectTrigger>
                  <SelectValue placeholder="How important is lounge access?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="essential">Essential - I use it every trip</SelectItem>
                  <SelectItem value="important">Important - nice to have</SelectItem>
                  <SelectItem value="nice_to_have">Nice to have</SelectItem>
                  <SelectItem value="not_important">Not important</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
