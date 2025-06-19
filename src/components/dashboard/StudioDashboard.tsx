import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMaterialLimits } from '@/hooks/useMaterialLimits';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { FolderOpen, Package, Building, Users, AlertTriangle, TrendingUp, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddProjectForm from '@/components/forms/AddProjectForm';
import AddMaterialForm from '@/components/forms/AddMaterialForm';
import AddClientForm from '@/components/forms/AddClientForm';
import AddManufacturerForm from '@/components/forms/AddManufacturerForm';

const StudioDashboard = () => {
  const { userProfile, studioId, loading: authLoading } = useAuth();
  const { monthlyCount, monthlyLimit, billingPreference } = useMaterialLimits();
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalMaterials: 0,
    totalManufacturers: 0,
    totalClients: 0,
    activeAlerts: 0
  });
  const [recentMaterials, setRecentMaterials] = useState<any[]>([]);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [topMaterials, setTopMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && studioId) {
      fetchStudioData();
    } else if (!authLoading && !studioId) {
      setError('No studio ID available');
      setLoading(false);
    }
  }, [studioId, authLoading]);

  const fetchStudioData = async () => {
    if (!studioId) {
      setError('No studio ID available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch counts
      const [projectsResult, materialsResult, manufacturersResult, clientsResult, alertsResult] = await Promise.all([
        supabase
          .from('projects')
          .select('id, status', { count: 'exact' })
          .eq('studio_id', studioId),
        supabase
          .from('materials')
          .select('id', { count: 'exact', head: true })
          .eq('studio_id', studioId),
        supabase
          .from('manufacturers')
          .select('id', { count: 'exact', head: true })
          .eq('studio_id', studioId),
        supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('studio_id', studioId),
        supabase
          .from('alerts')
          .select('id', { count: 'exact', head: true })
          .eq('studio_id', studioId)
          .eq('status', 'active')
      ]);

      const activeProjects = (projectsResult.data || []).filter(p => p.status === 'active').length;

      // Fetch recent materials (limit to 3 for compactness)
      const { data: recentMaterialsData } = await supabase
        .from('materials')
        .select('*, manufacturers(name)')
        .eq('studio_id', studioId)
        .order('created_at', { ascending: false })
        .limit(3);

      // Fetch recent projects (limit to 3 for compactness)
      const { data: recentProjectsData } = await supabase
        .from('projects')
        .select('*, clients(name)')
        .eq('studio_id', studioId)
        .order('created_at', { ascending: false })
        .limit(3);

      // Get top materials usage
      const { data: allProjMaterials } = await supabase
        .from('proj_materials')
        .select('material_id, materials(name, category)')
        .eq('studio_id', studioId);

      const materialUsageMap = new Map();
      (allProjMaterials || []).forEach(pm => {
        if (pm.materials) {
          const count = materialUsageMap.get(pm.material_id) || 0;
          materialUsageMap.set(pm.material_id, count + 1);
        }
      });

      const topMaterialsProcessed = Array.from(materialUsageMap.entries())
        .map(([materialId, count]) => {
          const material = (allProjMaterials || []).find(pm => pm.material_id === materialId)?.materials;
          return { material, count, materialId };
        })
        .filter(item => item.material)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      setStats({
        totalProjects: projectsResult.count || 0,
        activeProjects,
        totalMaterials: materialsResult.count || 0,
        totalManufacturers: manufacturersResult.count || 0,
        totalClients: clientsResult.count || 0,
        activeAlerts: alertsResult.count || 0
      });

      setRecentMaterials(recentMaterialsData || []);
      setRecentProjects(recentProjectsData || []);
      setTopMaterials(topMaterialsProcessed || []);
    } catch (error: any) {
      console.error('Error fetching studio data:', error);
      setError(error.message || 'An unexpected error occurred');
      // Set default empty arrays to prevent map errors
      setRecentMaterials([]);
      setRecentProjects([]);
      setTopMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDataUpdated = () => {
    fetchStudioData();
  };

  if (authLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          <p>Error loading dashboard: {error}</p>
          <Button onClick={fetchStudioData} variant="outline" className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  const getUsageColor = () => {
    const percentage = (monthlyCount / monthlyLimit) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75)   'text-yellow-600';
    return 'text-coral-600';
  };

  const getBillingStatusText = () => {
    switch (billingPreference) {
      case 'per_material':
        return 'Per-material billing enabled';
      case 'upgrade_pending':
        return 'Upgrade request pending';
      case 'blocked':
      default:
        return 'Materials blocked at limit';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{userProfile?.studios?.name || 'Studio Dashboard'}</h1>
          <p className="text-gray-600 mt-1">Studio Dashboard</p>
        </div>
      </div>

      {/* Compact Usage Overview */}
      <Card className="bg-gradient-to-r from-coral-50 to-orange-50 border-coral-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-xl font-bold ${getUsageColor()}`}>
                {monthlyCount}/{monthlyLimit}
              </div>
              <p className="text-xs text-coral-600">Materials this month</p>
              {monthlyCount >= monthlyLimit && (
                <p className="text-xs text-gray-500 mt-1">{getBillingStatusText()}</p>
              )}
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{stats.activeProjects}</div>
              <p className="text-xs text-gray-600">Active projects</p>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{stats.totalMaterials}</div>
              <p className="text-xs text-gray-600">Materials library</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <AddProjectForm onProjectAdded={handleDataUpdated} />
            <AddMaterialForm onMaterialAdded={handleDataUpdated} />
            <AddClientForm onClientAdded={handleDataUpdated} />
            <AddManufacturerForm onManufacturerAdded={handleDataUpdated} />
          </div>
        </CardContent>
      </Card>

      {/* Compact Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Link to="/projects">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <FolderOpen className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <div className="text-lg font-bold">{stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">Projects</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/materials">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <Package className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <div className="text-lg font-bold">{stats.totalMaterials}</div>
              <p className="text-xs text-muted-foreground">Materials</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/manufacturers">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <Building className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <div className="text-lg font-bold">{stats.totalManufacturers}</div>
              <p className="text-xs text-muted-foreground">Manufacturers</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/clients">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <div className="text-lg font-bold">{stats.totalClients}</div>
              <p className="text-xs text-muted-foreground">Clients</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/alerts">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <div className="text-lg font-bold text-red-600">{stats.activeAlerts}</div>
              <p className="text-xs text-muted-foreground">Alerts</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Compact Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              Recent Materials
              <Link to="/materials" className="text-sm text-coral-600 hover:text-coral-700">View all</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {(recentMaterials || []).map((material) => (
                <Link key={material.id} to={`/materials/${material.id}`}>
                  <div className="flex items-center justify-between hover:bg-gray-50 p-2 rounded cursor-pointer">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{material.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {material.category} • {material.manufacturers?.name || 'No manufacturer'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
              {(recentMaterials || []).length === 0 && (
                <p className="text-gray-500 text-center py-4 text-sm">No materials yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              Recent Projects
              <Link to="/projects" className="text-sm text-coral-600 hover:text-coral-700">View all</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {(recentProjects || []).map((project) => (
                <Link key={project.id} to={`/projects/${project.id}`}>
                  <div className="flex items-center justify-between hover:bg-gray-50 p-2 rounded cursor-pointer">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{project.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {project.type} • {project.clients?.name || 'No client'}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      project.status === 'active' ? 'bg-green-100 text-green-700' :
                      project.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </Link>
              ))}
              {(recentProjects || []).length === 0 && (
                <p className="text-gray-500 text-center py-4 text-sm">No projects yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              Top Materials Used
              <Link to="/materials?sortBy=most_projects" className="text-sm text-coral-600 hover:text-coral-700">View all</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {(topMaterials || []).map((item, index) => (
                <Link key={item.materialId} to={`/materials/${item.materialId}`}>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{item.material.name}</p>
                      <p className="text-xs text-gray-500 truncate">{item.material.category}</p>
                    </div>
                    <span className="text-sm font-bold text-coral-600">{item.count}</span>
                  </div>
                </Link>
              ))}
              {(topMaterials || []).length === 0 && (
                <p className="text-gray-500 text-center py-4 text-sm">No usage data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudioDashboard;
