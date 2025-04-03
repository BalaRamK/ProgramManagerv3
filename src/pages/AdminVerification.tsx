import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Shield, 
  Activity, 
  Database, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const ADMIN_EMAIL = 'balaramakrishnasaikarumanchi0@gmail.com';

interface PendingUser {
  id: string;
  email: string;
  name: string;
  status: string;
  created_at: string;
  role: 'free' | 'pro' | 'executive';
  modules: string[];
  storage_used: number;
  storage_limit: number;
}

interface UserLog {
  id: string;
  user_id: string;
  action: string;
  details: string;
  created_at: string;
}

const AVAILABLE_MODULES = [
  { id: 'roadmap', name: 'Roadmap & Milestones' },
  { id: 'kpi', name: 'KPI & Financials' },
  { id: 'scenario', name: 'Scenario Planning' },
  { id: 'communication', name: 'Communication Hub' },
  { id: 'documents', name: 'Document Center' },
  { id: 'insights', name: 'Custom Insights' }
];

const ROLE_LIMITS = {
  free: {
    storage: 100 * 1024 * 1024, // 100MB
    modules: ['roadmap', 'kpi']
  },
  pro: {
    storage: 1 * 1024 * 1024 * 1024, // 1GB
    modules: ['roadmap', 'kpi', 'scenario', 'communication']
  },
  executive: {
    storage: 5 * 1024 * 1024 * 1024, // 5GB
    modules: AVAILABLE_MODULES.map(m => m.id)
  }
};

