
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

  const fetchUserProfile = async (userId: string, userEmail: string = '', firstName: string = '', lastName: string = '') => {
    try {
      console.log('Fetching user profile for:', userId);
      
      // First try to get existing profile
      const { data: profile, error } = await supabase
        .from('users')
        .select('*, studios(*)')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
        
        // If it's a different error, try to create a basic profile
        if (userEmail) {
          console.log('Creating new user profile...');
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert({
              id: userId,
              email: userEmail,
              first_name: firstName,
              last_name: lastName,
              role: 'studio_user'
            })
            .select('*, studios(*)')
            .single();
            
          if (createError) {
            console.error('Error creating user profile:', createError);
            setUserProfile(null);
            toast({
              title: "Profile Error",
              description: "Could not create user profile. Please contact support.",
              variant: "destructive"
            });
          } else {
            console.log('User profile created successfully:', newProfile);
            setUserProfile(newProfile);
          }
        } else {
          setUserProfile(null);
          toast({
            title: "Profile Warning",
            description: "Could not load user profile. Some features may be limited.",
            variant: "destructive"
          });
        }
        return;
      }

      if (profile) {
        console.log('User profile found:', profile);
        setUserProfile(profile);
        
        // Check if user has a studio
        if (!profile.studio_id && profile.role !== 'admin') {
          console.log('User has no studio assigned');
          toast({
            title: "Studio Assignment Required",
            description: "Your account needs to be assigned to a studio. Please contact your administrator.",
            variant: "destructive"
          });
        }
      } else {
        // Profile doesn't exist, create one
        console.log('User profile not found, creating basic profile...');
        
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: userEmail,
            first_name: firstName,
            last_name: lastName,
            role: 'studio_user'
          })
          .select('*, studios(*)')
          .single();
          
        if (createError) {
          console.error('Error creating user profile:', createError);
          setUserProfile(null);
          toast({
            title: "Profile Error",
            description: "Could not create user profile. Please contact support.",
            variant: "destructive"
          });
        } else {
          console.log('User profile created successfully:', newProfile);
          setUserProfile(newProfile);
        }
      }
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
      setUserProfile(null);
      toast({
        title: "Connection Error",
        description: "Could not connect to user profile service.",
        variant: "destructive"
      });
    }
  };

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
            await fetchUserProfile(
              session.user.id,
              session.user.email || '',
              session.user.user_metadata?.first_name || '',
              session.user.user_metadata?.last_name || ''
            );
            setLoading(false);
          }, 100);
        } else {
          setUserProfile(null);
          if (mounted) {
            setLoading(false);
          }
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await fetchUserProfile(
              session.user.id,
              session.user.email || '',
              session.user.user_metadata?.first_name || '',
              session.user.user_metadata?.last_name || ''
            );
          }
          
          setLoading(false);
        }
      } catch (err: any) {
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
      } else {
        toast({
          title: "Success",
          description: "You have been signed in successfully."
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
  
  // Provide studioId - either from userProfile or null if admin without assignment
  const contextValue: AuthContextType = {
    user,
    session,
    userProfile,
    loading,
    signIn,
    signOut,
    isAdmin,
    studioId: userProfile?.studio_id || null
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
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
