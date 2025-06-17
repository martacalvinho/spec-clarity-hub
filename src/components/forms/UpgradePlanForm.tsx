
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const UpgradePlanForm = () => {
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('studio');
  const [includeOnboarding, setIncludeOnboarding] = useState(false);
  const [selectedOnboardingTier, setSelectedOnboardingTier] = useState('studio');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, userProfile, studioId } = useAuth();
  const { toast } = useToast();

  const plans = [
    { id: 'studio', name: 'Studio', description: '500 materials/month', price: '$89/month' },
    { id: 'growth', name: 'Growth', description: '1500 materials/month', price: '$299/month' }
  ];

  const onboardingOptions = [
    { 
      id: 'starter', 
      name: 'Starter Onboarding', 
      materials: '100 materials',
      price: '$99',
      description: 'Includes setup of up to 100 materials'
    },
    { 
      id: 'studio', 
      name: 'Studio Onboarding', 
      materials: '500 materials',
      price: '$499',
      description: 'Includes setup of up to 500 materials'
    },
    { 
      id: 'growth', 
      name: 'Growth Onboarding', 
      materials: '1,500 materials',
      price: '$999',
      description: 'Includes setup of up to 1,500 materials'
    },
    { 
      id: 'custom', 
      name: 'Custom Onboarding', 
      materials: '1,500+ materials',
      price: 'Custom pricing',
      description: 'For studios with more than 1,500 materials - price to be discussed'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !studioId) return;

    setLoading(true);
    try {
      const selectedPlanData = plans.find(p => p.id === selectedPlan);
      const selectedOnboardingData = includeOnboarding ? onboardingOptions.find(o => o.id === selectedOnboardingTier) : null;
      
      let onboardingText = '';
      if (includeOnboarding && selectedOnboardingData) {
        onboardingText = ` + ${selectedOnboardingData.name} (${selectedOnboardingData.price} one-time)`;
      }

      const { error } = await supabase
        .from('alerts')
        .insert({
          studio_id: studioId,
          message: `${userProfile?.studios?.name || 'Studio'} requests upgrade to ${selectedPlanData?.name} plan (${selectedPlanData?.price})${onboardingText}. Additional notes: ${additionalNotes || 'None'}`,
          severity: 'medium',
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Upgrade request submitted",
        description: "We'll contact you soon to discuss your upgrade options.",
      });

      setSelectedPlan('studio');
      setIncludeOnboarding(false);
      setSelectedOnboardingTier('studio');
      setAdditionalNotes('');
      setOpen(false);
    } catch (error) {
      console.error('Error submitting upgrade request:', error);
      toast({
        title: "Error",
        description: "Failed to submit upgrade request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentTier = userProfile?.studios?.subscription_tier;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start text-gray-700">
          <TrendingUp className="h-4 w-4 mr-2" />
          Upgrade Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upgrade Your Plan</DialogTitle>
          <DialogDescription>
            Currently on {currentTier} plan. Choose your new plan below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Select Plan</Label>
            <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className="mt-2">
              {plans.map((plan) => (
                <div key={plan.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={plan.id} id={plan.id} />
                  <Label htmlFor={plan.id} className="flex-1">
                    <div className="font-medium">{plan.name} - {plan.price}</div>
                    <div className="text-sm text-gray-500">{plan.description}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="onboarding" 
              checked={includeOnboarding}
              onCheckedChange={(checked) => setIncludeOnboarding(checked === true)}
            />
            <Label htmlFor="onboarding" className="text-sm">
              Include optional onboarding service
            </Label>
          </div>

          {includeOnboarding && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <Label>Select Onboarding Package</Label>
              <RadioGroup value={selectedOnboardingTier} onValueChange={setSelectedOnboardingTier}>
                {onboardingOptions.map((option) => (
                  <div key={option.id} className="flex items-start space-x-2">
                    <RadioGroupItem value={option.id} id={`onboarding-${option.id}`} className="mt-1" />
                    <Label htmlFor={`onboarding-${option.id}`} className="flex-1">
                      <div className="font-medium">{option.name} - {option.price}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                      <div className="text-xs text-gray-500">{option.materials}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <div className="text-xs text-gray-600 mt-2">
                Extra materials: $1.50 each above your chosen onboarding plan
              </div>
            </div>
          )}
          
          <div>
            <Label htmlFor="notes">Additional Notes (optional)</Label>
            <Textarea
              id="notes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any specific requirements or questions?"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Request Upgrade"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradePlanForm;
