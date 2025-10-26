import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import ExploreCardsSection from "@/components/ExploreCardsSection";
import AboutTrustSection from "@/components/AboutTrustSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import { CompareProvider } from "@/contexts/CompareContext";
import { CompareDrawer } from "@/components/CompareDrawer";
import { MobileNudges } from "@/components/MobileNudges";

const Index = () => {
  return (
    <CompareProvider>
      <div className="min-h-screen bg-background font-sans">
        <Header />
        <main>
          <HeroSection />
          <HowItWorksSection />
          <ExploreCardsSection />
          <AboutTrustSection />
          <FAQSection />
        </main>
        <Footer />
        <CompareDrawer />
        <MobileNudges />
      </div>
    </CompareProvider>
  );
};

export default Index;
