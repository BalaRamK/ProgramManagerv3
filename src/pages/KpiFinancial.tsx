import {
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Calendar,
  Filter,
  Download,
  Share2,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  Plus,
  Edit,
  X,
  Trash2,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, LineChart, Line, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InvoiceModal } from '@/components/InvoiceModal';

// Define types based on your schema
interface Kpi {
  id: string;
  program_id: string;
  name: string;
  value: number;
  metric_type: string;
  updated_at: string;
  trend: string;
  change: string;
  unit?: string;
  target?: number;
}

interface Financial {
  id: string;
  program_id: string;
  planned_budget: number;
  actual_budget: number;
  forecasted_budget: number;
  updated_at: string;
}

interface DepartmentFinancial {
  id: string;
  program_id: string;
  department_id: string;
  month_year: string;
  planned_spend: number;
  actual_spend: number;
  forecasted_spend: number;
  created_at: string;
  name: string;
  spent: number;
  budget: number;
}

interface FinancialSnapshot {
  id: string;
  program_id: string;
  snapshot_date: string;
  total_budget: number;
  total_spent: number;
  remaining_budget: number;
  cost_variance: number;
  roi: number;
  created_at: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  user_type: 'internal' | 'external';
  organization_id?: string;
}

interface Organization {
  id: string;
  name: string;
}

