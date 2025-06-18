
import { Users, Lightbulb, Target, TrendingUp, Quote } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AboutSection = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/get-started');
  };

  return (
    <section id="about" className="py-24 bg-gradient-to-br from-gray-50 via-white to-coral-50/30">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header section */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-coral-100 text-coral-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Users className="h-4 w-4" />
              Meet Our Team
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Architecture Veterans Who've 
              <span className="text-coral block md:inline"> Lived Your Challenges</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Two passionate architects who understand the pain points of material specification 
              and are building the solution the industry needs.
            </p>
          </div>

          {/* Founder Section */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            <div className="group bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start gap-6 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-coral-100 to-coral-200 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <Users className="h-10 w-10 text-coral-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">Marta</h3>
                  <p className="text-coral-600 font-semibold text-lg">Co-Founder</p>
                  <div className="w-12 h-1 bg-coral-200 rounded-full mt-2"></div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg">
                A decade of architectural practice spanning global hubs like Lisbon, London, New York, Chicago, and Tokyo. 
                Moving from studio to studio I intimately understand the challenges architects face. I've lived the reality of navigating complex projects 
                and the often-overlooked goldmine hidden within material specifications.
              </p>
            </div>

            <div className="group bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start gap-6 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-coral-100 to-coral-200 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <Users className="h-10 w-10 text-coral-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">Jed</h3>
                  <p className="text-coral-600 font-semibold text-lg">Co-Founder</p>
                  <div className="w-12 h-1 bg-coral-200 rounded-full mt-2"></div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg">
                Architectural practice experience in Philadelphia and Chicago, combined with hands-on woodworking 
                expertise in New York City. This unique blend of architectural design and craft gives deep insight 
                into material selection, specification challenges, and the critical importance of getting materials right.
              </p>
            </div>
          </div>

          {/* The Aha Moment */}
          <div className="relative bg-gradient-to-r from-coral-500 to-coral-600 rounded-3xl p-12 mb-16 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
            <div className="relative">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Lightbulb className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold">The "Aha!" Moment</h3>
              </div>
              <div className="flex items-start gap-4 mb-6">
                <Quote className="h-8 w-8 text-white/60 flex-shrink-0 mt-1" />
                <blockquote className="text-2xl font-medium italic leading-relaxed">
                  "We knew there had to be a way to transform that chaos into clarity, that history into a powerful, proactive design tool."
                </blockquote>
              </div>
              <p className="text-xl text-white/90 leading-relaxed max-w-4xl">
                Ever felt that critical material knowledge from past projects was just...gone? Lost in old PDFs or forgotten spreadsheets? 
                We've been there. That frustration – seeing valuable data lie dormant while inefficiencies crept in – was the spark for Treqy.
              </p>
            </div>
          </div>

          {/* Mission Section */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Transforming how architects work with materials through intelligent technology
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-coral-100 to-coral-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Target className="h-10 w-10 text-coral-600" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Intuitive Analysis</h4>
                <p className="text-gray-600 leading-relaxed">Automatically analyze specs and reveal actionable insights that would take hours to discover manually</p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-coral-100 to-coral-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Lightbulb className="h-10 w-10 text-coral-600" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Smart Decisions</h4>
                <p className="text-gray-600 leading-relaxed">Make data-driven choices with speed and confidence, backed by your project history</p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-coral-100 to-coral-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-10 w-10 text-coral-600" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Better Outcomes</h4>
                <p className="text-gray-600 leading-relaxed">Boost creativity and slash inefficiencies while maintaining the highest quality standards</p>
              </div>
            </div>
          </div>

          {/* Looking Forward */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-coral-500/10 rounded-full -translate-y-48 translate-x-48"></div>
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-coral-500/5 rounded-full translate-y-36 -translate-x-36"></div>
            <div className="relative">
              <h3 className="text-3xl md:text-4xl font-bold mb-6">Looking Forward</h3>
              <div className="flex items-start gap-4 mb-8">
                <Quote className="h-8 w-8 text-coral-400 flex-shrink-0 mt-1" />
                <blockquote className="text-2xl font-medium italic text-coral-100 leading-relaxed">
                  "We're obsessed with understanding the dynamic needs of modern practice."
                </blockquote>
              </div>
              <p className="text-xl text-gray-300 leading-relaxed mb-10 max-w-4xl">
                Grounded in real-world architectural experience, Treqy isn't just a tool; it's an evolving partner. 
                We're passionately committed to helping you transform your accumulated material knowledge from a simple record 
                into a powerful strategic asset for every future project.
              </p>
              <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm border border-white/20">
                <h4 className="text-2xl font-bold mb-3">Ready to Transform Your Material Knowledge?</h4>
                <p className="text-lg text-gray-300 mb-6">Use Treqy to make smarter material decisions and unlock the potential in your project history.</p>
                <button 
                  onClick={handleGetStarted}
                  className="inline-flex items-center gap-2 bg-coral-500 hover:bg-coral-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 cursor-pointer"
                >
                  Get Started Today
                  <TrendingUp className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
