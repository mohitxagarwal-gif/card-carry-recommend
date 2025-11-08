import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useEffect } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { processQueue } from "@/lib/offlineQueue";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { cleanupStaleAnalyses } from "@/lib/sessionManager";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import OnboardingBasics from "./pages/OnboardingBasics";
import OnboardingFirstCard from "./pages/OnboardingFirstCard";
import OnboardingSetup from "./pages/OnboardingSetup";
import OnboardingSpending from "./pages/OnboardingSpending";
import OnboardingTravel from "./pages/OnboardingTravel";
import OnboardingRecap from "./pages/OnboardingRecap";
import Upload from "./pages/Upload";
import Results from "./pages/Results";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Applications from "./pages/Applications";
import CardsPage from "./pages/CardsPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCards from "./pages/AdminCards";
import AdminCardForm from "./pages/AdminCardForm";
import AdminBulkUpload from "./pages/AdminBulkUpload";
import AdminContentList from "./pages/AdminContentList";
import AdminAnalytics from "./pages/AdminAnalytics";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isOnline } = useOnlineStatus();

  useEffect(() => {
    if (isOnline) {
      // Process queued actions when coming back online
      processQueue({
        status_update: async (payload) => {
          await supabase.from("card_applications").update({ status: payload.status }).eq("id", payload.id);
        },
        note_update: async (payload) => {
          await supabase.from("card_applications").update({ notes: payload.notes }).eq("id", payload.id);
        },
        shortlist_add: async (payload) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from("user_shortlist").insert({ user_id: user.id, card_id: payload.cardId });
          }
        },
        reminder_dismiss: async (payload) => {
          await supabase.from("user_reminders").update({ dismissed: true }).eq("id", payload.id);
        },
      }).then(({ processed, failed }) => {
        if (processed > 0) {
          toast.success(`Synced ${processed} offline changes`);
          trackEvent("offline_queue_processed", { count: processed });
        }
        if (failed > 0) {
          toast.error(`${failed} changes failed to sync`, {
            action: {
              label: "Retry",
              onClick: () => window.location.reload(),
            },
          });
        }
      });
    }
  }, [isOnline]);

  useEffect(() => {
    const initSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await cleanupStaleAnalyses(user.id);
      }
    };
    
    initSession();
  }, []);

  return (
    <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/auth" element={<Auth />} />
      <Route path="/onboarding/basics" element={
        <ProtectedRoute requireOnboarding={false}>
          <OnboardingBasics />
        </ProtectedRoute>
      } />
      <Route path="/onboarding/first-card" element={
        <ProtectedRoute requireOnboarding={false}>
          <OnboardingFirstCard />
        </ProtectedRoute>
      } />
      <Route path="/onboarding/setup" element={
        <ProtectedRoute requireOnboarding={false}>
          <OnboardingSetup />
        </ProtectedRoute>
      } />
      <Route path="/onboarding/spending" element={
        <ProtectedRoute requireOnboarding={false}>
          <OnboardingSpending />
        </ProtectedRoute>
      } />
      <Route path="/onboarding/travel" element={
        <ProtectedRoute requireOnboarding={false}>
          <OnboardingTravel />
        </ProtectedRoute>
      } />
      <Route path="/onboarding/recap" element={
        <ProtectedRoute requireOnboarding={false}>
          <OnboardingRecap />
        </ProtectedRoute>
      } />
      <Route path="/cards" element={<CardsPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute requireOnboarding={true}>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute requireOnboarding={true}>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/apps" element={
        <ProtectedRoute requireOnboarding={true}>
          <Applications />
        </ProtectedRoute>
      } />
      <Route path="/upload" element={
        <ProtectedRoute requireOnboarding={true}>
          <Upload />
        </ProtectedRoute>
      } />
      <Route path="/results" element={
        <ProtectedRoute requireOnboarding={true}>
          <Results />
        </ProtectedRoute>
      } />
      <Route path="/recs" element={
        <ProtectedRoute requireOnboarding={true}>
          <Results />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute requireOnboarding={true}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/cards" element={
        <ProtectedRoute requireOnboarding={true}>
          <AdminCards />
        </ProtectedRoute>
      } />
      <Route path="/admin/cards/new" element={
        <ProtectedRoute requireOnboarding={true}>
          <AdminCardForm />
        </ProtectedRoute>
      } />
      <Route path="/admin/cards/:id" element={
        <ProtectedRoute requireOnboarding={true}>
          <AdminCardForm />
        </ProtectedRoute>
      } />
      <Route path="/admin/content" element={
        <ProtectedRoute requireOnboarding={true}>
          <AdminContentList />
        </ProtectedRoute>
      } />
      <Route path="/admin/bulk-upload" element={
        <ProtectedRoute requireOnboarding={true}>
          <AdminBulkUpload />
        </ProtectedRoute>
      } />
      <Route path="/admin/analytics" element={
        <ProtectedRoute requireOnboarding={true}>
          <AdminAnalytics />
        </ProtectedRoute>
      } />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
