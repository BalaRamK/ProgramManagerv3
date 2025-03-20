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
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Define types based on your schema
interface Kpi {
  id: string;
  program_id: string;
  name: string;
  value: number;
  metric_type: string;
  updated_at: string;
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

function MetricCard({ metric }: { metric: Kpi }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{metric.name}</p>
          <p className="text-2xl font-bold mt-1">{metric.value.toFixed(1)}%</p>
        </div>
        <div className={`flex items-center ${
          metric.trend === 'up' ? 'text-green-500' : 'text-red-500'
        }`}>
          {metric.trend === 'up' ? (
            <ArrowUpRight className="h-5 w-5" />
          ) : (
            <ArrowDownRight className="h-5 w-5" />
          )}
          <span className="text-sm font-medium ml-1">{metric.change}</span>
        </div>
      </div>
      <div className="mt-4">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${
              metric.trend === 'up' ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ width: metric.value.toFixed(1) }}
          ></div>
        </div>
      </div>
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
  const [departmentSpending, setDepartmentSpending] = useState<DepartmentFinancial[]>([]);

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

export function KpiFinancial() {
  const [timeRange, setTimeRange] = useState('month');
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [financials, setFinancials] = useState<Financial[]>([]);
  const [departmentSpending, setDepartmentSpending] = useState<DepartmentFinancial[]>([]);
  const [financialSnapshots, setFinancialSnapshots] = useState<FinancialSnapshot[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Fetch KPIs
      const { data: kpiData, error: kpiError } = await supabase
        .from('kpis')
        .select('*')
        .eq('user_id', userData.user.id);
      if (kpiData) {
        setKpis(kpiData);
      }
      if (kpiError) {
        console.error('Error fetching KPIs:', kpiError);
      }

      // Fetch Financials
      const { data: financialData, error: financialError } = await supabase
        .from('financials')
        .select('*')
        .eq('user_id', userData.user.id);
      if (financialData) {
        setFinancials(financialData);
      }
      if (financialError) {
        console.error('Error fetching financials:', financialError);
      }

      // Fetch Department Spending
      const { data: departmentData, error: departmentError } = await supabase
        .from('department_financials')
        .select('*')
        .eq('user_id', userData.user.id);
      if (departmentData) {
        setDepartmentSpending(departmentData);
      }
      if (departmentError) {
        console.error('Error fetching department spending:', departmentError);
      }

      // Fetch Financial Snapshots
      const { data: snapshotData, error: snapshotError } = await supabase
        .from('financial_snapshots')
        .select('*')
        .eq('user_id', userData.user.id);
      if (snapshotData) {
        setFinancialSnapshots(snapshotData);
      }
      if (snapshotError) {
        console.error('Error fetching financial snapshots:', snapshotError);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">KPI & Financial Health</h1>
            <p className="text-gray-600">Track and analyze your program's financial performance</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  timeRange === 'month'
                    ? 'bg-violet-100 text-violet-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setTimeRange('quarter')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  timeRange === 'quarter'
                    ? 'bg-violet-100 text-violet-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Quarter
              </button>
              <button
                onClick={() => setTimeRange('year')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  timeRange === 'year'
                    ? 'bg-violet-100 text-violet-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Year
              </button>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Settings className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {kpis.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BudgetOverview />
          <DepartmentSpending />
          <div className="lg:col-span-2">
            <MonthlyTrends />
          </div>
        </div>

        {/* Customization Hint */}
        <div className="mt-6 bg-violet-50 rounded-xl p-4 border border-violet-100">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Settings className="h-5 w-5 text-violet-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-violet-800">
                Customize your financial dashboard
              </h3>
              <p className="mt-1 text-sm text-violet-600">
                Click on any widget to see more details or customize the metrics shown.
                You can also drag and drop widgets to rearrange them.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
