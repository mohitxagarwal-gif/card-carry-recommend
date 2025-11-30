import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { CardLoadingScreen } from "@/components/CardLoadingScreen";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Validation schema for credit card form
const cardFormSchema = z.object({
  card_id: z.string()
    .trim()
    .min(1, "Card ID is required")
    .max(50, "Card ID must be less than 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Card ID must be alphanumeric (can include _ and -)"),
  name: z.string()
    .trim()
    .min(2, "Card name must be at least 2 characters")
    .max(100, "Card name must be less than 100 characters"),
  issuer: z.string()
    .trim()
    .min(2, "Issuer must be at least 2 characters")
    .max(50, "Issuer must be less than 50 characters"),
  network: z.string()
    .trim()
    .min(2, "Network must be at least 2 characters")
    .max(30, "Network must be less than 30 characters"),
  annual_fee: z.number()
    .int("Annual fee must be a whole number")
    .min(0, "Annual fee cannot be negative")
    .max(100000, "Annual fee cannot exceed ₹1,00,000"),
  popular_score: z.number()
    .int("Popularity score must be a whole number")
    .min(1, "Popularity score must be at least 1")
    .max(10, "Popularity score cannot exceed 10"),
  forex_markup: z.string()
    .trim()
    .min(1, "Forex markup is required")
    .max(100, "Forex markup must be less than 100 characters"),
  forex_markup_pct: z.number()
    .min(0, "Forex markup percentage cannot be negative")
    .max(10, "Forex markup percentage cannot exceed 10%"),
  welcome_bonus: z.string()
    .trim()
    .min(1, "Welcome bonus is required")
    .max(500, "Welcome bonus must be less than 500 characters"),
  reward_structure: z.string()
    .trim()
    .min(1, "Reward structure is required")
    .max(2000, "Reward structure must be less than 2000 characters"),
  lounge_access: z.string()
    .trim()
    .min(1, "Lounge access is required")
    .max(200, "Lounge access must be less than 200 characters"),
  reward_type: z.string()
    .trim()
    .min(1, "At least one reward type is required")
    .refine((val) => {
      const items = val.split(',').map(s => s.trim()).filter(s => s);
      return items.length > 0 && items.length <= 10;
    }, "Must have 1-10 reward types")
    .refine((val) => {
      const items = val.split(',').map(s => s.trim());
      return items.every(item => item.length <= 50);
    }, "Each reward type must be less than 50 characters"),
  key_perks: z.string()
    .trim()
    .min(1, "At least one key perk is required")
    .refine((val) => {
      const items = val.split(',').map(s => s.trim()).filter(s => s);
      return items.length > 0 && items.length <= 20;
    }, "Must have 1-20 key perks")
    .refine((val) => {
      const items = val.split(',').map(s => s.trim());
      return items.every(item => item.length <= 200);
    }, "Each key perk must be less than 200 characters"),
  ideal_for: z.string()
    .trim()
    .min(1, "At least one ideal use case is required")
    .refine((val) => {
      const items = val.split(',').map(s => s.trim()).filter(s => s);
      return items.length > 0 && items.length <= 10;
    }, "Must have 1-10 ideal use cases")
    .refine((val) => {
      const items = val.split(',').map(s => s.trim());
      return items.every(item => item.length <= 100);
    }, "Each ideal use case must be less than 100 characters"),
  downsides: z.string()
    .trim()
    .min(1, "At least one downside is required")
    .refine((val) => {
      const items = val.split(',').map(s => s.trim()).filter(s => s);
      return items.length > 0 && items.length <= 10;
    }, "Must have 1-10 downsides")
    .refine((val) => {
      const items = val.split(',').map(s => s.trim());
      return items.every(item => item.length <= 200);
    }, "Each downside must be less than 200 characters"),
  category_badges: z.string()
    .trim()
    .min(1, "At least one category badge is required")
    .refine((val) => {
      const items = val.split(',').map(s => s.trim()).filter(s => s);
      return items.length > 0 && items.length <= 10;
    }, "Must have 1-10 category badges")
    .refine((val) => {
      const items = val.split(',').map(s => s.trim());
      return items.every(item => item.length <= 50);
    }, "Each category badge must be less than 50 characters"),
  image_url: z.string()
    .trim()
    .url("Must be a valid URL")
    .max(500, "Image URL must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  waiver_rule: z.string()
    .trim()
    .max(300, "Waiver rule must be less than 300 characters")
    .optional()
    .or(z.literal("")),
  eligibility: z.string()
    .trim()
    .max(500, "Eligibility must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  docs_required: z.string()
    .trim()
    .max(500, "Documents required must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  tnc_url: z.string()
    .trim()
    .url("Must be a valid URL")
    .max(500, "T&C URL must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  application_url: z.string()
    .trim()
    .url("Must be a valid URL")
    .max(500, "Application URL must be less than 500 characters")
    .optional()
    .or(z.literal("")),
});

type CardFormData = z.infer<typeof cardFormSchema>;

const AdminCardForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(false);
  
  const form = useForm<CardFormData>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      card_id: "",
      name: "",
      issuer: "",
      network: "",
      annual_fee: 0,
      popular_score: 5,
      forex_markup: "",
      forex_markup_pct: 0,
      welcome_bonus: "",
      reward_structure: "",
      lounge_access: "",
      reward_type: "",
      key_perks: "",
      ideal_for: "",
      downsides: "",
      category_badges: "",
      image_url: "",
      waiver_rule: "",
      eligibility: "",
      docs_required: "",
      tnc_url: "",
      application_url: "",
    },
  });

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
      loadCard();
    }
  }, [id]);

  const loadCard = async () => {
    const { data, error } = await supabase
      .from("credit_cards")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Failed to load card");
      navigate("/admin");
    } else {
      // Convert arrays to comma-separated strings for form display
      form.reset({
        ...data,
        reward_type: Array.isArray(data.reward_type) ? data.reward_type.join(', ') : data.reward_type,
        key_perks: Array.isArray(data.key_perks) ? data.key_perks.join(', ') : data.key_perks,
        ideal_for: Array.isArray(data.ideal_for) ? data.ideal_for.join(', ') : data.ideal_for,
        downsides: Array.isArray(data.downsides) ? data.downsides.join(', ') : data.downsides,
        category_badges: Array.isArray(data.category_badges) ? data.category_badges.join(', ') : data.category_badges,
      });
    }
  };

  const onSubmit = async (formData: CardFormData) => {
    setLoading(true);

    try {
      // Convert comma-separated strings to arrays and sanitize
      const formattedData = {
        card_id: formData.card_id.trim(),
        name: formData.name.trim(),
        issuer: formData.issuer.trim(),
        network: formData.network.trim(),
        annual_fee: formData.annual_fee,
        popular_score: formData.popular_score,
        forex_markup: formData.forex_markup.trim(),
        forex_markup_pct: formData.forex_markup_pct,
        welcome_bonus: formData.welcome_bonus.trim(),
        reward_structure: formData.reward_structure.trim(),
        lounge_access: formData.lounge_access.trim(),
        reward_type: formData.reward_type.split(',').map((s: string) => s.trim()).filter((s: string) => s),
        key_perks: formData.key_perks.split(',').map((s: string) => s.trim()).filter((s: string) => s),
        ideal_for: formData.ideal_for.split(',').map((s: string) => s.trim()).filter((s: string) => s),
        downsides: formData.downsides.split(',').map((s: string) => s.trim()).filter((s: string) => s),
        category_badges: formData.category_badges.split(',').map((s: string) => s.trim()).filter((s: string) => s),
        image_url: formData.image_url?.trim() || null,
        waiver_rule: formData.waiver_rule?.trim() || null,
        eligibility: formData.eligibility?.trim() || null,
        docs_required: formData.docs_required?.trim() || null,
        tnc_url: formData.tnc_url?.trim() || null,
        application_url: formData.application_url?.trim() || null,
      };

      if (id) {
        const { error } = await supabase
          .from("credit_cards")
          .update(formattedData)
          .eq("id", id);

        if (error) {
          toast.error("Failed to update card");
          console.error(error);
        } else {
          toast.success("Card updated successfully");
          navigate("/admin");
        }
      } else {
        const { error } = await supabase
          .from("credit_cards")
          .insert([formattedData]);

        if (error) {
          toast.error("Failed to create card");
          console.error(error);
        } else {
          toast.success("Card created successfully");
          navigate("/admin");
        }
      }
    } catch (error) {
      toast.error("An error occurred while saving the card");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading screen until role verification completes
  if (roleLoading) {
    return <CardLoadingScreen message="Verifying access..." variant="fullPage" />;
  }

  // Don't render admin UI until verified as admin
  if (role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>{id ? "Edit Card" : "Add New Card"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="card_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Card ID*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., hdfc-regalia" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Card Name*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., HDFC Regalia" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="issuer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issuer*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., HDFC Bank" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="network"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Network*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Visa, Mastercard, etc." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="annual_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Fee (₹)*</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="popular_score"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Popularity Score (1-10)*</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="forex_markup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forex Markup*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 1.0% - 2.0%" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="forex_markup_pct"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forex Markup %*</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="welcome_bonus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Welcome Bonus*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reward_structure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reward Structure*</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lounge_access"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lounge Access*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reward_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reward Types* (comma-separated)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Cashback, Travel, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="key_perks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Perks* (comma-separated)</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ideal_for"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ideal For* (comma-separated)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="downsides"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Downsides* (comma-separated)</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category_badges"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Badges* (comma-separated)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="waiver_rule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Waiver Rule (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="application_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application URL (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://bank.com/apply/card-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {id && (
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold mb-2">Detailed Information</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add complex reward structures, examples, and deep-dive content for the "Nerd Out" feature
                    </p>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => navigate(`/admin/cards/${id}/details`)}
                    >
                      Manage Detailed Information →
                    </Button>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {id ? "Update Card" : "Create Card"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate("/admin")}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminCardForm;
