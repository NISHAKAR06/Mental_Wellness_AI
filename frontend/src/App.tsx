import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./components/layout/DashboardLayout";
import VideoConferencing from "./pages/features/VideoConferencing";
import EmotionMonitoring from "./pages/features/EmotionMonitoring";
import SessionSummarizer from "./pages/features/SessionSummarizer";
import AiGaming from "./pages/features/AiGaming";
import PeerSupport from "./pages/features/PeerSupport";
import Multilingual from "./pages/features/Multilingual";
import Lifestyle from "./pages/features/Lifestyle";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/dashboard/video-conferencing" element={<VideoConferencing />} />
                  <Route path="/dashboard/emotion-monitoring" element={<EmotionMonitoring />} />
                  <Route path="/dashboard/session-summarizer" element={<SessionSummarizer />} />
                  <Route path="/dashboard/ai-gaming" element={<AiGaming />} />
                  <Route path="/dashboard/peer-support" element={<PeerSupport />} />
                  <Route path="/dashboard/multilingual" element={<Multilingual />} />
                  <Route path="/dashboard/lifestyle" element={<Lifestyle />} />
                  <Route path="/dashboard/settings" element={<Settings />} />
                </Route>
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
