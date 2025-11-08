import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, CreditCard as CreditCardIcon, Sparkles, LogOut, AlertCircle, Loader2, LayoutDashboard, ArrowUpCircle, ArrowDownCircle, Home } from "lucide-react";
import { toast } from "sonner";
import { CardActionBar } from "@/components/CardActionBar";
import { EligibilityIndicator } from "@/components/EligibilityIndicator";
import { CardStatusDropdown } from "@/components/CardStatusDropdown";
import { RecommendationSummaryPanel } from "@/components/RecommendationSummaryPanel";
import { useRecommendationSnapshot } from "@/hooks/useRecommendationSnapshot";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { STANDARD_CATEGORIES, normalizeCategory } from "@/lib/categories";
import { includeInSpending, calculateTotalSpending, groupByCategory } from "@/lib/transactionRules";
import { trackEvent } from "@/lib/analytics";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Transaction {
  date: string;
  merchant: string;
  amount: number;
  category: string;
  transactionType?: 'debit' | 'credit';
  categoryConfidence?: number;
  isRecurring?: boolean;
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
    matchScore?: number;
  }>;
  insights?: string[];
  summary?: string;
  transactions?: Transaction[];
}

const CATEGORY_OPTIONS = STANDARD_CATEGORIES;

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const analysisId = location.state?.analysisId;
  const { createSnapshot, latestSnapshot } = useRecommendationSnapshot();
  
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [editedTransactions, setEditedTransactions] = useState<Transaction[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const [showOtherWarning, setShowOtherWarning] = useState(false);
  const [userIncome, setUserIncome] = useState<string | undefined>(undefined);
  const [hasExistingRecommendations, setHasExistingRecommendations] = useState(false);
  const [activeView, setActiveView] = useState<'review' | 'recommendations'>('review');
  const [matchScoreModal, setMatchScoreModal] = useState<{ isOpen: boolean; card: any } | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userPreferences, setUserPreferences] = useState<any>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        // Priority order: URL state → query param → localStorage → latest from DB
        let currentAnalysisId = analysisId;
        
        if (!currentAnalysisId) {
          const params = new URLSearchParams(location.search);
          currentAnalysisId = params.get('analysisId');
        }
        
        if (!currentAnalysisId) {
          currentAnalysisId = localStorage.getItem(`last_analysis_${user.id}`);
        }
        
        if (!currentAnalysisId) {
          // Fetch the most recent analysis for this user
          const { data: latestAnalysis } = await supabase
            .from('spending_analyses')
            .select('id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          currentAnalysisId = latestAnalysis?.id;
        }
        
        if (!currentAnalysisId) {
          toast.error("No analysis found. Please upload statements first.");
          navigate("/upload");
          return;
        }
        
        // Save to localStorage for future use
        localStorage.setItem(`last_analysis_${user.id}`, currentAnalysisId);

        const { data, error } = await supabase
          .from('spending_analyses')
          .select('*')
          .eq('id', currentAnalysisId)
          .single();

        if (error) throw error;

        const analysisData = data.analysis_data as unknown as AnalysisData;
        setAnalysis(analysisData);
        setEditedTransactions(analysisData.transactions || []);
        
        // Check if recommendations already exist for this analysis
        const { data: existingSnapshot } = await supabase
          .from('recommendation_snapshots')
          .select('id, recommended_cards')
          .eq('analysis_id', currentAnalysisId)
          .maybeSingle();
        
        if (existingSnapshot && existingSnapshot.recommended_cards) {
          console.log('[Results] Found existing recommendations for analysis:', currentAnalysisId);
          setHasExistingRecommendations(true);
          setShowRecommendations(true);
          setActiveView('recommendations');
          
          // Populate analysis with existing recommendations
          if (analysisData.recommendedCards === undefined || analysisData.recommendedCards.length === 0) {
            setAnalysis(prev => prev ? {
              ...prev,
              recommendedCards: existingSnapshot.recommended_cards as any
            } : null);
          }
        }
        
        // Phase 2: Verify transaction count matches analysis_run
        if (data.analysis_run_id) {
          const { data: runData } = await supabase
            .from('analysis_runs')
            .select('transaction_count, transaction_ids')
            .eq('id', data.analysis_run_id)
            .single();
            
          const actualCount = analysisData.transactions?.length || 0;
          
          console.log('[Results] Transaction count check:', {
            analysisRunId: data.analysis_run_id,
            expectedCount: runData?.transaction_count,
            actualCount,
            match: runData?.transaction_count === actualCount
          });
          
          if (runData && runData.transaction_count !== actualCount) {
            console.error('[Results] Transaction count mismatch!', {
              expected: runData.transaction_count,
              actual: actualCount,
              difference: Math.abs(runData.transaction_count - actualCount)
            });
            toast.error(`Transaction count mismatch! Upload: ${runData.transaction_count}, Results: ${actualCount}`, {
              description: 'Some transactions may have been lost. Please re-upload your statements.',
              duration: 10000
            });
          }
        } else {
          console.warn('[Results] No analysis_run_id found for this analysis');
        }
        
        // Phase 7: Telemetry logging
        console.log('[Results] Loaded analysis:', {
          analysisId: currentAnalysisId,
          txTotal: analysisData.transactions?.length || 0,
          txIncluded: analysisData.transactions?.filter(includeInSpending).length || 0,
          categories: Object.keys(groupByCategory(analysisData.transactions || [])).length,
          totalSpending: calculateTotalSpending(analysisData.transactions || [])
        });
        
        // Fetch user profile for income info and completeness check
        const { data: profile } = await supabase
          .from('profiles')
          .select('income_band_inr, city, age_range')
          .eq('id', user.id)
          .single();
        
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('fee_sensitivity, travel_frequency, lounge_importance, preference_type')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile) {
          setUserIncome(profile.income_band_inr);
          setUserProfile(profile);
        }
        
        if (prefs) {
          setUserPreferences(prefs);
        }
      } catch (error: any) {
        console.error('Error fetching analysis:', error);
        toast.error('Failed to load analysis');
        navigate("/upload");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [analysisId, navigate, location.search]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleEditTransaction = (index: number, field: keyof Transaction, value: string | number) => {
    const updated = [...editedTransactions];
    updated[index] = { ...updated[index], [field]: value };
    setEditedTransactions(updated);
    
    // Phase 4: Use shared inclusion rules for calculations
    const newTotal = calculateTotalSpending(updated);
    const categoryTotals = groupByCategory(updated);
    
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

  const handleFinalizeAndGetRecommendations = async () => {
    // Check how many transactions are still "Other"
    const otherCount = editedTransactions.filter(t => t.category === "Other").length;
    const otherPercentage = (otherCount / editedTransactions.length) * 100;

    // If more than 20% are "Other", show warning
    if (otherPercentage > 20) {
      setShowOtherWarning(true);
      return;
    }

    await generateRecommendations();
  };

  const generateRecommendations = async () => {
    setIsGeneratingRecommendations(true);
    setShowOtherWarning(false);

    try {
      // Fetch user profile and preferences
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('age_range, income_band_inr, city')
        .eq('id', user.id)
        .single();

      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('fee_sensitivity, travel_frequency, lounge_importance, preference_type')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('[Results] Generating recommendations with profile:', {
        hasProfile: !!profile,
        hasPreferences: !!preferences,
        transactionsCount: editedTransactions.length
      });

      // Update the database with edited transactions
      const { error: updateError } = await supabase
        .from('spending_analyses')
        .update({
          analysis_data: {
            ...analysis,
            transactions: editedTransactions
          } as any
        })
        .eq('id', analysisId);

      if (updateError) throw updateError;

      // Step 1: Derive features from the analysis
      console.log("[Results] Deriving features for analysis:", analysisId);
      
      const { error: deriveError } = await supabase.functions.invoke('derive-user-features', {
        body: {
          userId: user.id,
          analysisId: analysisId,
        },
      });

      if (deriveError) {
        console.error("[Results] Feature derivation failed:", deriveError);
        toast.error("Failed to calculate user features");
        return;
      }

      // Step 2: Generate recommendations with fresh features
      // Call the new edge function with profile data
      const { data, error } = await supabase.functions.invoke('generate-recommendations', {
        body: {
          analysisId,
          transactions: editedTransactions,
          profile: profile || {},
          preferences: preferences || {}
        }
      });

      if (error) throw error;

      // Update the local state with recommendations
      if (data.recommendations) {
        const recs = data.recommendations;
        
        setAnalysis(prev => prev ? {
          ...prev,
          recommendedCards: recs.recommendedCards,
          insights: [
            ...(prev.insights || []),
            ...(recs.additionalInsights || [])
          ]
        } : null);
        
        // Create snapshot for dashboard
        const savings = recs.recommendedCards?.reduce((acc: any, card: any) => {
          const match = card.estimatedSavings?.match(/₹([\d,]+)/);
          if (match) {
            const amount = parseInt(match[1].replace(/,/g, ''));
            return { min: Math.min(acc.min, amount), max: Math.max(acc.max, amount) };
          }
          return acc;
        }, { min: Infinity, max: 0 });
        
        const hasLowConfidence = editedTransactions.length < 20 || otherCount > editedTransactions.length * 0.3;
        
        createSnapshot({
          analysisId,
          savingsMin: savings.min === Infinity ? 0 : savings.min,
          savingsMax: savings.max === 0 ? 10000 : savings.max,
          confidence: hasLowConfidence ? 'low' : editedTransactions.length > 100 ? 'high' : 'medium',
          recommendedCards: recs.recommendedCards || [],
        });
        
        setShowRecommendations(true);
        toast.success("Recommendations saved! View them anytime from your dashboard.");
        
        // Scroll to recommendations
        setTimeout(() => {
          document.getElementById('recommendations-section')?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }, 300);
      }
    } catch (error: any) {
      console.error('Error generating recommendations:', error);
      toast.error('Failed to generate recommendations. Please try again.');
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };

  const otherCount = editedTransactions.filter(t => t.category === "Other").length;

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
            <h1 className="text-2xl font-heading font-bold text-foreground">
              card & carry.
            </h1>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="border-foreground/20 hover:bg-foreground/5"
              >
                <Home className="h-4 w-4 mr-2" />
                back to dashboard
              </Button>
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
        </div>
      </header>

      <main className="container mx-auto px-6 lg:px-12 py-16">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Progress Indicator */}
          {!hasExistingRecommendations && (
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  activeView === 'review' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}>
                  1
                </div>
                <span className={`text-sm font-sans ${
                  activeView === 'review' ? 'text-foreground' : 'text-muted-foreground'
                }`}>Review & Edit Transactions</span>
              </div>
              <div className="w-12 h-px bg-border"></div>
              <div className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  activeView === 'recommendations' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}>
                  2
                </div>
                <span className={`text-sm font-sans ${
                  activeView === 'recommendations' ? 'text-foreground' : 'text-muted-foreground'
                }`}>Get Recommendations</span>
              </div>
            </div>
          )}

          {/* Incomplete Profile Alert */}
          {showRecommendations && (!userProfile?.city || !userPreferences?.fee_sensitivity) && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900">
                These recommendations are based on limited profile data. 
                <Button 
                  variant="link" 
                  className="p-0 h-auto ml-1 text-amber-700 underline"
                  onClick={() => navigate('/profile')}
                >
                  Complete your profile
                </Button> for more accurate matches.
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              {hasExistingRecommendations ? 'your recommendations' : 'your spending analysis'}
            </h2>
            <p className="text-lg font-sans text-muted-foreground">
              {hasExistingRecommendations 
                ? 'personalized credit card recommendations based on your spending'
                : activeView === 'recommendations'
                ? 'personalized credit card recommendations'
                : 'review and correct categories for better recommendations'
              }
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
                  <h3 className="text-xl font-heading font-bold text-foreground mb-3">
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
                <h3 className="text-xl font-heading font-bold text-foreground mb-2">
                  total spending
                </h3>
                <p className="text-3xl font-heading font-bold text-foreground tabular-nums">
                  ₹{analysis.totalSpending?.toLocaleString("en-IN") || "0"}
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
              <h3 className="text-xl font-heading font-bold text-foreground mb-6">
                top spending categories
              </h3>
              <div className="space-y-4">
                {analysis.topCategories.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="font-sans text-foreground">{category.name}</span>
                      <span className="font-sans text-sm text-muted-foreground">
                        {category.percentage.toFixed(1)}%
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
          {showRecommendations && analysis.recommendedCards && analysis.recommendedCards.length > 0 && (
            <>
              <div id="recommendations-section"></div>
              
              {/* Incomplete Profile Alert */}
              {(!userProfile?.city || !userPreferences?.fee_sensitivity) && (
                <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                          Improve Your Recommendations
                        </h3>
                        <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                          Your recommendations are based on spending patterns only. Complete your profile for more personalized matches based on your preferences and location.
                        </p>
                        <div className="flex gap-3">
                          <Button 
                            size="sm"
                            onClick={() => navigate('/profile')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Complete Profile
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const element = document.getElementById('recommendations-list');
                              element?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            See Recommendations
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Low Confidence Warning */}
              {(editedTransactions.length < 20 || otherCount > editedTransactions.length * 0.3) && (
                <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-900 dark:text-amber-100">
                    These recommendations are based on limited data. Upload more statements or recategorize "Other" transactions for better accuracy.
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Summary Panel */}
              <RecommendationSummaryPanel
                savingsMin={analysis.recommendedCards.reduce((min, card) => {
                  const match = card.estimatedSavings?.match(/₹([\d,]+)/);
                  if (match) {
                    const amount = parseInt(match[1].replace(/,/g, ''));
                    return Math.min(min, amount);
                  }
                  return min;
                }, Infinity)}
                savingsMax={analysis.recommendedCards.reduce((max, card) => {
                  const match = card.estimatedSavings?.match(/₹([\d,]+)/);
                  if (match) {
                    const amount = parseInt(match[1].replace(/,/g, ''));
                    return Math.max(max, amount);
                  }
                  return max;
                }, 0)}
                confidence={
                  editedTransactions.length < 20 || otherCount > editedTransactions.length * 0.3
                    ? 'low'
                    : editedTransactions.length > 100
                    ? 'high'
                    : 'medium'
                }
                nextAction={analysis.recommendedCards[0] ? `Apply for ${analysis.recommendedCards[0].name} first` : undefined}
                snapshotId={latestSnapshot?.id}
                recommendedCards={analysis.recommendedCards}
              />
              
              <div className="space-y-6">
                <h3 className="text-2xl font-heading font-bold text-foreground">
                  recommended credit cards
                </h3>
                <div id="recommendations-list" className="grid md:grid-cols-2 gap-6">
                  {analysis.recommendedCards.map((card, index) => (
                    <Card key={index} className="p-8 border-border hover:border-primary/50 transition-colors">
                      <div className="space-y-4">
                         <div className="flex items-start justify-between gap-3">
                           <div className="flex items-start gap-3">
                             <div className="bg-primary/10 p-2 rounded-lg">
                               <CreditCardIcon className="h-5 w-5 text-primary" />
                             </div>
                             <div className="flex-1">
                               <div className="flex items-center gap-2 mb-1">
                                 <h4 className="text-lg font-heading font-bold text-foreground">
                                   {card.name}
                                 </h4>
                                 {card.matchScore && card.matchScore >= 70 && (
                                   <Badge 
                                     variant="secondary" 
                                     className={
                                       card.matchScore >= 85 
                                         ? 'bg-green-500/10 text-green-700 border-green-500/20 text-xs'
                                         : card.matchScore >= 75
                                         ? 'bg-blue-500/10 text-blue-700 border-blue-500/20 text-xs'
                                         : 'bg-amber-500/10 text-amber-700 border-amber-500/20 text-xs'
                                     }
                                   >
                                     {card.matchScore}% match
                                   </Badge>
                                 )}
                               </div>
                               <p className="text-sm font-sans text-muted-foreground">
                                 {card.issuer}
                               </p>
                             </div>
                           </div>
                           <EligibilityIndicator userIncome={userIncome} />
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
                              {card.benefits.slice(0, 3).map((benefit, i) => (
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
                        
                        <div className="space-y-3">
                          <CardStatusDropdown cardId={`${card.issuer}-${card.name}`.replace(/\s/g, '-').toLowerCase()} />
                          <CardActionBar 
                            cardId={`${card.issuer}-${card.name}`.replace(/\s/g, '-').toLowerCase()}
                            issuer={card.issuer}
                            name={card.name}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Go to Dashboard CTA */}
                <Card className="mt-12 bg-gradient-to-br from-primary/5 via-background to-primary/10 border-primary/20">
                  <CardContent className="pt-12 pb-12 text-center">
                    <div className="max-w-2xl mx-auto space-y-6">
                      <div className="inline-flex p-4 bg-primary/10 rounded-full mb-2">
                        <TrendingUp className="w-8 h-8 text-primary" />
                      </div>
                      <h2 className="text-3xl font-heading font-bold text-foreground">
                        Ready to Track Your Progress?
                      </h2>
                      <p className="text-lg text-muted-foreground">
                        Visit your dashboard to manage cards, set fee waiver goals, track lounge access, and get personalized content recommendations.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <Button 
                          size="lg"
                          onClick={() => {
                            trackEvent('results_to_dashboard');
                            navigate('/dashboard');
                          }}
                          className="text-lg px-8"
                        >
                          Go to Dashboard
                        </Button>
                        <Button 
                          size="lg"
                          variant="outline"
                          onClick={() => navigate('/cards')}
                        >
                          Explore All Cards
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Insights */}
          {analysis.insights && analysis.insights.length > 0 && (
            <Card className="p-8 border-border">
              <h3 className="text-xl font-heading font-bold text-foreground mb-6">
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
          {!showRecommendations && editedTransactions.length > 0 && (
            <Card className="p-8 border-border">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-heading font-bold text-foreground">
                  all transactions ({editedTransactions.length})
                </h3>
              </div>

              {/* Warning for Other categories */}
              {otherCount > 0 && (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-sans font-medium text-amber-900 dark:text-amber-100">
                        {otherCount} transaction{otherCount !== 1 ? 's' : ''} categorized as "Other"
                      </p>
                      <p className="text-xs font-sans text-amber-700 dark:text-amber-300 mt-1">
                        Review and recategorize these for more accurate credit card recommendations
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-sans text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 font-sans text-sm font-medium text-muted-foreground">Merchant</th>
                      <th className="text-left py-3 px-4 font-sans text-sm font-medium text-muted-foreground">Category</th>
                      <th className="text-center py-3 px-4 font-sans text-sm font-medium text-muted-foreground">Type</th>
                      <th className="text-right py-3 px-4 font-sans text-sm font-medium text-muted-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editedTransactions.map((transaction, index) => {
                      const txType = transaction.transactionType || 'debit';
                      return (
                        <tr 
                          key={index} 
                          className={`border-b border-border/50 hover:bg-secondary/20 transition-colors ${
                            transaction.category === "Other" ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={transaction.date}
                              onChange={(e) => handleEditTransaction(index, 'date', e.target.value)}
                              className="w-full bg-transparent font-sans text-sm text-foreground border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-2 py-1"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={transaction.merchant}
                              onChange={(e) => handleEditTransaction(index, 'merchant', e.target.value)}
                              className="w-full bg-transparent font-sans text-sm text-foreground border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-2 py-1"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Select
                              value={transaction.category}
                              onValueChange={(value) => handleEditTransaction(index, 'category', value)}
                            >
                              <SelectTrigger className="w-full h-9 font-sans text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORY_OPTIONS.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {txType === 'credit' ? (
                              <ArrowUpCircle className="h-5 w-5 text-green-500 inline-block" />
                            ) : (
                              <ArrowDownCircle className="h-5 w-5 text-orange-500 inline-block" />
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <input
                              type="number"
                              value={transaction.amount}
                              onChange={(e) => handleEditTransaction(index, 'amount', parseFloat(e.target.value) || 0)}
                              className={`w-full bg-transparent font-sans text-sm border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-2 py-1 text-right ${
                                txType === 'credit' ? 'text-green-600 dark:text-green-500' : 'text-foreground'
                              }`}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          {!showRecommendations && (
            <div className="flex gap-4 justify-center pt-8">
              <Button
                onClick={handleFinalizeAndGetRecommendations}
                size="lg"
                disabled={isGeneratingRecommendations}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isGeneratingRecommendations ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    generating recommendations...
                  </>
                ) : (
                  <>
                    <CreditCardIcon className="mr-2 h-5 w-5" />
                    finalize categorization & get recommendations
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Other Category Warning Dialog */}
      <AlertDialog open={showOtherWarning} onOpenChange={setShowOtherWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Many transactions still marked as "Other"</AlertDialogTitle>
            <AlertDialogDescription>
              You have {otherCount} transaction{otherCount !== 1 ? 's' : ''} ({((otherCount / editedTransactions.length) * 100).toFixed(0)}%) 
              still categorized as "Other". Getting recommendations with more specific categories will yield significantly better results.
              <br /><br />
              Would you like to continue anyway or go back to review these transactions?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review Transactions</AlertDialogCancel>
            <AlertDialogAction onClick={generateRecommendations}>
              Continue Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Results;
