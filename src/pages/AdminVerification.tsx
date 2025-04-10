import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, Users, Check, X, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Navbar } from '../components/Navbar';

const ADMIN_EMAIL = 'balaramakrishnasaikarumanchi0@gmail.com';

interface PendingUser {
  id: string;
  email: string;
  name: string;
  status: string;
  created_at: string;
}

interface ManagedUser {
  id: string;
  email: string;
  name: string;
  user_type: string;
  created_at: string;
}

interface AuthUser {
  id: string;
  email: string;
  raw_user_meta_data: {
    name?: string;
    user_type?: string;
  } | null;
  created_at: string;
}

export function AdminVerification() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
    debugSession();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || user.email !== ADMIN_EMAIL) {
        console.log('Admin access denied or no user logged in.');
        navigate('/');
        return;
      }

      await Promise.all([fetchPendingUsers(), fetchManagedUsers()]);
    } catch (err) {
      console.error('Error checking admin access:', err);
      setError('Failed to verify admin access. Please login again.');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const debugSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    setSessionInfo(session);
  };

  const fetchPendingUsers = async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('pending_users')
        .select('id, email, name, status, created_at')
        .eq('status', 'pending_admin_approval')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPendingUsers(data || []);
    } catch (err) {
      console.error('Error fetching pending users:', err);
      setError('Failed to fetch pending users. Please try refreshing.');
    }
  };

  const fetchManagedUsers = async () => {
    try {
      setError(null);
      
      // First get the admin user's access token
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || user.email !== ADMIN_EMAIL) {
        throw new Error('Not authorized');
      }

      // Use the REST API with service role key
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/admin/users`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Auth API Error:', errorData);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.msg || 'Unknown error'}`);
      }

      const { users } = await response.json();
      
      if (!users || !Array.isArray(users)) {
        throw new Error('Invalid users data received');
      }

      // Sort users by created_at in descending order
      const sortedUsers = [...users].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      const formattedUsers = sortedUsers.map(user => ({
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || '-',
        user_type: user.user_metadata?.user_type || 'external',
        created_at: user.created_at
      }));

      setManagedUsers(formattedUsers);
    } catch (err) {
      console.error('Error fetching managed users:', err);
      setError('Failed to fetch managed users. Please try refreshing.');
    }
  };

  const handleAction = async (userId: string, email: string, action: 'approve' | 'reject' | 'delete') => {
    setActionLoading(prev => ({ ...prev, [userId + action]: true }));
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session. Please login again.');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase URL or Anon Key is missing in environment variables.');
      }

      const functionUrl = `${supabaseUrl}/functions/v1/admin-user-management`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ action, userId, email })
      });

      if (!response.ok) {
        let errorData = { error: `Action failed with status: ${response.status}` };
        try {
          errorData = await response.json(); 
        } catch (e) {
          console.warn("Could not parse error response as JSON");
        }
        console.error("Function returned error:", errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Function success result:", result);

      // Refresh both lists after any action
      await Promise.all([fetchPendingUsers(), fetchManagedUsers()]);

    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
      setError(`Failed to ${action} user: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId + action]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      <div className="p-8 mt-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Verification</h1>
        <p className="text-gray-600 text-lg mb-8">Manage user sign-up requests and existing users.</p>

        {/* Debug Section */}
        <div className="mb-6 p-4 bg-gray-100 border border-gray-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Debug Information</h2>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} aria-label="Close" className="ml-auto text-red-700 hover:text-red-900">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <Card className="mb-8 border border-gray-100 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-violet-600" />
              Pending Approval ({pendingUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested On</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No users pending approval.</td>
                    </tr>
                  ) : (
                    pendingUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleAction(user.id, user.email, 'approve')}
                            disabled={actionLoading[user.id + 'approve']}
                            className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
                          >
                            {actionLoading[user.id + 'approve'] ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 mr-1" />
                            )}
                            Approve
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleAction(user.id, user.email, 'reject')}
                            disabled={actionLoading[user.id + 'reject']}
                            className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            {actionLoading[user.id + 'reject'] ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <X className="h-4 w-4 mr-1" />
                            )}
                            Reject
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
              <LayoutDashboard className="h-5 w-5 mr-2 text-violet-600" />
              Managed Users ({managedUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {managedUsers.length === 0 ? (
                     <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No managed users found.</td>
                    </tr>
                  ) : (
                    managedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ 
                            user.user_type === 'internal' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800' 
                          }`}>
                            {user.user_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          {user.email !== ADMIN_EMAIL && (
                            <Button 
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to permanently delete user ${user.email}? This action cannot be undone.`)) {
                                  handleAction(user.id, user.email, 'delete')
                                }
                              }}
                              disabled={actionLoading[user.id + 'delete']}
                            >
                               {actionLoading[user.id + 'delete'] ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-1" />
                              )}
                              Delete User
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}