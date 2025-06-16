import React from "react";
import { GraduationCap, CheckSquare, Tag } from "lucide-react";

const useCases = [
  {
    title: "New-Hire Onboarding",
    description: "Day-one access to every material ever used—no binder hunt.",
    icon: <GraduationCap className="w-6 h-6 text-blue-600" />,
    circle: "bg-blue-100",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    title: "Spec QA",
    description: "Instantly flag duplicates or missing manufacturer info before tender.",
    icon: <CheckSquare className="w-6 h-6 text-green-600" />,
    circle: "bg-green-100",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  {
    title: "Manufacturer Shortlist",
    description: "Auto-generated 'Top 20 brands our studio trusts' list.",
    icon: <Tag className="w-6 h-6 text-amber-600" />,
    circle: "bg-amber-100",
    bgColor: "bg-coral-50",
    borderColor: "border-coral-200",
  },
];

const UseCasesSection: React.FC = () => {
  

const useCases = [
    {
      title: "New-Hire Onboarding",
      description: "Day-one access to every material ever used—no binder hunt.",
      icon: <GraduationCap className="w-6 h-6 text-blue-600" />, circle: "bg-blue-100" ,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      title: "Spec QA",
      description: "Instantly flag duplicates or missing manufacturer info before tender.",
      icon: <CheckSquare className="w-6 h-6 text-green-600" />, circle: "bg-green-100" ,
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      title: "Manufacturer Shortlist",
      description: "Auto-generated 'Top 20 brands our studio trusts' list.",
      icon: <Tag className="w-6 h-6 text-amber-600" />, circle: "bg-amber-100" ,
      bgColor: "bg-coral-50",
      borderColor: "border-coral-200"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Key Use Cases
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See how studios are transforming their workflow with Treqy
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <div key={index} className={`${useCase.bgColor} ${useCase.borderColor} border-2 rounded-xl p-8 ring-1 ring-inset ring-white/70 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in`}>
              <div className={`mb-4 w-12 h-12 rounded-full flex items-center justify-center ${useCase.circle}`}>{useCase.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{useCase.title}</h3>
              <p className="text-gray-700 leading-relaxed line-clamp-2">{useCase.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
