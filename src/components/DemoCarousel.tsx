
import React from 'react';
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

const DemoCarousel = () => {
  return (
    <section id="demo" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            See It In Action
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Watch how Treqy transforms your material workflow
          </p>
          
          <Button 
            size="lg" 
            className="bg-coral hover:bg-coral-600 text-white px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg group"
            onClick={() => window.open('http://calendly.com/treqy', '_blank')}
          >
            <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
            Book a Demo
          </Button>
        </div>
      </div>
    </section>
  );
};

export default DemoCarousel;
