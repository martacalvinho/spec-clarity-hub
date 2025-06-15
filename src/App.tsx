
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import GetStarted from "./pages/GetStarted";
import AuthPage from "./components/auth/AuthPage";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Dashboard from "./components/dashboard/Dashboard";
import Materials from "./pages/Materials";
import MaterialDetails from "./pages/MaterialDetails";
import MaterialsByCategory from "./pages/MaterialsByCategory";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import Manufacturers from "./pages/Manufacturers";
import ManufacturerDetails from "./pages/ManufacturerDetails";
import Clients from "./pages/Clients";
import ClientDetails from "./pages/ClientDetails";
import Alerts from "./pages/Alerts";
import Studios from "./pages/Studios";
import Users from "./pages/Users";
import AdminAlerts from "./pages/AdminAlerts";
import Onboarding from "./pages/Onboarding";
import OnboardingPage from "./pages/OnboardingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/get-started" element={<GetStarted />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/onboarding-start" element={<OnboardingPage />} />
              
              {/* Protected Dashboard Routes */}
              <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
              <Route path="/materials" element={<DashboardLayout><Materials /></DashboardLayout>} />
              <Route path="/materials/:id" element={<DashboardLayout><MaterialDetails /></DashboardLayout>} />
              <Route path="/materials/category/:category" element={<DashboardLayout><MaterialsByCategory /></DashboardLayout>} />
              <Route path="/projects" element={<DashboardLayout><Projects /></DashboardLayout>} />
              <Route path="/projects/:id" element={<DashboardLayout><ProjectDetails /></DashboardLayout>} />
              <Route path="/manufacturers" element={<DashboardLayout><Manufacturers /></DashboardLayout>} />
              <Route path="/manufacturers/:id" element={<DashboardLayout><ManufacturerDetails /></DashboardLayout>} />
              <Route path="/clients" element={<DashboardLayout><Clients /></DashboardLayout>} />
              <Route path="/clients/:id" element={<DashboardLayout><ClientDetails /></DashboardLayout>} />
              <Route path="/alerts" element={<DashboardLayout><Alerts /></DashboardLayout>} />
              
              {/* Admin Routes */}
              <Route path="/studios" element={<DashboardLayout><Studios /></DashboardLayout>} />
              <Route path="/users" element={<DashboardLayout><Users /></DashboardLayout>} />
              <Route path="/admin-alerts" element={<DashboardLayout><AdminAlerts /></DashboardLayout>} />
              <Route path="/onboarding" element={<DashboardLayout><Onboarding /></DashboardLayout>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
