
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserInitialsProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
}

const UserInitials = ({ userId, size = 'sm' }: UserInitialsProps) => {
  const [initials, setInitials] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInitials = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', userId)
          .single();

        if (error) throw error;

        const firstInitial = data.first_name?.charAt(0)?.toUpperCase() || '';
        const lastInitial = data.last_name?.charAt(0)?.toUpperCase() || '';
        setInitials(`${firstInitial}${lastInitial}`);
      } catch (error) {
        console.error('Error fetching user initials:', error);
        setInitials('??');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserInitials();
    }
  }, [userId]);

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  if (loading) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-200 rounded-full flex items-center justify-center animate-pulse`}>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} bg-coral-500 text-white rounded-full flex items-center justify-center font-semibold`}>
      {initials}
    </div>
  );
};

export default UserInitials;
