import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import ExploreTeaserSection from "@/components/ExploreTeaserSection";
import AboutTrustSection from "@/components/AboutTrustSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 1. Check for the most recent analysis
        const { data: latestAnalysis } = await supabase
          .from('spending_analyses')
          .select('id, created_at, analysis_data')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        // 2. Check if they have recommendations for this analysis
        const { data: snapshot } = await supabase
          .from('recommendation_snapshots')
          .select('id, analysis_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        // Decision tree:
        if (snapshot) {
          // They have completed recommendations → Dashboard
          navigate('/dashboard', { replace: true });
        } else if (latestAnalysis) {
          // They have an analysis but no recommendations yet
          // Check if analysis is recent (within last 7 days)
          const analysisDate = new Date(latestAnalysis.created_at);
          const daysSinceAnalysis = (Date.now() - analysisDate.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysSinceAnalysis < 7) {
            // Resume at results/transaction review page
            navigate(`/results?analysisId=${latestAnalysis.id}`, { replace: true });
          } else {
            // Analysis is stale → fresh upload
            navigate('/upload', { replace: true });
          }
        } else {
          // No analysis at all → Upload
          navigate('/upload', { replace: true });
        }
      }
    };
    
    checkAuthAndRedirect();
  }, [navigate]);
  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <ExploreTeaserSection />
        <AboutTrustSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
