
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Package, FolderOpen, MapPin, Building2 } from 'lucide-react';

interface MaterialStats {
  totalMaterials: number;
  totalProjects: number;
  totalLocations: number;
  totalManufacturers: number;
}

const MaterialStatsCards = () => {
  const { studioId } = useAuth();
  const [stats, setStats] = useState<MaterialStats>({
    totalMaterials: 0,
    totalProjects: 0,
    totalLocations: 0,
    totalManufacturers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studioId) {
      fetchStats();
    }
  }, [studioId]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Get total materials count
      const { count: materialsCount } = await supabase
        .from('materials')
        .select('*', { count: 'exact', head: true })
        .eq('studio_id', studioId);

      // Get unique projects count through proj_materials
      const { data: projectsData } = await supabase
        .from('proj_materials')
        .select('project_id')
        .eq('studio_id', studioId);

      const uniqueProjects = new Set(projectsData?.map(p => p.project_id) || []);

      // Get unique locations count
      const { data: materialsData } = await supabase
        .from('materials')
        .select('location')
        .eq('studio_id', studioId)
        .not('location', 'is', null);

      const allLocations = new Set();
      materialsData?.forEach(material => {
        if (material.location) {
          material.location.split(',').forEach(loc => {
            const trimmedLoc = loc.trim();
            if (trimmedLoc) allLocations.add(trimmedLoc);
          });
        }
      });

      // Get total manufacturers count
      const { count: manufacturersCount } = await supabase
        .from('manufacturers')
        .select('*', { count: 'exact', head: true })
        .eq('studio_id', studioId);

      setStats({
        totalMaterials: materialsCount || 0,
        totalProjects: uniqueProjects.size,
        totalLocations: allLocations.size,
        totalManufacturers: manufacturersCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Materials',
      value: stats.totalMaterials,
      icon: Package,
      color: 'text-coral',
      bgColor: 'bg-coral-50',
    },
    {
      title: 'Projects',
      value: stats.totalProjects,
      icon: FolderOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Locations',
      value: stats.totalLocations,
      icon: MapPin,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Manufacturers',
      value: stats.totalManufacturers,
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MaterialStatsCards;
