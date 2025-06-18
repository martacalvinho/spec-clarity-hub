
import React from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import PricingCalculator from "./PricingCalculator";
import { useNavigate } from "react-router-dom";

const PricingSection = () => {
  const navigate = useNavigate();

  const monthlyPlans = [
    {
      name: "Starter",
      price: "$29",
      period: "month",
      description: "Up to 100 materials/month",
      subtitle: "Ideal for small studios with light usage.",
      isPopular: false,
      slug: "starter"
    },
    {
      name: "Studio",
      price: "$89",
      period: "month", 
      description: "Up to 500 materials/month",
      subtitle: "Designed for most active studios.",
      isPopular: true,
      slug: "studio"
    },
    {
      name: "Growth",
      price: "$299",
      period: "month",
      description: "Up to 1,500 materials/month", 
      subtitle: "For large firms managing many projects.",
      isPopular: false,
      slug: "growth"
    }
  ];

  const onboardingPlans = [
    {
      name: "Starter",
      description: "Includes setup of up to 100 materials",
      price: "$99",
      period: "one-time optional onboarding",
      slug: "starter"
    },
    {
      name: "Studio",
      description: "Includes setup of up to 500 materials",
      price: "$499",
      period: "one-time optional onboarding",
      slug: "studio"
    },
    {
      name: "Growth",
      description: "Includes setup of up to 1,500 materials",
      price: "$999",
      period: "one-time optional onboarding",
      slug: "growth"
    }
  ];

  const handleGetStarted = (plan: any) => {
    navigate(`/get-started?plan=${plan.slug}`);
  };

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h2>
        </div>

        <Tabs defaultValue="monthly" className="w-full max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 max-w-xs sm:max-w-lg mx-auto mb-12 h-auto">
            <TabsTrigger value="monthly" className="text-xs sm:text-sm px-2 py-2 sm:py-2.5">Monthly Pricing</TabsTrigger>
            <TabsTrigger value="onboarding" className="text-xs sm:text-sm px-2 py-2 sm:py-2.5">Optional Onboarding</TabsTrigger>
            <TabsTrigger value="calculator" className="text-xs sm:text-sm px-2 py-2 sm:py-2.5">Calculator</TabsTrigger>
          </TabsList>
          
          <TabsContent value="monthly">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
              {monthlyPlans.map((plan, index) => (
                <div key={index} className={`bg-white border-2 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow relative flex flex-col ${plan.isPopular ? 'border-coral' : 'border-gray-200'}`}>
                  {plan.isPopular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-coral text-white text-xs sm:text-sm">
                      Most Popular
                    </Badge>
                  )}
                  <div className="text-center mb-6 flex-grow">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                      {plan.price}<span className="text-base sm:text-lg font-normal text-gray-600">/{plan.period}</span>
                    </div>
                    
                    <p className="text-gray-900 font-medium mb-2 text-sm sm:text-base">{plan.description}</p>
                    <p className="text-gray-600 text-xs sm:text-sm">{plan.subtitle}</p>
                  </div>
                  
                  <Button 
                    className="w-full bg-coral hover:bg-coral-600 text-white font-semibold py-3 mt-auto text-sm sm:text-base"
                    onClick={() => handleGetStarted(plan)}
                  >
                    Get Started
                  </Button>
                </div>
              ))}
            </div>
            <div className="text-center mt-8 px-4">
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                Extra materials: $1.50/month each • Enterprise plans available for 1,500+ materials • No limit on number of users per studio
              </p>
              <p className="text-gray-700 font-medium text-sm sm:text-base">
                Billed via invoice. Bank transfer only.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="onboarding">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
              {onboardingPlans.map((plan, index) => (
                <div key={index} className="bg-white border-2 border-gray-200 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow flex flex-col">
                  <div className="text-center mb-6 flex-grow">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-6 text-sm sm:text-base">{plan.description}</p>
                    
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                      {plan.price}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">{plan.period}</div>
                  </div>
                  
                  <Button 
                    className="w-full bg-coral hover:bg-coral-600 text-white font-semibold py-3 mt-auto text-sm sm:text-base"
                    onClick={() => handleGetStarted(plan)}
                  >
                    Get Started
                  </Button>
                </div>
              ))}
            </div>
            <div className="text-center mt-8 px-4">
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                Extra materials: $1.50 each • Enterprise onboarding available for 1,500+ materials • No limit on number of users per studio
              </p>
              <p className="text-gray-700 font-medium text-sm sm:text-base">
                Billed via invoice. Bank transfer only.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="calculator">
            <div className="max-w-2xl mx-auto px-4">
              <PricingCalculator />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default PricingSection;
