import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, Building, Users, Filter, Package, AlertTriangle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AddStudioForm from '@/components/forms/AddStudioForm';
import EditStudioForm from '@/components/forms/EditStudioForm';
import DeleteStudioForm from '@/components/forms/DeleteStudioForm';

const Studios = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [studios, setStudios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>(
    searchParams.get('tier') || 'all'
  );

  const subscriptionLimits = {
    starter: 100,
    professional: 500,
    enterprise: 1500
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStudios();
    }
  }, [isAdmin]);

  // Update filter when URL parameters change
  useEffect(() => {
    const tierParam = searchParams.get('tier');
    if (tierParam) {
      setSubscriptionFilter(tierParam);
    }
  }, [searchParams]);

  // Update URL when filter changes
  useEffect(() => {
    if (subscriptionFilter !== 'all') {
      setSearchParams({ tier: subscriptionFilter });
    } else {
      setSearchParams({});
    }
  }, [subscriptionFilter, setSearchParams]);

  const fetchStudios = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('studios')
        .select(`
          *,
          users(id, first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (data) {
        // For each studio, get their material counts
        const studiosWithCounts = await Promise.all(
          data.map(async (studio) => {
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
    } catch (error) {
      console.error('Error fetching studios:', error);
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

  const filteredStudios = studios.filter(studio => {
    const matchesSearch = studio.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = subscriptionFilter === 'all' || studio.subscription_tier === subscriptionFilter;
    return matchesSearch && matchesTier;
  });

  const getSubscriptionColor = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'bg-purple-100 text-purple-700';
      case 'professional': return 'bg-blue-100 text-blue-700';
      case 'starter': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleManageUsers = (studioId: string) => {
    navigate(`/users?studio=${studioId}`);
  };

  const handleViewData = (studioId: string) => {
    navigate(`/studios/${studioId}/dashboard`);
  };

  if (!isAdmin) {
    return <div className="p-6">Access denied. Admin privileges required.</div>;
  }

  if (loading) {
    return <div className="p-6">Loading studios...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Studios Management</h1>
        <AddStudioForm onStudioAdded={fetchStudios} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Studios</CardTitle>
              <CardDescription>Manage all studios in the system</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search studios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredStudios.map((studio) => {
              const userCount = studio.users?.length || 0;
              return (
                <div key={studio.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-coral-100 rounded-lg">
                      <Building className="h-6 w-6 text-coral-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{studio.name}</h3>
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
                      <div className="grid grid-cols-4 gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{userCount} user{userCount !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          <span>Monthly: {studio.monthlyMaterialsCount}/{studio.monthlyLimit}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          <span>Total: {studio.totalMaterialsCount}</span>
                        </div>
                        <span>Created: {new Date(studio.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                    <EditStudioForm 
                      studio={studio} 
                      onStudioUpdated={fetchStudios}
                    />
                    <DeleteStudioForm 
                      studio={studio} 
                      onStudioDeleted={fetchStudios}
                    />
                  </div>
                </div>
              );
            })}
            {filteredStudios.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || subscriptionFilter !== 'all' 
                  ? 'No studios found matching your filters.' 
                  : 'No studios yet.'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Studios;
