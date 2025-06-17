
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Building, Plus, Settings, Crown, Users, Package, AlertTriangle, ArrowLeft, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickStudioManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [tierCounts, setTierCounts] = useState({
    starter: 0,
    professional: 0,
    enterprise: 0
  });
  const [allStudios, setAllStudios] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    subscription_tier: 'starter'
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const subscriptionLimits = {
    starter: 100,
    professional: 500,
    enterprise: 1500
  };

  useEffect(() => {
    fetchAllStudios();
  }, []);

  const fetchAllStudios = async () => {
    try {
      setLoading(true);
      const { data: studios } = await supabase
        .from('studios')
        .select(`
          *,
          users(id, first_name, last_name)
        `)
        .order('name');

      if (studios) {
        // For each studio, get their material counts
        const studiosWithCounts = await Promise.all(
          studios.map(async (studio) => {
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

        setAllStudios(studiosWithCounts);
        
        // Calculate tier counts
        const counts = studiosWithCounts.reduce((acc, studio) => {
          acc[studio.subscription_tier] = (acc[studio.subscription_tier] || 0) + 1;
          return acc;
        }, { starter: 0, professional: 0, enterprise: 0 });
        
        setTierCounts(counts);
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

  const handleCreateStudio = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Studio name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('studios')
        .insert([{
          name: formData.name,
          subscription_tier: formData.subscription_tier as any
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Studio created successfully"
      });

      setFormData({ name: '', subscription_tier: 'starter' });
      setIsCreateOpen(false);
      fetchAllStudios(); // Refresh studios
    } catch (error) {
      console.error('Error creating studio:', error);
      toast({
        title: "Error",
        description: "Failed to create studio",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkActions = () => {
    navigate('/studios');
  };

  const handleManageSubscriptions = () => {
    navigate('/studios');
  };

  const handleManageUsers = (studioId: string) => {
    navigate(`/users?studio=${studioId}`);
  };

  const handleViewData = (studioId: string) => {
    navigate(`/studios/${studioId}/dashboard`);
  };

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return { color: 'bg-purple-100 text-purple-700', icon: Crown, limit: 'Unlimited' };
      case 'professional':
        return { color: 'bg-blue-100 text-blue-700', icon: Settings, limit: '500/month' };
      default:
        return { color: 'bg-green-100 text-green-700', icon: Building, limit: '100/month' };
    }
  };

  const getSubscriptionColor = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'bg-purple-100 text-purple-700';
      case 'professional': return 'bg-blue-100 text-blue-700';
      case 'starter': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Filter studios based on tier
  const filteredStudios = allStudios.filter(studio => {
    return tierFilter === 'all' || studio.subscription_tier === tierFilter;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Quick Studio Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Studio
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Studio</DialogTitle>
                  <DialogDescription>
                    Create a new studio with subscription settings
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="studio-name">Studio Name</Label>
                    <Input
                      id="studio-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter studio name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subscription-tier">Subscription Tier</Label>
                    <Select 
                      value={formData.subscription_tier} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, subscription_tier: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleCreateStudio} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? 'Creating...' : 'Create Studio'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="w-full" onClick={handleBulkActions}>
              <Settings className="h-4 w-4 mr-2" />
              Bulk Actions
            </Button>

            <Button variant="outline" className="w-full" onClick={handleManageSubscriptions}>
              <Crown className="h-4 w-4 mr-2" />
              Manage Subscriptions
            </Button>
          </div>

          {/* Subscription Tier Overview with Counts */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Subscription Tiers</h4>
            {(['starter', 'professional', 'enterprise'] as const).map((tier) => {
              const tierInfo = getTierInfo(tier);
              const Icon = tierInfo.icon;
              const count = tierCounts[tier];
              
              return (
                <div key={tier} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className={tierInfo.color}>
                          {tier.charAt(0).toUpperCase() + tier.slice(1)}
                        </Badge>
                        <span className="text-sm font-medium text-gray-900">
                          {count} studio{count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Materials: {tierInfo.limit}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* All Studios with Tier Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-gray-700">All Studios</h4>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={tierFilter} onValueChange={setTierFilter}>
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
            </div>

            {loading ? (
              <div className="text-center py-4">Loading studios...</div>
            ) : (
              <div className="space-y-4">
                {filteredStudios.map((studio) => {
                  const userCount = studio.users?.length || 0;
                  return (
                    <div key={studio.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-coral-100 rounded-lg">
                          <Building className="h-5 w-5 text-coral-600" />
                        </div>
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
                          <div className="grid grid-cols-3 gap-4 text-sm text-gray-500">
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
                      </div>
                    </div>
                  );
                })}
                {filteredStudios.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {tierFilter !== 'all' 
                      ? `No ${tierFilter} studios found.`
                      : 'No studios found.'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickStudioManagement;
