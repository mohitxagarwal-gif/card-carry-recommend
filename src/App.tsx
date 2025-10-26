import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import OnboardingBasics from "./pages/OnboardingBasics";
import OnboardingFirstCard from "./pages/OnboardingFirstCard";
import Upload from "./pages/Upload";
import Results from "./pages/Results";
import CardsPage from "./pages/CardsPage";
import Admin from "./pages/Admin";
import AdminCardForm from "./pages/AdminCardForm";
import AdminBulkUpload from "./pages/AdminBulkUpload";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
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
          <Route path="/cards" element={<CardsPage />} />
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
          <Route path="/admin" element={
            <ProtectedRoute requireOnboarding={true}>
              <Admin />
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
          <Route path="/admin/bulk-upload" element={
            <ProtectedRoute requireOnboarding={true}>
              <AdminBulkUpload />
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
