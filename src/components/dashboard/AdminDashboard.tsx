
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, Users, FolderOpen, Package, AlertTriangle, Search, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SystemHealthIndicators from './admin/SystemHealthIndicators';
import UsageAnalytics from './admin/UsageAnalytics';
import RecentUserActivity from './admin/RecentUserActivity';
import QuickStudioManagement from './admin/QuickStudioManagement';
import PlatformAnnouncements from './admin/PlatformAnnouncements';
import MaterialApprovalQueue from './admin/MaterialApprovalQueue';

const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [studios, setStudios] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState({
    totalStudios: 0,
    totalProjects: 0,
    totalMaterials: 0,
    activeAlerts: 0,
    pendingMaterials: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchGlobalData();
    }
  }, [isAdmin]);

  const subscriptionLimits = {
    starter: 100,
    professional: 500,
    enterprise: 1500
  };

  const fetchGlobalData = async () => {
    try {
      setLoading(true);
      
      // Fetch studios with material counts
      const { data: studiosData } = await supabase
        .from('studios')
        .select('*')
        .order('name');
      
      if (studiosData) {
        // For each studio, get their material counts
        const studiosWithCounts = await Promise.all(
          studiosData.map(async (studio) => {
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
            
            // Get current month materials count
            const { count: monthlyCount } = await supabase
              .from('materials')
              .select('*', { count: 'exact', head: true })
              .eq('studio_id', studio.id)
              .gte('created_at', `${currentMonth}-01T00:00:00.000Z`)
              .lt('created_at', `${getNextMonth(currentMonth)}-01T00:00:00.000Z`);

            // Get total materials count
            const { count: totalCount } = await supabase
              .from('materials')
              .select('*', { count: 'exact', head: true })
              .eq('studio_id', studio.id);

            const monthlyLimit = subscriptionLimits[studio.subscription_tier as keyof typeof subscriptionLimits] || 100;
            const isAtLimit = (monthlyCount || 0) >= monthlyLimit;

            // Create alert if studio is at limit and no active alert exists
            if (isAtLimit) {
              const { data: existingAlert } = await supabase
                .from('alerts')
                .select('id')
                .eq('studio_id', studio.id)
                .eq('status', 'active')
                .ilike('message', '%monthly material limit%')
                .single();

              if (!existingAlert) {
                await supabase
                  .from('alerts')
                  .insert({
                    studio_id: studio.id,
                    message: `${studio.name} has reached their monthly material limit of ${monthlyLimit} materials`,
                    severity: 'high',
                    status: 'active'
                  });
              }
            }

            return {
              ...studio,
              monthlyMaterialsCount: monthlyCount || 0,
              totalMaterialsCount: totalCount || 0,
              monthlyLimit,
              isAtLimit
            };
          })
        );

        setStudios(studiosWithCounts);
      }
      
      // Fetch global stats
      const [projectsCount, materialsCount, alertsCount, pendingMaterialsCount] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('materials').select('id', { count: 'exact', head: true }),
        supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('pending_materials').select('id', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      setGlobalStats({
        totalStudios: studiosData?.length || 0,
        totalProjects: projectsCount.count || 0,
        totalMaterials: materialsCount.count || 0,
        activeAlerts: alertsCount.count || 0,
        pendingMaterials: pendingMaterialsCount.count || 0
      });
    } catch (error) {
      console.error('Error fetching global data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get next month in YYYY-MM format
  const getNextMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
  };

  const handleManageUsers = (studioId: string) => {
    navigate(`/users?studio=${studioId}`);
  };

  const handleViewData = (studioId: string) => {
    navigate(`/studios/${studioId}/dashboard`);
  };

  const getSubscriptionColor = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'bg-purple-100 text-purple-700';
      case 'professional': return 'bg-blue-100 text-blue-700';
      case 'starter': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isAdmin) {
    return <div>Access denied. Admin privileges required.</div>;
  }

  if (loading) {
    return <div className="p-6">Loading admin dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects, clients, materials..."
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* System Health */}
      <SystemHealthIndicators />

      {/* Global Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Studios</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.totalStudios}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.totalProjects}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.totalMaterials}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Materials</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{globalStats.pendingMaterials}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{globalStats.activeAlerts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="materials">Material Approval Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Usage Analytics */}
          <UsageAnalytics />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent User Activity */}
            <RecentUserActivity />

            {/* Quick Studio Management */}
            <QuickStudioManagement />
          </div>

          {/* Platform Announcements */}
          <PlatformAnnouncements />
        </TabsContent>

        <TabsContent value="materials">
          <MaterialApprovalQueue />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
