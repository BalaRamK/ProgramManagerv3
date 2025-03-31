import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  BarChart3,
  Shield,
  Users,
  LogOut,
  MessageSquare,
  Folder,
  Settings as SettingsIcon,
} from 'lucide-react';

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    checkUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.reload();
  };

  return (
    <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <NavLink to="/" className="flex items-center">
              <img 
                src="/src/assets/ProgramMatrix_logo.png" 
                alt="ProgramMatrix Logo" 
                className="h-8 w-auto mr-2" 
              />
            </NavLink>
            {user && (
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md text-sm font-medium ${
                        isActive
                          ? 'bg-violet-100 text-violet-600'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`
                    }
                  >
                    <LayoutDashboard className="h-4 w-4 inline-block mr-1" />
                    Dashboard
                  </NavLink>
                  <NavLink
                    to="/ai-chat"
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md text-sm font-medium ${
                        isActive
                          ? 'bg-violet-100 text-violet-600'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`
                    }
                  >
                    <MessageSquare className="h-4 w-4 inline-block mr-1" />
                    AI Assistant
                  </NavLink>
                </div>
              </div>
            )}
          </div>
          {user ? (
            <div className="flex items-center">
              <span className="text-gray-600 text-sm mr-3">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 inline-block mr-1" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <NavLink
                  to="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/signup"
                  className="ml-4 inline-flex items-center justify-center rounded-full bg-violet-600 px-6 h-8 text-sm font-medium text-white transition-colors hover:bg-violet-700"
                >
                  Sign Up
                </NavLink>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
