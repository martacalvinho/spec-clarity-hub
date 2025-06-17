
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Package, TrendingUp, AlertCircle, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const MaterialStatsCards = () => {
  const { studioId } = useAuth();
  const [stats, setStats] = useState({
    totalMaterials: 0,
    topMaterials: [],
    lowStockMaterials: 0
  });

  useEffect(() => {
    if (studioId) {
      fetchMaterialStats();
    }
  }, [studioId]);

  const fetchMaterialStats = async () => {
    try {
      // Get total materials count
      const { count: totalMaterials } = await supabase
        .from('materials')
        .select('*', { count: 'exact', head: true })
        .eq('studio_id', studioId);

      // Get top materials used in projects (limited to 5)
      const { data: topMaterialsData } = await supabase
        .from('proj_materials')
        .select(`
          material_id,
          materials(name),
          count:material_id
        `)
        .eq('studio_id', studioId)
        .limit(5);

      // Process top materials data
      const materialCounts = new Map();
      topMaterialsData?.forEach(item => {
        const materialId = item.material_id;
        const materialName = item.materials?.name;
        if (materialName) {
          materialCounts.set(materialId, {
            name: materialName,
            count: (materialCounts.get(materialId)?.count || 0) + 1
          });
        }
      });

      const topMaterials = Array.from(materialCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Limit to top 5

      setStats({
        totalMaterials: totalMaterials || 0,
        topMaterials,
        lowStockMaterials: 0 // This would need inventory tracking
      });
    } catch (error) {
      console.error('Error fetching material stats:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalMaterials}</div>
          <p className="text-xs text-muted-foreground">
            Materials in your library
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Materials Used</CardTitle>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <Link to="/materials">
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                <Eye className="h-3 w-3 mr-1" />
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.topMaterials.length > 0 ? (
              stats.topMaterials.map((material: any, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="truncate">{material.name}</span>
                  <span className="text-muted-foreground">{material.count}x</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No materials used yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Materials Library</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">Active</div>
          <p className="text-xs text-muted-foreground">
            Library status
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialStatsCards;
