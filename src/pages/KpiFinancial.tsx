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
import { InvoiceModal as ImportedInvoiceModal, InvoiceModalProps as ImportedInvoiceModalProps } from '@/components/InvoiceModal';

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
  name: string;
  type: 'Vendor' | 'Miscellaneous';
  cost: number;
  invoice_date: string;
  platform?: string;
  organization_id: string;
}

interface Cost {
  id: string;
  organization_id: string;
  cost?: number;  // Only allow number type
  invoice_id?: string | null;
  // Resource cost specific fields
  user_id?: string;
  manager_id?: string;
  start_date?: string;
  end_date?: string;
  starting_level?: string;
  current_level?: string;
  status?: 'Active' | 'Resigned' | 'Separated';
  billing?: 'Billable' | 'Not Billable';
  // Vendor cost specific fields
  vendor_name?: string;
  cycle?: 'one-time' | 'Continuous';
  approver_id?: string;
  // Misc cost specific fields
  name?: string;
  billed_by_id?: string;
  approved_by_id?: string;
  // Additional fields
  user?: { id: string; name: string | null; email: string }; // Add id and email, allow null name
  manager?: { id: string; name: string | null; email: string }; // Add id and email, allow null name
  organization?: { id: string; name: string };
  approver?: { id: string; name: string | null; email: string }; // Add id and email, allow null name
  billed_by?: { id: string; name: string | null; email: string }; // Add id and email, allow null name
  approved_by?: { id: string; name: string | null; email: string }; // Add id and email, allow null name
  invoice?: { id: string; name: string } | null;
  created_at?: string;
  updated_at?: string;
  // Program field
  program_id?: string;
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

interface ProfitRawData {
  id: string;
  organization_id: string;
  year: number;
  month: number;
  revenue: number;
  resource_cost: number;
  vendor_cost: number;
  misc_cost: number;
  total_cost: number;
  profit: number;
  roi: number;
  debug_role?: string;
  debug_user_id?: string;
  debug_user_org_id?: string;
}

// Add this interface near the top of the file with other interfaces
interface MonthlyProfitData {
  period: string;
  total_revenue: number;
  total_cost: number;
  profit: number;
  roi: number;
}

// Add new interface for navigation items
interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface FormData {
  id: string;
  organization_id: string;
  // Make cost property a number type only, and handle string conversion in the UI layer
  cost?: number;
  invoice_id?: string | null;
  // Resource cost specific fields
  user_id?: string;
  manager_id?: string;
  start_date?: string;
  end_date?: string;
  starting_level?: string;
  current_level?: string;
  status?: 'Active' | 'Resigned' | 'Separated';
  billing?: 'Billable' | 'Not Billable';
  // Vendor cost specific fields
  vendor_name?: string;
  cycle?: 'one-time' | 'Continuous';
  approver_id?: string;
  // Misc cost specific fields
  name?: string;
  billed_by_id?: string;
  approved_by_id?: string;
  // Additional fields
  user?: { id: string; name: string | null; email: string }; // Add id and email, allow null name
  manager?: { id: string; name: string | null; email: string }; // Add id and email, allow null name
  organization?: { id: string; name: string };
  approver?: { id: string; name: string | null; email: string }; // Add id and email, allow null name
  billed_by?: { id: string; name: string | null; email: string }; // Add id and email, allow null name
  approved_by?: { id: string; name: string | null; email: string }; // Add id and email, allow null name
  invoice?: { id: string; name: string } | null;
  created_at?: string;
  updated_at?: string;
  // Program field
  program_id?: string;
  email?: string;
  managerEmail?: string;
  approverEmail?: string;
}

interface InvoiceForSelect {
  id: string;
  name: string;
  type: string;
  cost: number; // Renamed from amount based on usage/previous error
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
          <button className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Download budget overview" title="Download budget overview">
            <Download className="h-5 w-5 text-gray-500" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Share budget overview" title="Share budget overview">
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

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string | null;
  editingInvoice?: Invoice | null;
}

interface CostManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'resource' | 'vendor' | 'misc';
  organizationId: string | null;
  editingCost?: Cost | null;
}

interface RevenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string | null;
  editingRevenue?: Revenue | null;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  editingInvoice = null
}) => {
  if (!isOpen) return null;
  // ... existing implementation ...
  return <div>Existing implementation</div>;
};

