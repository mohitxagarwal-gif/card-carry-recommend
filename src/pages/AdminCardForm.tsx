import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { CreditCard } from "@/hooks/useCards";

const AdminCardForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm<Partial<CreditCard>>();

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
      reset(data);
    }
  };

  const onSubmit = async (formData: any) => {
    setLoading(true);

    // Convert comma-separated strings to arrays
    const formattedData = {
      ...formData,
      reward_type: Array.isArray(formData.reward_type) 
        ? formData.reward_type 
        : formData.reward_type.split(',').map((s: string) => s.trim()),
      key_perks: Array.isArray(formData.key_perks)
        ? formData.key_perks
        : formData.key_perks.split(',').map((s: string) => s.trim()),
      ideal_for: Array.isArray(formData.ideal_for)
        ? formData.ideal_for
        : formData.ideal_for.split(',').map((s: string) => s.trim()),
      downsides: Array.isArray(formData.downsides)
        ? formData.downsides
        : formData.downsides.split(',').map((s: string) => s.trim()),
      category_badges: Array.isArray(formData.category_badges)
        ? formData.category_badges
        : formData.category_badges.split(',').map((s: string) => s.trim()),
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

    setLoading(false);
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>{id ? "Edit Card" : "Add New Card"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="card_id">Card ID*</Label>
                  <Input id="card_id" {...register("card_id", { required: true })} />
                </div>
                <div>
                  <Label htmlFor="name">Card Name*</Label>
                  <Input id="name" {...register("name", { required: true })} />
                </div>
                <div>
                  <Label htmlFor="issuer">Issuer*</Label>
                  <Input id="issuer" {...register("issuer", { required: true })} />
                </div>
                <div>
                  <Label htmlFor="network">Network*</Label>
                  <Input id="network" {...register("network", { required: true })} placeholder="Visa, Mastercard, etc." />
                </div>
                <div>
                  <Label htmlFor="annual_fee">Annual Fee*</Label>
                  <Input id="annual_fee" type="number" {...register("annual_fee", { required: true, valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="popular_score">Popularity Score (1-10)*</Label>
                  <Input id="popular_score" type="number" {...register("popular_score", { required: true, valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="forex_markup">Forex Markup*</Label>
                  <Input id="forex_markup" {...register("forex_markup", { required: true })} placeholder="e.g., 1.0% - 2.0%" />
                </div>
                <div>
                  <Label htmlFor="forex_markup_pct">Forex Markup %*</Label>
                  <Input id="forex_markup_pct" type="number" step="0.1" {...register("forex_markup_pct", { required: true, valueAsNumber: true })} />
                </div>
              </div>

              <div>
                <Label htmlFor="welcome_bonus">Welcome Bonus*</Label>
                <Input id="welcome_bonus" {...register("welcome_bonus", { required: true })} />
              </div>

              <div>
                <Label htmlFor="reward_structure">Reward Structure*</Label>
                <Textarea id="reward_structure" {...register("reward_structure", { required: true })} rows={3} />
              </div>

              <div>
                <Label htmlFor="lounge_access">Lounge Access*</Label>
                <Input id="lounge_access" {...register("lounge_access", { required: true })} />
              </div>

              <div>
                <Label htmlFor="reward_type">Reward Types* (comma-separated)</Label>
                <Input id="reward_type" {...register("reward_type", { required: true })} placeholder="Cashback, Travel, etc." />
              </div>

              <div>
                <Label htmlFor="key_perks">Key Perks* (comma-separated)</Label>
                <Textarea id="key_perks" {...register("key_perks", { required: true })} rows={2} />
              </div>

              <div>
                <Label htmlFor="ideal_for">Ideal For* (comma-separated)</Label>
                <Input id="ideal_for" {...register("ideal_for", { required: true })} />
              </div>

              <div>
                <Label htmlFor="downsides">Downsides* (comma-separated)</Label>
                <Textarea id="downsides" {...register("downsides", { required: true })} rows={2} />
              </div>

              <div>
                <Label htmlFor="category_badges">Category Badges* (comma-separated)</Label>
                <Input id="category_badges" {...register("category_badges", { required: true })} />
              </div>

              <div>
                <Label htmlFor="image_url">Image URL (optional)</Label>
                <Input id="image_url" {...register("image_url")} />
              </div>

              <div>
                <Label htmlFor="waiver_rule">Waiver Rule (optional)</Label>
                <Input id="waiver_rule" {...register("waiver_rule")} />
              </div>

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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminCardForm;
