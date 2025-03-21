import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Users, Building2 } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface DashboardUser {
  id: string;
  user_id: string;
  email: string;
  name: string;
  organization_id: string;
  role: 'user' | 'admin';
  created_at: string;
}

export function UserOrgManagement() {
  const [showUserModal, setShowUserModal] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [dashboardUsers, setDashboardUsers] = useState<DashboardUser[]>([]);
  const [newUser, setNewUser] = useState({ email: '', role: 'user' as const, organization_id: '' });
  const [newOrg, setNewOrg] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizations();
    fetchDashboardUsers();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
    }
  };

  const fetchDashboardUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('dashboard_users')
        .select(`
          id,
          user_id,
          role,
          organization_id,
          created_at,
          users (
            email,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedUsers = data?.map(user => ({
        ...user,
        email: user.users.email,
        name: user.users.name
      })) || [];

      setDashboardUsers(formattedUsers);
    } catch (err) {
      console.error('Error fetching dashboard users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // First, check if the user exists in the auth.users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', newUser.email)
        .single();

      if (userError) throw new Error('User not found. Please ensure the user has registered first.');

      // Then create the dashboard user
      const { error: dashboardUserError } = await supabase
        .from('dashboard_users')
        .insert([{
          user_id: userData.id,
          organization_id: newUser.organization_id,
          role: newUser.role
        }]);

      if (dashboardUserError) throw dashboardUserError;

      setShowUserModal(false);
      setNewUser({ email: '', role: 'user', organization_id: '' });
      await fetchDashboardUsers();
    } catch (err) {
      console.error('Error adding user:', err);
      setError(err instanceof Error ? err.message : 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('organizations')
        .insert([newOrg]);

      if (error) throw error;

      setShowOrgModal(false);
      setNewOrg({ name: '', description: '' });
      await fetchOrganizations();
    } catch (err) {
      console.error('Error adding organization:', err);
      setError(err instanceof Error ? err.message : 'Failed to add organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {/* Organizations Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Organizations
          </h2>
          <button
            onClick={() => setShowOrgModal(true)}
            className="flex items-center px-3 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
            aria-label="Add Organization"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Organization
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => (
                <tr key={org.id} className="border-b">
                  <td className="py-2">{org.name}</td>
                  <td className="py-2">{org.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Users
          </h2>
          <button
            onClick={() => setShowUserModal(true)}
            className="flex items-center px-3 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
            aria-label="Add User"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add User
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Role</th>
                <th className="text-left py-2">Organization</th>
              </tr>
            </thead>
            <tbody>
              {dashboardUsers.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="py-2">{user.name || 'N/A'}</td>
                  <td className="py-2">{user.email}</td>
                  <td className="py-2">{user.role}</td>
                  <td className="py-2">
                    {organizations.find(org => org.id === user.organization_id)?.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Organization Modal */}
      {showOrgModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Organization</h3>
            <form onSubmit={handleAddOrg}>
              <div className="mb-4">
                <label htmlFor="org-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  id="org-name"
                  type="text"
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                  placeholder="Enter organization name"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="org-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="org-description"
                  value={newOrg.description}
                  onChange={(e) => setNewOrg({ ...newOrg, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="Enter organization description"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOrgModal(false)}
                  className="px-4 py-2 border rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add User</h3>
            <form onSubmit={handleAddUser}>
              <div className="mb-4">
                <label htmlFor="user-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="user-email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                  placeholder="Enter user email"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="user-role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="user-role"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'user' | 'admin' })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="user-org" className="block text-sm font-medium text-gray-700 mb-1">
                  Organization
                </label>
                <select
                  id="user-org"
                  value={newUser.organization_id}
                  onChange={(e) => setNewUser({ ...newUser, organization_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Select Organization</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 border rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
          {error}
        </div>
      )}
    </div>
  );
} 