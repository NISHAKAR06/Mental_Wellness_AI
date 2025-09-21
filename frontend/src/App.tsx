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
import DrAliceJohnson from "./pages/features/psychologists/DrAliceJohnson";
import DrCarolWhite from "./pages/features/psychologists/DrCarolWhite";
import DrEveBlack from "./pages/features/psychologists/DrEveBlack";
import EmotionMonitoring from "./pages/features/EmotionMonitoring";
import SessionSummarizer from "./pages/features/SessionSummarizer";
import AiGaming from "./pages/features/AiGaming";
import PeerSupport from "./pages/features/PeerSupport";
import Multilingual from "./pages/features/Multilingual";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import SessionGuidelines from "./pages/SessionGuidelines";
import VideoCall from "./pages/VideoCall";
import VideoCallSimple from "./pages/VideoCallSimple";
import Pricing from "./pages/Pricing";

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
                  <Route path="/dashboard/psychologists/alice-johnson" element={<DrAliceJohnson />} />
                  <Route path="/dashboard/psychologists/carol-white" element={<DrCarolWhite />} />
                  <Route path="/dashboard/psychologists/eve-black" element={<DrEveBlack />} />
                  <Route path="/dashboard/emotion-monitoring" element={<EmotionMonitoring />} />
                  <Route path="/dashboard/session-summarizer" element={<SessionSummarizer />} />
                  <Route path="/dashboard/ai-gaming" element={<AiGaming />} />
                  <Route path="/dashboard/peer-support" element={<PeerSupport />} />
                  <Route path="/dashboard/multilingual" element={<Multilingual />} />
                  <Route path="/dashboard/pricing" element={<Pricing />} />
                  <Route path="/dashboard/settings" element={<Settings />} />
                </Route>
                <Route path="/session-guidelines" element={<SessionGuidelines />} />
                <Route path="/video-call" element={<VideoCall />} />
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
