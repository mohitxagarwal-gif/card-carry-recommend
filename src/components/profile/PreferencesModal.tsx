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

  // Normalize age range values from legacy format to current format
  const normalizeAgeRange = (value: string | null): string => {
    if (!value) return "";
    
    // Map old values to new values
    const ageRangeMap: Record<string, string> = {
      '18-25': '18-24',
      '26-35': '25-34', 
      '36-45': '35-44',
      '46-60': '45-54',
      '60+': '55+'
    };
    
    // If it's an old value, convert it
    if (ageRangeMap[value]) {
      console.log(`[PreferencesModal] Converting legacy age range: ${value} -> ${ageRangeMap[value]}`);
      return ageRangeMap[value];
    }
    
    // If it's already a valid new value, keep it
    const validRanges = ['18-24', '25-34', '35-44', '45-54', '55+'];
    if (validRanges.includes(value)) {
      return value;
    }
    
    // If it's invalid, clear it
    console.warn(`[PreferencesModal] Invalid age range detected: ${value}, clearing`);
    return "";
  };

  useEffect(() => {
    if (open) {
      console.log('[PreferencesModal] Modal opened, initialTab:', initialTab);
      setActiveTab(initialTab);
      loadData();
    }
  }, [open, initialTab]);

  const loadData = async () => {
    console.log('[PreferencesModal] Loading profile data...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("age_range, income_band_inr, city")
        .eq("id", user.id)
        .single();

      console.log('[PreferencesModal] Loaded profile:', profile);

      const { data: preferences } = await supabase
        .from("user_preferences")
        .select("fee_sensitivity, travel_frequency, lounge_importance, reward_preference")
        .eq("user_id", user.id)
        .maybeSingle();

      console.log('[PreferencesModal] Loaded preferences:', preferences);

      if (profile) {
        const normalizedAgeRange = normalizeAgeRange(profile.age_range);
        console.log('[PreferencesModal] Setting age range:', normalizedAgeRange);
        setAgeRange(normalizedAgeRange);
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
      console.error("[PreferencesModal] Error loading data:", error);
    }
  };

  const handleSave = async () => {
    console.log('[PreferencesModal] Saving profile and preferences...');
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Validate age range before saving
      const validRanges = ['18-24', '25-34', '35-44', '45-54', '55+'];
      const ageRangeToSave = ageRange && validRanges.includes(ageRange) ? ageRange : null;
      
      if (ageRange && !ageRangeToSave) {
        console.error('[PreferencesModal] Invalid age range, not saving:', ageRange);
        toast.error('Please select a valid age range');
        setLoading(false);
        return;
      }

      console.log('[PreferencesModal] Saving profile with age_range:', ageRangeToSave);

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          age_range: ageRangeToSave,
          income_band_inr: incomeBand || null,
          city: city || null,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;
      console.log('[PreferencesModal] Profile updated successfully');

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
      console.log('[PreferencesModal] Deriving features...');
      await deriveFeatures.mutateAsync({
        userId: user.id,
      });

      console.log('[PreferencesModal] All updates successful!');
      toast.success("Profile updated successfully! Your recommendations may improve.");
      onOpenChange(false);
      if (onSaveComplete) onSaveComplete();
    } catch (error: any) {
      console.error("[PreferencesModal] Error saving:", error);
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
                <SelectTrigger className={!ageRange ? "text-muted-foreground" : ""}>
                  <SelectValue placeholder="Select your age range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18-24">18-24</SelectItem>
                  <SelectItem value="25-34">25-34</SelectItem>
                  <SelectItem value="35-44">35-44</SelectItem>
                  <SelectItem value="45-54">45-54</SelectItem>
                  <SelectItem value="55+">55+</SelectItem>
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
