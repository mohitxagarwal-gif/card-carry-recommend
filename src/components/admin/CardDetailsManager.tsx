import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save, Copy } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageUploadField } from "./ImageUploadField";

// Template data structures
const REWARD_BREAKDOWN_TEMPLATE = {
  base_rate: "1% on all spends",
  accelerated_categories: [
    {
      category: "Dining",
      rate: "10x points (5% value)",
      cap: "₹5,000/month",
      exclusions: []
    }
  ],
  milestone_bonuses: []
};

const EARNING_EXAMPLES_TEMPLATE = {
  scenario_1: {
    title: "Monthly ₹50k professional",
    breakdown: {
      dining: 10000,
      shopping: 15000,
      fuel: 5000,
      others: 20000
    },
    earnings: "₹2,850/month",
    net_benefit: "₹31,700/year after fee"
  }
};

const BENEFITS_TEMPLATE = {
  travel: {
    insurance: "Travel insurance up to ₹5L",
    lounge: "8 domestic + 2 international per year"
  },
  lifestyle: {
    concierge: "24/7 concierge service",
    dining: "Buy 1 get 1 at partner restaurants"
  }
};

interface DetailedCardData {
  reward_caps_details?: string;
  detailed_reward_breakdown?: any;
  detailed_benefits?: any;
  earning_examples?: any;
  fine_print?: string;
  insider_tips?: string;
  best_use_cases?: string;
  hidden_fees?: string;
  comparison_notes?: string;
  image_url?: string;
}

