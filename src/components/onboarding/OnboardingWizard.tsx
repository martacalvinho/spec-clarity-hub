
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Mail, Calendar, CreditCard, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type SubscriptionTier = 'starter' | 'professional' | 'enterprise';

interface OnboardingWizardProps {
  onComplete: () => void;
}

const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('starter');
  const [wantsHistoric, setWantsHistoric] = useState<boolean | null>(null);
  const [historicOption, setHistoricOption] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  const subscriptionPlans = [
    {
      id: 'starter' as SubscriptionTier,
      name: 'Starter',
      price: '$29/month',
      materials: 100,
      overageCost: '$0.50',
      features: ['100 materials/month', 'Basic project tracking', 'Email support']
    },
    {
      id: 'professional' as SubscriptionTier,
      name: 'Professional',
      price: '$79/month',
      materials: 500,
      overageCost: '$0.30',
      features: ['500 materials/month', 'Advanced analytics', 'Priority support', 'Client management']
    },
    {
      id: 'enterprise' as SubscriptionTier,
      name: 'Enterprise',
      price: '$199/month',
      materials: 1500,
      overageCost: '$0.20',
      features: ['1500 materials/month', 'Custom integrations', 'Dedicated support', 'Advanced reporting']
    }
  ];

  const historicImportOptions = [
    {
      id: 'basic',
      name: 'Basic Historic Import',
      price: '$299',
      description: 'Up to 3 years of project history, 500 materials maximum',
      timeframe: '2-3 weeks'
    },
    {
      id: 'comprehensive',
      name: 'Comprehensive Historic Import',
      price: '$599',
      description: 'Complete studio history, unlimited materials and projects',
      timeframe: '3-4 weeks'
    },
    {
      id: 'premium',
      name: 'Premium Historic Import + Setup',
      price: '$999',
      description: 'Complete history + custom categorization + 1-hour training session',
      timeframe: '4-5 weeks'
    }
  ];

  const handleSubscriptionSubmit = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Create an alert for admin to review subscription request
      const { error } = await supabase
        .from('alerts')
        .insert({
          studio_id: userProfile?.studio_id,
          message: `New subscription request: ${userProfile?.studios?.name || 'Studio'} wants to upgrade to ${selectedTier} plan.`,
          severity: 'medium',
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Subscription Request Submitted",
        description: "Our team will review your request and activate your subscription within 24 hours.",
      });

      if (wantsHistoric) {
        setCurrentStep(4); // Go to historic import step
      } else {
        setCurrentStep(5); // Go to completion step
      }
    } catch (error) {
      console.error('Error submitting subscription:', error);
      toast({
        title: "Error",
        description: "Failed to submit subscription request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHistoricSubmit = async () => {
    if (!user || !historicOption) return;
    
    setLoading(true);
    try {
      const selectedHistoricPlan = historicImportOptions.find(opt => opt.id === historicOption);
      
      // Create alert for historic import request
      const { error } = await supabase
        .from('alerts')
        .insert({
          studio_id: userProfile?.studio_id,
          message: `Historic import request: ${userProfile?.studios?.name || 'Studio'} selected ${selectedHistoricPlan?.name} (${selectedHistoricPlan?.price}). Contact: ${user.email}`,
          severity: 'high',
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Historic Import Requested",
        description: "We'll contact you within 48 hours to schedule your import process.",
      });

      setCurrentStep(6); // Go to historic pending step
    } catch (error) {
      console.error('Error submitting historic import:', error);
      toast({
        title: "Error",
        description: "Failed to submit historic import request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = subscriptionPlans.find(plan => plan.id === selectedTier);

  if (currentStep === 1) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Choose Your Subscription Plan</CardTitle>
          <CardDescription>
            Select the plan that best fits your studio's needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedTier} onValueChange={(value) => setSelectedTier(value as SubscriptionTier)}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subscriptionPlans.map((plan) => (
                <div key={plan.id} className="relative">
                  <RadioGroupItem value={plan.id} id={plan.id} className="sr-only" />
                  <Label 
                    htmlFor={plan.id} 
                    className={`block p-6 border rounded-lg cursor-pointer transition-all ${
                      selectedTier === plan.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <h3 className="text-xl font-semibold">{plan.name}</h3>
                      <p className="text-2xl font-bold text-blue-600 mt-2">{plan.price}</p>
                      <p className="text-gray-600 mt-1">{plan.materials} materials/month</p>
                      <div className="mt-4 space-y-2">
                        {plan.features.map((feature, index) => (
                          <p key={index} className="text-sm text-gray-600">✓ {feature}</p>
                        ))}
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
          <div className="mt-8 text-center">
            <Button onClick={() => setCurrentStep(2)} size="lg">
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentStep === 2) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Plan Details</CardTitle>
          <CardDescription>
            Here's what you'll get with your {selectedPlan?.name} plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold">{selectedPlan?.name}</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{selectedPlan?.price}</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-semibold text-lg mb-4">Monthly Allocation</h4>
              <p className="text-lg">
                <span className="font-bold text-green-600">{selectedPlan?.materials} materials</span> included per month
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Track unlimited projects and manage your complete material library
              </p>
            </div>

            <div className="bg-orange-50 p-6 rounded-lg">
              <h4 className="font-semibold text-lg mb-4">Overage Pricing</h4>
              <p className="text-lg">
                <span className="font-bold text-orange-600">{selectedPlan?.overageCost}</span> per additional material
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Only pay for what you use beyond your monthly allocation
              </p>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Change Plan
              </Button>
              <Button onClick={() => setCurrentStep(3)} className="flex-1">
                Continue
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentStep === 3) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Historic Material Import</CardTitle>
          <CardDescription>
            Do you want to import your existing material library and project history?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                The Power of Your Complete Material History
              </h4>
              <ul className="space-y-2 text-sm">
                <li>• Track material usage patterns across all past projects</li>
                <li>• Identify cost-saving opportunities from historical data</li>
                <li>• Make informed decisions based on your complete material library</li>
                <li>• Seamlessly reference past specifications and suppliers</li>
                <li>• Generate comprehensive reports across your entire project timeline</li>
              </ul>
            </div>

            <RadioGroup value={wantsHistoric?.toString()} onValueChange={(value) => setWantsHistoric(value === 'true')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="yes-historic" />
                <Label htmlFor="yes-historic" className="font-medium">
                  Yes, I want to import my historic material data
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="no-historic" />
                <Label htmlFor="no-historic" className="font-medium">
                  No, I'll start fresh with new projects
                </Label>
              </div>
            </RadioGroup>

            {wantsHistoric === true && (
              <div className="mt-6">
                <h4 className="font-semibold mb-4">Choose Your Import Package:</h4>
                <RadioGroup value={historicOption} onValueChange={setHistoricOption}>
                  <div className="space-y-4">
                    {historicImportOptions.map((option) => (
                      <div key={option.id} className="border rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <RadioGroupItem value={option.id} id={option.id} />
                          <Label htmlFor={option.id} className="font-medium">
                            {option.name}
                          </Label>
                          <Badge variant="secondary">{option.price}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 ml-6">{option.description}</p>
                        <p className="text-xs text-gray-500 ml-6 mt-1">Completion time: {option.timeframe}</p>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Back
              </Button>
              <Button 
                onClick={handleSubscriptionSubmit} 
                disabled={loading || (wantsHistoric === true && !historicOption)}
                className="flex-1"
              >
                {loading ? 'Processing...' : 'Continue to Payment'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentStep === 4 && wantsHistoric) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Historic Import Process</CardTitle>
          <CardDescription>
            Complete your historic material import setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Subscription Request Submitted!</h3>
              <p className="text-gray-600">Your {selectedPlan?.name} plan will be activated within 24 hours.</p>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Next Steps for Historic Import
              </h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Option 1: Schedule a Meeting</p>
                    <p className="text-sm text-gray-600">We'll contact you within 48 hours to schedule an initial consultation call</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Option 2: Email Your Files</p>
                    <p className="text-sm text-gray-600">
                      Send PDFs of the projects you want included to{' '}
                      <a href="mailto:hello@treqy.com" className="text-blue-600 underline">
                        hello@treqy.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button onClick={() => setCurrentStep(6)} variant="outline">
                I Understand - Continue
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentStep === 5) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Welcome to Your Material Dashboard!</CardTitle>
          <CardDescription>
            Your subscription request has been submitted
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-xl font-semibold mb-2">You're Almost Ready!</h3>
              <p className="text-gray-600">
                Our team will review and activate your {selectedPlan?.name} subscription within 24 hours.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-semibold mb-2">What happens next:</h4>
              <ul className="text-sm text-gray-600 space-y-1 text-left">
                <li>• Admin will process your payment and activate your subscription</li>
                <li>• You'll receive an email confirmation when your account is ready</li>
                <li>• You can then start adding materials and managing projects</li>
              </ul>
            </div>
            <Button onClick={onComplete}>
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentStep === 6) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Historic Import In Progress</CardTitle>
          <CardDescription>
            Your material import is being processed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-6">
            <Clock className="h-16 w-16 text-orange-500 mx-auto" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Import Process Started</h3>
              <p className="text-gray-600">
                Your historic material import is now in our queue. We'll contact you soon!
              </p>
            </div>
            <div className="bg-orange-50 p-6 rounded-lg">
              <h4 className="font-semibold mb-2 text-orange-800">Platform Access Restricted</h4>
              <p className="text-sm text-orange-700">
                Full platform features will be available once your historic import is complete.
                You can still explore the interface but cannot add new materials until the import is finished.
              </p>
            </div>
            <Button onClick={onComplete} variant="outline">
              View Limited Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default OnboardingWizard;
