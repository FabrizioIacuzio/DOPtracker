import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppDataProvider } from "@/contexts/AppDataContext";
import AppLayout from "@/components/AppLayout";
import Onboarding from "@/pages/Onboarding";
import HomePage from "@/pages/HomePage";
import CalendarPage from "@/pages/CalendarPage";
import BatchForm from "@/pages/BatchForm";
import DashboardPage from "@/pages/DashboardPage";
import LabReportsPage from "@/pages/LabReportsPage";
import DocumentsPage from "@/pages/DocumentsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AppDataProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route element={<AppLayout />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/batch/new" element={<BatchForm />} />
                <Route path="/batch/:id" element={<BatchForm />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/lab-reports" element={<LabReportsPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
              </Route>
              <Route path="/" element={<Navigate to="/onboarding" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AppDataProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
