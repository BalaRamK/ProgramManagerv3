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
  organization_id: string;
  planned_budget: number;
  actual_budget: number;
  forecasted_budget: number;
  total_revenue: number;
  total_cost: number;
  profit: number;
  cost_variance: number;
  roi: number;
  updated_at: string;
}

interface DepartmentFinancial {
  id: string;
  organization_id: string;
  department_id: string;
  month_year: string;
  planned_spend: number;
  actual_spend: number;
  forecasted_spend: number;
  created_at: string;
  spent?: number;
  budget?: number;
}

interface FinancialSnapshot {
  id: string;
  organization_id: string;
  snapshot_date: string;
  total_revenue: number;
  total_cost: number;
  profit: number;
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

interface LevelCost {
  id: string;
  organization_id: string;
  level: string;
  cost_per_month: number;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
}

interface Revenue {
  id: string;
  organization_id: string;
  billing_type: 'Direct' | 'Indirect';
  billing_sub_type: 'resource_billing' | 'service_billing' | 'product_billing' | 'others';
  from_date: string;
  to_date: string;
  revenue_amount: number;
  other_details?: string;
  created_at: string;
  updated_at: string;
}

interface Profit {
  id: string;
  organization_id: string;
  year: number;
  month: number;
  revenue: string;
  resource_cost: string;
  vendor_cost: string;
  misc_cost: string;
  total_cost: string;
  profit: string;
  roi: string;
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
          organization_id,
          department_id,
          month_year,
          planned_spend,
          actual_spend,
          forecasted_spend,
          created_at
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
  organizationId
}: {
  isOpen: boolean;
  onClose: () => void;
  type: 'resource' | 'vendor' | 'misc';
  organizationId: string | null;
}) {
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [availableInvoices, setAvailableInvoices] = useState<InvoiceForSelect[]>([]);
  const [levelCosts, setLevelCosts] = useState<LevelCost[]>([]);

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

      // Fetch level costs if this is a resource cost
      if (type === 'resource' && organizationId) {
        const today = new Date().toISOString().split('T')[0];
        const { data: levelData } = await supabase
          .from('level_costs')
          .select('*')
          .eq('organization_id', organizationId)
          .lte('effective_from', today)
          .or(`effective_to.is.null,effective_to.gte.${today}`)
          .order('level', { ascending: true });
        
        if (levelData) {
          // Remove duplicates and keep only the most recent effective level
          const uniqueLevels = levelData.reduce((acc: LevelCost[], curr) => {
            const existingIndex = acc.findIndex(item => item.level === curr.level);
            if (existingIndex === -1) {
              acc.push(curr);
            } else if (new Date(curr.effective_from) > new Date(acc[existingIndex].effective_from)) {
              acc[existingIndex] = curr;
            }
            return acc;
          }, []);
          setLevelCosts(uniqueLevels);
        }
      }
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

   const handleLevelChange = async (level: string) => {
    if (!level || !organizationId) return;

    const today = new Date().toISOString().split('T')[0];
    const applicableCost = levelCosts.find(lc => 
      lc.level === level && 
      new Date(lc.effective_from) <= new Date(today) && 
      (!lc.effective_to || new Date(lc.effective_to) >= new Date(today))
    );

    setFormData(prev => ({
      ...prev,
      current_level: level,
      cost: applicableCost?.cost_per_month?.toString() || ''
    }));
  };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!organizationId) {
          alert("Organization context is missing. Cannot save cost.");
          return;
      }
      if (type === 'resource' && !formData.user_id) { 
        alert("User is required for Resource Cost."); 
        return; 
      }
      if (type === 'vendor' && !formData.vendor_name) { alert("Vendor Name is required."); return; }
      if (type === 'misc' && !formData.name) { alert("Name/Description is required."); return; }
      const costValue = formData.cost ? parseFloat(formData.cost as string) : undefined;
       if (formData.cost && isNaN(costValue as number)) {
           alert("Invalid Cost value.");
           return;
       }
      const dataToInsert: Partial<FormData> & { organization_id: string } = {
          ...formData,
          organization_id: organizationId,
          cost: type !== 'resource' ? costValue : undefined, // Only include cost for non-resource types
          invoice_id: formData.invoice_id || null,
      };
      // Clean up fields based on type
      if (type === 'resource') { 
          delete dataToInsert.vendor_name; 
          delete dataToInsert.cycle; 
          delete dataToInsert.approver_id; 
          delete dataToInsert.name; 
          delete dataToInsert.billed_by_id; 
          delete dataToInsert.approved_by_id; 
          delete dataToInsert.invoice_id;
          delete dataToInsert.cost; // Remove cost field for resource costs as it's derived from level_costs
      }
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
                 <div>
                   <Label htmlFor="current_level">Level</Label>
                   <Select 
                     name="current_level" 
                     value={formData.current_level || ''} 
                     onValueChange={handleLevelChange}
                   >
                     <SelectTrigger className="w-full mt-1">
                       <SelectValue placeholder="Select Level" />
                     </SelectTrigger>
                     <SelectContent>
                       {Array.from(new Set(levelCosts.map(lc => lc.level)))
                         .sort()
                         .map(level => (
                           <SelectItem key={level} value={level}>
                             {level} - ${levelCosts.find(lc => lc.level === level)?.cost_per_month.toLocaleString(undefined, {minimumFractionDigits: 2})} /month
                           </SelectItem>
                         ))}
                     </SelectContent>
                   </Select>
                 </div>
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

