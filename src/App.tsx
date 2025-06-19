
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { MaterialLimitsProvider } from "@/hooks/useMaterialLimits";
import Index from "./pages/Index";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import GetStarted from "./pages/GetStarted";
import LoginPage from "./components/auth/LoginPage";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Dashboard from "./components/dashboard/Dashboard";
import StudioSpecificDashboard from "./components/dashboard/StudioSpecificDashboard";
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
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected Dashboard Routes - Wrapped with MaterialLimitsProvider */}
              <Route path="/dashboard" element={
                <MaterialLimitsProvider>
                  <DashboardLayout><Dashboard /></DashboardLayout>
                </MaterialLimitsProvider>
              } />
              
              {/* Studio-specific dashboard route for admin users */}
              <Route path="/studios/:studioId/dashboard" element={
                <MaterialLimitsProvider>
                  <DashboardLayout><StudioSpecificDashboard /></DashboardLayout>
                </MaterialLimitsProvider>
              } />
              
              <Route path="/materials" element={
                <MaterialLimitsProvider>
                  <DashboardLayout><Materials /></DashboardLayout>
                </MaterialLimitsProvider>
              } />
              <Route path="/materials/:id" element={
                <MaterialLimitsProvider>
                  <DashboardLayout><MaterialDetails /></DashboardLayout>
                </MaterialLimitsProvider>
              } />
              <Route path="/materials/category/:category" element={
                <MaterialLimitsProvider>
                  <DashboardLayout><MaterialsByCategory /></DashboardLayout>
                </MaterialLimitsProvider>
              } />
              <Route path="/projects" element={
                <MaterialLimitsProvider>
                  <DashboardLayout><Projects /></DashboardLayout>
                </MaterialLimitsProvider>
              } />
              <Route path="/projects/:id" element={
                <MaterialLimitsProvider>
                  <DashboardLayout><ProjectDetails /></DashboardLayout>
                </MaterialLimitsProvider>
              } />
              <Route path="/manufacturers" element={
                <MaterialLimitsProvider>
                  <DashboardLayout><Manufacturers /></DashboardLayout>
                </MaterialLimitsProvider>
              } />
              <Route path="/manufacturers/:id" element={
                <MaterialLimitsProvider>
                  <DashboardLayout><ManufacturerDetails /></DashboardLayout>
                </MaterialLimitsProvider>
              } />
              <Route path="/clients" element={
                <MaterialLimitsProvider>
                  <DashboardLayout><Clients /></DashboardLayout>
                </MaterialLimitsProvider>
              } />
              <Route path="/clients/:id" element={
                <MaterialLimitsProvider>
                  <DashboardLayout><ClientDetails /></DashboardLayout>
                </MaterialLimitsProvider>
              } />
              <Route path="/alerts" element={
                <MaterialLimitsProvider>
                  <DashboardLayout><Alerts /></DashboardLayout>
                </MaterialLimitsProvider>
              } />
              
              {/* Admin Routes */}
              <Route path="/studios" element={
                <MaterialLimitsProvider>
                  <DashboardLayout><Studios /></DashboardLayout>
                </MaterialLimitsProvider>
              } />
              <Route path="/users" element={
                <MaterialLimitsProvider>
                  <DashboardLayout><Users /></DashboardLayout>
                </MaterialLimitsProvider>
              } />
              <Route path="/admin-alerts" element={
                <MaterialLimitsProvider>
                  <DashboardLayout><AdminAlerts /></DashboardLayout>
                </MaterialLimitsProvider>
              } />
              <Route path="/onboarding" element={
                <MaterialLimitsProvider>
                  <DashboardLayout><Onboarding /></DashboardLayout>
                </MaterialLimitsProvider>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
