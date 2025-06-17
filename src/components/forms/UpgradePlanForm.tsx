
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
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [includeOnboarding, setIncludeOnboarding] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, userProfile, studioId } = useAuth();
  const { toast } = useToast();

  const plans = [
    { id: 'professional', name: 'Professional', description: '500 materials/month' },
    { id: 'enterprise', name: 'Enterprise', description: '1500 materials/month + premium features' }
  ];

  const getOnboardingPrice = (planId: string) => {
    switch (planId) {
      case 'professional': return '$499';
      case 'enterprise': return '$999';
      default: return '$499';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !studioId) return;

    setLoading(true);
    try {
      const onboardingText = includeOnboarding ? ` + Optional onboarding (${getOnboardingPrice(selectedPlan)})` : '';
      const { error } = await supabase
        .from('alerts')
        .insert({
          studio_id: studioId,
          message: `${userProfile?.studios?.name || 'Studio'} requests upgrade to ${selectedPlan} plan${onboardingText}. Additional notes: ${additionalNotes || 'None'}`,
          severity: 'medium',
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Upgrade request submitted",
        description: "We'll contact you soon to discuss your upgrade options.",
      });

      setSelectedPlan('professional');
      setIncludeOnboarding(false);
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
      <DialogContent className="sm:max-w-[425px]">
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
                    <div className="font-medium">{plan.name}</div>
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
              onCheckedChange={setIncludeOnboarding}
            />
            <Label htmlFor="onboarding" className="text-sm">
              Include optional onboarding service ({getOnboardingPrice(selectedPlan)} one-time)
            </Label>
          </div>
          
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