const CardDetailsManager = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cardName, setCardName] = useState("");
  const [formData, setFormData] = useState<DetailedCardData>({
    reward_caps_details: "",
    detailed_reward_breakdown: null,
    detailed_benefits: null,
    earning_examples: null,
    fine_print: "",
    insider_tips: "",
    best_use_cases: "",
    hidden_fees: "",
    comparison_notes: "",
    image_url: "",
  });
  const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to access admin panel");
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!roleLoading && role !== "admin") {
      toast.error("Access denied. Admin privileges required.");
      navigate("/");
    }
  }, [role, roleLoading, navigate]);

  useEffect(() => {
    if (id) {
      loadCardDetails();
    }
  }, [id]);

  const loadCardDetails = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("credit_cards")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Failed to load card details");
      navigate("/admin/cards");
    } else {
      setCardName(data.name);
      setFormData({
        reward_caps_details: data.reward_caps_details || "",
        detailed_reward_breakdown: data.detailed_reward_breakdown,
        detailed_benefits: data.detailed_benefits,
        earning_examples: data.earning_examples,
        fine_print: data.fine_print || "",
        insider_tips: data.insider_tips || "",
        best_use_cases: data.best_use_cases || "",
        hidden_fees: data.hidden_fees || "",
        comparison_notes: data.comparison_notes || "",
        image_url: data.image_url || "",
      });
    }
    setLoading(false);
  };

  const validateJSON = (field: string, value: string): boolean => {
    if (!value.trim()) {
      setJsonErrors(prev => ({ ...prev, [field]: "" }));
      return true;
    }
    try {
      JSON.parse(value);
      setJsonErrors(prev => ({ ...prev, [field]: "" }));
      return true;
    } catch (e) {
      setJsonErrors(prev => ({ ...prev, [field]: "Invalid JSON format" }));
      return false;
    }
  };

  const handleJSONChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value ? JSON.parse(value) : null }));
  };

  const copyTemplate = (template: any, field: string) => {
    const jsonString = JSON.stringify(template, null, 2);
    navigator.clipboard.writeText(jsonString);
    toast.success("Template copied to clipboard");
  };

  const handleSave = async () => {
    // Validate all JSON fields
    const rewardBreakdownStr = typeof formData.detailed_reward_breakdown === 'object' 
      ? JSON.stringify(formData.detailed_reward_breakdown) 
      : formData.detailed_reward_breakdown || "";
    const benefitsStr = typeof formData.detailed_benefits === 'object' 
      ? JSON.stringify(formData.detailed_benefits) 
      : formData.detailed_benefits || "";
    const examplesStr = typeof formData.earning_examples === 'object' 
      ? JSON.stringify(formData.earning_examples) 
      : formData.earning_examples || "";

    const hasErrors = 
      (rewardBreakdownStr && !validateJSON('detailed_reward_breakdown', rewardBreakdownStr)) ||
      (benefitsStr && !validateJSON('detailed_benefits', benefitsStr)) ||
      (examplesStr && !validateJSON('earning_examples', examplesStr));

    if (hasErrors) {
      toast.error("Please fix JSON errors before saving");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("credit_cards")
        .update({
          reward_caps_details: formData.reward_caps_details || null,
          detailed_reward_breakdown: formData.detailed_reward_breakdown,
          detailed_benefits: formData.detailed_benefits,
          earning_examples: formData.earning_examples,
          fine_print: formData.fine_print || null,
          insider_tips: formData.insider_tips || null,
          best_use_cases: formData.best_use_cases || null,
          hidden_fees: formData.hidden_fees || null,
          comparison_notes: formData.comparison_notes || null,
          image_url: formData.image_url || null,
        })
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Detailed information saved successfully");
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/admin/cards")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cards
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Manage Detailed Information</h1>
            <p className="text-muted-foreground">{cardName}</p>
          </div>
        </div>

        <Alert className="mb-6">
          <AlertDescription>
            Use the templates provided to structure your JSON data. Empty fields will be saved as null.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="rewards" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
            <TabsTrigger value="benefits">Benefits</TabsTrigger>
            <TabsTrigger value="costs">Costs</TabsTrigger>
            <TabsTrigger value="tips">Tips</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>

          <TabsContent value="rewards" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reward Structure Details</CardTitle>
                <CardDescription>
                  Define caps, exclusions, and detailed earning rates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="reward_caps">Reward Caps Summary (Text)</Label>
                  <Textarea
                    id="reward_caps"
                    value={formData.reward_caps_details}
                    onChange={(e) => setFormData(prev => ({ ...prev, reward_caps_details: e.target.value }))}
                    rows={3}
                    placeholder="e.g., ₹5,000 per month cap on accelerated categories"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="reward_breakdown">Detailed Reward Breakdown (JSON)</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyTemplate(REWARD_BREAKDOWN_TEMPLATE, 'detailed_reward_breakdown')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Template
                    </Button>
                  </div>
                  <Textarea
                    id="reward_breakdown"
                    value={formData.detailed_reward_breakdown ? JSON.stringify(formData.detailed_reward_breakdown, null, 2) : ""}
                    onChange={(e) => {
                      validateJSON('detailed_reward_breakdown', e.target.value);
                      if (e.target.value.trim()) {
                        try {
                          handleJSONChange('detailed_reward_breakdown', e.target.value);
                        } catch {}
                      } else {
                        setFormData(prev => ({ ...prev, detailed_reward_breakdown: null }));
                      }
                    }}
                    rows={12}
                    className="font-mono text-sm"
                    placeholder={JSON.stringify(REWARD_BREAKDOWN_TEMPLATE, null, 2)}
                  />
                  {jsonErrors.detailed_reward_breakdown && (
                    <p className="text-sm text-destructive mt-1">{jsonErrors.detailed_reward_breakdown}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Earning Examples</CardTitle>
                <CardDescription>
                  Real-world scenarios showing how users earn rewards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="earning_examples">Earning Scenarios (JSON)</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyTemplate(EARNING_EXAMPLES_TEMPLATE, 'earning_examples')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Template
                    </Button>
                  </div>
                  <Textarea
                    id="earning_examples"
                    value={formData.earning_examples ? JSON.stringify(formData.earning_examples, null, 2) : ""}
                    onChange={(e) => {
                      validateJSON('earning_examples', e.target.value);
                      if (e.target.value.trim()) {
                        try {
                          handleJSONChange('earning_examples', e.target.value);
                        } catch {}
                      } else {
                        setFormData(prev => ({ ...prev, earning_examples: null }));
                      }
                    }}
                    rows={15}
                    className="font-mono text-sm"
                    placeholder={JSON.stringify(EARNING_EXAMPLES_TEMPLATE, null, 2)}
                  />
                  {jsonErrors.earning_examples && (
                    <p className="text-sm text-destructive mt-1">{jsonErrors.earning_examples}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="benefits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Benefits</CardTitle>
                <CardDescription>
                  Deep dive into all card benefits and perks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="detailed_benefits">Benefits Breakdown (JSON)</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyTemplate(BENEFITS_TEMPLATE, 'detailed_benefits')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Template
                    </Button>
                  </div>
                  <Textarea
                    id="detailed_benefits"
                    value={formData.detailed_benefits ? JSON.stringify(formData.detailed_benefits, null, 2) : ""}
                    onChange={(e) => {
                      validateJSON('detailed_benefits', e.target.value);
                      if (e.target.value.trim()) {
                        try {
                          handleJSONChange('detailed_benefits', e.target.value);
                        } catch {}
                      } else {
                        setFormData(prev => ({ ...prev, detailed_benefits: null }));
                      }
                    }}
                    rows={12}
                    className="font-mono text-sm"
                    placeholder={JSON.stringify(BENEFITS_TEMPLATE, null, 2)}
                  />
                  {jsonErrors.detailed_benefits && (
                    <p className="text-sm text-destructive mt-1">{jsonErrors.detailed_benefits}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Costs & Fine Print</CardTitle>
                <CardDescription>
                  Hidden fees, terms, and conditions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="hidden_fees">Hidden Fees</Label>
                  <Textarea
                    id="hidden_fees"
                    value={formData.hidden_fees}
                    onChange={(e) => setFormData(prev => ({ ...prev, hidden_fees: e.target.value }))}
                    rows={4}
                    placeholder="e.g., ₹500 late payment fee, GST extra on annual fee..."
                  />
                </div>

                <div>
                  <Label htmlFor="fine_print">Fine Print</Label>
                  <Textarea
                    id="fine_print"
                    value={formData.fine_print}
                    onChange={(e) => setFormData(prev => ({ ...prev, fine_print: e.target.value }))}
                    rows={6}
                    placeholder="Important terms and conditions that users should know..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tips" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Expert Tips & Insights</CardTitle>
                <CardDescription>
                  Best practices and strategic advice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="insider_tips">Insider Tips</Label>
                  <Textarea
                    id="insider_tips"
                    value={formData.insider_tips}
                    onChange={(e) => setFormData(prev => ({ ...prev, insider_tips: e.target.value }))}
                    rows={4}
                    placeholder="e.g., Book flights on the issuer portal for bonus points..."
                  />
                </div>

                <div>
                  <Label htmlFor="best_use_cases">Best Use Cases</Label>
                  <Textarea
                    id="best_use_cases"
                    value={formData.best_use_cases}
                    onChange={(e) => setFormData(prev => ({ ...prev, best_use_cases: e.target.value }))}
                    rows={4}
                    placeholder="e.g., Ideal for international travelers who dine out frequently..."
                  />
                </div>

                <div>
                  <Label htmlFor="comparison_notes">Comparison Notes</Label>
                  <Textarea
                    id="comparison_notes"
                    value={formData.comparison_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, comparison_notes: e.target.value }))}
                    rows={4}
                    placeholder="e.g., Better lounge access than competitor X, but lower cashback..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
                <CardDescription>Upload and manage card images</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ImageUploadField
                  currentUrl={formData.image_url}
                  onUrlChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                  cardId={id || ""}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={() => navigate("/admin/cards")}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || Object.values(jsonErrors).some(e => e)}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CardDetailsManager;
