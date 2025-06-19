
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { MaterialLimitsProvider } from "@/hooks/useMaterialLimits";
import Index from "./pages/Index";
import Dashboard from "./components/dashboard/Dashboard";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Materials from "./pages/Materials";
import Projects from "./pages/Projects";
import Clients from "./pages/Clients";
import Manufacturers from "./pages/Manufacturers";
import ManufacturerDetails from "./pages/ManufacturerDetails";
import ClientDetails from "./pages/ClientDetails";
import ProjectDetails from "./pages/ProjectDetails";
import MaterialDetails from "./pages/MaterialDetails";
import MaterialsByCategory from "./pages/MaterialsByCategory";
import AuthPage from "./components/auth/AuthPage";
import LoginPage from "./components/auth/LoginPage";
import Studios from "./pages/Studios";
import Users from "./pages/Users";
import Alerts from "./pages/Alerts";
import AdminAlerts from "./pages/AdminAlerts";
import AdminPDFSubmissions from "./pages/AdminPDFSubmissions";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import GetStarted from "./pages/GetStarted";
import OnboardingPage from "./pages/OnboardingPage";
import Onboarding from "./pages/Onboarding";
import PDFUpload from "./pages/PDFUpload";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MaterialLimitsProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/about" element={<About />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/get-started" element={<GetStarted />} />
                <Route path="/onboarding-signup" element={<OnboardingPage />} />
                
                {/* Protected routes */}
                <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
                <Route path="/materials" element={<DashboardLayout><Materials /></DashboardLayout>} />
                <Route path="/materials/:id" element={<DashboardLayout><MaterialDetails /></DashboardLayout>} />
                <Route path="/materials/category/:category" element={<DashboardLayout><MaterialsByCategory /></DashboardLayout>} />
                <Route path="/projects" element={<DashboardLayout><Projects /></DashboardLayout>} />
                <Route path="/projects/:id" element={<DashboardLayout><ProjectDetails /></DashboardLayout>} />
                <Route path="/clients" element={<DashboardLayout><Clients /></DashboardLayout>} />
                <Route path="/clients/:id" element={<DashboardLayout><ClientDetails /></DashboardLayout>} />
                <Route path="/manufacturers" element={<DashboardLayout><Manufacturers /></DashboardLayout>} />
                <Route path="/manufacturers/:id" element={<DashboardLayout><ManufacturerDetails /></DashboardLayout>} />
                <Route path="/alerts" element={<DashboardLayout><Alerts /></DashboardLayout>} />
                <Route path="/pdf-upload" element={<DashboardLayout><PDFUpload /></DashboardLayout>} />
                
                {/* Admin routes */}
                <Route path="/studios" element={<DashboardLayout><Studios /></DashboardLayout>} />
                <Route path="/users" element={<DashboardLayout><Users /></DashboardLayout>} />
                <Route path="/admin-alerts" element={<DashboardLayout><AdminAlerts /></DashboardLayout>} />
                <Route path="/admin-pdf-submissions" element={<DashboardLayout><AdminPDFSubmissions /></DashboardLayout>} />
                <Route path="/onboarding" element={<DashboardLayout><Onboarding /></DashboardLayout>} />
                
                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </MaterialLimitsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
