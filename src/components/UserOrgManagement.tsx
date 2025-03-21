import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Users, Building2, X } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface DashboardUser {
  id: string;
  name: string;
  email: string;
  organization_id: string;
  role: 'user' | 'admin';
  created_at: string;
}

export function UserOrgManagement() {
  const [showUserModal, setShowUserModal] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showUserListModal, setShowUserListModal] = useState(false);
  const [showOrgListModal, setShowOrgListModal] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [dashboardUsers, setDashboardUsers] = useState<DashboardUser[]>([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'user' as const, organization_id: '' });
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
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDashboardUsers(data || []);
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
      const { error } = await supabase
        .from('dashboard_users')
        .insert([newUser]);

      if (error) throw error;

      setShowUserModal(false);
      setNewUser({ name: '', email: '', role: 'user', organization_id: '' });
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
    <div className="flex justify-between items-center mb-6">
      {/* Organization Management */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setShowOrgModal(true)}
          className="flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          aria-label="Add Organization"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Organization
        </button>
        <button
          onClick={() => setShowOrgListModal(true)}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          aria-label="View Organizations"
        >
          <Building2 className="w-4 h-4 mr-2" />
          View Organizations
        </button>
      </div>

      {/* User Management */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setShowUserModal(true)}
          className="flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          aria-label="Add User"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </button>
        <button
          onClick={() => setShowUserListModal(true)}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          aria-label="View Users"
        >
          <Users className="w-4 h-4 mr-2" />
          View Users
        </button>
      </div>

      {/* Add Organization Modal */}
      {showOrgModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Organization</h3>
              <button
                onClick={() => setShowOrgModal(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add User</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="mb-4">
                <label htmlFor="user-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  id="user-name"
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                  placeholder="Enter user name"
                />
              </div>
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

      {/* View Organizations Modal */}
      {showOrgListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Organizations</h3>
              <button
                onClick={() => setShowOrgListModal(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Description</th>
                    <th className="text-left py-2">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org) => (
                    <tr key={org.id} className="border-b">
                      <td className="py-2">{org.name}</td>
                      <td className="py-2">{org.description}</td>
                      <td className="py-2">{new Date(org.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View Users Modal */}
      {showUserListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Users</h3>
              <button
                onClick={() => setShowUserListModal(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
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
                      <td className="py-2">{user.name}</td>
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