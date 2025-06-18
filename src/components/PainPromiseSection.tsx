
import { AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";

const PainPromiseSection = () => {
  const painPoints = [
    '"Where did we use that acoustic panel?"',
    'New hires spend weeks digging through old specs.',
    'Duplicate orders waste money and time.'
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 relative overflow-hidden">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255, 99, 71) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
        {/* Improved geometric accents */}
        <div className="absolute top-16 right-1/3 w-40 h-40 border border-coral/8 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 left-1/3 w-28 h-28 border border-coral/6 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-coral/5 rounded-2xl rotate-45"></div>
      </div>
      
      <div className="container mx-auto px-6 relative">
        <div className="grid lg:grid-cols-2 gap-20 items-center max-w-7xl mx-auto">
          {/* Enhanced Pain Points Side */}
          <div className="space-y-10">
            <div className="flex items-center gap-5 mb-12">
              <div className="w-14 h-14 bg-gradient-to-br from-coral/15 to-coral/25 rounded-3xl flex items-center justify-center border border-coral/30 shadow-lg">
                <AlertTriangle className="h-7 w-7 text-coral" />
              </div>
              <h3 className="text-4xl font-bold text-gray-900 tracking-tight">
                Sound Familiar?
              </h3>
            </div>
            
            <div className="space-y-8">
              {painPoints.map((point, index) => (
                <div 
                  key={index} 
                  className="group flex items-start gap-6 p-6 rounded-3xl hover:bg-white/80 hover:shadow-lg transition-all duration-500 hover:scale-[1.02] cursor-default border border-transparent hover:border-gray-100/50 backdrop-blur-sm"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className="w-3 h-3 bg-coral rounded-full mt-4 flex-shrink-0 group-hover:scale-150 transition-all duration-500 shadow-sm"></div>
                  <p className="text-xl text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors duration-300 font-medium">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Enhanced Promise Side */}
          <div className="relative">
            {/* Improved decorative elements */}
            <div className="absolute -top-8 -right-8 w-16 h-16 bg-gradient-to-br from-coral/10 to-coral/20 rounded-3xl rotate-12 shadow-lg"></div>
            <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-gradient-to-br from-coral/15 to-coral/25 rounded-2xl rotate-45 shadow-md"></div>
            
            <div className="relative bg-white/90 backdrop-blur-sm rounded-4xl p-10 border border-gray-100/50 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:scale-[1.02] group">
              {/* Enhanced accent line */}
              <div className="absolute top-0 left-10 right-10 h-1 bg-gradient-to-r from-transparent via-coral/40 to-transparent rounded-full"></div>
              
              <div className="relative">
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-coral to-coral-600 rounded-3xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <CheckCircle className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-4xl font-bold text-gray-900 group-hover:text-coral transition-colors duration-300 tracking-tight">
                    Our Promise
                  </h3>
                </div>
                
                <div className="space-y-6">
                  <p className="text-xl text-gray-700 font-medium leading-relaxed group-hover:text-gray-900 transition-colors duration-300">
                    We organize your materials → build a live, searchable library personalized for your studio's needs.
                  </p>
                  
                  {/* Enhanced Visual Flow Indicator */}
                  <div className="flex items-center gap-4 pt-6 opacity-70 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="flex items-center gap-3 text-sm font-semibold text-coral">
                      <span className="px-4 py-2 bg-gradient-to-r from-coral/10 to-coral/15 rounded-xl border border-coral/20">Upload</span>
                      <ArrowRight className="h-5 w-5 animate-pulse" />
                      <span className="px-4 py-2 bg-gradient-to-r from-coral/10 to-coral/15 rounded-xl border border-coral/20">Organize</span>
                      <ArrowRight className="h-5 w-5 animate-pulse" style={{ animationDelay: '0.5s' }} />
                      <span className="px-4 py-2 bg-gradient-to-r from-coral/10 to-coral/15 rounded-xl border border-coral/20">Search</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced bottom accent */}
        <div className="mt-24 text-center">
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-coral/30 to-transparent mx-auto rounded-full"></div>
        </div>
      </div>
    </section>
  );
};

export default PainPromiseSection;
