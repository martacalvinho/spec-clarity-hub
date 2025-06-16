import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (sectionId: string) => {
    // If we're not on the home page, navigate there first
    if (location.pathname !== '/') {
      navigate('/', { replace: true });
      // Wait for navigation to complete before scrolling
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMenuOpen(false);
  };

  const handleAboutClick = () => {
    navigate('/about');
    // Scroll to top when navigating to About page
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
    setIsMenuOpen(false);
  };

  const handleHomeClick = () => {
    navigate('/');
    // Scroll to top when navigating to home page
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <button onClick={handleHomeClick} className="font-bold text-xl text-coral">
            Treqy
          </button>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('how-it-works')}
              className="text-gray-700 hover:text-coral transition-colors"
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToSection('pricing')}
              className="text-gray-700 hover:text-coral transition-colors"
            >
              Pricing
            </button>
            <button 
              onClick={handleAboutClick}
              className="text-gray-700 hover:text-coral transition-colors"
            >
              About
            </button>
            <button 
              onClick={() => scrollToSection('faq')}
              className="text-gray-700 hover:text-coral transition-colors"
            >
              FAQ
            </button>
            <a 
              href="mailto:hello@treqy.com"
              className="text-gray-700 hover:text-coral transition-colors"
            >
              Contact
            </a>
            <Button 
              onClick={() => window.open('http://calendly.com/treqy', '_blank')}
              className="bg-coral hover:bg-coral-600 text-white"
            >
              Book a Demo
            </Button>
            <Button 
              onClick={() => navigate('/login')}
              variant="outline"
              className="border-coral text-coral hover:bg-coral hover:text-white"
            >
              Login
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="text-left text-gray-700 hover:text-coral transition-colors"
              >
                How It Works
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="text-left text-gray-700 hover:text-coral transition-colors"
              >
                Pricing
              </button>
              <button 
                onClick={handleAboutClick}
                className="text-left text-gray-700 hover:text-coral transition-colors"
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('faq')}
                className="text-left text-gray-700 hover:text-coral transition-colors"
              >
                FAQ
              </button>
              <a 
                href="mailto:hello@treqy.com"
                className="text-left text-gray-700 hover:text-coral transition-colors"
              >
                Contact
              </a>
              <Button 
                onClick={() => window.open('http://calendly.com/treqy', '_blank')}
                className="bg-coral hover:bg-coral-600 text-white w-fit"
              >
                Book a Demo
              </Button>
              <Button 
                onClick={() => navigate('/login')}
                variant="outline"
                className="border-coral text-coral hover:bg-coral hover:text-white w-fit"
              >
                Login
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
