import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Header from "@/components/Header";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, User, Bell, Shield } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const Profile = () => {
  const { preferences, isLoading, updatePreferences } = useUserPreferences();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    trackEvent("profile_view");
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-playfair italic font-medium text-foreground mb-8">
          your profile
        </h1>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Email</Label>
                <p className="text-sm text-muted-foreground mt-1">{profile.email}</p>
              </div>
              <div>
                <Label>Age Range</Label>
                <p className="text-sm text-muted-foreground mt-1">{profile.age_range || 'Not set'}</p>
              </div>
              <div>
                <Label>Income Band</Label>
                <p className="text-sm text-muted-foreground mt-1">{profile.income_band_inr || 'Not set'}</p>
              </div>
              <div>
                <Label>City</Label>
                <p className="text-sm text-muted-foreground mt-1">{profile.city || 'Not set'}</p>
              </div>
              <Button variant="outline" onClick={() => window.location.href = '/onboarding/basics'}>
                Edit Basics
              </Button>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Fee Sensitivity</Label>
                <Select 
                  value={preferences?.fee_sensitivity || 'medium'}
                  onValueChange={(value) => updatePreferences({ fee_sensitivity: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - I don't mind high fees</SelectItem>
                    <SelectItem value="medium">Medium - Balanced approach</SelectItem>
                    <SelectItem value="high">High - Prefer no/low fees</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Travel Frequency</Label>
                <Select 
                  value={preferences?.travel_frequency || 'occasional'}
                  onValueChange={(value) => updatePreferences({ travel_frequency: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="occasional">Occasional (1-2 times/year)</SelectItem>
                    <SelectItem value="frequent">Frequent (3+ times/year)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Lounge Access Importance</Label>
                <Select 
                  value={preferences?.lounge_importance || 'medium'}
                  onValueChange={(value) => updatePreferences({ lounge_importance: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Don't care</SelectItem>
                    <SelectItem value="medium">Medium - Nice to have</SelectItem>
                    <SelectItem value="high">High - Very important</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reward Preference</Label>
                <Select 
                  value={preferences?.preference_type || 'both'}
                  onValueChange={(value) => updatePreferences({ preference_type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashback">Cashback</SelectItem>
                    <SelectItem value="points">Reward Points</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Reminders</Label>
                  <p className="text-sm text-muted-foreground">Bill due dates, fee reminders</p>
                </div>
                <Switch 
                  checked={preferences?.email_reminders ?? true}
                  onCheckedChange={(checked) => {
                    updatePreferences({ email_reminders: checked });
                    trackEvent("notifications_toggle", { type: 'email_reminders', enabled: checked });
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">New offers and guides</p>
                </div>
                <Switch 
                  checked={preferences?.email_marketing ?? false}
                  onCheckedChange={(checked) => {
                    updatePreferences({ email_marketing: checked });
                    trackEvent("notifications_toggle", { type: 'email_marketing', enabled: checked });
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Legal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Legal & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="link" className="p-0 h-auto">Terms of Service</Button>
              <Button variant="link" className="p-0 h-auto">Privacy Policy</Button>
              <Button variant="link" className="p-0 h-auto">Affiliate Disclosure</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
