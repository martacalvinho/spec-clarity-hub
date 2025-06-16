import { AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";

const PainPromiseSection = () => {
  const painPoints = [
    '"Where did we use that acoustic panel?"',
    'New hires spend weeks digging through old specs.',
    'Duplicate orders waste money and time.'
  ];

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Modern Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255, 99, 71) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}></div>
        {/* Subtle geometric accents */}
        <div className="absolute top-20 right-1/4 w-32 h-32 border border-coral/10 rounded-full"></div>
        <div className="absolute bottom-32 left-1/4 w-24 h-24 border border-coral/5 rounded-full"></div>
      </div>
      
      <div className="container mx-auto px-6 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          {/* Pain Points Side */}
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-coral/10 rounded-2xl flex items-center justify-center border border-coral/20">
                <AlertTriangle className="h-6 w-6 text-coral" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">
                Sound Familiar?
              </h3>
            </div>
            
            <div className="space-y-6">
              {painPoints.map((point, index) => (
                <div 
                  key={index} 
                  className="group flex items-start gap-4 p-5 rounded-2xl hover:bg-gray-50/80 hover:shadow-sm transition-all duration-300 hover:scale-[1.01] cursor-default border border-transparent hover:border-gray-100"
                >
                  <div className="w-2 h-2 bg-coral rounded-full mt-3 flex-shrink-0 group-hover:scale-125 transition-transform duration-300"></div>
                  <p className="text-xl text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors duration-300">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Promise Side */}
          <div className="relative">
            {/* Modern decorative elements */}
            <div className="absolute -top-6 -right-6 w-12 h-12 bg-coral/5 rounded-2xl rotate-12"></div>
            <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-coral/10 rounded-xl rotate-45"></div>
            
            <div className="relative bg-white rounded-3xl p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] group">
              {/* Subtle accent line */}
              <div className="absolute top-0 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-coral/30 to-transparent"></div>
              
              <div className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-coral rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 group-hover:text-coral transition-colors duration-300">
                    Our Promise
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <p className="text-xl text-gray-700 font-medium leading-relaxed group-hover:text-gray-900 transition-colors duration-300">
                    We organize your materials → build a live, searchable library personalized for your studio's needs.
                  </p>
                  
                  {/* Visual Flow Indicator */}
                  <div className="flex items-center gap-3 pt-4 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-2 text-sm font-medium text-coral">
                      <span className="px-2 py-1 bg-coral/10 rounded-lg">Upload</span>
                      <ArrowRight className="h-4 w-4" />
                      <span className="px-2 py-1 bg-coral/10 rounded-lg">Organize</span>
                      <ArrowRight className="h-4 w-4" />
                      <span className="px-2 py-1 bg-coral/10 rounded-lg">Search</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modern bottom accent */}
        <div className="mt-20 text-center">
          <div className="w-16 h-0.5 bg-coral/20 mx-auto"></div>
        </div>
      </div>
    </section>
  );
};

export default PainPromiseSection;
