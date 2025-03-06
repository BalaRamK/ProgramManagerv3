import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    
    checkUser();
    
    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-900">
              ProgramMatrix
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Dashboard
                  </Link>
                
                  <button
                    onClick={handleSignOut}
                    className="inline-flex h-9 items-center justify-center rounded-full bg-gray-900 px-4 text-sm font-medium text-white hover:bg-gray-700"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="inline-flex h-9 items-center justify-center rounded-full bg-white px-4 text-sm font-medium text-gray-900 ring-1 ring-gray-900/10 hover:bg-gray-50 hover:ring-gray-900/20"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    className="inline-flex h-9 items-center justify-center rounded-full bg-gray-900 px-4 text-sm font-medium text-white hover:bg-gray-700"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
