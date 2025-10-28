import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Shield, MailX, Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TrustBadge } from "@/components/onboarding/TrustBadge";
import { SegmentedControl } from "@/components/onboarding/SegmentedControl";
import { RadioGrid } from "@/components/onboarding/RadioGrid";
import { CityCombobox } from "@/components/onboarding/CityCombobox";
import { PhoneInput } from "@/components/onboarding/PhoneInput";
import { trackEvent } from "@/lib/analytics";
import { getReturnToFromQuery, sanitizeInternalPath } from "@/lib/authUtils";
import { trackAuthRedirectNext } from "@/lib/authAnalytics";

interface FormData {
  age_range: string;
  income_band_inr: string;
  city: string;
  phone_e164: string;
  marketing_consent: boolean;
}

const AGE_OPTIONS = [
  { value: "18-24", label: "18-24" },
  { value: "25-34", label: "25-34" },
  { value: "35-44", label: "35-44" },
  { value: "45-54", label: "45-54" },
  { value: "55+", label: "55+" },
];

const INCOME_OPTIONS = [
  { value: "0-25000", label: "₹0-25k" },
  { value: "25000-50000", label: "₹25k-50k" },
  { value: "50000-100000", label: "₹50k-1L" },
  { value: "100000-200000", label: "₹1L-2L" },
  { value: "200000+", label: "₹2L+" },
];

export default function OnboardingBasics() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    age_range: "",
    income_band_inr: "",
    city: "",
    phone_e164: "",
    marketing_consent: false,
  });

  const autosaveKey = `onboarding_basics_${userId}`;

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return; // ProtectedRoute handles this
      
      setUserId(user.id);
      
      // Check if user has already completed onboarding
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed, age_range, income_band_inr, phone_e164")
        .eq("id", user.id)
        .single();
      
      if (profile?.onboarding_completed && profile.age_range && profile.income_band_inr && profile.phone_e164) {
        // User already completed onboarding, redirect to intended destination
        const returnTo = getReturnToFromQuery();
        const destination = sanitizeInternalPath(returnTo) || '/upload';
        navigate(destination, { replace: true });
        return;
      }
      
      // Load saved form data from localStorage
      const saved = localStorage.getItem(`onboarding_basics_${user.id}`);
      if (saved) {
        setFormData(JSON.parse(saved));
      }
      
      setChecking(false);
    };

    loadProfile();
    trackEvent("onboarding_basics_view");
  }, [navigate]);

  const handleFieldChange = (field: keyof FormData, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    if (userId) {
      localStorage.setItem(autosaveKey, JSON.stringify(newData));
    }
    
    trackEvent(`onboarding_basics_field_change`, { field });
  };

  const handleSkip = async () => {
    trackEvent("onboarding_basics_skip_click");
    
    const defaultData = {
      age_range: formData.age_range || "25-34",
      income_band_inr: formData.income_band_inr || "50000-100000",
      city: formData.city || null,
      phone_e164: null,
      marketing_consent: false,
    };

    await submitData(defaultData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent("onboarding_basics_submit_attempt");

    if (!formData.age_range || !formData.income_band_inr) {
      toast.error("Please select age range and income level");
      return;
    }

    if (formData.phone_e164 && !phoneVerified) {
      toast.error("Please verify your phone number");
      return;
    }

    await submitData({
      age_range: formData.age_range,
      income_band_inr: formData.income_band_inr,
      city: formData.city || null,
      phone_e164: phoneVerified ? `+91${formData.phone_e164}` : null,
      marketing_consent: formData.marketing_consent,
    });
  };

  const submitData = async (data: any) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Server-side verification: Check if phone is actually verified
      if (data.phone_e164) {
        const { data: verification, error: verifyError } = await supabase
          .from('phone_verifications')
          .select('verified')
          .eq('user_id', session.user.id)
          .eq('phone_e164', data.phone_e164)
          .eq('verified', true)
          .single();
        
        if (verifyError || !verification) {
          throw new Error('Phone number not verified. Please complete verification.');
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          ...data,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);

      if (error) throw error;

      if (userId) {
        localStorage.removeItem(autosaveKey);
      }

      trackEvent("onboarding_basics_submit_success");
      toast.success("Saved. Tailoring picks for you...");
      
      // Save the intended destination for after first-card decision
      const returnTo = getReturnToFromQuery();
      const safe = sanitizeInternalPath(returnTo) || '/upload';
      
      if (userId) {
        localStorage.setItem(`post_first_card_destination_${userId}`, safe);
      }
      
      // Always route to first-card screen next
      navigate('/onboarding/first-card', { replace: true });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-heading font-bold">a few basics for better matches</h1>
              <p className="text-lg text-muted-foreground">
                this helps us personalize your recommendations. takes under 30 seconds.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <TrustBadge icon={Shield} text="Private" />
              <TrustBadge icon={MailX} text="No spam" />
              <TrustBadge icon={Edit} text="Edit anytime" />
            </div>

            <p className="text-xs text-muted-foreground">
              We use this info only to personalize your results. No credit pull. No hidden sharing.
            </p>
          </div>

          <Card className="p-8">
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">Step 1 of 2</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="age-range">
                  Age Range <span className="text-destructive">*</span>
                </Label>
                <SegmentedControl
                  name="age-range"
                  options={AGE_OPTIONS}
                  value={formData.age_range}
                  onValueChange={(value) => handleFieldChange("age_range", value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="income">
                  Approx. monthly income (₹) <span className="text-destructive">*</span>
                </Label>
                <RadioGrid
                  name="income"
                  options={INCOME_OPTIONS}
                  value={formData.income_band_inr}
                  onValueChange={(value) => handleFieldChange("income_band_inr", value)}
                />
                <p className="text-xs text-muted-foreground">
                  Some cards have income criteria; this helps us filter out poor fits.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City (optional)</Label>
                <CityCombobox
                  value={formData.city}
                  onChange={(value) => handleFieldChange("city", value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <PhoneInput
                  value={formData.phone_e164}
                  onChange={(value) => handleFieldChange("phone_e164", value)}
                  onVerified={() => {
                    setPhoneVerified(true);
                    trackEvent("onboarding_basics_phone_otp_verified");
                  }}
                  verified={phoneVerified}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="marketing"
                  checked={formData.marketing_consent}
                  onCheckedChange={(checked) =>
                    handleFieldChange("marketing_consent", checked as boolean)
                  }
                />
                <Label
                  htmlFor="marketing"
                  className="text-sm font-normal cursor-pointer"
                >
                  Send me occasional updates and offers
                </Label>
              </div>

              <p className="text-xs text-muted-foreground">
                By continuing, you agree to our Terms and Privacy Policy.
              </p>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={loading}
                >
                  Skip for now
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