interface Invoice {
  id: string;
  invoice_date: string;
  name: string;
  cost: number;
  type: 'Vendor' | 'Miscellaneous';
  platform?: string;
  vendor_cost_id?: string | null;
  miscellaneous_cost_id?: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

interface InvoiceForSelect {
  id: string;
  name: string;
  cost: number;
}

interface FormData {
  id?: string;
  program_id?: string;
  organization_id?: string;
  user_id?: string;
  manager_id?: string;
  start_date?: string;
  end_date?: string;
  starting_level?: string;
  current_level?: string;
  status?: 'Active' | 'Resigned' | 'Separated';
  billing?: 'Billable' | 'Not Billable';
  vendor_name?: string;
  cycle?: 'one-time' | 'Continuous';
  approver_id?: string;
  name?: string;
  cost?: number | string;
  created_at?: string;
  updated_at?: string;
  invoice_id?: string | null;
  billed_by_id?: string;
  approved_by_id?: string;
  user?: { name: string };
  manager?: { name: string };
  organization?: { name: string };
  approver?: { name: string };
  billed_by?: { name: string };
  approved_by?: { name: string };
  invoice?: { id: string; name: string } | null;
  user_name?: string;
  manager_name?: string;
  organization_name?: string;
  billed_by_name?: string;
  approved_by_name?: string;
  approver_name?: string;
  created_date?: string;
}

function MetricCard({ metric }: { metric: Kpi }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{metric.name}</p>
          <p className="text-2xl font-bold mt-1">
            {typeof metric.value === 'number'
              ? `${metric.unit === '$' ? '$' : ''}${metric.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${metric.unit && metric.unit !== '$' ? metric.unit : ''}`
              : metric.value}
          </p>
        </div>
        {metric.change && (
          <div
            className={`flex items-center ${metric.trend === 'up' ? 'text-green-500' : metric.trend === 'down' ? 'text-red-500' : 'text-gray-500'
              }`}
          >
            {metric.trend === 'up' ? (
              <ArrowUpRight className="h-5 w-5" />
            ) : metric.trend === 'down' ? (
              <ArrowDownRight className="h-5 w-5" />
            ) : null}
            <span className="text-sm font-medium ml-1">{metric.change}</span>
          </div>
        )}
      </div>
      {typeof metric.value === 'number' && metric.target && (
        <div className="mt-4">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                metric.value >= metric.target
                  ? 'bg-green-500'
                  : 'bg-violet-500'
              }`}
              style={{
                width: `${Math.min((metric.value / metric.target) * 100, 100)}%`,
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

function BudgetOverview() {
  const [financials, setFinancials] = useState<Financial[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: financialData, error: financialError } = await supabase
        .from('financials')
        .select('*');
      if (financialData) {
        setFinancials(financialData);
      }
      if (financialError) {
        console.error('Error fetching financials:', financialError);
      }
    };

    fetchData();
  }, []);

  const totalBudget = financials.reduce((acc, fin) => acc + fin.planned_budget, 0);
  const totalSpent = financials.reduce((acc, fin) => acc + (fin.actual_budget || 0), 0);
  const remaining = totalBudget - totalSpent;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Budget Overview</h2>
        <div className="flex space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Download">
            <Download className="h-5 w-5 text-gray-500" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Share">
            <Share2 className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div>
          <p className="text-sm text-gray-500">Total Budget</p>
          <p className="text-2xl font-bold">${(totalBudget / 1000000).toFixed(1)}M</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Spent</p>
          <p className="text-2xl font-bold">${(totalSpent / 1000000).toFixed(1)}M</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Remaining</p>
          <p className="text-2xl font-bold">${(remaining / 1000000).toFixed(1)}M</p>
        </div>
      </div>
      <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-violet-500"
          style={{
            width: `${(totalSpent / totalBudget) * 100}%`,
          }}
        ></div>
      </div>
    </div>
  );
}

function DepartmentSpending() {
  const [departmentSpending, setDepartmentSpending] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: departmentData, error: departmentError } = await supabase
        .from('department_financials')
        .select(`
          id,
          program_id,
          department_id,
          month_year,
          planned_spend,
          actual_spend,
          forecasted_spend,
          created_at,
          departments (name)
        `);
      if (departmentData) {
        setDepartmentSpending(departmentData);
      }
      if (departmentError) {
        console.error('Error fetching department spending:', departmentError);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Department Spending</h2>
        <button className="flex items-center text-sm text-gray-500 hover:text-gray-700">
          <Filter className="h-4 w-4 mr-1" />
          Filter
        </button>
      </div>
      <div className="space-y-4">
        {departmentSpending.map((dept) => (
          <div key={dept.id}>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">{dept.departments ? dept.departments.name : 'Unknown Department'}</span>
              <span className="text-sm text-gray-500">
                ${(dept.actual_spend / 1000).toFixed(1)}k / ${(dept.planned_spend / 1000).toFixed(1)}k
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500"
                style={{ width: `${(dept.actual_spend / dept.planned_spend) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthlyTrends() {
  const [monthlyTrends, setMonthlyTrends] = useState<{ month: string; planned: number; actual: number }[]>([]);
  const [startMonth, setStartMonth] = useState<string>('');
  const [endMonth, setEndMonth] = useState<string>('');

  useEffect(() => {
    const fetchMonthlyTrends = async () => {
      if (!startMonth || !endMonth) return; // Ensure both dates are selected

      // Construct full date strings for the start and end months
      const startDate = new Date(startMonth + '-01').toISOString().slice(0, 10); // First day of the start month
      const endDate = new Date(endMonth + '-01'); // First day of the end month
      endDate.setMonth(endDate.getMonth() + 1); // Move to the first day of the next month
      const endDateString = endDate.toISOString().slice(0, 10); // Convert to YYYY-MM-DD

      const { data: trendsData, error } = await supabase
        .from('department_financials')
        .select('month_year, planned_spend, actual_spend')
        .gte('month_year', startDate) // Use the full start date
        .lt('month_year', endDateString) // Use the full end date (exclusive)
        .order('month_year', { ascending: true });

      if (trendsData) {
        const formattedData = trendsData.map(item => ({
          month: new Date(item.month_year).toISOString().slice(0, 7), // Format to YYYY-MM
          planned: item.planned_spend,
          actual: item.actual_spend,
        }));
        setMonthlyTrends(formattedData);
      }
      if (error) {
        console.error('Error fetching monthly trends:', error);
      }
    };

    fetchMonthlyTrends();
  }, [startMonth, endMonth]); // Fetch data whenever start or end month changes

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Monthly Spending Trends</h2>
        <div className="flex items-center space-x-4">
          <div>
            <label htmlFor="startMonth" className="text-sm">Start Month:</label>
            <input
              type="month"
              id="startMonth"
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              className="border rounded p-1"
            />
          </div>
          <div>
            <label htmlFor="endMonth" className="text-sm">End Month:</label>
            <input
              type="month"
              id="endMonth"
              value={endMonth}
              onChange={(e) => setEndMonth(e.target.value)}
              className="border rounded p-1"
            />
          </div>
        </div>
      </div>
      <div className="relative h-64">
        <div className="absolute inset-0 flex items-end justify-between">
          {monthlyTrends.map((month, index) => (
            <div key={`${month.month}-${index}`} className="flex-1 mx-1">
              <div className="relative h-full flex items-end space-x-1">
                <div
                  className="flex-1 bg-violet-200"
                  style={{
                    height: `${(month.planned / 200000) * 100}%`, // Adjust based on your data
                  }}
                ></div>
                <div
                  className="flex-1 bg-violet-500"
                  style={{
                    height: `${(month.actual / 200000) * 100}%`, // Adjust based on your data
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 text-center mt-2">
                {month.month}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center mt-4 space-x-6">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-violet-200 mr-2"></div>
          <span className="text-sm text-gray-500">Planned</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-violet-500 mr-2"></div>
          <span className="text-sm text-gray-500">Actual</span>
        </div>
      </div>
    </div>
  );
}

function CostManagementModal({
  isOpen,
  onClose,
  type,
  programId,
  organizationId
}: {
  isOpen: boolean;
  onClose: () => void;
  type: 'resource' | 'vendor' | 'misc';
  programId: string | null;
  organizationId: string | null;
}) {
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [availableInvoices, setAvailableInvoices] = useState<InvoiceForSelect[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch internal users
      const { data: userData } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('user_type', 'internal');
      if (userData) setUsers(userData as User[]);

      // Fetch organizations
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id, name');
      if (orgData) setOrganizations(orgData as Organization[]);
    };

    // Add back fetchRelevantInvoices if removed
    const fetchRelevantInvoices = async () => {
       if (!organizationId || (type !== 'vendor' && type !== 'misc')) {
           setAvailableInvoices([]);
           return;
       }
       const invoiceType = type === 'vendor' ? 'Vendor' : 'Miscellaneous';
       const { data, error } = await supabase
         .from('invoices')
         .select('id, name, cost')
         .eq('type', invoiceType)
         .eq('organization_id', organizationId)
         .is(type === 'vendor' ? 'vendor_cost_id' : 'miscellaneous_cost_id', null)
         .order('name', { ascending: true });
       if (error) console.error('Error fetching relevant invoices:', error);
       else if (data) setAvailableInvoices(data as InvoiceForSelect[]);
     };

    if (isOpen) {
      fetchData();
      fetchRelevantInvoices(); // Call fetchRelevantInvoices
      setFormData({});
    } else {
       setAvailableInvoices([]);
    }
  }, [isOpen, type, organizationId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
     const { name, value, type: inputType } = e.target;
     const isCheckbox = inputType === 'checkbox' && e.target instanceof HTMLInputElement;
     setFormData((prev) => ({
        ...prev,
        [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    }));
  };

   const handleSelectChange = (name: string, value: string | number | boolean | null) => {
      setFormData((prev) => ({ ...prev, [name]: value }));
   };

   // Add back the correct handleSubmit logic if it was reverted
   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!programId || !organizationId) {
          alert("Program or Organization context is missing. Cannot save cost.");
          return;
      }
      if (type === 'resource' && !formData.user_id) { alert("User is required for Resource Cost."); return; }
      if (type === 'vendor' && !formData.vendor_name) { alert("Vendor Name is required."); return; }
      if (type === 'misc' && !formData.name) { alert("Name/Description is required."); return; }
      const costValue = formData.cost ? parseFloat(formData.cost as string) : undefined;
       if (formData.cost && isNaN(costValue as number)) {
           alert("Invalid Cost value.");
           return;
       }
      const dataToInsert: Partial<FormData> & { program_id: string, organization_id: string } = {
          ...formData,
          program_id: programId,
          organization_id: organizationId,
          cost: costValue,
          invoice_id: formData.invoice_id || null,
      };
      // Clean up fields based on type
      if (type === 'resource') { delete dataToInsert.vendor_name; delete dataToInsert.cycle; delete dataToInsert.approver_id; delete dataToInsert.name; delete dataToInsert.billed_by_id; delete dataToInsert.approved_by_id; delete dataToInsert.invoice_id; }
      else if (type === 'vendor') { delete dataToInsert.user_id; delete dataToInsert.manager_id; delete dataToInsert.starting_level; delete dataToInsert.current_level; delete dataToInsert.status; delete dataToInsert.billing; delete dataToInsert.name; delete dataToInsert.billed_by_id; delete dataToInsert.approved_by_id; }
      else { delete dataToInsert.user_id; delete dataToInsert.manager_id; delete dataToInsert.start_date; delete dataToInsert.end_date; delete dataToInsert.starting_level; delete dataToInsert.current_level; delete dataToInsert.status; delete dataToInsert.billing; delete dataToInsert.vendor_name; delete dataToInsert.cycle; delete dataToInsert.approver_id; }

      const table = type === 'resource' ? 'resource_costs' : type === 'vendor' ? 'vendor_costs' : 'miscellaneous_costs';
      const { data: insertedCost, error } = await supabase.from(table).insert([dataToInsert]).select('id').single();

      if (error) {
        alert(`Error saving cost: ${error.message}`);
      } else if (insertedCost && formData.invoice_id && (type === 'vendor' || type === 'misc')) {
        // Link invoice if selected
        const costIdField = type === 'vendor' ? 'vendor_cost_id' : 'miscellaneous_cost_id';
        const { error: invoiceUpdateError } = await supabase.from('invoices').update({ [costIdField]: insertedCost.id }).eq('id', formData.invoice_id);
        if (invoiceUpdateError) alert(`Cost saved, but failed to link invoice: ${invoiceUpdateError.message}. Please link manually if needed.`);
        onClose();
      } else {
         onClose(); // Close modal on success
      }
    };

  // Restore the Modal JSX structure if it was reverted
  // Ensure all optional <Select> components use value={formData.field || undefined}
  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 ${isOpen ? 'flex' : 'hidden'} items-center justify-center z-50`}>
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white py-4 border-b z-10">
          <h2 className="text-xl font-semibold">Add {type.charAt(0).toUpperCase() + type.slice(1)} Cost</h2>
           <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" title="Close modal">
             <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-1 pb-4">
          {/* Resource Cost Fields */}
          {type === 'resource' && (
            <>
              <div>
                 <Label htmlFor="user_id">User</Label>
                 <Select name="user_id" required value={formData.user_id || ''} onValueChange={(value: string) => handleSelectChange('user_id', value)}>
                    <SelectTrigger className="w-full mt-1"> <SelectValue placeholder="Select User" /> </SelectTrigger>
                    <SelectContent> {users.map(user => <SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>)} </SelectContent>
                 </Select>
              </div>
               <div>
                 <Label htmlFor="manager_id">Manager</Label>
                 <Select name="manager_id" value={formData.manager_id || undefined} onValueChange={(value: string) => handleSelectChange('manager_id', value || null)}> { /* Allow unsetting */ }
                     <SelectTrigger className="w-full mt-1"> <SelectValue placeholder="Select Manager (Optional)" /> </SelectTrigger>
                     <SelectContent> <SelectItem value="none">None</SelectItem> {users.map(user => <SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>)} </SelectContent>
                 </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div> <Label htmlFor="start_date">Start Date</Label> <Input id="start_date" type="date" name="start_date" required value={formData.start_date || ''} onChange={handleInputChange} className="mt-1"/> </div>
                <div> <Label htmlFor="end_date">End Date (Optional)</Label> <Input id="end_date" type="date" name="end_date" value={formData.end_date || ''} onChange={handleInputChange} className="mt-1"/> </div>
              </div>
               <div className="grid grid-cols-2 gap-4">
                 <div> <Label htmlFor="starting_level">Starting Level</Label> <Input id="starting_level" type="text" name="starting_level" value={formData.starting_level || ''} onChange={handleInputChange} className="mt-1"/> </div>
                 <div> <Label htmlFor="current_level">Current Level</Label> <Input id="current_level" type="text" name="current_level" value={formData.current_level || ''} onChange={handleInputChange} className="mt-1"/> </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" value={formData.status || ''} onValueChange={(value: 'Active' | 'Resigned' | 'Separated') => handleSelectChange('status', value)}>
                         <SelectTrigger className="w-full mt-1"> <SelectValue placeholder="Select Status" /> </SelectTrigger>
                         <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Resigned">Resigned</SelectItem>
                            <SelectItem value="Separated">Separated</SelectItem>
                         </SelectContent>
                    </Select>
                  </div>
                   <div>
                    <Label htmlFor="billing">Billing</Label>
                    <Select name="billing" value={formData.billing || ''} onValueChange={(value: 'Billable' | 'Not Billable') => handleSelectChange('billing', value)}>
                         <SelectTrigger className="w-full mt-1"> <SelectValue placeholder="Select Billing Type" /> </SelectTrigger>
                         <SelectContent>
                            <SelectItem value="Billable">Billable</SelectItem>
                            <SelectItem value="Not Billable">Not Billable</SelectItem>
                         </SelectContent>
                    </Select>
                  </div>
               </div>
            </>
          )}

           {/* Vendor Cost Fields */}
           {type === 'vendor' && (
             <>
               <div> <Label htmlFor="vendor_name">Vendor Name</Label> <Input id="vendor_name" type="text" name="vendor_name" required value={formData.vendor_name || ''} onChange={handleInputChange} className="mt-1"/> </div>
               <div>
                 <Label htmlFor="organization_id">Organization (Vendor)</Label>
                 <Select name="organization_id" value={formData.organization_id || undefined} onValueChange={(value: string) => handleSelectChange('organization_id', value || null)}> { /* Allow unsetting */ }
                    <SelectTrigger className="w-full mt-1"> <SelectValue placeholder="Select Vendor Organization (Optional)" /> </SelectTrigger>
                    <SelectContent> <SelectItem value="none">None</SelectItem> {organizations.map(org => <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>)} </SelectContent>
                 </Select>
               </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cycle">Cycle</Label>
                     <Select name="cycle" value={formData.cycle || ''} onValueChange={(value: 'one-time' | 'Continuous') => handleSelectChange('cycle', value)}>
                         <SelectTrigger className="w-full mt-1"> <SelectValue placeholder="Select Cycle" /> </SelectTrigger>
                         <SelectContent>
                            <SelectItem value="one-time">One-Time</SelectItem>
                            <SelectItem value="Continuous">Continuous</SelectItem>
                         </SelectContent>
                     </Select>
                  </div>
                  <div> <Label htmlFor="cost">Cost</Label> <Input id="cost" type="number" step="0.01" name="cost" value={formData.cost || ''} onChange={handleInputChange} className="mt-1"/> </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div> <Label htmlFor="start_date">Start Date (Optional)</Label> <Input id="start_date" type="date" name="start_date" value={formData.start_date || ''} onChange={handleInputChange} className="mt-1"/> </div>
                   <div> <Label htmlFor="end_date">End Date (Optional)</Label> <Input id="end_date" type="date" name="end_date" value={formData.end_date || ''} onChange={handleInputChange} className="mt-1"/> </div>
                </div>
                <div>
                 <Label htmlFor="approver_id">Approver</Label>
                 <Select name="approver_id" value={formData.approver_id || undefined} onValueChange={(value: string) => handleSelectChange('approver_id', value || null)}> { /* Allow unsetting */ }
                    <SelectTrigger className="w-full mt-1"> <SelectValue placeholder="Select Approver (Optional)" /> </SelectTrigger>
                    <SelectContent> <SelectItem value="none">None</SelectItem> {users.map(user => <SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>)} </SelectContent>
                 </Select>
               </div>
               {/* Link Invoice Dropdown */}
               <div>
                 <Label htmlFor="invoice_id">Link Invoice (Optional)</Label>
                 <Select name="invoice_id" onValueChange={(value: string) => handleSelectChange('invoice_id', value || null)} value={formData.invoice_id || undefined}> { /* Allow unsetting */ }
                    <SelectTrigger className="w-full mt-1" title="Select an existing invoice to link"> <SelectValue placeholder="-- Select Invoice --" /> </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">-- Do not link --</SelectItem>
                        {availableInvoices.map((invoice) => (
                           <SelectItem key={invoice.id} value={invoice.id}> {invoice.name} (${invoice.cost}) </SelectItem>
                        ))}
                     </SelectContent>
                 </Select>
               </div>
             </>
           )}

           {/* Miscellaneous Cost Fields */}
           {type === 'misc' && (
             <>
               <div> <Label htmlFor="name">Name/Description</Label> <Input id="name" type="text" name="name" required value={formData.name || ''} onChange={handleInputChange} className="mt-1"/> </div>
               <div> <Label htmlFor="cost">Cost</Label> <Input id="cost" type="number" step="0.01" name="cost" required value={formData.cost || ''} onChange={handleInputChange} className="mt-1"/> </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <Label htmlFor="billed_by_id">Billed By</Label>
                    <Select name="billed_by_id" value={formData.billed_by_id || undefined} onValueChange={(value: string) => handleSelectChange('billed_by_id', value || null)}> { /* Allow unsetting */ }
                         <SelectTrigger className="w-full mt-1"> <SelectValue placeholder="Select User (Optional)" /> </SelectTrigger>
                         <SelectContent> <SelectItem value="none">None</SelectItem> {users.map(user => <SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>)} </SelectContent>
                     </Select>
                 </div>
                 <div>
                   <Label htmlFor="approved_by_id">Approved By</Label>
                     <Select name="approved_by_id" value={formData.approved_by_id || undefined} onValueChange={(value: string) => handleSelectChange('approved_by_id', value || null)}> { /* Allow unsetting */ }
                         <SelectTrigger className="w-full mt-1"> <SelectValue placeholder="Select User (Optional)" /> </SelectTrigger>
                         <SelectContent> <SelectItem value="none">None</SelectItem> {users.map(user => <SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>)} </SelectContent>
                     </Select>
                 </div>
               </div>
                {/* Link Invoice Dropdown */}
               <div>
                 <Label htmlFor="invoice_id">Link Invoice (Optional)</Label>
                 <Select name="invoice_id" onValueChange={(value: string) => handleSelectChange('invoice_id', value || null)} value={formData.invoice_id || undefined}> { /* Allow unsetting */ }
                    <SelectTrigger className="w-full mt-1" title="Select an existing invoice to link"> <SelectValue placeholder="-- Select Invoice --" /> </SelectTrigger>
                    <SelectContent>
                         <SelectItem value="none">-- Do not link --</SelectItem>
                        {availableInvoices.map((invoice) => (
                           <SelectItem key={invoice.id} value={invoice.id}> {invoice.name} (${invoice.cost}) </SelectItem>
                        ))}
                     </SelectContent>
                 </Select>
               </div>
             </>
           )}

          {/* Submit/Cancel Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t mt-6 sticky bottom-0 bg-white py-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Cost</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InvoiceManagementSection({ organizationId }: { organizationId: string | null }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const fetchInvoices = async () => {
     if (!organizationId) {
        setInvoices([]);
        return;
     }
    const { data, error } = await supabase.from('invoices').select('*').eq('organization_id', organizationId).order('invoice_date', { ascending: false });
    if (error) {
      console.error("Error fetching invoices:", error);
      setInvoices([]);
    } else if (data) {
      setInvoices(data as Invoice[]);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [organizationId]);

   const handleModalClose = () => {
    setIsInvoiceModalOpen(false);
    fetchInvoices(); // Refetch after modal close
  };

   const handleDeleteInvoice = async (invoiceId: string) => {
    const confirmation = window.confirm("Are you sure you want to delete this invoice? This cannot be undone.");
    if (!confirmation) return;
     // Check if invoice is linked to any costs before deleting
     const { data: linkedCosts, error: checkError } = await supabase.from('invoices').select('vendor_cost_id, miscellaneous_cost_id').eq('id', invoiceId).single();
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found, which is okay
         alert("Error checking if invoice is linked. Deletion aborted.");
         return;
    }
    if (linkedCosts?.vendor_cost_id || linkedCosts?.miscellaneous_cost_id) {
        alert("Cannot delete invoice because it is linked to a cost entry. Please unlink it from the cost entry first (by editing the cost).");
        return;
    }
    // Proceed with deletion if not linked
    const { error: deleteError } = await supabase.from('invoices').delete().eq('id', invoiceId);
    if (deleteError) alert(`Error deleting invoice: ${deleteError.message}`);
    else fetchInvoices(); // Refetch after delete
   };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Invoice Management</h2>
        <Button onClick={() => setIsInvoiceModalOpen(true)} variant="default" size="sm" disabled={!organizationId} title={!organizationId ? "Select a program first" : "Add a new invoice"}>
          <Plus className="h-4 w-4 mr-2" />
          Add Invoice
        </Button>
      </div>
      <div className="overflow-x-auto">
         <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                 <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                 <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
             {!organizationId ? (
                  <tr><td colSpan={6} className="text-center py-4 text-gray-500">Select a program to view invoices.</td></tr>
             ) : invoices.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-4 text-gray-500">No invoices found for this organization.</td></tr>
             ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id}>
                   <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(invoice.invoice_date + 'T00:00:00Z').toLocaleDateString()}</td>
                   <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.name}</td>
                   <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{invoice.type}</td>
                   <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right">${invoice.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                   <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{invoice.platform || '-'}</td>
                   <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                       <Button variant="ghost" size="sm" onClick={() => handleDeleteInvoice(invoice.id)} title="Delete Invoice">
                           <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700"/>
                       </Button>
                   </td>
                </tr>
              ))
             )}
            </tbody>
          </table>
      </div>
       {/* Ensure InvoiceModal is correctly defined and imported/available */} 
       {organizationId && <InvoiceModal isOpen={isInvoiceModalOpen} onClose={handleModalClose} organizationId={organizationId} />} 
    </div>
  );
}

function CostManagementSection({ programId, organizationId }: { programId: string | null; organizationId: string | null }) {
  const [activeTab, setActiveTab] = useState<'resource' | 'vendor' | 'misc'>('resource');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'resource' | 'vendor' | 'misc'>('resource');
  const [resourceCosts, setResourceCosts] = useState<FormData[]>([]);
  const [vendorCosts, setVendorCosts] = useState<FormData[]>([]);
  const [miscCosts, setMiscCosts] = useState<FormData[]>([]);

  const fetchCosts = async () => {
      if (!programId) {
         setResourceCosts([]); setVendorCosts([]); setMiscCosts([]);
         return;
      }
      // Fetch Resource Costs
      const { data: resourceData, error: resourceError } = await supabase.from('resource_costs')
        .select(`*, user:users!resource_costs_user_id_fkey(id, name), manager:users!resource_costs_manager_id_fkey(id, name), organization:organizations(id, name)`)
        .eq('program_id', programId);
       if (resourceError) console.error("Error fetching resource costs:", resourceError);
       else if (resourceData) setResourceCosts(resourceData as FormData[]); else setResourceCosts([]);

      // Fetch Vendor Costs
      const { data: vendorData, error: vendorError } = await supabase.from('vendor_costs')
        .select(`*, organization:organizations!vendor_costs_organization_id_fkey(id, name), approver:users!vendor_costs_approver_id_fkey(id, name), invoice:invoices!vendor_costs_invoice_id_fkey(id, name)`)
         .eq('program_id', programId);
       if (vendorError) console.error("Error fetching vendor costs:", vendorError);
       else if (vendorData) setVendorCosts(vendorData as FormData[]); else setVendorCosts([]);

      // Fetch Miscellaneous Costs (using 'misc' internally, corresponds to miscellaneous_costs table)
      const { data: miscData, error: miscError } = await supabase.from('miscellaneous_costs')
        .select(`*, billed_by:users!miscellaneous_costs_billed_by_id_fkey(id, name), approved_by:users!miscellaneous_costs_approved_by_id_fkey(id, name), organization:organizations!miscellaneous_costs_organization_id_fkey(id, name), invoice:invoices!miscellaneous_costs_invoice_id_fkey(id, name)`)
         .eq('program_id', programId);
      if (miscError) console.error("Error fetching misc costs:", miscError);
      else if (miscData) setMiscCosts(miscData as FormData[]); else setMiscCosts([]);
    };

  useEffect(() => {
    fetchCosts();
  }, [programId]);

  const openModal = (type: 'resource' | 'vendor' | 'misc') => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    fetchCosts();
  };

  const handleDeleteCost = async (costId: string, costType: 'resource' | 'vendor' | 'misc') => {
    const confirmation = window.confirm(`Are you sure you want to delete this ${costType} cost entry?`);
    if (!confirmation) return;

    const table = costType === 'resource' ? 'resource_costs' : costType === 'vendor' ? 'vendor_costs' : 'miscellaneous_costs';
    let invoiceToUnlink: string | null = null;

    if (costType === 'vendor' || costType === 'misc') {
        const costData = costType === 'vendor' ? vendorCosts.find(c => c.id === costId) : miscCosts.find(c => c.id === costId);
        if (costData?.invoice_id) invoiceToUnlink = costData.invoice_id;
    }

    const { error: deleteError } = await supabase.from(table).delete().eq('id', costId);
    if (deleteError) {
        alert(`Error deleting cost: ${deleteError.message}`);
        return;
    }

    if (invoiceToUnlink && (costType === 'vendor' || costType === 'misc')) {
        const costIdField = costType === 'vendor' ? 'vendor_cost_id' : 'miscellaneous_cost_id';
        const { error: unlinkError } = await supabase.from('invoices').update({ [costIdField]: null }).eq('id', invoiceToUnlink);
        if (unlinkError) alert("Cost entry deleted, but failed to automatically unlink the associated invoice. Please check manually.");
    }

    fetchCosts();
  };

  const renderCostList = () => {
    let costsToRender: FormData[] = [];
    let headers: string[] = [];
    const baseThClasses = "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
    const centerThClasses = `${baseThClasses} text-center`;
    const rightThClasses = `${baseThClasses} text-right`;
    const tdClasses = "px-4 py-4 whitespace-nowrap text-sm text-gray-700";
    const tdCenterClasses = `${tdClasses} text-center`;
    const tdRightClasses = `${tdClasses} text-right`;
    const tdPrimaryClasses = `${tdClasses} font-medium text-gray-900`;

    switch (activeTab) {
      case 'resource':
        costsToRender = resourceCosts;
        headers = ['User', 'Manager', 'Start Date', 'End Date', 'Level', 'Status', 'Billing', 'Actions'];
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead><tr>{headers.map(h => <th key={h} className={`${baseThClasses} ${h === 'Actions' ? centerThClasses : ''}`}>{h}</th>)}</tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!programId ? (<tr><td colSpan={headers.length} className="text-center py-4 text-gray-500">Select a program to view costs.</td></tr>)
               : costsToRender.length === 0 ? (<tr><td colSpan={headers.length} className="text-center py-4 text-gray-500">No resource costs found.</td></tr>)
               : costsToRender.map((cost) => (
                <tr key={cost.id}>
                  <td className={tdPrimaryClasses}>{cost.user?.name || 'N/A'}</td>
                  <td className={tdClasses}>{cost.manager?.name || '-'}</td>
                  <td className={tdClasses}>{cost.start_date ? new Date(cost.start_date + 'T00:00:00Z').toLocaleDateString() : '-'}</td>
                  <td className={tdClasses}>{cost.end_date ? new Date(cost.end_date + 'T00:00:00Z').toLocaleDateString() : '-'}</td>
                  <td className={tdClasses}>{cost.current_level || cost.starting_level || '-'}</td>
                  <td className={tdClasses}>{cost.status || '-'}</td>
                  <td className={tdClasses}>{cost.billing || '-'}</td>
                   <td className={tdCenterClasses}>
                       <Button variant="ghost" size="sm" onClick={() => handleDeleteCost(cost.id!, 'resource')} title="Delete Resource Cost">
                           <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700"/>
                       </Button>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'vendor':
        costsToRender = vendorCosts;
        headers = ['Vendor Name', 'Organization', 'Cycle', 'Cost', 'Approver', 'Start Date', 'End Date', 'Invoice', 'Actions'];
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead><tr>{headers.map(h => <th key={h} className={`${baseThClasses} ${h === 'Cost' ? rightThClasses : h === 'Actions' ? centerThClasses : ''}`}>{h}</th>)}</tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
             {!programId ? (<tr><td colSpan={headers.length} className="text-center py-4 text-gray-500">Select a program to view costs.</td></tr>)
              : costsToRender.length === 0 ? (<tr><td colSpan={headers.length} className="text-center py-4 text-gray-500">No vendor costs found.</td></tr>)
              : costsToRender.map((cost) => (
                <tr key={cost.id}>
                  <td className={tdPrimaryClasses}>{cost.vendor_name}</td>
                  <td className={tdClasses}>{cost.organization?.name || '-'}</td>
                  <td className={tdClasses}>{cost.cycle || '-'}</td>
                  <td className={tdRightClasses}>${cost.cost ? Number(cost.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                  <td className={tdClasses}>{cost.approver?.name || '-'}</td>
                  <td className={tdClasses}>{cost.start_date ? new Date(cost.start_date + 'T00:00:00Z').toLocaleDateString() : '-'}</td>
                  <td className={tdClasses}>{cost.end_date ? new Date(cost.end_date + 'T00:00:00Z').toLocaleDateString() : '-'}</td>
                  <td className={tdClasses} title={cost.invoice?.id}>{cost.invoice ? cost.invoice.name : '-'}</td>
                   <td className={tdCenterClasses}>
                       <Button variant="ghost" size="sm" onClick={() => handleDeleteCost(cost.id!, 'vendor')} title="Delete Vendor Cost">
                           <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700"/>
                       </Button>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'misc':
        costsToRender = miscCosts;
        headers = ['Name', 'Cost', 'Billed By', 'Approved By', 'Created Date', 'Invoice', 'Actions'];
         return (
           <table className="min-w-full divide-y divide-gray-200">
             <thead><tr>{headers.map(h => <th key={h} className={`${baseThClasses} ${h === 'Cost' ? rightThClasses : h === 'Actions' ? centerThClasses : ''}`}>{h}</th>)}</tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!programId ? (<tr><td colSpan={headers.length} className="text-center py-4 text-gray-500">Select a program to view costs.</td></tr>)
               : costsToRender.length === 0 ? (<tr><td colSpan={headers.length} className="text-center py-4 text-gray-500">No miscellaneous costs found.</td></tr>)
               : costsToRender.map((cost) => (
                <tr key={cost.id}>
                   <td className={tdPrimaryClasses}>{cost.name}</td>
                   <td className={tdRightClasses}>${cost.cost ? Number(cost.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                   <td className={tdClasses}>{cost.billed_by?.name || '-'}</td>
                   <td className={tdClasses}>{cost.approved_by?.name || '-'}</td>
                   <td className={tdClasses}>{cost.created_at ? new Date(cost.created_at).toLocaleDateString() : '-'}</td>
                   <td className={tdClasses} title={cost.invoice?.id}>{cost.invoice ? cost.invoice.name : '-'}</td>
                   <td className={tdCenterClasses}>
                       <Button variant="ghost" size="sm" onClick={() => handleDeleteCost(cost.id!, 'misc')} title="Delete Misc Cost">
                           <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700"/>
                       </Button>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
         );
      default:
         const _exhaustiveCheck: never = activeTab;
         return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-1 border border-gray-200 rounded-lg p-1">
          {(['resource', 'vendor', 'misc'] as const).map((tab) => (
            <Button key={tab} variant={activeTab === tab ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab(tab)} className={`capitalize ${activeTab === tab ? 'bg-violet-100 text-violet-700' : 'text-gray-600'}`}>
              {tab} Costs
            </Button>
          ))}
        </div>
         <Button onClick={() => openModal(activeTab)} variant="default" size="sm" disabled={!programId} title={!programId ? "Select a program first" : `Add new ${activeTab} cost`}>
           <Plus className="h-4 w-4 mr-2" />
           Add {activeTab} Cost
         </Button>
      </div>
      <div className="overflow-x-auto">
        {renderCostList()}
      </div>
      {isModalOpen && (
        <CostManagementModal isOpen={isModalOpen} onClose={handleModalClose} type={modalType} programId={programId} organizationId={organizationId} />
      )}
    </div>
  );
}

const KpiFinancial: React.FC = () => {
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [financials, setFinancials] = useState<Financial[]>([]);
  const [departmentSpending, setDepartmentSpending] = useState<DepartmentFinancial[]>([]);
  const [financialSnapshots, setFinancialSnapshots] = useState<FinancialSnapshot[]>([]);
  const [userData, setUserData] = useState<{ user: any | null; session: any | null }>({ user: null, session: null });
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError || !authData.session?.user) {
        setUserData({ user: null, session: null });
        setOrganizations([]);
        setLoading(false);
        return;
      }
      const user = authData.session.user;
      setUserData({ user, session: authData.session });

      // First get the user's organization_id from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error("Error fetching user data:", userError);
        setOrganizations([]);
        setLoading(false);
        return;
      }

      if (!userData?.organization_id) {
        console.log("User has no organization assigned");
        setOrganizations([]);
        setLoading(false);
        return;
      }

      // Then fetch only that specific organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('id', userData.organization_id)
        .single();

      if (orgError) {
        console.error("Error fetching organization:", orgError);
        setOrganizations([]);
      } else if (orgData) {
        setOrganizations([orgData]);
        // Auto-select the organization since user only has one
        setSelectedOrganizationId(orgData.id);
      }
      setLoading(false);
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchOrganizationData = async () => {
      if (!selectedOrganizationId) {
        setKpis([]);
        setFinancials([]);
        setDepartmentSpending([]);
        setFinancialSnapshots([]);
        return;
      }
      setLoading(true);

      // Fetch financials for the organization
      const { data: financialData, error: financialError } = await supabase
        .from('financials')
        .select('*')
        .eq('organization_id', selectedOrganizationId);
      if (financialError) console.error('Error fetching financials:', financialError);
      setFinancials(financialData || []);

      // Fetch department spending for the organization
      const { data: departmentData, error: departmentError } = await supabase
        .from('department_financials')
        .select('*')
        .eq('organization_id', selectedOrganizationId);
      if (departmentError) console.error('Error fetching department spending:', departmentError);
      setDepartmentSpending(departmentData || []);

      // Fetch financial snapshots for the organization
      const { data: snapshotData, error: snapshotError } = await supabase
        .from('financial_snapshots')
        .select('*')
        .eq('organization_id', selectedOrganizationId);
      if (snapshotError) console.error('Error fetching financial snapshots:', snapshotError);
      setFinancialSnapshots(snapshotData || []);

      const currentFinancials = financialData?.[0];
      const mockKpis: Kpi[] = [
        { 
          id: 'k1', 
          name: 'Budget Variance', 
          value: currentFinancials?.cost_variance ?? 'N/A', 
          unit: '$', 
          trend: 'down', 
          change: '-5%',
          program_id: selectedOrganizationId,
          metric_type: 'financial',
          updated_at: new Date().toISOString()
        },
        { 
          id: 'k2', 
          name: 'ROI', 
          value: currentFinancials?.roi ?? 'N/A', 
          unit: '%', 
          trend: 'up', 
          change: '+2%',
          program_id: selectedOrganizationId,
          metric_type: 'financial',
          updated_at: new Date().toISOString()
        },
        { 
          id: 'k3', 
          name: 'Actual Spend', 
          value: currentFinancials?.actual_budget ?? 'N/A', 
          unit: '$',
          trend: '',
          change: '',
          program_id: selectedOrganizationId,
          metric_type: 'financial',
          updated_at: new Date().toISOString()
        },
        { 
          id: 'k4', 
          name: 'Forecast Accuracy', 
          value: 92, 
          unit: '%',
          trend: '',
          change: '',
          program_id: selectedOrganizationId,
          metric_type: 'financial',
          updated_at: new Date().toISOString()
        }
      ];
      setKpis(mockKpis);
      setLoading(false);
    };
    fetchOrganizationData();
  }, [selectedOrganizationId]);

  const departmentChartData = departmentSpending.map(d => ({
    name: `Dept ${d.department_id.substring(0, 6)}...`,
    planned: d.planned_spend || 0,
    actual: d.actual_spend || 0,
    forecasted: d.forecasted_spend || 0,
  }));

   const snapshotChartData = financialSnapshots
     .sort((a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime())
     .map(s => ({
        date: new Date(s.snapshot_date + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Budget: s.total_budget || 0,
        Spent: s.total_spent || 0,
        Remaining: s.remaining_budget || 0,
    }));

  if (loading && !userData.session) {
    return <div className="p-6 text-center">Loading authentication state...</div>;
  }

   if (!userData.user) {
     return <div className="p-6 text-center">Please log in to view financial KPIs.</div>;
  }

  const OrganizationSelector = () => (
    <div className="flex items-center space-x-2 mb-6">
      <Label htmlFor="organization-select" className="text-sm font-medium">Organization:</Label>
      <Select value={selectedOrganizationId || ""} onValueChange={(value: string) => setSelectedOrganizationId(value || null)}>
        <SelectTrigger id="organization-select" className="w-[200px]">
          <SelectValue placeholder="Select Organization" />
        </SelectTrigger>
        <SelectContent>
          {organizations.length === 0 && <SelectItem value="no-orgs" disabled>No organization assigned</SelectItem>}
          {organizations.map(org => (
            <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Financial KPIs</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track financial metrics, costs, and invoices
          </p>
        </div>
      </div>

      <OrganizationSelector />

      {!selectedOrganizationId ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {organizations.length === 0 
              ? "You don't have any organization assigned. Please contact your administrator."
              : "Please select an organization to view its financial details."}
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex items-center justify-center p-6">
          <div className="text-center text-muted-foreground">Loading organization data...</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => <MetricCard key={kpi.id} metric={kpi} />)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Department Spending (Monthly)</CardTitle>
              </CardHeader>
              <CardContent>
                {departmentSpending.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={departmentChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12}/>
                      <YAxis fontSize={12} tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}/>
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`}/>
                      <Legend />
                      <Bar dataKey="planned" fill="#a78bfa" name="Planned"/>
                      <Bar dataKey="actual" fill="#82ca9d" name="Actual"/>
                      <Bar dataKey="forecasted" fill="#facc15" name="Forecasted"/>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No department spending data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Financial Snapshot Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {financialSnapshots.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={snapshotChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12}/>
                      <YAxis fontSize={12} tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}/>
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`}/>
                      <Legend />
                      <Line type="monotone" dataKey="Budget" stroke="#8884d8" activeDot={{ r: 6 }}/>
                      <Line type="monotone" dataKey="Spent" stroke="#82ca9d" />
                      <Line type="monotone" dataKey="Remaining" stroke="#fbbf24" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No financial snapshot data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <CostManagementSection programId={null} organizationId={selectedOrganizationId} />
          <InvoiceManagementSection organizationId={selectedOrganizationId} />
        </>
      )}
    </div>
  );
};

export default KpiFinancial;
