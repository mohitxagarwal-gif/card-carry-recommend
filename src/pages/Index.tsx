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
        // Check if they have a snapshot
        const { data: snapshot } = await supabase
          .from('recommendation_snapshots')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (snapshot) {
          navigate('/dashboard', { replace: true });
        } else {
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
