import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const ADMIN_EMAIL = 'balaramakrishnasaikarumanchi0@gmail.com';

interface PendingUser {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

export function AdminVerification() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      setError(null);
      setDebugInfo(null);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        setError('Authentication error');
        setDebugInfo(JSON.stringify(userError, null, 2));
        navigate('/');
        return;
      }

      if (!user) {
        console.log('No user found');
        setError('No authenticated user found');
        navigate('/');
        return;
      }

      if (user.email !== ADMIN_EMAIL) {
        console.log('Access denied. User:', user.email);
        setError(`Access denied. You must be logged in as ${ADMIN_EMAIL}`);
        navigate('/');
        return;
      }

      console.log('Admin access granted for:', user.email);
      setDebugInfo(`Authenticated as: ${user.email}`);
      fetchPendingUsers();
    } catch (err) {
      console.error('Error in checkAdminAccess:', err);
      setError('Error checking admin access');
      setDebugInfo(err instanceof Error ? err.message : 'Unknown error');
      navigate('/');
    }
  };

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      setDebugInfo('Starting to fetch pending users...');
      
      // Log connection info
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      
      // Try to get the authenticated user first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        setDebugInfo(`Auth error: ${JSON.stringify(authError, null, 2)}`);
        throw new Error('Authentication error');
      }
      
      setDebugInfo(`Authenticated as: ${user?.email}`);

      // Try a simple query first
      const { data: testData, error: testError } = await supabase
        .from('pending_users')
        .select('*')
        .limit(1);

      if (testError) {
        console.error('Error in test query:', testError);
        setDebugInfo(`Test query error: ${JSON.stringify(testError, null, 2)}`);
        throw testError;
      }

      setDebugInfo(`Test query successful. Found ${testData?.length || 0} records`);

      // Now fetch all pending users
      const { data, error } = await supabase
        .from('pending_users')
        .select('*')
        .eq('status', 'pending_admin_approval');

      if (error) {
        console.error('Error fetching pending users:', error);
        setDebugInfo(`Query error: ${JSON.stringify(error, null, 2)}`);
        throw error;
      }

      console.log('Fetched pending users:', data);
      setDebugInfo(`Successfully fetched ${data?.length || 0} pending users`);
      setPendingUsers(data || []);
    } catch (err) {
      console.error('Failed to fetch pending users:', err);
      setError('Failed to fetch pending users');
      if (err instanceof Error) {
        setDebugInfo(`Error: ${err.message}\n\nStack: ${err.stack}`);
      } else {
        setDebugInfo(`Unknown error: ${JSON.stringify(err, null, 2)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (user: PendingUser) => {
    try {
      setLoading(true);
      console.log('Approving user:', user.email);

      // Update pending_users table
      const { error: updateError } = await supabase
        .from('pending_users')
        .update({ status: 'pending_email_verification' })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating user status:', updateError);
        throw updateError;
      }

      // Send verification email to user
      const { error: emailError } = await supabase
        .functions.invoke('send-verification-email', {
          body: { userEmail: user.email }
        });

      if (emailError) {
        console.error('Error sending verification email:', emailError);
        throw emailError;
      }

      console.log('Successfully approved user:', user.email);
      await fetchPendingUsers();
    } catch (err) {
      console.error('Failed to approve user:', err);
      setError('Failed to approve user');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (user: PendingUser) => {
    try {
      setLoading(true);
      console.log('Rejecting user:', user.email);

      // Delete user from auth.users
      const { error: deleteAuthError } = await supabase
        .functions.invoke('delete-auth-user', {
          body: { userEmail: user.email }
        });

      if (deleteAuthError) {
        console.error('Error deleting auth user:', deleteAuthError);
        throw deleteAuthError;
      }

      // Update pending_users table
      const { error: updateError } = await supabase
        .from('pending_users')
        .update({ status: 'rejected' })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating user status:', updateError);
        throw updateError;
      }

      // Send rejection email
      const { error: emailError } = await supabase
        .functions.invoke('send-rejection-email', {
          body: { userEmail: user.email }
        });

      if (emailError) {
        console.error('Error sending rejection email:', emailError);
        throw emailError;
      }

      console.log('Successfully rejected user:', user.email);
      await fetchPendingUsers();
    } catch (err) {
      console.error('Failed to reject user:', err);
      setError('Failed to reject user');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Pending User Approvals</h2>
              <p className="mt-1 text-sm text-gray-500">Review and manage new user registration requests</p>
            </div>
            <button
              onClick={() => fetchPendingUsers()}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          
          {error && (
            <div className="px-4 py-3 bg-red-50">
              <p className="text-sm text-red-600">{error}</p>
              {debugInfo && (
                <pre className="mt-2 text-xs text-red-800 bg-red-100 p-2 rounded overflow-auto">
                  {debugInfo}
                </pre>
              )}
            </div>
          )}

          {!error && debugInfo && (
            <div className="px-4 py-3 bg-blue-50">
              <p className="text-xs text-blue-800">{debugInfo}</p>
            </div>
          )}

          <div className="border-t border-gray-200">
            {pendingUsers.length === 0 ? (
              <div className="px-4 py-5 text-center text-gray-500">
                No pending requests
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {pendingUsers.map((user) => (
                  <li key={user.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.email}</p>
                        <p className="text-sm text-gray-500">
                          Requested: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleApprove(user)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(user)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 