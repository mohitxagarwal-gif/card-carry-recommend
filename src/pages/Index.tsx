import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import ExploreTeaserSection from "@/components/ExploreTeaserSection";
import AboutTrustSection from "@/components/AboutTrustSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import { MobileNudges } from "@/components/MobileNudges";

const Index = () => {
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
      <MobileNudges />
    </div>
  );
};

export default Index;
