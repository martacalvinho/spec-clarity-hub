
import { AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";

const PainPromiseSection = () => {
  const painPoints = [
    '"Where did we use that acoustic panel?"',
    'New hires spend weeks digging through old specs.',
    'Duplicate orders waste money and time.'
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 relative overflow-hidden">
      {/* Simplified Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255, 99, 71) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>
      
      <div className="container mx-auto px-6 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-7xl mx-auto">
          {/* Pain Points Side - Optimized for Mobile */}
          <div className="space-y-8 md:space-y-10">
            <div className="flex items-center gap-4 md:gap-5 mb-8 md:mb-12">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-coral/15 to-coral/25 rounded-2xl md:rounded-3xl flex items-center justify-center border border-coral/30 shadow-lg">
                <AlertTriangle className="h-6 w-6 md:h-7 md:w-7 text-coral" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                Sound Familiar?
              </h3>
            </div>
            
            <div className="space-y-4 md:space-y-6">
              {painPoints.map((point, index) => (
                <div 
                  key={index} 
                  className="group flex items-start gap-4 md:gap-6 p-4 md:p-6 rounded-2xl md:rounded-3xl hover:bg-white/80 hover:shadow-lg transition-all duration-500 hover:scale-[1.02] cursor-default border border-transparent hover:border-gray-100/50 backdrop-blur-sm"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-coral rounded-full mt-3 md:mt-4 flex-shrink-0 group-hover:scale-150 transition-all duration-500 shadow-sm"></div>
                  <p className="text-lg md:text-xl text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors duration-300 font-medium">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Promise Side - Optimized for Mobile */}
          <div className="relative">
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl md:rounded-4xl p-6 md:p-10 border border-gray-100/50 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:scale-[1.02] group">
              {/* Enhanced accent line */}
              <div className="absolute top-0 left-6 right-6 md:left-10 md:right-10 h-1 bg-gradient-to-r from-transparent via-coral/40 to-transparent rounded-full"></div>
              
              <div className="relative">
                <div className="flex items-center gap-4 md:gap-5 mb-6 md:mb-8">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-coral to-coral-600 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <CheckCircle className="h-6 w-6 md:h-7 md:w-7 text-white" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900 group-hover:text-coral transition-colors duration-300 tracking-tight">
                    Our Promise
                  </h3>
                </div>
                
                <div className="space-y-6">
                  <p className="text-lg md:text-xl text-gray-700 font-medium leading-relaxed group-hover:text-gray-900 transition-colors duration-300">
                    We organize your materials → build a live, searchable library personalized for your studio's needs.
                  </p>
                  
                  {/* Enhanced Visual Flow Indicator - Mobile Optimized */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 pt-4 md:pt-6 opacity-70 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold text-coral">
                      <span className="px-3 py-2 bg-gradient-to-r from-coral/10 to-coral/15 rounded-xl border border-coral/20">Upload</span>
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse hidden sm:block" />
                      <span className="px-3 py-2 bg-gradient-to-r from-coral/10 to-coral/15 rounded-xl border border-coral/20">Organize</span>
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse hidden sm:block" style={{ animationDelay: '0.5s' }} />
                      <span className="px-3 py-2 bg-gradient-to-r from-coral/10 to-coral/15 rounded-xl border border-coral/20">Search</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced bottom accent */}
        <div className="mt-16 md:mt-24 text-center">
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-coral/30 to-transparent mx-auto rounded-full"></div>
        </div>
      </div>
    </section>
  );
};

export default PainPromiseSection;
