
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Users, Building, Package } from 'lucide-react';

const UsageAnalytics = () => {
  const [growthData, setGrowthData] = useState({
    weeklyGrowth: {
      users: { count: 0, percentage: 0 },
      studios: { count: 0, percentage: 0 },
      materials: { count: 0, percentage: 0 }
    },
    monthlyGrowth: {
      users: { count: 0, percentage: 0 },
      studios: { count: 0, percentage: 0 },
      materials: { count: 0, percentage: 0 }
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrowthData();
  }, []);

  const fetchGrowthData = async () => {
    try {
      setLoading(true);

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Get weekly counts
      const [weeklyUsers, weeklyStudios, weeklyMaterials] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', oneWeekAgo.toISOString()),
        supabase.from('studios').select('id', { count: 'exact', head: true }).gte('created_at', oneWeekAgo.toISOString()),
        supabase.from('materials').select('id', { count: 'exact', head: true }).gte('created_at', oneWeekAgo.toISOString())
      ]);

      // Get previous week counts for comparison
      const [prevWeekUsers, prevWeekStudios, prevWeekMaterials] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', twoWeeksAgo.toISOString()).lt('created_at', oneWeekAgo.toISOString()),
        supabase.from('studios').select('id', { count: 'exact', head: true }).gte('created_at', twoWeeksAgo.toISOString()).lt('created_at', oneWeekAgo.toISOString()),
        supabase.from('materials').select('id', { count: 'exact', head: true }).gte('created_at', twoWeeksAgo.toISOString()).lt('created_at', oneWeekAgo.toISOString())
      ]);

      // Get monthly counts
      const [monthlyUsers, monthlyStudios, monthlyMaterials] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', oneMonthAgo.toISOString()),
        supabase.from('studios').select('id', { count: 'exact', head: true }).gte('created_at', oneMonthAgo.toISOString()),
        supabase.from('materials').select('id', { count: 'exact', head: true }).gte('created_at', oneMonthAgo.toISOString())
      ]);

      // Get previous month counts for comparison
      const [prevMonthUsers, prevMonthStudios, prevMonthMaterials] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', twoMonthsAgo.toISOString()).lt('created_at', oneMonthAgo.toISOString()),
        supabase.from('studios').select('id', { count: 'exact', head: true }).gte('created_at', twoMonthsAgo.toISOString()).lt('created_at', oneMonthAgo.toISOString()),
        supabase.from('materials').select('id', { count: 'exact', head: true }).gte('created_at', twoMonthsAgo.toISOString()).lt('created_at', oneMonthAgo.toISOString())
      ]);

      const calculatePercentage = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      setGrowthData({
        weeklyGrowth: {
          users: {
            count: weeklyUsers.count || 0,
            percentage: calculatePercentage(weeklyUsers.count || 0, prevWeekUsers.count || 0)
          },
          studios: {
            count: weeklyStudios.count || 0,
            percentage: calculatePercentage(weeklyStudios.count || 0, prevWeekStudios.count || 0)
          },
          materials: {
            count: weeklyMaterials.count || 0,
            percentage: calculatePercentage(weeklyMaterials.count || 0, prevWeekMaterials.count || 0)
          }
        },
        monthlyGrowth: {
          users: {
            count: monthlyUsers.count || 0,
            percentage: calculatePercentage(monthlyUsers.count || 0, prevMonthUsers.count || 0)
          },
          studios: {
            count: monthlyStudios.count || 0,
            percentage: calculatePercentage(monthlyStudios.count || 0, prevMonthStudios.count || 0)
          },
          materials: {
            count: monthlyMaterials.count || 0,
            percentage: calculatePercentage(monthlyMaterials.count || 0, prevMonthMaterials.count || 0)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching growth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const GrowthCard = ({ title, icon: Icon, data, period }: any) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(data).map(([key, value]: [string, any]) => {
          const isPositive = value.percentage >= 0;
          const IconComponent = isPositive ? TrendingUp : TrendingDown;
          const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
          
          return (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {key === 'users' && <Users className="h-4 w-4 text-gray-500" />}
                {key === 'studios' && <Building className="h-4 w-4 text-gray-500" />}
                {key === 'materials' && <Package className="h-4 w-4 text-gray-500" />}
                <span className="capitalize text-sm font-medium">{key}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">{value.count}</span>
                <div className={`flex items-center gap-1 ${colorClass}`}>
                  <IconComponent className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {Math.abs(value.percentage).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading growth data...</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading growth data...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <GrowthCard
        title="Weekly Growth"
        icon={TrendingUp}
        data={growthData.weeklyGrowth}
        period="week"
      />
      <GrowthCard
        title="Monthly Growth"
        icon={TrendingUp}
        data={growthData.monthlyGrowth}
        period="month"
      />
    </div>
  );
};

export default UsageAnalytics;
