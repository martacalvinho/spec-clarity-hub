
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Building, Users, FolderOpen, Package, AlertTriangle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SystemHealthIndicators from './admin/SystemHealthIndicators';
import UsageAnalytics from './admin/UsageAnalytics';
import RecentUserActivity from './admin/RecentUserActivity';
import QuickStudioManagement from './admin/QuickStudioManagement';
import PlatformAnnouncements from './admin/PlatformAnnouncements';

const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [studios, setStudios] = useState<any[]>([]);
  const [selectedStudio, setSelectedStudio] = useState<string>('');
  const [globalStats, setGlobalStats] = useState({
    totalStudios: 0,
    totalProjects: 0,
    totalMaterials: 0,
    activeAlerts: 0
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
      const [projectsCount, materialsCount, alertsCount] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('materials').select('id', { count: 'exact', head: true }),
        supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('status', 'active')
      ]);

      setGlobalStats({
        totalStudios: studiosData?.length || 0,
        totalProjects: projectsCount.count || 0,
        totalMaterials: materialsCount.count || 0,
        activeAlerts: alertsCount.count || 0
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

  const handleViewStudioDashboard = () => {
    if (selectedStudio) {
      navigate(`/studios/${selectedStudio}/dashboard`);
    }
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{globalStats.activeAlerts}</div>
          </CardContent>
        </Card>
      </div>

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

      {/* Studio Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Studio Management</CardTitle>
          <CardDescription>Select a studio to view and manage their data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedStudio} onValueChange={setSelectedStudio}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a studio" />
              </SelectTrigger>
              <SelectContent>
                {studios.map((studio) => (
                  <SelectItem key={studio.id} value={studio.id}>
                    {studio.name} ({studio.subscription_tier})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              disabled={!selectedStudio}
              onClick={handleViewStudioDashboard}
            >
              View Studio Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Studios List */}
      <Card>
        <CardHeader>
          <CardTitle>All Studios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {studios.map((studio) => (
              <div key={studio.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{studio.name}</h3>
                    <Badge className={getSubscriptionColor(studio.subscription_tier)}>
                      {studio.subscription_tier}
                    </Badge>
                    {studio.isAtLimit && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        At Limit
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Monthly Usage:</span> {studio.monthlyMaterialsCount}/{studio.monthlyLimit}
                    </div>
                    <div>
                      <span className="font-medium">Total Materials:</span> {studio.totalMaterialsCount}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {new Date(studio.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleManageUsers(studio.id)}
                  >
                    Manage Users
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewData(studio.id)}
                  >
                    View Data
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