function CostManagementSection({ organizationId }: { organizationId: string | null }) {
  const [activeTab, setActiveTab] = useState<'resource' | 'vendor' | 'misc'>('resource');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'resource' | 'vendor' | 'misc'>('resource');
  const [resourceCosts, setResourceCosts] = useState<FormData[]>([]);
  const [vendorCosts, setVendorCosts] = useState<FormData[]>([]);
  const [miscCosts, setMiscCosts] = useState<FormData[]>([]);
  const [isLevelCostsModalOpen, setIsLevelCostsModalOpen] = useState(false);

  const verifyConnection = async () => {
    try {
      // Test the connection with a simple query
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .limit(1);

      if (error) {
        console.error('Supabase connection test failed:', error);
        return false;
      }
      console.log('Supabase connection successful');
      return true;
    } catch (err) {
      console.error('Supabase connection error:', err);
      return false;
    }
  };

  const fetchCosts = async () => {
      if (!organizationId) {
         setResourceCosts([]); setVendorCosts([]); setMiscCosts([]);
         return;
      }
      // Fetch Resource Costs
      const { data: resourceData, error: resourceError } = await supabase.from('resource_costs')
        .select(`*, user:users!resource_costs_user_id_fkey(id, name), manager:users!resource_costs_manager_id_fkey(id, name), organization:organizations(id, name)`)
        .eq('organization_id', organizationId);
       if (resourceError) console.error("Error fetching resource costs:", resourceError);
       else if (resourceData) setResourceCosts(resourceData as FormData[]); else setResourceCosts([]);

      // Fetch Vendor Costs
      const { data: vendorData, error: vendorError } = await supabase.from('vendor_costs')
        .select(`*, organization:organizations!vendor_costs_organization_id_fkey(id, name), approver:users!vendor_costs_approver_id_fkey(id, name), invoice:invoices!vendor_costs_invoice_id_fkey(id, name)`)
         .eq('organization_id', organizationId);
       if (vendorError) console.error("Error fetching vendor costs:", vendorError);
       else if (vendorData) setVendorCosts(vendorData as FormData[]); else setVendorCosts([]);

      // Fetch Miscellaneous Costs (using 'misc' internally, corresponds to miscellaneous_costs table)
      const { data: miscData, error: miscError } = await supabase.from('miscellaneous_costs')
        .select(`*, billed_by:users!miscellaneous_costs_billed_by_id_fkey(id, name), approved_by:users!miscellaneous_costs_approved_by_id_fkey(id, name), organization:organizations!miscellaneous_costs_organization_id_fkey(id, name), invoice:invoices!miscellaneous_costs_invoice_id_fkey(id, name)`)
         .eq('organization_id', organizationId);
      if (miscError) console.error("Error fetching misc costs:", miscError);
      else if (miscData) setMiscCosts(miscData as FormData[]); else setMiscCosts([]);
    };

  useEffect(() => {
    fetchCosts();
  }, [organizationId]);

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
              {!organizationId ? (<tr><td colSpan={headers.length} className="text-center py-4 text-gray-500">Select an organization to view costs.</td></tr>)
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
             {!organizationId ? (<tr><td colSpan={headers.length} className="text-center py-4 text-gray-500">Select an organization to view costs.</td></tr>)
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
              {!organizationId ? (<tr><td colSpan={headers.length} className="text-center py-4 text-gray-500">Select an organization to view costs.</td></tr>)
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
         <Button onClick={() => openModal(activeTab)} variant="default" size="sm" disabled={!organizationId} title={!organizationId ? "Select an organization first" : `Add new ${activeTab} cost`}>
           <Plus className="h-4 w-4 mr-2" />
           Add {activeTab} Cost
         </Button>
      </div>
      <div className="overflow-x-auto">
        {renderCostList()}
      </div>
      {isModalOpen && (
        <CostManagementModal isOpen={isModalOpen} onClose={handleModalClose} type={modalType} organizationId={organizationId} />
      )}
      <Button onClick={() => setIsLevelCostsModalOpen(true)} variant="outline" size="sm" disabled={!organizationId}>
        <Settings className="h-4 w-4 mr-2" />
        Manage Level Costs
      </Button>
      {isLevelCostsModalOpen && (
        <LevelCostsModal
          isOpen={isLevelCostsModalOpen}
          onClose={() => setIsLevelCostsModalOpen(false)}
          organizationId={organizationId}
        />
      )}
    </div>
  );
}

function LevelCostsModal({
  isOpen,
  onClose,
  organizationId
}: {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string | null;
}) {
  const [levelCosts, setLevelCosts] = useState<LevelCost[]>([]);
  const [newLevel, setNewLevel] = useState({ level: '', cost_per_month: '', effective_from: '' });

  useEffect(() => {
    if (isOpen && organizationId) {
      fetchLevelCosts();
    }
  }, [isOpen, organizationId]);

  const fetchLevelCosts = async () => {
    if (!organizationId) return;
    const { data, error } = await supabase
      .from('level_costs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('level', { ascending: true });
    
    if (error) {
      console.error('Error fetching level costs:', error);
    } else {
      setLevelCosts(data || []);
    }
  };

  const handleAddLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;

    const { error } = await supabase.from('level_costs').insert([{
      organization_id: organizationId,
      level: newLevel.level,
      cost_per_month: parseFloat(newLevel.cost_per_month),
      effective_from: newLevel.effective_from
    }]);

    if (error) {
      alert(`Error adding level cost: ${error.message}`);
    } else {
      setNewLevel({ level: '', cost_per_month: '', effective_from: '' });
      fetchLevelCosts();
    }
  };

  const handleDeleteLevel = async (id: string) => {
    const confirmation = window.confirm("Are you sure you want to delete this level cost?");
    if (!confirmation) return;

    const { error } = await supabase
      .from('level_costs')
      .delete()
      .eq('id', id);

    if (error) {
      alert(`Error deleting level cost: ${error.message}`);
    } else {
      fetchLevelCosts();
    }
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 ${isOpen ? 'flex' : 'hidden'} items-center justify-center z-50`}>
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Manage Level Costs</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleAddLevel} className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <Label htmlFor="level">Level</Label>
            <Input
              id="level"
              value={newLevel.level}
              onChange={(e) => setNewLevel(prev => ({ ...prev, level: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="cost_per_month">Cost per Month</Label>
            <Input
              id="cost_per_month"
              type="number"
              step="0.01"
              value={newLevel.cost_per_month}
              onChange={(e) => setNewLevel(prev => ({ ...prev, cost_per_month: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="effective_from">Effective From</Label>
            <Input
              id="effective_from"
              type="date"
              value={newLevel.effective_from}
              onChange={(e) => setNewLevel(prev => ({ ...prev, effective_from: e.target.value }))}
              required
            />
          </div>
          <Button type="submit" className="col-span-3">Add Level Cost</Button>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost per Month</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective From</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective To</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {levelCosts.map((cost) => (
                <tr key={cost.id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cost.level}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    ${cost.cost_per_month.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    {new Date(cost.effective_from).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    {cost.effective_to ? new Date(cost.effective_to).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteLevel(cost.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RevenueModal({
  isOpen,
  onClose,
  organizationId
}: {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string | null;
}) {
  const [formData, setFormData] = useState({
    billing_type: 'Direct' as 'Direct' | 'Indirect',
    billing_sub_type: 'resource_billing' as 'resource_billing' | 'service_billing' | 'product_billing' | 'others',
    from_date: '',
    to_date: '',
    revenue_amount: '',
    other_details: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) {
      alert('Organization ID is required');
      return;
    }

    const revenueAmount = parseFloat(formData.revenue_amount);
    if (isNaN(revenueAmount)) {
      alert('Please enter a valid revenue amount');
      return;
    }

    const { error } = await supabase.from('revenues').insert([{
      ...formData,
      organization_id: organizationId,
      revenue_amount: revenueAmount
    }]);

    if (error) {
      alert(`Error creating revenue entry: ${error.message}`);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Add Revenue Entry</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" title="Close modal">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="billing_type">Billing Type</Label>
            <Select
              name="billing_type"
              value={formData.billing_type}
              onValueChange={(value: 'Direct' | 'Indirect') => handleSelectChange('billing_type', value)}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select Billing Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Direct">Direct</SelectItem>
                <SelectItem value="Indirect">Indirect</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="billing_sub_type">Billing Sub-Type</Label>
            <Select
              name="billing_sub_type"
              value={formData.billing_sub_type}
              onValueChange={(value: 'resource_billing' | 'service_billing' | 'product_billing' | 'others') => 
                handleSelectChange('billing_sub_type', value)}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select Billing Sub-Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resource_billing">Resource Billing</SelectItem>
                <SelectItem value="service_billing">Service Billing</SelectItem>
                <SelectItem value="product_billing">Product Billing</SelectItem>
                <SelectItem value="others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="from_date">From Date</Label>
              <Input
                id="from_date"
                name="from_date"
                type="date"
                value={formData.from_date}
                onChange={handleInputChange}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="to_date">To Date</Label>
              <Input
                id="to_date"
                name="to_date"
                type="date"
                value={formData.to_date}
                onChange={handleInputChange}
                required
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="revenue_amount">Revenue Amount</Label>
            <Input
              id="revenue_amount"
              name="revenue_amount"
              type="number"
              step="0.01"
              value={formData.revenue_amount}
              onChange={handleInputChange}
              required
              className="mt-1"
            />
          </div>

          {formData.billing_sub_type === 'others' && (
            <div>
              <Label htmlFor="other_details">Other Details</Label>
              <Input
                id="other_details"
                name="other_details"
                value={formData.other_details}
                onChange={handleInputChange}
                placeholder="Please specify the billing details"
                className="mt-1"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Revenue</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RevenueManagementSection({ organizationId }: { organizationId: string | null }) {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);

  const fetchRevenues = async () => {
    if (!organizationId) {
      setRevenues([]);
      return;
    }
    const { data, error } = await supabase
      .from('revenues')
      .select('*')
      .eq('organization_id', organizationId)
      .order('from_date', { ascending: false });

    if (error) {
      console.error("Error fetching revenues:", error);
      setRevenues([]);
    } else if (data) {
      setRevenues(data);
    }
  };

  useEffect(() => {
    fetchRevenues();
  }, [organizationId]);

  const handleModalClose = () => {
    setIsRevenueModalOpen(false);
    fetchRevenues();
  };

  const handleDeleteRevenue = async (revenueId: string) => {
    const confirmation = window.confirm("Are you sure you want to delete this revenue entry?");
    if (!confirmation) return;

    const { error } = await supabase
      .from('revenues')
      .delete()
      .eq('id', revenueId);

    if (error) {
      alert(`Error deleting revenue: ${error.message}`);
    } else {
      fetchRevenues();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Revenue Management</h2>
        <Button 
          onClick={() => setIsRevenueModalOpen(true)} 
          variant="default" 
          size="sm" 
          disabled={!organizationId}
          title={!organizationId ? "Select an organization first" : "Add new revenue entry"}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Revenue
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing Type</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub-Type</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From Date</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To Date</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue Amount</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Other Details</th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {!organizationId ? (
              <tr><td colSpan={7} className="text-center py-4 text-gray-500">Select an organization to view revenue entries.</td></tr>
            ) : revenues.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-4 text-gray-500">No revenue entries found.</td></tr>
            ) : (
              revenues.map((revenue) => (
                <tr key={revenue.id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{revenue.billing_type}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    {revenue.billing_sub_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    {new Date(revenue.from_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    {new Date(revenue.to_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                    ${revenue.revenue_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{revenue.other_details || '-'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteRevenue(revenue.id)}
                      title="Delete Revenue Entry"
                    >
                      <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700"/>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {organizationId && (
        <RevenueModal
          isOpen={isRevenueModalOpen}
          onClose={handleModalClose}
          organizationId={organizationId}
        />
      )}
    </div>
  );
}

function ProfitSection({ organizationId }: { organizationId: string | null }) {
  const [profits, setProfits] = useState<Profit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfits = async () => {
      if (!organizationId) {
        setProfits([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profits_monthly')
          .select('*')
          .eq('organization_id', organizationId)
          .order('year', { ascending: false })
          .order('month', { ascending: false });

        if (error) {
          console.error('Error fetching profits:', error);
          setProfits([]);
        } else {
          setProfits(data || []);
        }
      } catch (err) {
        console.error('Error in fetchProfits:', err);
        setProfits([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProfits();
  }, [organizationId]);

  if (!organizationId) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
        <h2 className="text-lg font-semibold mb-6">Profit Analysis</h2>
        <div className="text-center text-gray-500">Select an organization to view profit analysis.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
      <h2 className="text-lg font-semibold mb-6">Profit Analysis</h2>
      {loading ? (
        <div className="text-center text-gray-500">Loading profit data...</div>
      ) : profits.length === 0 ? (
        <div className="text-center text-gray-500">No profit data available.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Resource Cost</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Vendor Cost</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Misc Cost</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Profit</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ROI (%)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {profits.map((profit) => (
                <tr key={profit.id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {`${profit.year}-${profit.month.toString().padStart(2, '0')}`}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                    ${parseFloat(profit.revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                    ${parseFloat(profit.resource_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                    ${parseFloat(profit.vendor_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                    ${parseFloat(profit.misc_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                    ${parseFloat(profit.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                    <span className={parseFloat(profit.profit) >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${parseFloat(profit.profit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                    <span className={parseFloat(profit.roi) >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {parseFloat(profit.roi).toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FinancialOverview({ organizationId }: { organizationId: string | null }) {
  const [financials, setFinancials] = useState<Financial[]>([]);
  const [snapshots, setSnapshots] = useState<FinancialSnapshot[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [loading, setLoading] = useState(false);

  const fetchFinancialData = async () => {
    if (!organizationId) {
      setFinancials([]);
      setSnapshots([]);
      return;
    }

    setLoading(true);
    try {
      // Fetch current financial data
      const { data: financialData, error: financialError } = await supabase
        .from('financials')
        .select('*')
        .eq('organization_id', organizationId);

      if (financialError) {
        console.error('Error fetching financials:', financialError);
      } else {
        setFinancials(financialData || []);
      }

      // Calculate date range based on filter period
      const now = new Date();
      let startDate = new Date();
      switch (filterPeriod) {
        case 'month':
          startDate.setMonth(now.getMonth() - 12); // Last 12 months
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 12); // Last 4 quarters (12 months)
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 3); // Last 3 years
          break;
      }

      // Fetch snapshots within the date range
      const { data: snapshotData, error: snapshotError } = await supabase
        .from('financial_snapshots')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('snapshot_date', startDate.toISOString().split('T')[0])
        .lte('snapshot_date', now.toISOString().split('T')[0])
        .order('snapshot_date', { ascending: true });

      if (snapshotError) {
        console.error('Error fetching snapshots:', snapshotError);
      } else {
        setSnapshots(snapshotData || []);
      }
    } catch (error) {
      console.error('Error in fetchFinancialData:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [organizationId, filterPeriod]);

  const aggregateData = (data: FinancialSnapshot[]) => {
    if (data.length === 0) return [];

    switch (filterPeriod) {
      case 'month':
        return data;
      case 'quarter': {
        const quarterlyData = data.reduce((acc: any[], snapshot) => {
          const date = new Date(snapshot.snapshot_date);
          const quarter = Math.floor(date.getMonth() / 3);
          const year = date.getFullYear();
          const key = `${year}-Q${quarter + 1}`;
          
          const existing = acc.find(item => item.period === key);
          if (existing) {
            existing.total_revenue += snapshot.total_revenue;
            existing.total_cost += snapshot.total_cost;
            existing.profit += snapshot.profit;
            existing.roi = (existing.profit / existing.total_cost) * 100;
          } else {
            acc.push({
              period: key,
              total_revenue: snapshot.total_revenue,
              total_cost: snapshot.total_cost,
              profit: snapshot.profit,
              roi: snapshot.roi
            });
          }
          return acc;
        }, []);
        return quarterlyData;
      }
      case 'year': {
        const yearlyData = data.reduce((acc: any[], snapshot) => {
          const year = new Date(snapshot.snapshot_date).getFullYear();
          
          const existing = acc.find(item => item.period === year.toString());
          if (existing) {
            existing.total_revenue += snapshot.total_revenue;
            existing.total_cost += snapshot.total_cost;
            existing.profit += snapshot.profit;
            existing.roi = (existing.profit / existing.total_cost) * 100;
          } else {
            acc.push({
              period: year.toString(),
              total_revenue: snapshot.total_revenue,
              total_cost: snapshot.total_cost,
              profit: snapshot.profit,
              roi: snapshot.roi
            });
          }
          return acc;
        }, []);
        return yearlyData;
      }
      default:
        return data;
    }
  };

  const aggregatedData = aggregateData(snapshots);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Financial Overview</h2>
        <Select value={filterPeriod} onValueChange={(value: 'month' | 'quarter' | 'year') => setFilterPeriod(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Monthly</SelectItem>
            <SelectItem value="quarter">Quarterly</SelectItem>
            <SelectItem value="year">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading financial data...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Cost Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={aggregatedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="total_revenue" name="Revenue" stroke="#8884d8" />
                    <Line type="monotone" dataKey="total_cost" name="Cost" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profit & ROI Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={aggregatedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(value, name) => name === 'roi' ? `${Number(value).toFixed(2)}%` : `$${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="profit" name="Profit" stroke="#8884d8" />
                    <Line yAxisId="right" type="monotone" dataKey="roi" name="ROI (%)" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Profit</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ROI</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {aggregatedData.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.period}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          ${item.total_revenue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          ${item.total_cost.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span className={item.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ${item.profit.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span className={item.roi >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {item.roi.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
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

  const verifyConnection = async () => {
    try {
      // Test the connection with a simple query
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .limit(1);

      if (error) {
        console.error('Supabase connection test failed:', error);
        return false;
      }
      console.log('Supabase connection successful');
      return true;
    } catch (err) {
      console.error('Supabase connection error:', err);
      return false;
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Test connection first
        const isConnected = await verifyConnection();
        if (!isConnected) {
          console.error('Unable to connect to Supabase');
          return;
        }

        console.log('Fetching initial auth data...');
        const { data: authData, error: authError } = await supabase.auth.getSession();
        if (authError || !authData.session?.user) {
          console.error('Auth error or no user session:', authError);
          setUserData({ user: null, session: null });
          setOrganizations([]);
          setLoading(false);
          return;
        }
        const user = authData.session.user;
        setUserData({ user, session: authData.session });

        // First get the user's organization_id from the users table
        console.log('Fetching user organization...');
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
        console.log('Fetching organization details...');
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('id', userData.organization_id)
          .single();

        if (orgError) {
          console.error("Error fetching organization:", orgError);
          setOrganizations([]);
        } else if (orgData) {
          console.log('Organization data fetched successfully:', orgData);
          setOrganizations([orgData]);
          // Auto-select the organization since user only has one
          setSelectedOrganizationId(orgData.id);
        }
      } catch (error) {
        console.error('Unexpected error in fetchInitialData:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchOrganizationData = async () => {
      if (!selectedOrganizationId) {
        console.log('No organization selected, skipping data fetch');
        setKpis([]);
        setFinancials([]);
        setDepartmentSpending([]);
        setFinancialSnapshots([]);
        return;
      }

      setLoading(true);
      console.log('Fetching data for organization:', selectedOrganizationId);

      try {
        // Test connection first
        const isConnected = await verifyConnection();
        if (!isConnected) {
          console.error('Unable to connect to Supabase');
          return;
        }

        // Fetch financials for the organization
        console.log('Fetching financials...');
        const { data: financialData, error: financialError } = await supabase
          .from('financials')
          .select('*')
          .eq('organization_id', selectedOrganizationId)
          .single();
        
        if (financialError) {
          console.error('Error fetching financials:', financialError);
          if (financialError.code === 'PGRST116') {
            console.log('No financial record found, creating initial record...');
            const { data: newFinancial, error: insertError } = await supabase
              .from('financials')
              .insert([{
                organization_id: selectedOrganizationId,
                planned_budget: 0,
                actual_budget: 0,
                forecasted_budget: 0,
                cost_variance: 0,
                roi: 0
              }])
              .select()
              .single();
            
            if (insertError) {
              console.error('Error creating initial financial record:', insertError);
            } else {
              console.log('Created initial financial record:', newFinancial);
              setFinancials([newFinancial]);
            }
          }
        } else {
          console.log('Financial data fetched successfully:', financialData);
          setFinancials(financialData ? [financialData] : []);
        }

        // Fetch department spending for the organization
        console.log('Fetching department spending...');
        const { data: departmentData, error: departmentError } = await supabase
          .from('department_financials')
          .select(`
            id,
            organization_id,
            department_id,
            month_year,
            planned_spend,
            actual_spend,
            forecasted_spend,
            created_at
          `)
          .eq('organization_id', selectedOrganizationId);
        
        if (departmentError) {
          console.error('Error fetching department spending:', departmentError);
        } else {
          console.log('Department spending data fetched successfully:', departmentData);
          setDepartmentSpending(departmentData?.map(d => ({
            id: d.id,
            organization_id: d.organization_id,
            department_id: d.department_id,
            month_year: d.month_year,
            planned_spend: d.planned_spend,
            actual_spend: d.actual_spend,
            forecasted_spend: d.forecasted_spend,
            created_at: d.created_at,
            spent: d.actual_spend,
            budget: d.planned_spend
          })) || []);
        }

        // Fetch financial snapshots for the organization
        console.log('Fetching financial snapshots...');
        const { data: snapshotData, error: snapshotError } = await supabase
          .from('financial_snapshots')
          .select(`
            id,
            organization_id,
            snapshot_date,
            total_budget,
            total_spent,
            remaining_budget,
            cost_variance,
            roi,
            created_at
          `)
          .eq('organization_id', selectedOrganizationId)
          .order('snapshot_date', { ascending: true });
        
        if (snapshotError) {
          console.error('Error fetching financial snapshots:', snapshotError);
        } else {
          console.log('Financial snapshots fetched successfully:', snapshotData);
          setFinancialSnapshots(snapshotData?.map(s => ({
            id: s.id,
            organization_id: s.organization_id,
            snapshot_date: s.snapshot_date,
            total_budget: s.total_budget,
            total_spent: s.total_spent,
            remaining_budget: s.remaining_budget,
            cost_variance: s.cost_variance,
            roi: s.roi,
            created_at: s.created_at
          })) || []);
        }

        // Update KPIs
        const currentFinancials = financialData || { cost_variance: 0, roi: 0, actual_budget: 0 };
        const mockKpis: Kpi[] = [
          { 
            id: 'k1', 
            name: 'Budget Variance', 
            value: currentFinancials.cost_variance ?? 0, 
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
            value: currentFinancials.roi ?? 0, 
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
            value: currentFinancials.actual_budget ?? 0, 
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

      } catch (error) {
        console.error('Unexpected error in fetchOrganizationData:', error);
      } finally {
        setLoading(false);
      }
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
            {kpis.map((kpi: Kpi) => <MetricCard key={kpi.id} metric={kpi} />)}
          </div>

          <FinancialOverview organizationId={selectedOrganizationId} />

          <CostManagementSection organizationId={selectedOrganizationId} />
          <InvoiceManagementSection organizationId={selectedOrganizationId} />
          <RevenueManagementSection organizationId={selectedOrganizationId} />
          <ProfitSection organizationId={selectedOrganizationId} />
        </>
      )}
    </div>
  );
};

export default KpiFinancial;
