
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
import { Building, Plus, Settings, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickStudioManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tierCounts, setTierCounts] = useState({
    starter: 0,
    professional: 0,
    enterprise: 0
  });
  const [formData, setFormData] = useState({
    name: '',
    subscription_tier: 'starter'
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTierCounts();
  }, []);

  const fetchTierCounts = async () => {
    try {
      const { data: studios } = await supabase
        .from('studios')
        .select('subscription_tier');

      if (studios) {
        const counts = studios.reduce((acc, studio) => {
          acc[studio.subscription_tier] = (acc[studio.subscription_tier] || 0) + 1;
          return acc;
        }, { starter: 0, professional: 0, enterprise: 0 });

        setTierCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching tier counts:', error);
    }
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
      fetchTierCounts(); // Refresh counts
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
    // Navigate to studios page for bulk actions
    navigate('/studios');
  };

  const handleManageSubscriptions = () => {
    // Navigate to studios page to manage subscriptions
    navigate('/studios');
  };

  const handleManageTier = (tier: string) => {
    // Navigate to studios page with tier filter
    navigate(`/studios?tier=${tier}`);
  };

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return { color: 'bg-purple-100 text-purple-700', icon: Crown, limit: 'Unlimited' };
      case 'professional':
        return { color: 'bg-blue-100 text-blue-700', icon: Settings, limit: '1000/month' };
      default:
        return { color: 'bg-green-100 text-green-700', icon: Building, limit: '100/month' };
    }
  };

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
                  <Button variant="ghost" size="sm" onClick={() => handleManageTier(tier)}>
                    Manage
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickStudioManagement;
