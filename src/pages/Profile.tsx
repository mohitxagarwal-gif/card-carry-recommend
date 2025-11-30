import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Header from "@/components/Header";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, User, Bell, Shield, FileText, Upload, Download, Trash2, LogOut, TrendingUp, AlertCircle } from "lucide-react";
import { safeTrackEvent as trackEvent } from "@/lib/safeAnalytics";
import { PreferencesModal } from "@/components/profile/PreferencesModal";

const Profile = () => {
  const navigate = useNavigate();
  const { preferences, isLoading, updatePreferences } = useUserPreferences();
  const [profile, setProfile] = useState<any>(null);
  const [userFeatures, setUserFeatures] = useState<any>(null);
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);

  useEffect(() => {
    trackEvent("profile_view");
    loadProfile();
    loadUserFeatures();
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

  const loadUserFeatures = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("user_features")
        .select("*")
        .eq("user_id", user.id)
        .single();
      setUserFeatures(data);
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
        <h1 className="text-4xl font-heading font-bold text-foreground mb-8">
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
              <Button variant="outline" onClick={() => setPreferencesModalOpen(true)}>
                Edit Basics
              </Button>
            </CardContent>
          </Card>

          {/* Complete Profile Prompt */}
          {(() => {
            const missingFields: string[] = [];
            if (!profile?.city) missingFields.push('City');
            if (!preferences?.fee_sensitivity) missingFields.push('Fee Preference');
            if (!preferences?.travel_frequency) missingFields.push('Travel Habits');
            if (!preferences?.lounge_importance) missingFields.push('Lounge Importance');
            
            return missingFields.length > 0 ? (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-amber-900 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Complete Your Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-amber-800 mb-4">
                    Add these details to improve your card recommendations:
                  </p>
                  <ul className="space-y-2 mb-4">
                    {missingFields.map(field => (
                      <li key={field} className="flex items-center gap-2 text-sm text-amber-900">
                        <span className="text-amber-600 font-bold">•</span> {field}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant="default"
                    className="w-full"
                    onClick={() => setPreferencesModalOpen(true)}
                  >
                    Complete Profile
                  </Button>
                </CardContent>
              </Card>
            ) : null;
          })()}

          {/* Derived Features */}
          {userFeatures && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Your Spending Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Data Source</Label>
                  <Badge variant={userFeatures.data_source === 'statement' ? 'default' : 'secondary'}>
                    {userFeatures.data_source === 'statement' ? 'Bank Statements' : 'Self-Reported'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Confidence Level</Label>
                  <div className="flex items-center gap-2">
                    <Progress value={(userFeatures.feature_confidence || 0) * 100} className="w-24 h-2" />
                    <span className="text-sm font-semibold">
                      {Math.round((userFeatures.feature_confidence || 0) * 100)}%
                    </span>
                  </div>
                </div>

                <div>
                  <Label>Monthly Spending</Label>
                  <p className="text-2xl font-bold mt-1">
                    ₹{userFeatures.monthly_spend_estimate?.toLocaleString('en-IN')}
                  </p>
                </div>

                {userFeatures.spend_split_json && (
                  <div className="space-y-2">
                    <Label>Top Categories</Label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(userFeatures.spend_split_json)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 5)
                        .map(([cat, val]) => (
                          <Badge key={cat} variant="outline">
                            {cat}: {(val as number).toFixed(0)}%
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label className="text-xs text-muted-foreground">Pay-in-Full Score</Label>
                    <p className="text-lg font-semibold">{((userFeatures.pif_score || 0) * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Max Fee Tolerance</Label>
                    <p className="text-lg font-semibold">
                      ₹{userFeatures.fee_tolerance_numeric?.toLocaleString('en-IN') || 'N/A'}
                    </p>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/upload')}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Update with New Statements
                </Button>
              </CardContent>
            </Card>
          )}

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
                    <SelectItem value="rarely">Rarely</SelectItem>
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
                  value={preferences?.reward_preference || 'both'}
                  onValueChange={(value) => updatePreferences({ reward_preference: value as any })}
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
            </CardContent>
          </Card>

          {/* Data & Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Data & Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Statements</Label>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/upload')}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Re-upload Statements
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>Local Cache</Label>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    localStorage.clear();
                    toast.success("Cache cleared");
                    trackEvent("data_cache_clear");
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Local Cache
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Export Data</Label>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={async () => {
                    try {
                      const { exportUserData } = await import("@/lib/exportUserData");
                      await exportUserData();
                      toast.success("Data exported");
                      trackEvent("data_export");
                    } catch (error) {
                      toast.error("Export failed");
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export My Data (JSON)
                </Button>
              </div>

              <div className="pt-4 border-t space-y-2">
                <Label className="text-destructive">Danger Zone</Label>
                <Button 
                  variant="destructive" 
                  className="w-full justify-start"
                  onClick={async () => {
                    if (confirm("Are you sure? This will permanently delete your account and all data. This action cannot be undone.")) {
                      try {
                        const { error } = await supabase.functions.invoke('delete-user-data');
                        if (error) throw error;
                        toast.success("Account deleted");
                        trackEvent("data_delete_request");
                        navigate('/auth');
                      } catch (error) {
                        toast.error("Failed to delete account");
                      }
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={async () => {
                  try {
                    await supabase.auth.signOut();
                    toast.success("Signed out successfully");
                    trackEvent("auth_signout", { location: 'profile' });
                    navigate('/auth');
                  } catch (error) {
                    toast.error("Failed to sign out");
                  }
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
          </div>
        </main>

        <PreferencesModal 
          open={preferencesModalOpen}
          onOpenChange={setPreferencesModalOpen}
          onSaveComplete={() => {
            loadProfile();
            loadUserFeatures();
          }}
        />
      </div>
    );
  };

export default Profile;