const CostManagementModal: React.FC<CostManagementModalProps> = ({
  isOpen,
  onClose,
  type,
  organizationId,
  editingCost = null
}) => {
  // Log the editingCost prop on every render
  console.log('[CostModal Render] editingCost prop:', editingCost);

  // STATE DECLARATIONS (Ensure these are present)
  const [formData, setFormData] = useState<FormData>({
    id: '',
    organization_id: organizationId || '',
    cost: undefined,
    invoice_id: null,
    user_id: '',
    manager_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    starting_level: '',
    current_level: '',
    status: undefined,
    billing: undefined,
    vendor_name: '',
    cycle: undefined,
    approver_id: '',
    name: '',
    billed_by_id: '',
    approved_by_id: '',
    program_id: ''
  });
  const [users, setUsers] = useState<Array<{ id: string; name: string | null; user_type: string; email: string }>>([]);
  const [programs, setPrograms] = useState<Array<{ id: string; name: string }>>([]);
  const [invoices, setInvoices] = useState<Array<{ id: string; name: string; type: string; cost: number }>>([]);
  const [levelCostLevels, setLevelCostLevels] = useState<string[]>([]);
  const [allLevelCosts, setAllLevelCosts] = useState<LevelCost[]>([]);
  const [calculatedResourceCost, setCalculatedResourceCost] = useState<number | null>(null);

  // Filter arrays (Ensure these are present)
  const validUsers = users.filter(user => user && user.id);
  const validInvoices = invoices.filter(invoice => invoice && invoice.id);
  const validPrograms = programs.filter(program => program && program.id);

  // Log filtered lists early
  // console.log('[CostModal] Valid Users (All):', validUsers);
  // console.log('[CostModal] Valid Internal Users (Resource Dropdown):', validUsers.filter(user => user.user_type === 'internal'));

  // CORRECTED Data Fetching useEffect
  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId) {
         // Clear all dropdown data if no organization is selected
         setUsers([]);
         setPrograms([]);
         setInvoices([]);
         setAllLevelCosts([]);
         setLevelCostLevels([]);
         return;
      }

      try {
          // Fetch Users (Always needed) - Include user_type and email
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, name, user_type, email') // Add email
            .eq('organization_id', organizationId);
          if (usersError) throw usersError;
          // Cast to the updated type
          setUsers((usersData as Array<{ id: string; name: string | null; user_type: string; email: string }>) || []);
          console.log('Fetched Users Data:', usersData); // Log raw fetched data

          // Fetch Programs (Always needed)
          const { data: programsData, error: programsError } = await supabase
            .from('programs')
            .select('id, name')
            .eq('organization_id', organizationId);
          if (programsError) throw programsError;
          setPrograms(programsData || []);

          // Fetch Invoices (Conditional)
          if (type === 'vendor' || type === 'misc') {
            const { data: invoicesData, error: invoicesError } = await supabase
              .from('invoices')
              .select('id, name, type, cost')
              .eq('organization_id', organizationId)
              .eq('type', type === 'vendor' ? 'Vendor' : 'Miscellaneous');
            if (invoicesError) throw invoicesError;
            setInvoices((invoicesData as Array<{ id: string; name: string; type: string; cost: number }>) || []);
          } else {
            setInvoices([]);
          }

          // Fetch Level Costs (Conditional)
          if (type === 'resource') {
            const { data: levelCostsData, error: levelCostsError } = await supabase
              .from('level_costs')
              .select('*')
              .eq('organization_id', organizationId);
            if (levelCostsError) throw levelCostsError;
            const costs = (levelCostsData as LevelCost[]) || [];
            setAllLevelCosts(costs);
            const distinctLevels = [...new Set(costs.map(lc => lc.level))].filter(Boolean);
            setLevelCostLevels(distinctLevels);
          } else {
            setAllLevelCosts([]);
            setLevelCostLevels([]);
          }
      } catch (error: any) {
          console.error("Error fetching data for modal:", error.message);
          // Clear state on error
          setUsers([]);
          setPrograms([]);
          setInvoices([]);
          setAllLevelCosts([]);
          setLevelCostLevels([]);
      }
    };

    fetchData();
    // console.log('Current Users State:', users); // Remove log
  }, [organizationId, type]);

  // useEffect for setting form data on edit (Ensure this is present)
  useEffect(() => {
    // console.log('[CostModal useEffect] Received editingCost:', editingCost); // Keep if needed
    if (editingCost) {
        const startDate = editingCost.start_date ? editingCost.start_date.split('T')[0] : new Date().toISOString().split('T')[0];
        const endDate = editingCost.end_date ? editingCost.end_date.split('T')[0] : '';

        // Directly set state without intermediate variable
      setFormData({
        id: editingCost.id || '',
        organization_id: editingCost.organization_id || organizationId || '',
            cost: type === 'resource' ? undefined : editingCost.cost,
            invoice_id: editingCost.invoice_id || '',
            user_id: editingCost.user_id || '',
            manager_id: editingCost.manager_id || '',
            start_date: startDate,
            end_date: endDate,
            starting_level: editingCost.starting_level || '',
            current_level: editingCost.current_level || '',
            status: editingCost.status || undefined,
            billing: editingCost.billing || undefined,
            vendor_name: editingCost.vendor_name || '',
            cycle: editingCost.cycle || undefined,
            approver_id: editingCost.approver_id || '',
            name: editingCost.name || '',
            billed_by_id: editingCost.billed_by_id || '',
            approved_by_id: editingCost.approved_by_id || '',
            program_id: editingCost.program_id || ''
        });
        // console.log('[CostModal useEffect] Called setFormData with:', { /* object details */ }); // Simplified log if needed

    } else {
        // Reset form for adding new
      setFormData({
        id: '',
        organization_id: organizationId || '',
        cost: undefined,
            invoice_id: '', // Use empty string for 'none' select value
        user_id: '',
        manager_id: '',
            start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        starting_level: '',
        current_level: '',
        status: undefined,
        billing: undefined,
        vendor_name: '',
        cycle: undefined,
        approver_id: '',
        name: '',
        billed_by_id: '',
            approved_by_id: '',
            program_id: ''
          });
    }
  }, [editingCost, organizationId, isOpen, type]); // Add type dependency

  // useEffect for calculating cost (Ensure this is present)
  useEffect(() => {
    if (type === 'resource' && formData.current_level && formData.start_date && allLevelCosts.length > 0) {
        const targetDate = new Date(formData.start_date + 'T00:00:00Z');
        const applicableCost = allLevelCosts.find(lc =>
            lc.level === formData.current_level &&
            new Date(lc.effective_from) <= targetDate &&
            (lc.effective_to === null || new Date(lc.effective_to) >= targetDate)
        );
        setCalculatedResourceCost(applicableCost ? applicableCost.cost_per_month : null);
    } else {
        setCalculatedResourceCost(null);
    }
  }, [type, formData.current_level, formData.start_date, allLevelCosts]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // ... (existing logic)
    const { name, value } = e.target;
    if (name === 'cost') {
      const costValue = value === '' ? undefined : parseFloat(value);
      setFormData(prev => ({ ...prev, [name]: costValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prevState => {
      // Log previous state focusing on ID and the field changing
      console.log(`[handleSelectChange] Field: ${name}, Value: ${value}, Prev State ID: ${prevState.id}, Prev State UserID: ${prevState.user_id}`);

      // 1. Create base new state with the direct change using spread
      let newState: FormData = { ...prevState };
      (newState as any)[name] = value;

      // 2. Calculate derived changes based on the *current* change
      let derivedChanges: Partial<FormData> = {};
      if (type === 'resource') {
          if (name === 'user_id') {
              const selectedUser = users.find(user => user.id === value);
              derivedChanges.email = selectedUser?.email || '';
          } else if (name === 'manager_id') {
              const selectedManager = users.find(user => user.id === value);
              derivedChanges.managerEmail = selectedManager?.email || '';
          } else if (name === 'approver_id') {
              const selectedApprover = users.find(user => user.id === value);
              derivedChanges.approverEmail = selectedApprover?.email || '';
          }
      } else if ((type === 'vendor' || type === 'misc') && name === 'invoice_id') {
          // Recalculate cost based on the potentially updated invoice_id in newState
          if (newState.invoice_id && newState.invoice_id !== 'none') {
              const selectedInvoice = invoices.find(inv => inv.id === newState.invoice_id);
              // Use selected invoice cost, fallback to 0 if not found or for 'none'
              derivedChanges.cost = selectedInvoice ? selectedInvoice.cost : 0;
          } else {
              // Reset cost if invoice is deselected or type requires it
              derivedChanges.cost = 0; // Default to 0 for vendor/misc if no invoice
          }
      }

      // 3. Apply derived changes
      newState = { ...newState, ...derivedChanges };

      console.log(`[handleSelectChange] Final New State (ID: ${newState.id}, UserID: ${newState.user_id}):`, newState);
      return newState;
    });
  };

  // CORRECTED handleSubmit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) {
      alert('Organization ID is required');
      return;
    }

    // Log formData right before validation
    // console.log('[handleSubmit] formData at submission:', formData); // Remove log

    // Validation logic (keep as is)
    if (type === 'resource') {
      // ... (validation for resource)
      if (!formData.user_id) { 
          console.error('[handleSubmit] Validation Error: formData.user_id is missing!', formData); // Log details on error
          alert('User is required for resource costs'); 
          return; 
      }
      if (!formData.start_date) { alert('Start date is required'); return; }
    } else if (type === 'vendor') {
      // ... (validation for vendor)
      if (!formData.vendor_name) { alert('Vendor name is required'); return; }
      if (!formData.start_date) { alert('Start date is required'); return; }
    } else if (type === 'misc') {
      // ... (validation for misc)
      if (!formData.name) { alert('Cost name is required'); return; }
    }

    const table = type === 'resource' ? 'resource_costs' 
                : type === 'vendor' ? 'vendor_costs' 
                : 'miscellaneous_costs';

    // CORRECTED Payload Construction
    let payload: any = {
      organization_id: organizationId,
      program_id: formData.program_id || null,
      // cost, invoice_id, start/end dates added conditionally below
    };

    if (type === 'resource') {
      payload = {
        ...payload,
        user_id: formData.user_id,
        manager_id: formData.manager_id || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        starting_level: formData.starting_level || null,
        current_level: formData.current_level || null,
        status: formData.status || null,
        billing: formData.billing || null,
        // No cost, no invoice_id for resource
      };
    } else if (type === 'vendor') {
      payload = {
        ...payload,
        cost: formData.cost, // Has cost
        invoice_id: formData.invoice_id || null, // Has invoice_id
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        vendor_name: formData.vendor_name,
        cycle: formData.cycle || null,
        approver_id: formData.approver_id || null,
      };
    } else if (type === 'misc') {
      payload = {
        ...payload,
        cost: formData.cost, // Has cost
        invoice_id: formData.invoice_id || null, // Has invoice_id
        name: formData.name,
        billed_by_id: formData.billed_by_id || null,
        approved_by_id: formData.approved_by_id || null,
        // No start_date, end_date for misc
      };
    }

    // Timestamps (keep as is)
    if (editingCost) {
      payload.updated_at = new Date().toISOString();
    } else {
      payload.created_at = new Date().toISOString();
      payload.updated_at = new Date().toISOString();
    }

    // Supabase call (keep as is)
    let error;
    // console.log(`[handleSubmit] Payload for ${type}:`, payload); // Remove log
    if (editingCost) {
      const { error: updateError } = await supabase.from(table).update(payload).eq('id', editingCost.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from(table).insert([payload]);
      error = insertError;
    }

    if (error) {
      alert(`Error ${editingCost ? 'updating' : 'creating'} cost: ${error.message}`);
    } else {
      onClose();
    }
  };

  // JSX Rendering (Ensure level dropdowns and calculated cost display are present for resource)
  // ... (rest of the component, including the return statement with the form) ...
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
         {/* ... Modal Header ... */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{editingCost ? 'Edit' : 'Add New'} {type.charAt(0).toUpperCase() + type.slice(1)} Cost</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" title="Close modal"><X className="h-5 w-5 text-gray-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Resource Fields */} 
          {type === 'resource' && (
            <>
               {/* User Dropdown */} 
              <div>
                <Label htmlFor="user_id">Resource *</Label>
                <select
                  id="user_id"
                  title="Resource User"
                  disabled={users.length === 0}
                  name="user_id"
                  value={formData.user_id || ''}
                  onChange={(e) => handleSelectChange(e.target.name, e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select User</option>
                  {validUsers.map((user) => (
                    <option key={user.id} value={user.id}>{user.name || user.email || user.id}</option>
                  ))}
                </select>
              </div>
               {/* Manager Dropdown */} 
              <div>
                <Label htmlFor="manager_id">Manager</Label>
                <select
                  id="manager_id"
                  title="Manager"
                  disabled={users.length === 0}
                  name="manager_id"
                  value={formData.manager_id || ''}
                  onChange={(e) => handleSelectChange(e.target.name, e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select Manager</option>
                  {validUsers.map((user) => (
                    <option key={user.id} value={user.id}>{user.name || user.email || user.id}</option>
                  ))}
                </select>
              </div>
               {/* Starting Level Dropdown */} 
              <div>
                <Label htmlFor="starting_level">Starting Level</Label>
                <Select name="starting_level" value={formData.starting_level || 'none'} onValueChange={(value) => handleSelectChange('starting_level', value === 'none' ? '' : value)}>
                   <SelectTrigger className="w-full mt-1"><SelectValue placeholder="Select Starting Level" /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="none">None</SelectItem>
                     {levelCostLevels.map((level: string) => (<SelectItem key={level} value={level}>{level}</SelectItem>))}
                   </SelectContent>
                 </Select>
               </div>
               {/* Current Level Dropdown */} 
               <div>
                 <Label htmlFor="current_level">Current Level</Label>
                 <Select name="current_level" value={formData.current_level || 'none'} onValueChange={(value) => handleSelectChange('current_level', value === 'none' ? '' : value)}>
                   <SelectTrigger className="w-full mt-1"><SelectValue placeholder="Select Current Level" /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="none">None</SelectItem>
                     {levelCostLevels.map((level: string) => (<SelectItem key={level} value={level}>{level}</SelectItem>))}
                   </SelectContent>
                 </Select>
               </div>
               {/* Calculated Cost Display */} 
              <div>
                <Label htmlFor="calculated_cost">Calculated Cost per Month</Label>
                <Input id="calculated_cost" type="text" value={calculatedResourceCost !== null ? `$${calculatedResourceCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A - Select Level & Start Date'} readOnly disabled className="bg-gray-100 cursor-not-allowed mt-1" />
                {calculatedResourceCost === null && formData.current_level && formData.start_date && (
                   <p className="text-xs text-red-500 mt-1">No cost found for the selected level and effective date.</p>
                )}
              </div>
               {/* Status Dropdown */} 
               <div>
                 <Label htmlFor="status">Status</Label>
                 <select
                   id="status"
                   title="Status"
                   name="status"
                   value={formData.status || ''}
                   onChange={(e) => handleSelectChange(e.target.name, e.target.value)}
                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                 >
                   <option value="">Select Status</option>
                   <option value="Active">Active</option>
                   <option value="Resigned">Resigned</option>
                   <option value="Separated">Separated</option>
                 </select>
               </div>
               {/* Billing Dropdown */} 
               <div>
                 <Label htmlFor="billing">Billing</Label>
                 <select
                   id="billing"
                   title="Billing Status"
                   name="billing"
                   value={formData.billing || ''}
                   onChange={(e) => handleSelectChange(e.target.name, e.target.value)}
                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                 >
                   <option value="">Select Status</option>
                   <option value="Billable">Billable</option>
                   <option value="Non-Billable">Non-Billable</option>
                   <option value="Strategic">Strategic</option>
                 </select>
               </div>
            </>
          )}

           {/* Vendor Fields */} 
          {type === 'vendor' && (
            <>
               {/* Vendor Name Input */}
               <div><Label htmlFor="vendor_name">Vendor Name</Label><Input id="vendor_name" name="vendor_name" value={formData.vendor_name || ''} onChange={handleInputChange} required /></div>
               {/* Cycle Dropdown */}
              <div>
                 <Label htmlFor="cycle">Cycle</Label>
                 <Select name="cycle" value={formData.cycle || 'none'} onValueChange={(value) => handleSelectChange('cycle', value === 'none' ? '' : value)}>
                   <SelectTrigger className="w-full mt-1"><SelectValue placeholder="Select Cycle" /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="one-time">One-time</SelectItem>
                     <SelectItem value="Continuous">Continuous</SelectItem>
                   </SelectContent>
                 </Select>
              </div>
               {/* Approver Dropdown */} 
              <div>
                <Label htmlFor="approver_id">Approver</Label>
                <Select name="approver_id" value={formData.approver_id || 'none'} onValueChange={(value) => handleSelectChange('approver_id', value === 'none' ? '' : value)}>
                  <SelectTrigger className="w-full mt-1"><SelectValue placeholder="Select Approver" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {/* Display name or email or id */}
                    {validUsers.map((user) => (<SelectItem key={user.id} value={user.id}>{user.name || user.email || user.id}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
               {/* Invoice Dropdown (Vendor) */} 
               <div>
                 <Label htmlFor="invoice_id">Invoice</Label>
                 <Select name="invoice_id" value={formData.invoice_id || 'none'} onValueChange={(value) => handleSelectChange('invoice_id', value === 'none' ? '' : value)}>
                    <SelectTrigger className="w-full mt-1"><SelectValue placeholder="Select Invoice" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {validInvoices.map((invoice) => (<SelectItem key={invoice.id} value={invoice.id}>{invoice.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
            </>
          )}

           {/* Misc Fields */} 
          {type === 'misc' && (
            <>
               {/* Name Input */}
               <div><Label htmlFor="name">Cost Name</Label><Input id="name" name="name" value={formData.name || ''} onChange={handleInputChange} required /></div>
               {/* Billed By Dropdown */} 
              <div>
                <Label htmlFor="billed_by_id">Billed By</Label>
                <Select name="billed_by_id" value={formData.billed_by_id || 'none'} onValueChange={(value) => handleSelectChange('billed_by_id', value === 'none' ? '' : value)}>
                  <SelectTrigger className="w-full mt-1"><SelectValue placeholder="Select Billed By" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {/* Display name or email or id */}
                    {validUsers.map((user) => (<SelectItem key={user.id} value={user.id}>{user.name || user.email || user.id}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
               {/* Approved By Dropdown */} 
               <div>
                 <Label htmlFor="approved_by_id">Approved By</Label>
                 <Select name="approved_by_id" value={formData.approved_by_id || 'none'} onValueChange={(value) => handleSelectChange('approved_by_id', value === 'none' ? '' : value)}>
                    <SelectTrigger className="w-full mt-1"><SelectValue placeholder="Select Approved By" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {/* Display name or email or id */}
                      {validUsers.map((user) => (<SelectItem key={user.id} value={user.id}>{user.name || user.email || user.id}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
               {/* Invoice Dropdown (Misc) */} 
               <div>
                 <Label htmlFor="invoice_id">Invoice</Label>
                 <Select name="invoice_id" value={formData.invoice_id || 'none'} onValueChange={(value) => handleSelectChange('invoice_id', value === 'none' ? '' : value)}>
                    <SelectTrigger className="w-full mt-1"><SelectValue placeholder="Select Invoice" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {validInvoices.map((invoice) => (<SelectItem key={invoice.id} value={invoice.id}>{invoice.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
            </>
          )}

           {/* Cost Amount (Vendor/Misc Only) */} 
           {(type === 'vendor' || type === 'misc') && (
          <div>
            <Label htmlFor="cost">Cost Amount</Label>
            <Input
                  id="cost" name="cost" type="number" step="0.01" value={formData.cost || ''} onChange={handleInputChange} required
                  readOnly={!!formData.invoice_id && formData.invoice_id !== 'none'}
                  disabled={!!formData.invoice_id && formData.invoice_id !== 'none'}
                  className={!!formData.invoice_id && formData.invoice_id !== 'none' ? 'bg-gray-100 cursor-not-allowed' : ''}
                />
                {!!formData.invoice_id && formData.invoice_id !== 'none' && (
                  <p className="text-xs text-gray-500 mt-1">Cost is automatically populated from the selected invoice.</p>
                )}
          </div>
           )}
 
           {/* Program Dropdown (All Types) */} 
           <div>
             <Label htmlFor="program_id">Program</Label>
             <Select name="program_id" value={formData.program_id || 'none'} onValueChange={(value) => handleSelectChange('program_id', value === 'none' ? '' : value)}>
               <SelectTrigger className="w-full mt-1"><SelectValue placeholder="Select Program" /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="none">None</SelectItem>
                 {validPrograms.map((program) => (<SelectItem key={program.id} value={program.id}>{program.name}</SelectItem>))}
               </SelectContent>
             </Select>
           </div>
 
           {/* Start Date (Resource/Vendor Only) */} 
           {(type === 'resource' || type === 'vendor') && (
             <div><Label htmlFor="start_date">Start Date</Label><Input id="start_date" name="start_date" type="date" value={formData.start_date || ''} onChange={handleInputChange} required /></div>
           )}
 
           {/* End Date (Resource/Vendor Only) */} 
           {(type === 'resource' || type === 'vendor') && (
             <div><Label htmlFor="end_date">End Date</Label><Input id="end_date" name="end_date" type="date" value={formData.end_date || ''} onChange={handleInputChange} /></div>
           )}
 
           {/* Billing Status - Using standard HTML select for testing */}
           <div className="mt-4">
             <Label htmlFor="billing">Billing Status</Label>
             <select
               id="billing" // Keep ID for label
               title="Billing Status" // Add title for accessibility
               name="billing"
               value={formData.billing || ''} // Handle potential undefined
               onChange={(e) => handleSelectChange(e.target.name, e.target.value)}
               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" // Basic styling
             >
               <option value="">Select Status</option>
               <option value="Billable">Billable</option>
               <option value="Non-Billable">Non-Billable</option>
               <option value="Strategic">Strategic</option>
             </select>
           </div>
 
           {/* Billing Cycle - Keep as Tremor Select for now */}
           {(type === 'vendor' || type === 'misc') && (
             <div className="mt-4">
               <Label htmlFor="cycle">Billing Cycle</Label>
               <Select name="cycle" value={formData.cycle || 'none'} onValueChange={(value) => handleSelectChange('cycle', value === 'none' ? '' : value)}>
                 <SelectTrigger className="w-full mt-1"><SelectValue placeholder="Select Cycle" /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="one-time">One-time</SelectItem>
                   <SelectItem value="Continuous">Continuous</SelectItem>
                 </SelectContent>
               </Select>
             </div>
           )}
 
           {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6">
             <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
             <Button type="submit">{editingCost ? 'Update' : 'Add'} Cost</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RevenueModal: React.FC<RevenueModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  editingRevenue = null
}) => {
  const [formData, setFormData] = useState({
    billing_type: 'Direct' as 'Direct' | 'Indirect',
    billing_sub_type: 'resource_billing' as 'resource_billing' | 'service_billing' | 'product_billing' | 'others',
    from_date: new Date().toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0],
    revenue_amount: '',
    other_details: '',
    organization_id: organizationId || ''
  });

  useEffect(() => {
    if (editingRevenue) {
      setFormData({
        billing_type: editingRevenue.billing_type,
        billing_sub_type: editingRevenue.billing_sub_type,
        from_date: editingRevenue.from_date,
        to_date: editingRevenue.to_date,
        revenue_amount: editingRevenue.revenue_amount.toString(),
        other_details: editingRevenue.other_details || '',
        organization_id: editingRevenue.organization_id
      });
    } else {
      setFormData({
        billing_type: 'Direct',
        billing_sub_type: 'resource_billing',
        from_date: new Date().toISOString().split('T')[0],
        to_date: new Date().toISOString().split('T')[0],
        revenue_amount: '',
        other_details: '',
        organization_id: organizationId || ''
      });
    }
  }, [editingRevenue, organizationId, isOpen]);

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

    if (editingRevenue) {
      // Update existing revenue - ambiguity is likely in triggers, reverting to simple update
      const { error: updateError } = await supabase
        .from('revenues')
        .update({
          billing_type: formData.billing_type,
          billing_sub_type: formData.billing_sub_type,
          from_date: formData.from_date,
          to_date: formData.to_date,
          revenue_amount: revenueAmount,
          other_details: formData.other_details || null
        })
        .filter('id', 'eq', editingRevenue.id)
        .filter('organization_id', 'eq', organizationId);

      if (updateError) {
        console.error('Update error:', updateError);
        alert(`Error updating revenue: ${updateError.message}`);
      } else {
        onClose();
      }
    } else {
      // Create new revenue - include organization_id
      const { error: insertError } = await supabase
        .from('revenues')
        .insert({
          organization_id: organizationId,
          billing_type: formData.billing_type,
          billing_sub_type: formData.billing_sub_type,
          from_date: formData.from_date,
          to_date: formData.to_date,
          revenue_amount: revenueAmount,
          other_details: formData.other_details || null
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        alert(`Error creating revenue: ${insertError.message}`);
      } else {
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{editingRevenue ? 'Edit' : 'Add New'} Revenue</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" title="Close modal">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="billing_type">Billing Type</Label>
            <Select
              value={formData.billing_type}
              onValueChange={(value) => handleSelectChange('billing_type', value)}
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
              value={formData.billing_sub_type}
              onValueChange={(value) => handleSelectChange('billing_sub_type', value)}
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

          <div>
            <Label htmlFor="from_date">From Date</Label>
            <Input
              id="from_date"
              name="from_date"
              type="date"
              value={formData.from_date}
              onChange={handleInputChange}
              required
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
            />
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
            />
          </div>

          <div>
            <Label htmlFor="other_details">Other Details (Optional)</Label>
            <Input
              id="other_details"
              name="other_details"
              value={formData.other_details}
              onChange={handleInputChange}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editingRevenue ? 'Update' : 'Add'} Revenue
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

function InvoiceManagementSection({ organizationId }: { organizationId: string | null }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const fetchInvoices = async () => {
    if (!organizationId) {
      setInvoices([]);
      return;
    }
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('organization_id', organizationId)
      .order('invoice_date', { ascending: false });
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
    setEditingInvoice(null);
    fetchInvoices();
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    const confirmation = window.confirm("Are you sure you want to delete this invoice? This cannot be undone.");
    if (!confirmation) return;

    // Check if invoice is linked to any costs before deleting
    const { data: linkedCosts, error: checkError } = await supabase
      .from('invoices')
      .select('vendor_cost_id, miscellaneous_cost_id')
      .eq('id', invoiceId)
      .single();
    if (checkError && checkError.code !== 'PGRST116') {
      alert("Error checking if invoice is linked. Deletion aborted.");
      return;
    }
    if (linkedCosts?.vendor_cost_id || linkedCosts?.miscellaneous_cost_id) {
      alert("Cannot delete invoice because it is linked to a cost entry. Please unlink it from the cost entry first (by editing the cost).");
      return;
    }

    // Proceed with deletion if not linked
    const { error: deleteError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);
    if (deleteError) {
      alert(`Error deleting invoice: ${deleteError.message}`);
    } else {
      fetchInvoices();
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsInvoiceModalOpen(true);
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
                    <div className="flex justify-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditInvoice(invoice)} 
                        title="Edit Invoice"
                      >
                        <Edit className="h-4 w-4 text-blue-500 hover:text-blue-700"/>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteInvoice(invoice.id)} 
                        title="Delete Invoice"
                      >
                        <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700"/>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {isInvoiceModalOpen && (
        <ImportedInvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={handleModalClose}
          organizationId={organizationId}
          editingInvoice={editingInvoice}
        />
      )}
    </div>
  );
}

// Helper function to convert FormData to Cost
const convertFormDataToCost = (formData: FormData | null): Cost | null => {
  if (!formData) return null;
  
  const { cost: formCost, ...rest } = formData;
  return {
    ...rest,
    cost: typeof formCost === 'string' ? parseFloat(formCost) || undefined : formCost
  } as Cost;
};

function CostManagementSection({ organizationId }: { organizationId: string | null }) {
  const [activeTab, setActiveTab] = useState<'resource' | 'vendor' | 'misc'>('resource');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'resource' | 'vendor' | 'misc'>('resource');
  const [resourceCosts, setResourceCosts] = useState<FormData[]>([]);
  const [vendorCosts, setVendorCosts] = useState<FormData[]>([]);
  const [miscCosts, setMiscCosts] = useState<FormData[]>([]);
  const [isLevelCostsModalOpen, setIsLevelCostsModalOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<FormData | null>(null);

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
        .select(`
          *,
          user:users!resource_costs_user_id_fkey(id, name, email),
          manager:users!resource_costs_manager_id_fkey(id, name, email),
          organization:organizations(id, name)
        `)
        .eq('organization_id', organizationId);
       if (resourceError) console.error("Error fetching resource costs:", resourceError);
       else if (resourceData) setResourceCosts(resourceData as FormData[]); else setResourceCosts([]);

      // Fetch Vendor Costs
      const { data: vendorData, error: vendorError } = await supabase.from('vendor_costs')
        .select(`
          *,
          organization:organizations!vendor_costs_organization_id_fkey(id, name),
          approver:users!vendor_costs_approver_id_fkey(id, name, email),
          invoice:invoices!vendor_costs_invoice_id_fkey(id, name)
        `)
         .eq('organization_id', organizationId);
       if (vendorError) console.error("Error fetching vendor costs:", vendorError);
       else if (vendorData) setVendorCosts(vendorData as FormData[]); else setVendorCosts([]);

      // Fetch Miscellaneous Costs 
      const { data: miscData, error: miscError } = await supabase.from('miscellaneous_costs')
        .select(`
          *,
          billed_by:users!miscellaneous_costs_billed_by_id_fkey(id, name, email),
          approved_by:users!miscellaneous_costs_approved_by_id_fkey(id, name, email),
          organization:organizations!miscellaneous_costs_organization_id_fkey(id, name),
          invoice:invoices!miscellaneous_costs_invoice_id_fkey(id, name)
        `)
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

  const handleModalClose = async () => { // Make async
    setIsModalOpen(false);
    setEditingCost(null);
    await fetchCosts(); // Wait for fetch to complete
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

  const handleEditCost = (cost: FormData, type: 'resource' | 'vendor' | 'misc') => {
    // Since FormData.cost is already a number, we can directly set it
    setEditingCost(cost);
    setModalType(type);
    setIsModalOpen(true);
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
                    {/* Display user name or email or id */}
                    <td className={tdPrimaryClasses}>{cost.user?.name || cost.user?.email || (cost.user_id ? `ID: ${cost.user_id.substring(0,6)}...` : 'N/A')}</td>
                    {/* Display manager name or email or id */}
                    <td className={tdClasses}>{cost.manager?.name || cost.manager?.email || (cost.manager_id ? `ID: ${cost.manager_id.substring(0,6)}...` : '-')}</td>
                  <td className={tdClasses}>{cost.start_date ? new Date(cost.start_date + 'T00:00:00Z').toLocaleDateString() : '-'}</td>
                  <td className={tdClasses}>{cost.end_date ? new Date(cost.end_date + 'T00:00:00Z').toLocaleDateString() : '-'}</td>
                  <td className={tdClasses}>{cost.current_level || cost.starting_level || '-'}</td>
                  <td className={tdClasses}>{cost.status || '-'}</td>
                  <td className={tdClasses}>{cost.billing || '-'}</td>
                   <td className={tdCenterClasses}>
                       <div className="flex justify-center space-x-2">
                           <Button 
                               variant="ghost" 
                               size="sm" 
                               onClick={() => handleEditCost(cost, 'resource')} 
                               title="Edit Resource Cost"
                           >
                               <Edit className="h-4 w-4 text-blue-500 hover:text-blue-700"/>
                           </Button>
                           <Button 
                               variant="ghost" 
                               size="sm" 
                               onClick={() => handleDeleteCost(cost.id!, 'resource')} 
                               title="Delete Resource Cost"
                           >
                               <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700"/>
                           </Button>
                       </div>
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
                    {/* Display user name or fallback to ID */}
                  <td className={tdPrimaryClasses}>{cost.vendor_name}</td>
                    {/* Display organization name */}
                  <td className={tdClasses}>{cost.organization?.name || '-'}</td>
                    {/* Display cycle */}
                  <td className={tdClasses}>{cost.cycle || '-'}</td>
                    {/* Display cost */}
                  <td className={tdRightClasses}>${cost.cost ? Number(cost.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                    {/* Display approver name or email or id */}
                    <td className={tdClasses}>{cost.approver?.name || cost.approver?.email || (cost.approver_id ? `ID: ${cost.approver_id.substring(0,6)}...` : '-')}</td>
                    {/* Display start date */}
                  <td className={tdClasses}>{cost.start_date ? new Date(cost.start_date + 'T00:00:00Z').toLocaleDateString() : '-'}</td>
                    {/* Display end date */}
                  <td className={tdClasses}>{cost.end_date ? new Date(cost.end_date + 'T00:00:00Z').toLocaleDateString() : '-'}</td>
                    {/* Display invoice name/id */}
                  <td className={tdClasses} title={cost.invoice?.id}>{cost.invoice ? cost.invoice.name : '-'}</td>
                   <td className={tdCenterClasses}>
                       <div className="flex justify-center space-x-2">
                           <Button 
                               variant="ghost" 
                               size="sm" 
                               onClick={() => handleEditCost(cost, 'vendor')} 
                               title="Edit Vendor Cost"
                           >
                               <Edit className="h-4 w-4 text-blue-500 hover:text-blue-700"/>
                           </Button>
                           <Button 
                               variant="ghost" 
                               size="sm" 
                               onClick={() => handleDeleteCost(cost.id!, 'vendor')} 
                               title="Delete Vendor Cost"
                           >
                               <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700"/>
                           </Button>
                       </div>
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
                    {/* Display user name or fallback to ID */}
                   <td className={tdPrimaryClasses}>{cost.name}</td>
                    {/* Display cost */}
                   <td className={tdRightClasses}>${cost.cost ? Number(cost.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                    {/* Display billed by name or email or id */}
                    <td className={tdClasses}>{cost.billed_by?.name || cost.billed_by?.email || (cost.billed_by_id ? `ID: ${cost.billed_by_id.substring(0,6)}...` : '-')}</td>
                    {/* Display approved by name or email or id */}
                    <td className={tdClasses}>{cost.approved_by?.name || cost.approved_by?.email || (cost.approved_by_id ? `ID: ${cost.approved_by_id.substring(0,6)}...` : '-')}</td>
                    {/* Display created date */}
                   <td className={tdClasses}>{cost.created_at ? new Date(cost.created_at).toLocaleDateString() : '-'}</td>
                    {/* Display invoice name/id */}
                   <td className={tdClasses} title={cost.invoice?.id}>{cost.invoice ? cost.invoice.name : '-'}</td>
                   <td className={tdCenterClasses}>
                       <div className="flex justify-center space-x-2">
                           <Button 
                               variant="ghost" 
                               size="sm" 
                               onClick={() => handleEditCost(cost, 'misc')} 
                               title="Edit Misc Cost"
                           >
                               <Edit className="h-4 w-4 text-blue-500 hover:text-blue-700"/>
                           </Button>
                           <Button 
                               variant="ghost" 
                               size="sm" 
                               onClick={() => handleDeleteCost(cost.id!, 'misc')} 
                               title="Delete Misc Cost"
                           >
                               <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700"/>
                           </Button>
                       </div>
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
        <CostManagementModal
          key={editingCost?.id || 'new'} // Add key prop here
          isOpen={isModalOpen}
          onClose={handleModalClose}
          type={modalType}
          organizationId={organizationId}
          editingCost={editingCost}
        />
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
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" title="Close modal" aria-label="Close modal">
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

function RevenueManagementSection({ organizationId }: { organizationId: string | null }) {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null);

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
      setRevenues(data as Revenue[]);
    }
  };

  useEffect(() => {
    fetchRevenues();
  }, [organizationId]);

  const handleModalClose = () => {
    setIsRevenueModalOpen(false);
    setEditingRevenue(null);
    fetchRevenues();
  };

  const handleDeleteRevenue = async (revenueId: string) => {
    const confirmation = window.confirm("Are you sure you want to delete this revenue entry? This cannot be undone.");
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

  const handleEditRevenue = (revenue: Revenue) => {
    setEditingRevenue(revenue);
    setIsRevenueModalOpen(true);
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
                    <div className="flex justify-center space-x-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditRevenue(revenue)} 
                            title="Edit Revenue Entry"
                        >
                            <Edit className="h-4 w-4 text-blue-500 hover:text-blue-700"/>
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteRevenue(revenue.id)} 
                            title="Delete Revenue Entry"
                        >
                            <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700"/>
                        </Button>
                    </div>
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
          editingRevenue={editingRevenue}
        />
      )}
    </div>
  );
}

function ProfitSection({ organizationId }: { organizationId: string | null }) {
  const [profits, setProfits] = useState<Profit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfits = async () => {
      if (!organizationId) {
        setProfits([]);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching profits for organization:', organizationId);
        
        // First verify the current user's session
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError) {
          console.error('Auth error:', authError);
          setError('Authentication error. Please try logging in again.');
          return;
        }
        console.log('Current user:', session?.user?.id);

        // Fetch the actual data
        const { data, error } = await supabase
          .from('profits_monthly')
          .select('*')
          .eq('organization_id', organizationId)
          .order('year', { ascending: false })
          .order('month', { ascending: false });

        console.log('Profits query result:', { data, error });

        if (error) {
          console.error('Error fetching profits:', error);
          setError(`Error fetching profit data: ${error.message}`);
          setProfits([]);
        } else if (!data || data.length === 0) {
          console.log('No profit data found for organization:', organizationId);
          
          // Double check if data exists in raw table
          const { data: rawData, error: rawError } = await supabase
            .from('profits_monthly_raw')
            .select('count(*)')
            .eq('organization_id', organizationId);
            
          console.log('Raw table check:', { rawData, rawError });
          
          setProfits([]);
        } else {
          console.log('Processing profit data:', data);
          
          // Transform the data to match the Profit interface
          const transformedData = data.map(row => ({
            id: row.id,
            organization_id: row.organization_id,
            year: row.year,
            month: row.month,
            revenue: row.revenue.toString(),
            resource_cost: row.resource_cost.toString(),
            vendor_cost: row.vendor_cost.toString(),
            misc_cost: row.misc_cost.toString(),
            total_cost: row.total_cost.toString(),
            profit: row.profit.toString(),
            roi: row.roi.toString()
          }));

          console.log('Transformed profit data:', transformedData);
          setProfits(transformedData);
        }
      } catch (err) {
        console.error('Error in fetchProfits:', err);
        setError('An unexpected error occurred while fetching profit data.');
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
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
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
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [profitData, setProfitData] = useState<MonthlyProfitData[]>([]);

  const fetchFinancialData = async () => {
    if (!organizationId) {
      setFinancials([]);
      setProfitData([]);
      return;
    }

    // Don't fetch data for future years
    if (selectedYear > currentYear) {
      console.log('Selected year is in the future, skipping data fetch');
      setProfitData([]);
      return;
    }

    setLoading(true);
    try {
      console.log('Fetching profit data for:', { organizationId, selectedYear, selectedMonth });

      // Build the query
      let query = supabase
        .from('profits_monthly')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('year', selectedYear);

      // Add month filter if a specific month is selected
      if (selectedMonth !== null) {
        query = query.eq('month', selectedMonth + 1); // Add 1 because months in DB are 1-based
      }

      // Execute query
      const { data: profitsData, error: profitsError } = await query.order('month', { ascending: true });

      if (profitsError) {
        console.error('Error fetching profits:', profitsError);
        setProfitData([]);
      } else {
        console.log('Fetched profits data:', profitsData);
        
        // Transform the data for the charts with proper type conversion
        let monthlyData: MonthlyProfitData[];
        
        if (selectedMonth !== null) {
          // If a specific month is selected, only show that month's data
          const monthData = profitsData?.[0] || null;
          monthlyData = monthData ? [{
            period: new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            total_revenue: Number(monthData.revenue) || 0,
            total_cost: Number(monthData.total_cost) || 0,
            profit: Number(monthData.profit) || 0,
            roi: Number(monthData.roi) || 0
          }] : [];
        } else {
          // Show all months for the selected year
          monthlyData = Array.from({ length: 12 }, (_, monthIndex) => {
            const monthData = profitsData?.find(p => p.month === monthIndex + 1) || null;
            return {
              period: new Date(selectedYear, monthIndex).toLocaleDateString('en-US', { month: 'short' }),
              total_revenue: monthData ? Number(monthData.revenue) : 0,
              total_cost: monthData ? Number(monthData.total_cost) : 0,
              profit: monthData ? Number(monthData.profit) : 0,
              roi: monthData ? Number(monthData.roi) : 0
            };
          });
        }

        console.log('Transformed monthly data:', monthlyData);
        setProfitData(monthlyData);
      }
    } catch (error) {
      console.error('Error in fetchFinancialData:', error);
      setProfitData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [organizationId, selectedYear, selectedMonth]);

  // Generate year options (current year and past years only)
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Financial Overview</h2>
        <div className="flex gap-4">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={selectedMonth !== null ? selectedMonth.toString() : 'all'} 
            onValueChange={(value) => setSelectedMonth(value === 'all' ? null : parseInt(value))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
                  <LineChart data={profitData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                  <LineChart data={profitData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                    {profitData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          No data available for the selected period
                        </td>
                      </tr>
                    ) : (
                      profitData.map((item: MonthlyProfitData, index: number) => (
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
                      ))
                    )}
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

// Add NavigationMenu component
function NavigationMenu({ activeSection, onSectionChange }: { 
  activeSection: string; 
  onSectionChange: (section: string) => void;
}) {
  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" aria-hidden="true" /> },
    { id: 'financial-overview', label: 'Financial Overview', icon: <DollarSign className="h-4 w-4" aria-hidden="true" /> },
    { id: 'cost-management', label: 'Cost Management', icon: <TrendingDown className="h-4 w-4" aria-hidden="true" /> },
    { id: 'invoice-management', label: 'Invoice Management', icon: <Clock className="h-4 w-4" aria-hidden="true" /> },
    { id: 'revenue-management', label: 'Revenue Management', icon: <TrendingUp className="h-4 w-4" aria-hidden="true" /> },
    { id: 'profit-analysis', label: 'Profit Analysis', icon: <Users className="h-4 w-4" aria-hidden="true" /> },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-[64px] overflow-y-auto">
      <nav className="p-4 space-y-1" aria-label="Financial sections navigation">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium rounded-lg text-left transition-colors ${
              activeSection === item.id
                ? 'bg-violet-100 text-violet-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            title={`Navigate to ${item.label}`}
            aria-label={`Navigate to ${item.label} section`}
            aria-current={activeSection === item.id ? 'page' : undefined}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

const KpiFinancial: React.FC = () => {
  // Group all useState hooks together at the top
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [financials, setFinancials] = useState<Financial[]>([]);
  const [departmentSpending, setDepartmentSpending] = useState<DepartmentFinancial[]>([]);
  const [financialSnapshots, setFinancialSnapshots] = useState<FinancialSnapshot[]>([]);
  const [userData, setUserData] = useState<{ user: any | null; session: any | null }>({ user: null, session: null });
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [yearlyMetrics, setYearlyMetrics] = useState<{
    totalProfit: number;
    totalRoi: number;
    totalCost: number;
    profitIncrease: number;
    profitIncreasePercentage: number;
  }>({
    totalProfit: 0,
    totalRoi: 0,
    totalCost: 0,
    profitIncrease: 0,
    profitIncreasePercentage: 0
  });

  const calculateYearlyMetrics = async (organizationId: string) => {
    try {
      const currentYear = new Date().getFullYear();
      const lastYear = currentYear - 1;

      console.log('Calculating metrics for:', { organizationId, currentYear, lastYear });

      // Fetch current year data with proper type conversion
      const { data: currentYearData, error: currentYearError } = await supabase
        .from('profits_monthly')
        .select('profit, revenue, total_cost')
        .eq('organization_id', organizationId)
        .eq('year', currentYear);

      if (currentYearError) {
        console.error('Error fetching current year data:', currentYearError);
        return;
      }

      console.log('Current year data:', currentYearData);

      // Fetch previous year data with proper type conversion
      const { data: previousYearData, error: previousYearError } = await supabase
        .from('profits_monthly')
        .select('profit')
        .eq('organization_id', organizationId)
        .eq('year', lastYear);

      if (previousYearError) {
        console.error('Error fetching previous year data:', previousYearError);
        return;
      }

      console.log('Previous year data:', previousYearData);

      // Calculate metrics with proper type handling
      const currentYearMetrics = currentYearData?.reduce((acc, curr) => ({
        totalProfit: acc.totalProfit + (Number(curr.profit) || 0),
        totalRevenue: acc.totalRevenue + (Number(curr.revenue) || 0),
        totalCost: acc.totalCost + (Number(curr.total_cost) || 0)
      }), { totalProfit: 0, totalRevenue: 0, totalCost: 0 });

      const previousYearTotalProfit = previousYearData?.reduce((acc, curr) => 
        acc + (Number(curr.profit) || 0), 0) || 0;

      console.log('Calculated metrics:', { currentYearMetrics, previousYearTotalProfit });

      const profitIncrease = (currentYearMetrics?.totalProfit || 0) - previousYearTotalProfit;
      const profitIncreasePercentage = previousYearTotalProfit !== 0 
        ? ((profitIncrease / Math.abs(previousYearTotalProfit)) * 100)
        : 0;

      const totalRoi = currentYearMetrics?.totalRevenue !== 0
        ? ((currentYearMetrics?.totalProfit || 0) / (currentYearMetrics?.totalRevenue || 1)) * 100
        : 0;

      const metrics = {
        totalProfit: currentYearMetrics?.totalProfit || 0,
        totalRoi: totalRoi,
        totalCost: currentYearMetrics?.totalCost || 0,
        profitIncrease,
        profitIncreasePercentage
      };

      console.log('Setting yearly metrics:', metrics);
      setYearlyMetrics(metrics);

    } catch (error) {
      console.error('Error calculating yearly metrics:', error);
      // Set default values on error
      setYearlyMetrics({
        totalProfit: 0,
        totalRoi: 0,
        totalCost: 0,
        profitIncrease: 0,
        profitIncreasePercentage: 0
      });
    }
  };

  // Combine verification and initial data fetching into a single useEffect
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
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
          return;
        }
        const user = authData.session.user;
        setUserData({ user, session: authData.session });

        console.log('Fetching user organization...');
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single();

        if (userError || !userData?.organization_id) {
          console.error("Error fetching user data:", userError);
          setOrganizations([]);
          return;
        }

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

  // Handle organization data fetching
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
      try {
        await calculateYearlyMetrics(selectedOrganizationId);
      } catch (error) {
        console.error('Error fetching organization data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationData();
  }, [selectedOrganizationId]);

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

  // Add scroll into view function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setActiveSection(sectionId);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavigationMenu activeSection={activeSection} onSectionChange={scrollToSection} />
      <div className="ml-64"> {/* Main content area with margin for fixed nav */}
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight">Financial KPIs</h1>
              <p className="text-sm text-muted-foreground">
                Manage and track financial metrics, costs, and invoices
              </p>
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
              <div className="space-y-6">
                <div id="overview" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Profit (Current Year)</p>
                        <p className="text-2xl font-bold mt-1">
                          ${yearlyMetrics.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className={`flex items-center ${yearlyMetrics.profitIncreasePercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {yearlyMetrics.profitIncreasePercentage >= 0 ? (
                          <ArrowUpRight className="h-5 w-5" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5" />
                        )}
                        <span className="text-sm font-medium ml-1">
                          {yearlyMetrics.profitIncreasePercentage >= 0 ? '+' : ''}
                          {yearlyMetrics.profitIncreasePercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total ROI</p>
                        <p className="text-2xl font-bold mt-1">
                          {yearlyMetrics.totalRoi.toFixed(2)}%
                        </p>
                      </div>
                      <div className={`flex items-center ${yearlyMetrics.totalRoi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {yearlyMetrics.totalRoi >= 0 ? (
                          <ArrowUpRight className="h-5 w-5" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Cost</p>
                        <p className="text-2xl font-bold mt-1">
                          ${yearlyMetrics.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">YoY Profit Change</p>
                        <p className="text-2xl font-bold mt-1">
                          ${yearlyMetrics.profitIncrease.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className={`flex items-center ${yearlyMetrics.profitIncrease >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {yearlyMetrics.profitIncrease >= 0 ? (
                          <ArrowUpRight className="h-5 w-5" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5" />
                        )}
                        <span className="text-sm font-medium ml-1">
                          {yearlyMetrics.profitIncreasePercentage >= 0 ? '+' : ''}
                          {yearlyMetrics.profitIncreasePercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div id="financial-overview">
                  <FinancialOverview organizationId={selectedOrganizationId} />
                </div>

                <div id="cost-management">
                  <CostManagementSection organizationId={selectedOrganizationId} />
                </div>

                <div id="invoice-management">
                  <InvoiceManagementSection organizationId={selectedOrganizationId} />
                </div>

                <div id="revenue-management">
                  <RevenueManagementSection organizationId={selectedOrganizationId} />
                </div>

                <div id="profit-analysis">
                  <ProfitSection organizationId={selectedOrganizationId} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KpiFinancial;
