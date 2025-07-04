
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, ChevronDown, Check } from "lucide-react";
// import HeroDashboardPreview from "./HeroDashboardPreview";
import HeroMaterialCollage from "./HeroMaterialCollage";
import MobileMaterialView from "./MobileMaterialView";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-blue-50 py-20 md:py-32 pt-24">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-in">
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-[0.95] mb-8">
                Your Studio's
                <br />
                <span className="text-coral bg-gradient-to-r from-coral to-coral-600 bg-clip-text text-transparent">
                  Material Memory,
                </span>
                <br />
                <span className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-gray-700 font-semibold">
                  Powered by AI.
                </span>
              </h1>
            </div>
            <div className="space-y-6 mb-10">
              <p className="text-xl md:text-2xl text-gray-700 font-semibold leading-tight">
                Treqy reads your spec sheets and automatically builds a searchable database of every material your studio has ever used.
              </p>
              
              {/* Enhanced bullet points emphasizing AI automation */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-coral flex-shrink-0" />
                  <div>
                    <span className="text-lg text-gray-900 font-semibold">AI-Powered Extraction:</span>
                    <span className="text-lg text-gray-600 ml-2">Just upload your PDFs. Our system does the rest.</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-coral flex-shrink-0" />
                  <div>
                    <span className="text-lg text-gray-900 font-semibold">Instant Search:</span>
                    <span className="text-lg text-gray-600 ml-2">Find any material, project, or manufacturer in seconds.</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-coral flex-shrink-0" />
                  <div>
                    <span className="text-lg text-gray-900 font-semibold">Permanent Knowledge:</span>
                    <span className="text-lg text-gray-600 ml-2">Protect your studio's most valuable asset—its history.</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <Button 
                onClick={() => navigate('/get-started')}
                size="lg" 
                className="bg-coral hover:bg-coral-600 text-white px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg group w-full sm:w-auto"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => window.open('https://vimeo.com/manage/videos/1095585955/a868b72bf1', '_blank')}
                className="border-2 border-gray-200 text-gray-700 px-8 py-4 text-lg font-medium hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200 group w-full sm:w-auto"
              >
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                View Demo
              </Button>
            </div>
          </div>
          
          {/* Material Collage Visual */}
          <div className="relative hidden lg:block">
            <HeroMaterialCollage />
            {/* Caption under collage */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 font-medium">
              Your complete material history at a glance
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Organize years of materials, manufacturers and projects
              </p>
            </div>
          </div>

          {/* Mobile Alternative */}
          <MobileMaterialView />
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ChevronDown className="h-6 w-6 text-gray-400" />
      </div>
    </section>
  );
};

export default HeroSection;