export function AdminVerification() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [activeUsers, setActiveUsers] = useState<PendingUser[]>([]);
  const [userLogs, setUserLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'logs'>('pending');
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AdminVerification component mounted');
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchUserLogs();
    }
  }, [activeTab]);

  const checkAdminAccess = async () => {
    try {
      console.log('Checking admin access...');
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
      fetchActiveUsers();
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
      
      const { data, error } = await supabase
        .from('pending_users')
        .select('*')
        .eq('status', 'pending_admin_approval');

      if (error) {
        throw error;
      }

      setPendingUsers(data || []);
    } catch (err) {
      console.error('Failed to fetch pending users:', err);
      setError('Failed to fetch pending users');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('pending_users')
        .select('*')
        .neq('status', 'pending_admin_approval')
        .neq('status', 'rejected');

      if (error) {
        throw error;
      }

      setActiveUsers(data || []);
    } catch (err) {
      console.error('Failed to fetch active users:', err);
      setError('Failed to fetch active users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('user_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        throw error;
      }

      setUserLogs(data || []);
    } catch (err) {
      console.error('Failed to fetch user logs:', err);
      setError('Failed to fetch user logs');
    } finally {
      setLoading(false);
    }
  };

  const logAction = async (userId: string, action: string, details: string) => {
    try {
      // Get the user's email from pending_users
      const { data: userData, error: userError } = await supabase
        .from('pending_users')
        .select('email')
        .eq('id', userId)
        .single();

      if (userError || !userData?.email) {
        console.error('Failed to get user email:', userError);
        return false;
      }

      // Get the user's ID from auth.users using a direct query
      const { data: authData, error: authError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single();

      if (authError || !authData?.id) {
        console.error('Failed to get auth user ID:', authError);
        return false;
      }

      // Log the action using the auth user ID
      const { error: logError } = await supabase
        .from('user_logs')
        .insert([{
          user_id: authData.id,
          action: action,
          details: details
        }]);

      if (logError) {
        console.error('Failed to log action:', logError);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error logging action:', err);
      return false;
    }
  };

  const handleApprove = async (user: PendingUser) => {
    try {
      setLoading(true);
      
      // 1. Update pending_users status
      const { error: updateError } = await supabase
        .from('pending_users')
        .update({ 
          status: 'approved',
          role: 'free',
          modules: ['roadmap', 'kpi', 'scenario', 'communication', 'documents', 'insights'],
          storage_limit: 100 * 1024 * 1024 // 100MB for free tier
        })
        .eq('email', user.email);

      if (updateError) throw updateError;

      // 2. Send verification email
      const { error: emailError } = await supabase
        .functions.invoke('send-verification-email', {
          body: { userEmail: user.email }
        });

      if (emailError) throw emailError;

      // 3. Log the action
      await logAction(user.id, 'user_approved', `User ${user.email} approved`);

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
      
      // Update user status in pending_users
      const { error: updateError } = await supabase
        .from('pending_users')
        .update({ status: 'rejected' })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Send rejection email
      const { error: emailError } = await supabase
        .functions.invoke('send-rejection-email', {
          body: { userEmail: user.email }
        });

      if (emailError) {
        throw emailError;
      }

      // Log the action
      await logAction(user.id, 'user_rejected', `User ${user.email} rejected`);

      await fetchPendingUsers();
    } catch (err) {
      console.error('Failed to reject user:', err);
      setError('Failed to reject user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (user: PendingUser, newRole: 'free' | 'pro' | 'executive') => {
    try {
      setLoading(true);
      
      // Update user role in pending_users
      const { error: updateError } = await supabase
        .from('pending_users')
        .update({ 
          role: newRole,
          storage_limit: ROLE_LIMITS[newRole].storage
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Log the action
      await logAction(user.id, 'role_updated', `User ${user.email} role updated to ${newRole}`);

      await fetchActiveUsers();
    } catch (err) {
      console.error('Failed to update user role:', err);
      setError('Failed to update user role');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserModules = async (user: PendingUser, newModules: string[]) => {
    try {
      setLoading(true);
      
      // Update user modules in pending_users
      const { error: updateError } = await supabase
        .from('pending_users')
        .update({ modules: newModules })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Log the action
      await logAction(user.id, 'modules_updated', `User ${user.email} modules updated to: ${newModules.join(', ')}`);

      await fetchActiveUsers();
    } catch (err) {
      console.error('Failed to update user modules:', err);
      setError('Failed to update user modules');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: PendingUser) => {
    try {
      setLoading(true);
      
      // Delete user from auth.users
      const { error: deleteAuthError } = await supabase
        .functions.invoke('delete-auth-user', {
          body: { userEmail: user.email }
        });

      if (deleteAuthError) {
        throw deleteAuthError;
      }

      // Delete user from pending_users
      const { error: deleteError } = await supabase
        .from('pending_users')
        .delete()
        .eq('id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      // Log the action
      await logAction(user.id, 'user_deleted', `User ${user.email} deleted`);

      await fetchActiveUsers();
      setIsDetailsOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const formatStorage = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
              <p className="mt-1 text-sm text-gray-500">Manage user access and permissions</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  fetchPendingUsers();
                  fetchActiveUsers();
                  fetchUserLogs();
                }}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
          
          {error && (
            <div className="px-4 py-3 bg-red-50">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                  {debugInfo && (
                    <pre className="mt-2 text-xs text-red-800 bg-red-100 p-2 rounded overflow-auto">
                      {debugInfo}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('pending')}
                className={`${
                  activeTab === 'pending'
                    ? 'border-violet-500 text-violet-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                Pending Users
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`${
                  activeTab === 'active'
                    ? 'border-violet-500 text-violet-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                Active Users
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`${
                  activeTab === 'logs'
                    ? 'border-violet-500 text-violet-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                System Logs
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="divide-y divide-gray-200">
            {activeTab === 'pending' && (
              <div className="px-4 py-5 sm:px-6">
                {pendingUsers.length === 0 ? (
                  <div className="text-center text-gray-500">No pending requests</div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {pendingUsers.map((user) => (
                      <li key={user.id} className="py-4">
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
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(user)}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {activeTab === 'active' && (
              <div className="px-4 py-5 sm:px-6">
                {activeUsers.length === 0 ? (
                  <div className="text-center text-gray-500">No active users</div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {activeUsers.map((user) => (
                      <li key={user.id} className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-900">{user.email}</p>
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.role === 'executive' ? 'bg-purple-100 text-purple-800' :
                                user.role === 'pro' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </span>
                            </div>
                            <div className="mt-2">
                              <p className="text-sm text-gray-500">Storage: {formatStorage(user.storage_used)} / {formatStorage(user.storage_limit)}</p>
                              <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-violet-500" 
                                  style={{ width: `${(user.storage_used / user.storage_limit) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsDetailsOpen(true);
                              }}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                            >
                              <Activity className="h-4 w-4 mr-1" />
                              Details
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="px-4 py-5 sm:px-6">
                {userLogs.length === 0 ? (
                  <div className="text-center text-gray-500">No logs available</div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {userLogs.map((log) => (
                      <li key={log.id} className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{log.action}</p>
                            <p className="text-sm text-gray-500">{log.details}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(log.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Details Slide-over */}
      {selectedUser && (
        <div className={`fixed inset-0 overflow-hidden ${isDetailsOpen ? 'block' : 'hidden'}`}>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsDetailsOpen(false)} />
            
            <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex sm:pl-16">
              <div className="w-screen max-w-2xl">
                <div className="h-full flex flex-col bg-white shadow-xl">
                  <div className="flex-1 py-6 overflow-y-auto px-4 sm:px-6">
                    <div className="flex items-start justify-between">
                      <h2 className="text-lg font-medium text-gray-900">User Details</h2>
                      <div className="ml-3 h-7 flex items-center">
                        <button
                          onClick={() => setIsDetailsOpen(false)}
                          className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                          <span className="sr-only">Close panel</span>
                          <XCircle className="h-6 w-6" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="space-y-6">
                        {/* User Info */}
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">User Information</h3>
                          <div className="mt-2">
                            <p className="text-sm text-gray-900">Email: {selectedUser.email}</p>
                            <p className="text-sm text-gray-900">Role: {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}</p>
                            <p className="text-sm text-gray-900">Storage: {formatStorage(selectedUser.storage_used)} / {formatStorage(selectedUser.storage_limit)}</p>
                          </div>
                        </div>

                        {/* Storage Usage */}
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Storage Usage</h3>
                          <div className="mt-2">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-violet-500" 
                                style={{ width: `${(selectedUser.storage_used / selectedUser.storage_limit) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        {/* Module Access */}
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Module Access</h3>
                          <div className="mt-2 space-y-2">
                            {AVAILABLE_MODULES.map(module => (
                              <label key={module.id} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={selectedUser.modules.includes(module.id)}
                                  onChange={(e) => {
                                    const newModules = e.target.checked
                                      ? [...selectedUser.modules, module.id]
                                      : selectedUser.modules.filter(m => m !== module.id);
                                    handleUpdateUserModules(selectedUser, newModules);
                                  }}
                                  className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-900">{module.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Role Management */}
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Role Management</h3>
                          <div className="mt-2 space-y-2">
                            <button
                              onClick={() => handleUpdateUserRole(selectedUser, 'free')}
                              className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                                selectedUser.role === 'free'
                                  ? 'bg-violet-100 text-violet-700'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              Free
                            </button>
                            <button
                              onClick={() => handleUpdateUserRole(selectedUser, 'pro')}
                              className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                                selectedUser.role === 'pro'
                                  ? 'bg-violet-100 text-violet-700'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              Pro
                            </button>
                            <button
                              onClick={() => handleUpdateUserRole(selectedUser, 'executive')}
                              className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                                selectedUser.role === 'executive'
                                  ? 'bg-violet-100 text-violet-700'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              Executive
                            </button>
                          </div>
                        </div>

                        {/* Delete User */}
                        <div className="pt-4 border-t border-gray-200">
                          <button
                            onClick={() => handleDeleteUser(selectedUser)}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 