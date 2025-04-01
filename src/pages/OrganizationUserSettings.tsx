import React from 'react';
import { UserOrgManagement } from '../components/UserOrgManagement';

export function OrganizationUserSettings() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Organization and User Settings</h1>
      <UserOrgManagement />
    </div>
  );
} 