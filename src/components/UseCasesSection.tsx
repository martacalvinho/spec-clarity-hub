
import React from "react";
import { GraduationCap, CheckSquare, Tag } from "lucide-react";

const useCases = [
  {
    title: "New-Hire Onboarding",
    description: "Day-one access to every material ever used—no binder hunt.",
    icon: <GraduationCap className="w-7 h-7 text-blue-600" />,
    circle: "bg-gradient-to-br from-blue-100 to-blue-200",
    bgColor: "bg-gradient-to-br from-blue-50/80 to-blue-100/60",
    borderColor: "border-blue-200/60",
    shadowColor: "hover:shadow-blue-100/50",
  },
  {
    title: "Spec QA",
    description: "Instantly flag duplicates or missing manufacturer info before tender.",
    icon: <CheckSquare className="w-7 h-7 text-green-600" />,
    circle: "bg-gradient-to-br from-green-100 to-green-200",
    bgColor: "bg-gradient-to-br from-green-50/80 to-green-100/60",
    borderColor: "border-green-200/60",
    shadowColor: "hover:shadow-green-100/50",
  },
  {
    title: "Manufacturer Shortlist",
    description: "Auto-generated 'Top 20 brands our studio trusts' list.",
    icon: <Tag className="w-7 h-7 text-amber-600" />,
    circle: "bg-gradient-to-br from-amber-100 to-amber-200",
    bgColor: "bg-gradient-to-br from-amber-50/80 to-coral-50/60",
    borderColor: "border-coral-200/60",
    shadowColor: "hover:shadow-coral-100/50",
  },
];

const UseCasesSection: React.FC = () => {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, rgb(99, 102, 241) 1px, transparent 0)`,
        backgroundSize: '50px 50px'
      }}></div>
      
      <div className="container mx-auto px-6 relative">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Key Use Cases
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
            See how studios are transforming their workflow with Treqy
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {useCases.map((useCase, index) => (
            <div 
              key={index} 
              className={`${useCase.bgColor} ${useCase.borderColor} ${useCase.shadowColor} border-2 rounded-3xl p-8 backdrop-blur-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 animate-fade-in group cursor-default`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className={`mb-6 w-16 h-16 rounded-2xl flex items-center justify-center ${useCase.circle} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {useCase.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors duration-300">
                {useCase.title}
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg group-hover:text-gray-800 transition-colors duration-300">
                {useCase.description}
              </p>
            </div>
          ))}
        </div>
        
        {/* Call to action hint */}
        <div className="text-center mt-16">
          <p className="text-gray-500 font-medium">
            Ready to transform your workflow?
          </p>
          <div className="w-16 h-0.5 bg-coral/30 mx-auto mt-4 rounded-full"></div>
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
