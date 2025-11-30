import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useCards } from "@/hooks/useCards";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CardLoadingScreen } from "@/components/CardLoadingScreen";

const Admin = () => {
  const navigate = useNavigate();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const { data: cards, isLoading: cardsLoading, refetch } = useCards();

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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this card?")) return;

    const { error } = await supabase
      .from("credit_cards")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete card");
      console.error(error);
    } else {
      toast.success("Card deleted successfully");
      refetch();
    }
  };

  // Show loading screen until role verification completes
  if (roleLoading || cardsLoading) {
    return <CardLoadingScreen message="Loading admin panel..." variant="fullPage" />;
  }

  // Don't render admin UI until verified as admin
  if (role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
            <p className="text-muted-foreground">Manage credit cards</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/admin/bulk-upload")}>
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>
            <Button onClick={() => navigate("/admin/cards/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Card
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {cards?.map((card) => (
            <Card key={card.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{card.name}</CardTitle>
                    <CardDescription>
                      {card.issuer} • {card.network}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/cards/${card.id}`)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(card.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {card.category_badges.map((badge, i) => (
                    <Badge key={i} variant="secondary">
                      {badge}
                    </Badge>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Annual Fee:</span>
                    <p className="font-medium">₹{card.annual_fee.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Popularity:</span>
                    <p className="font-medium">{card.popular_score}/10</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Forex:</span>
                    <p className="font-medium">{card.forex_markup}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={card.is_active ? "default" : "secondary"}>
                      {card.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Admin;
