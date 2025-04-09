import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const ADMIN_EMAIL = 'balaramakrishnasaikarumanchi0@gmail.com';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return user?.email === ADMIN_EMAIL ? <>{children}</> : <Navigate to="/" />;
};

export default AdminRoute; 