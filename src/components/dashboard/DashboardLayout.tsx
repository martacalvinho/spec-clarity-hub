
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { 
  Menu, 
  Home, 
  Package, 
  FolderOpen, 
  Users, 
  Building2, 
  AlertTriangle, 
  LogOut, 
  Settings, 
  Building,
  UserCog,
  Bell,
  Upload,
  FileText
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, isAdmin, studioId, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [alertsCount, setAlertsCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchAlertsCount();
  }, [user, navigate, studioId]);

  const fetchAlertsCount = async () => {
    if (!studioId) return;
    
    try {
      const { count } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('studio_id', studioId)
        .eq('status', 'active');
      
      setAlertsCount(count || 0);
    } catch (error) {
      console.error('Error fetching alerts count:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Package, label: 'Materials', path: '/materials' },
    { icon: FolderOpen, label: 'Projects', path: '/projects' },
    { icon: Users, label: 'Clients', path: '/clients' },
    { icon: Building2, label: 'Manufacturers', path: '/manufacturers' },
    { icon: Upload, label: 'PDF Upload', path: '/pdf-upload' },
    { 
      icon: AlertTriangle, 
      label: 'Alerts', 
      path: '/alerts',
      badge: alertsCount > 0 ? alertsCount : undefined
    },
  ];

  const adminNavItems = [
    { icon: Building, label: 'Studios', path: '/studios' },
    { icon: UserCog, label: 'Users', path: '/users' },
    { icon: Bell, label: 'Admin Alerts', path: '/admin-alerts' },
    { icon: FileText, label: 'PDF Submissions', path: '/admin-pdf-submissions' },
    { icon: Settings, label: 'Onboarding', path: '/onboarding' },
  ];

  const NavigationItems = ({ onItemClick }: { onItemClick?: () => void }) => (
    <>
      <div className="space-y-2">
        {navItems.map((item) => (
          <Button
            key={item.path}
            variant={location.pathname === item.path ? "default" : "ghost"}
            className={`w-full justify-start ${
              location.pathname === item.path ? "bg-coral text-white" : "text-gray-700"
            }`}
            onClick={() => {
              navigate(item.path);
              onItemClick?.();
            }}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
            {item.badge && (
              <Badge variant="destructive" className="ml-auto">
                {item.badge}
              </Badge>
            )}
          </Button>
        ))}
      </div>
      
      {isAdmin && (
        <>
          <Separator className="my-4" />
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-500 text-sm uppercase tracking-wider px-2">
              Admin Panel
            </h3>
            {adminNavItems.map((item) => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? "default" : "ghost"}
                className={`w-full justify-start ${
                  location.pathname === item.path ? "bg-coral text-white" : "text-gray-700"
                }`}
                onClick={() => {
                  navigate(item.path);
                  onItemClick?.();
                }}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </div>
        </>
      )}
    </>
  );

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-white lg:border-r">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-gray-900">Treqy</h1>
          </div>
          <nav className="mt-8 flex-1 px-2 space-y-2">
            <NavigationItems />
          </nav>
          <div className="flex-shrink-0 px-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex-1 flex flex-col lg:pl-0">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b">
          <h1 className="text-xl font-bold text-gray-900">Treqy</h1>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-full">
                <div className="p-6">
                  <h1 className="text-xl font-bold text-gray-900">Treqy</h1>
                </div>
                <nav className="flex-1 px-2 space-y-2">
                  <NavigationItems onItemClick={() => setMobileMenuOpen(false)} />
                </nav>
                <div className="p-2">
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-700"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
