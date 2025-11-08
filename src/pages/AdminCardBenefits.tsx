import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

interface CardBenefit {
  id: string;
  card_id: string;
  category: string;
  earn_rate: number;
  earn_type: string;
  earn_rate_unit: string;
  notes?: string;
}

const AdminCardBenefits = () => {
  const navigate = useNavigate();
  const { data: role } = useUserRole();
  const [cards, setCards] = useState<any[]>([]);
  const [benefits, setBenefits] = useState<CardBenefit[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role && role !== "admin") {
      toast.error("Unauthorized");
      navigate("/");
      return;
    }
    if (role === "admin") {
      loadCards();
    }
  }, [role, navigate]);

  useEffect(() => {
    if (selectedCardId) {
      loadBenefits(selectedCardId);
    }
  }, [selectedCardId]);

  const loadCards = async () => {
    // Use raw SQL query since we're not sure of the table name
    const { data, error } = await supabase.rpc('get_all_cards' as any) as any;
    
    if (error) {
      // Fallback: try direct query - this will fail but helps us see the error
      console.error("Failed to load cards:", error);
      toast.error("Unable to load cards. Admin feature needs proper table setup.");
      return;
    }
    setCards(data || []);
  };

  const loadBenefits = async (cardId: string) => {
    const { data, error } = await supabase
      .from("card_benefits")
      .select("*")
      .eq("card_id", cardId)
      .order("category");
    
    if (error) {
      toast.error("Failed to load benefits");
      return;
    }
    setBenefits(data || []);
  };

  const addBenefit = () => {
    if (!selectedCardId) {
      toast.error("Please select a card first");
      return;
    }

    const newBenefit: CardBenefit = {
      id: `new-${Date.now()}`,
      card_id: selectedCardId,
      category: "dining",
      earn_rate: 1.0,
      earn_type: "reward",
      earn_rate_unit: "points",
      notes: "",
    };
    setBenefits([...benefits, newBenefit]);
  };

  const updateBenefit = (id: string, field: keyof CardBenefit, value: any) => {
    setBenefits(benefits.map(b => 
      b.id === id ? { ...b, [field]: value } : b
    ));
  };

  const deleteBenefit = async (id: string) => {
    if (id.startsWith("new-")) {
      setBenefits(benefits.filter(b => b.id !== id));
      return;
    }

    const { error } = await supabase
      .from("card_benefits")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete benefit");
      return;
    }

    setBenefits(benefits.filter(b => b.id !== id));
    toast.success("Benefit deleted");
  };

  const saveBenefits = async () => {
    if (!selectedCardId) return;
    setLoading(true);

    try {
      // Separate new and existing benefits
      const newBenefits = benefits.filter(b => b.id.startsWith("new-"));
      const existingBenefits = benefits.filter(b => !b.id.startsWith("new-"));

      // Insert new benefits
      if (newBenefits.length > 0) {
        const { error: insertError } = await supabase
          .from("card_benefits")
          .insert(
            newBenefits.map(({ id, ...rest }) => rest)
          );
        
        if (insertError) throw insertError;
      }

      // Update existing benefits
      for (const benefit of existingBenefits) {
        const { error: updateError } = await supabase
          .from("card_benefits")
          .update({
            category: benefit.category,
            earn_rate: benefit.earn_rate,
            earn_type: benefit.earn_type,
            earn_rate_unit: benefit.earn_rate_unit,
            notes: benefit.notes,
          })
          .eq("id", benefit.id);
        
        if (updateError) throw updateError;
      }

      toast.success("Benefits saved successfully");
      loadBenefits(selectedCardId); // Reload to get proper IDs
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save benefits");
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    "dining",
    "groceries",
    "travel",
    "online",
    "entertainment",
    "fuel",
    "bills",
    "forex",
    "other"
  ];

  if (role !== "admin") {
    return null; // Or a loading spinner
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Card Benefits Management</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Card</CardTitle>
          </CardHeader>
          <CardContent>
            {cards.length === 0 ? (
              <p className="text-muted-foreground">
                No cards available. Please ensure cards are properly set up in the database.
              </p>
            ) : (
              <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a card..." />
                </SelectTrigger>
                <SelectContent>
                  {cards.map(card => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.name} ({card.issuer || 'Unknown'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {selectedCardId && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Earn Rates</CardTitle>
                <div className="flex gap-2">
                  <Button onClick={addBenefit} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Rate
                  </Button>
                  <Button onClick={saveBenefits} disabled={loading} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Save All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {benefits.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No earn rates defined yet. Click "Add Rate" to get started.
                  </p>
                ) : (
                  benefits.map(benefit => (
                    <div key={benefit.id} className="border rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <Label>Category</Label>
                          <Select
                            value={benefit.category}
                            onValueChange={(value) => updateBenefit(benefit.id, "category", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Earn Rate</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={benefit.earn_rate}
                            onChange={(e) => updateBenefit(benefit.id, "earn_rate", parseFloat(e.target.value))}
                          />
                        </div>

                        <div>
                          <Label>Unit</Label>
                          <Select
                            value={benefit.earn_rate_unit}
                            onValueChange={(value) => updateBenefit(benefit.id, "earn_rate_unit", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="points">Points</SelectItem>
                              <SelectItem value="cashback_pct">Cashback %</SelectItem>
                              <SelectItem value="miles">Miles</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteBenefit(benefit.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label>Notes (Optional)</Label>
                        <Input
                          value={benefit.notes || ""}
                          onChange={(e) => updateBenefit(benefit.id, "notes", e.target.value)}
                          placeholder="E.g., 5x on weekends only"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCardBenefits;