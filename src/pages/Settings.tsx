import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Sliders,
  Palette,
  Lock,
  Key,
  Link,
} from 'lucide-react';

const Settings = () => {
  // Placeholder data for user settings
  const [userSettings, setUserSettings] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    notifications: true,
    preferredLayout: 'grid',
    colorScheme: 'light',
    modules: ['Roadmap', 'KPI', 'Scenario Planning'],
  });

  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'Alice Brown', role: 'Admin', access: 'Full' },
    { id: 2, name: 'Bob Johnson', role: 'Editor', access: 'Edit' },
    { id: 3, name: 'Jane Smith', role: 'Viewer', access: 'View' },
  ]);

  const handleInputChange = (setting, value) => {
    setUserSettings({ ...userSettings, [setting]: value });
  };

  const handleTeamMemberChange = (id, field, value) => {
    setTeamMembers(
      teamMembers.map((member) => (member.id === id ? { ...member, [field]: value } : member))
    );
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <SettingsIcon className="mr-2" /> Settings
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* User Preferences */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <User className="mr-2" /> User Preferences
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={userSettings.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 mt-1 w-full text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={userSettings.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 mt-1 w-full text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="mb-4 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Notifications</label>
            <div className="relative inline-block w-10 mr-2 align-middle select-none">
              <input
                type="checkbox"
                checked={userSettings.notifications}
                onChange={(e) => handleInputChange('notifications', e.target.checked)}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
              />
              <label
                htmlFor="toggle"
                className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
              ></label>
            </div>
          </div>
        </div>

        {/* Dashboard Customization */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Sliders className="mr-2" /> Dashboard Customization
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Preferred Layout</label>
            <select
              value={userSettings.preferredLayout}
              onChange={(e) => handleInputChange('preferredLayout', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 mt-1 w-full text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="grid">Grid</option>
              <option value="list">List</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Color Scheme</label>
            <select
              value={userSettings.colorScheme}
              onChange={(e) => handleInputChange('colorScheme', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 mt-1 w-full text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>

        {/* Integration of Modules */}
        <div className="bg-white rounded-lg shadow p-6 col-span-full">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Link className="mr-2" /> Integration of Modules
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Active Modules</label>
            <div className="mt-2 space-y-2">
              {userSettings.modules.map((module, index) => (
                <div key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    checked
                    readOnly
                    className="h-4 w-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">{module}</label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security & Access Control */}
        <div className="bg-white rounded-lg shadow p-6 col-span-full">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Lock className="mr-2" /> Security & Access Control
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Team Member
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Role
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Access
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={member.role}
                        onChange={(e) => handleTeamMemberChange(member.id, 'role', e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Editor">Editor</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={member.access}
                        onChange={(e) =>
                          handleTeamMemberChange(member.id, 'access', e.target.value)
                        }
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="Full">Full</option>
                        <option value="Edit">Edit</option>
                        <option value="View">View</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
