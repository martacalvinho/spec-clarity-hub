
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStudioOverride } from '@/components/dashboard/StudioSpecificDashboard';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  studioId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && event !== 'SIGNED_OUT') {
          // Use setTimeout to prevent potential deadlocks
          setTimeout(async () => {
            if (!mounted) return;
            
            try {
              const { data: profile, error } = await supabase
                .from('users')
                .select('*, studios(*)')
                .eq('id', session.user.id)
                .single();
              
              if (error) {
                console.error('Error fetching user profile:', error);
              } else if (mounted) {
                setUserProfile(profile);
              }
            } catch (err) {
              console.error('Error in profile fetch:', err);
            }
          }, 0);
        } else {
          setUserProfile(null);
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        });
      }

      return { error };
    } catch (err) {
      console.error('Sign in error:', err);
      const error = { message: 'An unexpected error occurred during sign in' };
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const signOut = async () => {
    console.log('Starting sign out process...');
    
    // Clear local state immediately
    setUserProfile(null);
    setUser(null);
    setSession(null);
    
    try {
      // Only attempt Supabase sign out if we have a session
      if (session) {
        await supabase.auth.signOut();
        console.log('Supabase sign out completed');
      } else {
        console.log('No session to sign out from');
      }
    } catch (err) {
      console.error('Supabase sign out error (ignoring):', err);
    }
    
    // Show success message
    toast({
      title: "Signed out",
      description: "You have been signed out successfully."
    });
    
    // Force navigate to homepage
    console.log('Redirecting to homepage...');
    window.location.href = '/';
  };

  const isAdmin = userProfile?.role === 'admin';
  
  return (
    <AuthContext.Provider value={{
      user,
      session,
      userProfile,
      loading,
      signIn,
      signOut,
      isAdmin,
      studioId: userProfile?.studio_id
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  const studioOverride = useStudioOverride();
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // If we're in a studio override context (admin viewing a specific studio), use that studio ID
  const effectiveStudioId = studioOverride || context.studioId;
  
  return {
    ...context,
    studioId: effectiveStudioId
  };
}
