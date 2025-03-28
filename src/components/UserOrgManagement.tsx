import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Edit2, 
  Trash2, 
  Plus, 
  Download,
  X,
  Check,
  Calendar,
  Eye,
  Tag
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Organization {
  id: string;
  name: string;
  type: 'client' | 'internal_team' | 'vendor';
  project_start_date: string;
  project_end_date: string;
  region: string;
  services?: string[]; // Optional array of service IDs
}

interface User {
  id: string;
  email: string;
  name: string;
  user_type: 'internal' | 'vendor' | 'external';
  organization_id: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  technology_used: string[];
}

interface OrganizationService {
  organization_id: string;
  service_id: string;
}

export function UserOrgManagement() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [organizationServices, setOrganizationServices] = useState<OrganizationService[]>([]);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showOrgDetails, setShowOrgDetails] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [viewingOrg, setViewingOrg] = useState<Organization | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<Omit<User, 'id'>>({
    email: '',
    name: '',
    user_type: 'external',
    organization_id: ''
  });
  const [loading, setLoading] = useState(true);

  const regions = [
    'asia_pacific',
    'europe',
    'mea',
    'africa',
    'australia',
    'usa',
    'north_america',
    'south_america',
    'uk'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch organizations
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*');
      
      if (orgsError) throw orgsError;
      setOrganizations(orgs || []);

      // Fetch users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*');
      
      if (usersError) throw usersError;
      setUsers(users || []);

      // Fetch services
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*');
      
      if (servicesError) throw servicesError;
      setServices(services || []);

      // Fetch organization services
      const { data: orgServices, error: orgServicesError } = await supabase
        .from('organization_services')
        .select('*');
      
      if (orgServicesError) throw orgServicesError;
      setOrganizationServices(orgServices || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOrg) {
        // Update existing organization
        const { error: orgError } = await supabase
          .from('organizations')
          .update(editingOrg)
          .eq('id', editingOrg.id);
        
        if (orgError) throw orgError;

        // Update organization services
        const selectedServices = editingOrg.services || [];
        const existingServices = organizationServices.filter(os => os.organization_id === editingOrg.id);
        
        // Remove old services
        const servicesToRemove = existingServices.filter(es => !selectedServices.includes(es.service_id));
        if (servicesToRemove.length > 0) {
          const { error: removeError } = await supabase
            .from('organization_services')
            .delete()
            .in('service_id', servicesToRemove.map(s => s.service_id))
            .eq('organization_id', editingOrg.id);
          
          if (removeError) throw removeError;
        }

        // Add new services
        const servicesToAdd = selectedServices
          .filter((ss: string) => !existingServices.find(es => es.service_id === ss))
          .map((serviceId: string) => ({
            organization_id: editingOrg.id,
            service_id: serviceId
          }));

        if (servicesToAdd.length > 0) {
          const { error: addError } = await supabase
            .from('organization_services')
            .insert(servicesToAdd);
          
          if (addError) throw addError;
        }
      } else {
        // Create new organization
        const newOrgData: Omit<Organization, 'id'> = {
          name: editingOrg!.name,
          type: editingOrg!.type,
          project_start_date: editingOrg!.project_start_date,
          project_end_date: editingOrg!.project_end_date,
          region: editingOrg!.region,
          services: editingOrg!.services
        };

        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert([newOrgData])
          .select()
          .single();
        
        if (orgError) throw orgError;

        // Add organization services
        if (newOrgData.services?.length) {
          const servicesToAdd = newOrgData.services.map((serviceId: string) => ({
            organization_id: newOrg.id,
            service_id: serviceId
          }));

          const { error: servicesError } = await supabase
            .from('organization_services')
            .insert(servicesToAdd);
          
          if (servicesError) throw servicesError;
        }
      }
      
      setShowOrgModal(false);
      setEditingOrg(null);
      fetchData();
    } catch (error) {
      console.error('Error saving organization:', error);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const { error } = await supabase
          .from('users')
          .update(editingUser)
          .eq('id', editingUser.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('users')
          .insert([newUser]);
        
        if (error) throw error;
      }
      
      setShowUserModal(false);
      setEditingUser(null);
      setNewUser({
        email: '',
        name: '',
        user_type: 'external',
        organization_id: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleDeleteOrg = async (id: string) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting organization:', error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const downloadUsersExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(users);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    XLSX.writeFile(workbook, 'users.xlsx');
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(editingService)
          .eq('id', editingService.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('services')
          .insert([editingService]);
        
        if (error) throw error;
      }
      
      setShowServiceModal(false);
      setEditingService(null);
      fetchData();
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Organizations Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-xl font-semibold">Organizations</h2>
            <button
              onClick={() => setShowOrgDetails(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200"
              title="View organizations"
              aria-label="View organizations"
            >
              <Eye className="h-5 w-5" />
              View Organizations
            </button>
            <button
              onClick={() => {
                setEditingOrg(null);
                setShowOrgModal(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
              title="Add new organization"
              aria-label="Add new organization"
            >
              <Plus className="h-5 w-5" />
              Add Organization
            </button>
          </div>
        </div>

        {/* Users Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-xl font-semibold">Users</h2>
            <button
              onClick={() => setShowUserDetails(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200"
              title="View users"
              aria-label="View users"
            >
              <Eye className="h-5 w-5" />
              View Users
            </button>
            <button
              onClick={() => {
                setEditingUser(null);
                setShowUserModal(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
              title="Add new user"
              aria-label="Add new user"
            >
              <Plus className="h-5 w-5" />
              Add User
            </button>
            <button
              onClick={downloadUsersExcel}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              title="Download users data as Excel file"
              aria-label="Download users data as Excel file"
            >
              <Download className="h-5 w-5" />
              Export Users
            </button>
          </div>
        </div>

        {/* Services Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-xl font-semibold">Services</h2>
            <button
              onClick={() => setShowServiceModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200"
              title="View services"
              aria-label="View services"
            >
              <Eye className="h-5 w-5" />
              View Services
            </button>
            <button
              onClick={() => {
                setEditingService(null);
                setShowServiceModal(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
              title="Add new service"
              aria-label="Add new service"
            >
              <Plus className="h-5 w-5" />
              Add Service
            </button>
          </div>
        </div>
      </div>

      {/* Organizations List Modal */}
      {showOrgDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Organizations</h3>
              <button
                onClick={() => setShowOrgDetails(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close organizations list"
                title="Close organizations list"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {organizations.map((org) => (
                    <tr key={org.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{org.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{org.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setViewingOrg(org);
                              setShowOrgDetails(false);
                              setShowOrgModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title={`View details of ${org.name}`}
                            aria-label={`View details of ${org.name}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingOrg(org);
                              setShowOrgDetails(false);
                              setShowOrgModal(true);
                            }}
                            className="text-violet-600 hover:text-violet-800"
                            title={`Edit ${org.name}`}
                            aria-label={`Edit ${org.name}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrg(org.id)}
                            className="text-red-600 hover:text-red-800"
                            title={`Delete ${org.name}`}
                            aria-label={`Delete ${org.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Users List Modal */}
      {showUserDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Users</h3>
              <button
                onClick={() => setShowUserDetails(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close users list"
                title="Close users list"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.user_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {organizations.find(o => o.id === user.organization_id)?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setShowUserDetails(false);
                              setShowUserModal(true);
                            }}
                            className="text-violet-600 hover:text-violet-800"
                            title={`Edit ${user.email}`}
                            aria-label={`Edit ${user.email}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-800"
                            title={`Delete ${user.email}`}
                            aria-label={`Delete ${user.email}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Services List Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Services</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingService(null);
                    setShowServiceModal(true);
                  }}
                  className="flex items-center gap-2 px-3 py-1 bg-violet-600 text-white rounded-md hover:bg-violet-700"
                  title="Add new service"
                  aria-label="Add new service"
                >
                  <Plus className="h-4 w-4" />
                  Add Service
                </button>
                <button
                  onClick={() => setShowServiceModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close services list"
                  title="Close services list"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technologies</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {services.map((service) => (
                    <tr key={service.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{service.name}</td>
                      <td className="px-6 py-4">{service.description}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {service.technology_used.map((tech, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-800"
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {tech}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingService(service);
                              setShowServiceModal(true);
                            }}
                            className="text-violet-600 hover:text-violet-800"
                            title={`Edit ${service.name}`}
                            aria-label={`Edit ${service.name}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="text-red-600 hover:text-red-800"
                            title={`Delete ${service.name}`}
                            aria-label={`Delete ${service.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Organization Edit Modal */}
      {showOrgModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingOrg ? 'Edit Organization' : 'Add Organization'}
              </h3>
              <button
                onClick={() => {
                  setShowOrgModal(false);
                  setEditingOrg(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleOrgSubmit} className="space-y-4">
              <div>
                <label htmlFor="org-name" className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  id="org-name"
                  type="text"
                  value={editingOrg?.name || ''}
                  onChange={(e) => setEditingOrg(prev => ({ ...prev!, name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                  required
                  placeholder="Enter organization name"
                  aria-label="Organization name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={editingOrg?.type || ''}
                  onChange={(e) => setEditingOrg(prev => ({ ...prev!, type: e.target.value as Organization['type'] }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                  required
                  aria-label="Organization type"
                  title="Organization type"
                >
                  <option value="">Select Type</option>
                  <option value="client">Client</option>
                  <option value="internal_team">Internal Team</option>
                  <option value="vendor">Vendor</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Start Date</label>
                  <input
                    type="date"
                    value={editingOrg?.project_start_date || ''}
                    onChange={(e) => setEditingOrg(prev => ({ ...prev!, project_start_date: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                    aria-label="Project start date"
                    title="Project start date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project End Date</label>
                  <input
                    type="date"
                    value={editingOrg?.project_end_date || ''}
                    onChange={(e) => setEditingOrg(prev => ({ ...prev!, project_end_date: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                    aria-label="Project end date"
                    title="Project end date"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Region</label>
                <select
                  value={editingOrg?.region || ''}
                  onChange={(e) => setEditingOrg(prev => ({ ...prev!, region: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                  required
                  aria-label="Organization region"
                  title="Organization region"
                >
                  <option value="">Select Region</option>
                  {regions.map(region => (
                    <option key={region} value={region}>
                      {region.replace(/_/g, ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Services</label>
                <div className="mt-2 space-y-2">
                  {services.map(service => (
                    <label key={service.id} className="inline-flex items-center mr-4">
                      <input
                        type="checkbox"
                        checked={editingOrg?.services?.includes(service.id) || false}
                        onChange={(e) => {
                          const newServices = e.target.checked
                            ? [...(editingOrg?.services || []), service.id]
                            : editingOrg?.services?.filter(id => id !== service.id) || [];
                          setEditingOrg(prev => ({ ...prev!, services: newServices }));
                        }}
                        className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{service.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowOrgModal(false);
                    setEditingOrg(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  aria-label="Cancel organization changes"
                  title="Cancel organization changes"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700"
                  aria-label={editingOrg ? 'Save organization changes' : 'Add new organization'}
                  title={editingOrg ? 'Save organization changes' : 'Add new organization'}
                >
                  {editingOrg ? 'Save Changes' : 'Add Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Edit Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingUser ? 'Edit User' : 'Add User'}
              </h3>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setEditingUser(null);
                  setNewUser({
                    email: '',
                    name: '',
                    user_type: 'external',
                    organization_id: ''
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close user modal"
                title="Close user modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUserSubmit} className="space-y-4">
              {!editingUser && (
                <>
                  <div>
                    <label htmlFor="user-email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      id="user-email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                      required
                      placeholder="Enter user email"
                    />
                  </div>
                  <div>
                    <label htmlFor="user-name" className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      id="user-name"
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                      required
                      placeholder="Enter user name"
                    />
                  </div>
                </>
              )}
              <div>
                <label htmlFor="user-type" className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  id="user-type"
                  value={editingUser ? editingUser.user_type : newUser.user_type}
                  onChange={(e) => {
                    if (editingUser) {
                      setEditingUser(prev => ({ ...prev!, user_type: e.target.value as User['user_type'] }));
                    } else {
                      setNewUser(prev => ({ ...prev, user_type: e.target.value as User['user_type'] }));
                    }
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="internal">Internal</option>
                  <option value="vendor">Vendor</option>
                  <option value="external">External</option>
                </select>
              </div>
              <div>
                <label htmlFor="user-org" className="block text-sm font-medium text-gray-700">Organization</label>
                <select
                  id="user-org"
                  value={editingUser ? editingUser.organization_id : newUser.organization_id}
                  onChange={(e) => {
                    if (editingUser) {
                      setEditingUser(prev => ({ ...prev!, organization_id: e.target.value }));
                    } else {
                      setNewUser(prev => ({ ...prev, organization_id: e.target.value }));
                    }
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                  required
                >
                  <option value="">Select Organization</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                    setNewUser({
                      email: '',
                      name: '',
                      user_type: 'external',
                      organization_id: ''
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  aria-label="Cancel user changes"
                  title="Cancel user changes"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700"
                  aria-label={editingUser ? 'Save user changes' : 'Add new user'}
                  title={editingUser ? 'Save user changes' : 'Add new user'}
                >
                  {editingUser ? 'Save Changes' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 