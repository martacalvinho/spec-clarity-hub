import React from "react";
import { FileText, Factory, Users } from "lucide-react";

/*
  A visual-only collage of material "cards" to replace the old HeroDashboardPreview.
  Each card is a small panel (div) with light glassmorphism and staggered hover/fade animations via Tailwind classes + arbitrary CSS.
*/

const cards = [
  { id: 1, title: "Spec Sheet.pdf", bg: "bg-white", accent: "bg-coral", rotate: "rotate-[-2deg]", x: "left-1/2 -translate-x-1/2", y: "top-4", w: 280, h: 180, z: "z-20" },
  { id: 2, title: "Materials", bg: "bg-blue-50", accent: "bg-blue-400", rotate: "rotate-[3deg]", x: "-left-4", y: "bottom-12", w: 220, h: 130, z: "z-10" },
  { id: 3, title: "Manufacturers", bg: "bg-amber-50", accent: "bg-amber-400", rotate: "rotate-[-4deg]", x: "right-0", y: "top-24", w: 220, h: 130, z: "z-10" },
  { id: 4, title: "Clients / Projects", bg: "bg-emerald-50", accent: "bg-emerald-400", rotate: "rotate-[5deg]", x: "left-16", y: "top-48", w: 240, h: 140, z: "z-10" },
];

const renderContent = (title: string) => {
  switch (title) {
    case "Spec Sheet.pdf":
      return (
        <div className="h-full flex flex-col text-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-coral" />
              <span className="font-semibold text-xs">Spec Sheet.pdf</span>
            </div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          </div>
          
          {/* Document preview */}
          <div className="flex-1 bg-gray-50 rounded-md p-2 mb-2">
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Project:</span>
                <span className="font-medium">Office Tower</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Architect:</span>
                <span className="font-medium">RIBA Studio</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date:</span>
                <span className="font-medium">Dec 2024</span>
              </div>
            </div>
          </div>
          
          {/* Status */}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-xs text-green-600 font-medium">Indexed</span>
          </div>
        </div>
      );
    case "Materials":
      return (
        <div className="h-full flex flex-col text-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-xs">Materials</span>
            <span className="text-xs text-gray-500">+12 more</span>
          </div>
          
          {/* Table */}
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-xs font-medium text-gray-500 pb-1 border-b border-gray-200">
              <span>Material</span>
              <span>Qty</span>
              <span>Projects</span>
            </div>
            <div className="flex justify-between text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-sm"></div>
                <span>Tile A</span>
              </div>
              <span>120</span>
              <span className="text-gray-500">3</span>
            </div>
            <div className="flex justify-between text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-sm"></div>
                <span>Paint B</span>
              </div>
              <span>75</span>
              <span className="text-gray-500">1</span>
            </div>
            <div className="flex justify-between text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-400 rounded-sm"></div>
                <span>Marble C</span>
              </div>
              <span>45</span>
              <span className="text-gray-500">2</span>
            </div>
          </div>
        </div>
      );
    case "Manufacturers":
      return (
        <div className="h-full flex flex-col text-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-xs">Top Suppliers</span>
            <span className="text-xs bg-gray-100 px-1 rounded">15</span>
          </div>
          
          {/* Supplier list */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">R</div>
                <div>
                  <div className="text-xs font-medium">ROCA</div>
                  <div className="text-xs text-gray-500">Tiles & Fixtures</div>
                </div>
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">15</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">H</div>
                <div>
                  <div className="text-xs font-medium">Hansgrohe</div>
                  <div className="text-xs text-gray-500">Plumbing</div>
                </div>
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">9</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">A</div>
                <div>
                  <div className="text-xs font-medium">AkzoNobel</div>
                  <div className="text-xs text-gray-500">Paints</div>
                </div>
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">6</span>
            </div>
          </div>
        </div>
      );
    case "Clients / Projects":
      return (
        <div className="h-full flex flex-col text-gray-700">
          {/* Header tabs */}
          <div className="flex mb-2 text-xs">
            <span className="text-gray-500 mr-3">Clients</span>
            <span className="font-medium border-b-2 border-emerald-400">Projects</span>
          </div>
          
          {/* Project list */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">O</div>
                <div>
                  <div className="text-xs font-medium">Office Tower</div>
                  <div className="text-xs text-gray-500">RIBA Studio</div>
                </div>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">C</div>
                <div>
                  <div className="text-xs font-medium">CASL HQ</div>
                  <div className="text-xs text-gray-500">Modern Arch</div>
                </div>
              </div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold">C</div>
                <div>
                  <div className="text-xs font-medium">City Mall</div>
                  <div className="text-xs text-gray-500">Retail Design Co</div>
                </div>
              </div>
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        </div>
      );
    default:
      return <span className="text-sm font-semibold">{title}</span>;
  }
};

const HeroMaterialCollage: React.FC = () => {
  return (
    <div className="relative w-[520px] h-[420px] mx-auto lg:mx-0">
      {cards.map((card, idx) => (
        <div
          key={card.id}
          className={`absolute ${card.x} ${card.y} shadow-xl rounded-xl p-4 ${card.bg} backdrop-blur-sm bg-opacity-70 ${card.rotate} transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl animate-fade-in`}
          style={{ width: card.w ?? 220, height: card.h ?? 120, animationDelay: `${idx * 0.2}s` }}
        >
          <div className="w-full h-full rounded-xl bg-white/70 backdrop-blur-sm ring-1 ring-gray-200 overflow-hidden flex flex-col">
              {/* accent strip */}
              <div className={`${card.accent} h-1 w-full`} />
              <div className="flex-1 overflow-hidden p-3">
                {renderContent(card.title)}
              </div>
            </div>
        </div>
      ))}
    </div>
  );
};

export default HeroMaterialCollage;
