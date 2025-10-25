import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, CreditCard as CreditCardIcon, Sparkles, LogOut } from "lucide-react";
import { toast } from "sonner";

interface Transaction {
  date: string;
  description: string;
  amount: number;
  category: string;
}

interface AnalysisData {
  totalSpending: number;
  period?: string;
  categories?: Array<{ name: string; amount: number; percentage: number }>;
  topCategories?: Array<{ name: string; amount: number; percentage: number }>;
  recommendedCards?: Array<{
    name: string;
    issuer: string;
    reason: string;
    benefits: string[];
    estimatedSavings: string;
  }>;
  insights?: string[];
  summary?: string;
  transactions?: Transaction[];
}

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const analysisId = location.state?.analysisId;
  
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [editedTransactions, setEditedTransactions] = useState<Transaction[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!analysisId) {
        toast.error("No analysis found");
        navigate("/upload");
        return;
      }

      try {
        const { data, error } = await supabase
          .from('spending_analyses')
          .select('*')
          .eq('id', analysisId)
          .single();

        if (error) throw error;

        const analysisData = data.analysis_data as unknown as AnalysisData;
        setAnalysis(analysisData);
        setEditedTransactions(analysisData.transactions || []);
      } catch (error: any) {
        console.error('Error fetching analysis:', error);
        toast.error('Failed to load analysis');
        navigate("/upload");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [analysisId, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleEditTransaction = (index: number, field: keyof Transaction, value: string | number) => {
    const updated = [...editedTransactions];
    updated[index] = { ...updated[index], [field]: value };
    setEditedTransactions(updated);
    
    // Recalculate totals and categories
    const newTotal = updated.reduce((sum, t) => sum + t.amount, 0);
    const categoryTotals: Record<string, number> = {};
    updated.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    
    const categories = Object.entries(categoryTotals).map(([name, amount]) => ({
      name,
      amount,
      percentage: (amount / newTotal) * 100
    }));
    
    setAnalysis(prev => prev ? {
      ...prev,
      totalSpending: newTotal,
      categories: categories.sort((a, b) => b.amount - a.amount),
      topCategories: categories.sort((a, b) => b.amount - a.amount).slice(0, 3)
    } : null);
  };

  const handleSaveAndViewRecommendations = () => {
    toast.success("Analysis finalized!");
    setShowRecommendations(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-sans">loading your analysis...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/30 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 lg:px-12 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-playfair italic font-medium text-foreground">
              card & carry.
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-foreground/20 hover:bg-foreground/5"
            >
              <LogOut className="h-4 w-4 mr-2" />
              sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 lg:px-12 py-16">
        <Button
          variant="outline"
          onClick={() => navigate("/upload")}
          className="mb-8 border-foreground/20 hover:bg-foreground/5"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          upload new statements
        </Button>

        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-playfair italic font-medium text-foreground mb-4">
              your spending analysis
            </h2>
            <p className="text-lg font-sans text-muted-foreground">
              insights and recommendations based on your spending patterns
            </p>
          </div>

          {/* Summary */}
          {analysis.summary && (
            <Card className="p-8 border-border">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-playfair italic font-medium text-foreground mb-3">
                    summary
                  </h3>
                  <p className="text-foreground/80 font-sans leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Total Spending */}
          <Card className="p-8 border-border">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-playfair italic font-medium text-foreground mb-2">
                  total spending
                </h3>
                <p className="text-3xl font-playfair font-semibold text-foreground">
                  ₹{analysis.totalSpending?.toLocaleString('en-IN') || '0'}
                </p>
                {analysis.period && (
                  <p className="text-sm font-sans text-muted-foreground mt-1">
                    {analysis.period}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Top Categories */}
          {analysis.topCategories && analysis.topCategories.length > 0 && (
            <Card className="p-8 border-border">
              <h3 className="text-xl font-playfair italic font-medium text-foreground mb-6">
                top spending categories
              </h3>
              <div className="space-y-4">
                {analysis.topCategories.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="font-sans text-foreground">{category.name}</span>
                      <span className="font-sans text-sm text-muted-foreground">
                        {category.percentage}%
                      </span>
                    </div>
                    <div className="relative h-2 bg-secondary/30 rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-primary transition-all duration-500"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-sans text-muted-foreground">
                      ₹{category.amount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recommended Cards */}
          {analysis.recommendedCards && analysis.recommendedCards.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-playfair italic font-medium text-foreground">
                recommended credit cards
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {analysis.recommendedCards.map((card, index) => (
                  <Card key={index} className="p-8 border-border hover:border-primary/50 transition-colors">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <CreditCardIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-playfair italic font-medium text-foreground">
                            {card.name}
                          </h4>
                          <p className="text-sm font-sans text-muted-foreground">
                            {card.issuer}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-sm font-sans text-foreground/80 leading-relaxed">
                        {card.reason}
                      </p>
                      
                      {card.benefits && card.benefits.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-sans font-medium text-muted-foreground uppercase">
                            benefits
                          </p>
                          <ul className="space-y-1">
                            {card.benefits.map((benefit, i) => (
                              <li key={i} className="text-sm font-sans text-foreground/70 flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {card.estimatedSavings && (
                        <div className="pt-4 border-t border-border">
                          <p className="text-xs font-sans font-medium text-muted-foreground uppercase mb-1">
                            estimated savings
                          </p>
                          <p className="text-lg font-playfair font-semibold text-primary">
                            {card.estimatedSavings}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          {analysis.insights && analysis.insights.length > 0 && (
            <Card className="p-8 border-border">
              <h3 className="text-xl font-playfair italic font-medium text-foreground mb-6">
                key insights
              </h3>
              <ul className="space-y-3">
                {analysis.insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-3 font-sans text-foreground/80">
                    <span className="text-primary mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* All Transactions Table */}
          {editedTransactions.length > 0 && (
            <Card className="p-8 border-border">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-playfair italic font-medium text-foreground">
                  all transactions ({editedTransactions.length})
                </h3>
                <p className="text-sm font-sans text-muted-foreground">
                  click any field to edit
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-sans text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 font-sans text-sm font-medium text-muted-foreground">Merchant</th>
                      <th className="text-left py-3 px-4 font-sans text-sm font-medium text-muted-foreground">Category</th>
                      <th className="text-right py-3 px-4 font-sans text-sm font-medium text-muted-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editedTransactions.map((transaction, index) => (
                      <tr key={index} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={transaction.date}
                            onChange={(e) => handleEditTransaction(index, 'date', e.target.value)}
                            onFocus={() => setEditingIndex(index)}
                            onBlur={() => setEditingIndex(null)}
                            className="w-full bg-transparent font-sans text-sm text-foreground border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-2 py-1"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={transaction.description}
                            onChange={(e) => handleEditTransaction(index, 'description', e.target.value)}
                            onFocus={() => setEditingIndex(index)}
                            onBlur={() => setEditingIndex(null)}
                            className="w-full bg-transparent font-sans text-sm text-foreground border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-2 py-1"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={transaction.category}
                            onChange={(e) => handleEditTransaction(index, 'category', e.target.value)}
                            onFocus={() => setEditingIndex(index)}
                            onBlur={() => setEditingIndex(null)}
                            className="w-full bg-transparent font-sans text-sm text-foreground border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-2 py-1"
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <input
                            type="number"
                            value={transaction.amount}
                            onChange={(e) => handleEditTransaction(index, 'amount', parseFloat(e.target.value) || 0)}
                            onFocus={() => setEditingIndex(index)}
                            onBlur={() => setEditingIndex(null)}
                            className="w-full bg-transparent font-sans text-sm text-foreground border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-2 py-1 text-right"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pt-8">
            <Button
              onClick={handleSaveAndViewRecommendations}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <CreditCardIcon className="mr-2 h-5 w-5" />
              {showRecommendations ? "analysis finalized" : "finalize & see recommended cards"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Results;
