
import { Upload, Search, CheckCircle, ArrowRight } from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
    {
      icon: Upload,
      title: "Upload Specs",
      description: "Drag 3–5 PDFs—no cleanup needed.",
      number: "1",
      badge: "Instant",
      mockup: (
        <div className="bg-gray-50 rounded-lg p-3 md:p-4 border-2 border-dashed border-gray-300 transition-all duration-300 ease-out hover:border-coral-300 hover:bg-coral-50/30 hover:shadow-md">
          <div className="text-center">
            <Upload className="h-6 w-6 md:h-8 md:w-8 text-gray-400 mx-auto mb-2 transition-all duration-300 ease-out group-hover:text-coral group-hover:scale-110" />
            <p className="text-xs md:text-sm text-gray-600 mb-2">Drop PDF schedules here</p>
            <div className="space-y-1">
              <div className="bg-white rounded px-2 py-1 text-xs text-gray-700 border transform hover:scale-105 transition-all duration-300 ease-out hover:shadow-sm">Floor_Plans_Q3.pdf</div>
              <div className="bg-white rounded px-2 py-1 text-xs text-gray-700 border transform hover:scale-105 transition-all duration-300 ease-out hover:shadow-sm">Material_Schedule_v2.pdf</div>
              <div className="bg-white rounded px-2 py-1 text-xs text-gray-700 border transform hover:scale-105 transition-all duration-300 ease-out hover:shadow-sm">FF&E_Spec.pdf</div>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: Search,
      title: "AI Does the Heavy Lifting",
      description: "Our AI reads every line of your spec sheets—extracting materials, manufacturers, model numbers, and notes automatically. You just watch it happen.",
      number: "2",
      badge: "AI-Powered",
      mockup: (
        <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4 shadow-sm hover:shadow-lg transition-all duration-300 ease-out">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>AI Reading...</span>
              <span className="font-medium text-coral">78%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-coral to-coral-400 h-2 rounded-full shadow-sm transition-all duration-1000 ease-out" style={{ width: '78%' }}></div>
            </div>
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex gap-2 items-center transform hover:translate-x-1 transition-all duration-300 ease-out">
                <span className="bg-coral-100 text-coral-800 px-2 py-1 rounded font-medium">Flooring</span>
                <span className="text-gray-600">Daltile Ceramic</span>
              </div>
              <div className="flex gap-2 items-center transform hover:translate-x-1 transition-all duration-300 ease-out">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">Lighting</span>
                <span className="text-gray-600">Philips LED Panel</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: CheckCircle,
      title: "You Explore",
      description: "Filter by project, typology, or brand. Spot duplicates & discontinued SKUs.",
      number: "3",
      badge: "Smart Search",
      mockup: (
        <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4 shadow-sm hover:shadow-lg transition-all duration-300 ease-out">
          <div className="mb-2">
            <input 
              type="text" 
              placeholder="Search materials..." 
              className="w-full text-xs p-2 border border-gray-300 rounded focus:border-coral focus:ring-1 focus:ring-coral transition-all duration-300 ease-out focus:shadow-sm" 
            />
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-coral-50 hover:border-coral-200 border border-transparent transition-all duration-300 ease-out cursor-pointer group">
              <span className="group-hover:text-coral-700 transition-colors duration-300 ease-out">Acoustic panels</span>
              <span className="text-coral font-semibold bg-coral-100 px-2 py-1 rounded group-hover:bg-coral-200 transition-colors duration-300 ease-out">12 matches</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-coral-50 hover:border-coral-200 border border-transparent transition-all duration-300 ease-out cursor-pointer group">
              <span className="group-hover:text-coral-700 transition-colors duration-300 ease-out">Ceramic tiles</span>
              <span className="text-coral font-semibold bg-coral-100 px-2 py-1 rounded group-hover:bg-coral-200 transition-colors duration-300 ease-out">8 matches</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255, 99, 71) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}></div>
      </div>
      
      <div className="container mx-auto px-4 md:px-6 relative">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Get from specs to searchable library in three simple steps
          </p>
        </div>
        
        {/* Mobile Timeline - Stacked Vertically */}
        <div className="block md:hidden mb-12">
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start space-x-4">
                {/* Step Number Circle */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-coral rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ring-4 ring-coral-100">
                    {step.number}
                  </div>
                </div>
                
                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <step.icon className="h-5 w-5 text-coral" />
                    <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                    <span className="bg-coral text-white px-2 py-1 rounded-full text-xs font-medium">
                      {step.badge}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{step.description}</p>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                    {step.mockup}
                  </div>
                </div>
                
                {/* Connecting Line (except for last item) */}
                {index < steps.length - 1 && (
                  <div className="absolute left-6 mt-12 w-0.5 h-8 bg-gradient-to-b from-coral to-coral-300 opacity-50"></div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Desktop Timeline - Horizontal */}
        <div className="hidden md:flex justify-center mb-12">
          <div className="flex items-center space-x-8 overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center group">
                  <div className="w-12 h-12 bg-coral rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ring-4 ring-coral-100 transition-all duration-300 ease-out hover:ring-coral-200 hover:shadow-xl hover:scale-110">
                    {step.number}
                  </div>
                  <span className="text-sm font-medium text-gray-600 mt-3 transition-colors duration-300 ease-out group-hover:text-coral text-center whitespace-nowrap">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex items-center mx-6">
                    <div className="w-16 h-0.5 bg-gradient-to-r from-coral via-coral-300 to-coral opacity-50"></div>
                    <ArrowRight className="h-4 w-4 text-coral ml-2" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Desktop Cards Grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="relative bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 ease-out hover:scale-[1.02] hover:-translate-y-2 group"
              style={{ 
                animationDelay: `${index * 150}ms`,
                transform: 'translateY(20px)',
                opacity: 0,
                animation: `fade-in 0.8s ease-out ${index * 150}ms forwards`
              }}
            >
              {/* Floating Badge */}
              <div className="absolute -top-3 right-4 bg-coral text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg transform group-hover:scale-110 transition-all duration-300 ease-out">
                {step.badge}
              </div>
              
              {/* Gradient Border on Hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-coral via-transparent to-coral opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-500 ease-out"></div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-coral-50 to-coral-100 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300 ease-out group-hover:scale-110 group-hover:rotate-3">
                  <step.icon className="h-6 w-6 text-coral group-hover:scale-110 transition-all duration-300 ease-out" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-coral transition-colors duration-300 ease-out">{step.title}</h3>
              </div>
              <p className="text-base text-gray-600 leading-relaxed mb-6 group-hover:text-gray-700 transition-colors duration-300 ease-out">{step.description}</p>
              <div className="transition-all duration-300 ease-out group-hover:scale-[1.02] group-hover:shadow-lg rounded-lg overflow-hidden">
                {step.mockup}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
