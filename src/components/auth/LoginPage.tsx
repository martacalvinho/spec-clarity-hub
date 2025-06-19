
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const LoginPage = () => {
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to dashboard if already logged in
  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    await signIn(email, password);
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 flex flex-col">
      {/* Header with back button */}
      <div className="p-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center py-12 px-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome back to
              <br />
              <span className="text-coral bg-gradient-to-r from-coral to-coral-600 bg-clip-text text-transparent">
                Treqy
              </span>
            </h1>
            <p className="text-lg text-gray-600">
              Sign in to access your material dashboard
            </p>
          </div>

          {/* Login Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden backdrop-blur-sm">
            <div className="p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Sign In</h2>
              
              <form onSubmit={handleSignIn} className="space-y-6">
                <div>
                  <Label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className="w-full h-12 px-4 text-base border-gray-200 rounded-xl focus:border-coral focus:ring-coral transition-colors"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    className="w-full h-12 px-4 text-base border-gray-200 rounded-xl focus:border-coral focus:ring-coral transition-colors"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold bg-coral hover:bg-coral-600 text-white rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </div>
          </div>
          
          {/* Footer text */}
          <p className="mt-8 text-center text-sm text-gray-500">
            Don't have an account? <a href="/get-started" className="text-coral hover:underline">Get started here</a>
          </p>

          {/* Decorative elements */}
          <div className="absolute top-20 right-10 w-12 h-12 bg-coral/10 rounded-full animate-pulse hidden lg:block"></div>
          <div className="absolute bottom-20 left-10 w-8 h-8 bg-blue-400/10 rounded-full animate-pulse hidden lg:block" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
