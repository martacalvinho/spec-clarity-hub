
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  LayoutDashboard, 
  FolderOpen, 
  Package, 
  Building, 
  Users, 
  Bell,
  Settings,
  AlertTriangle
} from 'lucide-react';
import ChangePasswordForm from '@/components/forms/ChangePasswordForm';
import ContactUsForm from '@/components/forms/ContactUsForm';
import UpgradePlanForm from '@/components/forms/UpgradePlanForm';
import CancelSubscriptionForm from '@/components/forms/CancelSubscriptionForm';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, userProfile, signOut, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user needs studio assignment
  if (userProfile && !userProfile.studio_id && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Account Pending</h2>
          <p className="text-gray-600 mb-4">
            Your account is created but needs to be assigned to a studio by an administrator.
            Please contact support for assistance.
          </p>
          <Button onClick={signOut} variant="outline">
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  const navigationItems = isAdmin ? [
    { icon: LayoutDashboard, label: 'Admin Dashboard', href: '/dashboard' },
    { icon: Building, label: 'Studios', href: '/studios' },
    { icon: Users, label: 'Users', href: '/users' },
    { icon: AlertTriangle, label: 'Send Alerts', href: '/admin-alerts' },
    { icon: Settings, label: 'Onboarding', href: '/onboarding' },
  ] : [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: FolderOpen, label: 'Projects', href: '/projects' },
    { icon: Package, label: 'Materials', href: '/materials' },
    { icon: Building, label: 'Manufacturers', href: '/manufacturers' },
    { icon: Users, label: 'Clients', href: '/clients' },
    { icon: Bell, label: 'Alerts', href: '/alerts' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gray-900">
            {isAdmin ? 'Admin Panel' : userProfile?.studios?.name || 'Materials Dashboard'}
          </h1>
          {userProfile && (
            <p className="text-sm text-gray-500">
              {userProfile.first_name} {userProfile.last_name}
            </p>
          )}
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-coral-100 text-coral-700 font-medium' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t space-y-2">
          {!isAdmin && (
            <>
              <ContactUsForm />
              <UpgradePlanForm />
              <CancelSubscriptionForm />
            </>
          )}
          <ChangePasswordForm />
          <Button
            onClick={signOut}
            variant="ghost"
            className="w-full justify-start text-gray-700"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
