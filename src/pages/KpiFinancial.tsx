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
import React, { useState } from 'react';

const financialMetrics = {
  totalBudget: 1500000,
  spent: 850000,
  remaining: 650000,
  projectedOverrun: 50000,
  metrics: [
    {
      id: 1,
      name: 'Budget Utilization',
      value: '56.7%',
      trend: 'up',
      change: '+2.3%',
      color: 'violet',
    },
    {
      id: 2,
      name: 'Resource Allocation',
      value: '78.2%',
      trend: 'up',
      change: '+4.1%',
      color: 'blue',
    },
    {
      id: 3,
      name: 'Cost Variance',
      value: '-3.4%',
      trend: 'down',
      change: '-1.2%',
      color: 'red',
    },
    {
      id: 4,
      name: 'ROI',
      value: '12.8%',
      trend: 'up',
      change: '+0.8%',
      color: 'green',
    },
  ],
  departmentSpending: [
    { name: 'Development', spent: 320000, budget: 400000 },
    { name: 'Marketing', spent: 180000, budget: 250000 },
    { name: 'Operations', spent: 220000, budget: 300000 },
    { name: 'Research', spent: 130000, budget: 200000 },
  ],
  monthlyTrends: [
    { month: 'Jan', planned: 100000, actual: 98000 },
    { month: 'Feb', planned: 120000, actual: 115000 },
    { month: 'Mar', planned: 140000, actual: 145000 },
    { month: 'Apr', planned: 160000, actual: 158000 },
    { month: 'May', planned: 180000, actual: 185000 },
    { month: 'Jun', planned: 150000, actual: 149000 },
  ],
};

function MetricCard({ metric }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{metric.name}</p>
          <p className="text-2xl font-bold mt-1">{metric.value}</p>
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
            style={{ width: metric.value }}
          ></div>
        </div>
      </div>
    </div>
  );
}

function BudgetOverview() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Budget Overview</h2>
        <div className="flex space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Download className="h-5 w-5 text-gray-500" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Share2 className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div>
          <p className="text-sm text-gray-500">Total Budget</p>
          <p className="text-2xl font-bold">${(financialMetrics.totalBudget / 1000000).toFixed(1)}M</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Spent</p>
          <p className="text-2xl font-bold">${(financialMetrics.spent / 1000000).toFixed(1)}M</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Remaining</p>
          <p className="text-2xl font-bold">${(financialMetrics.remaining / 1000000).toFixed(1)}M</p>
        </div>
      </div>
      <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-violet-500"
          style={{
            width: `${(financialMetrics.spent / financialMetrics.totalBudget) * 100}%`,
          }}
        ></div>
      </div>
    </div>
  );
}

function DepartmentSpending() {
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
        {financialMetrics.departmentSpending.map((dept) => (
          <div key={dept.name}>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">{dept.name}</span>
              <span className="text-sm text-gray-500">
                ${(dept.spent / 1000).toFixed(1)}k / ${(dept.budget / 1000).toFixed(1)}k
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500"
                style={{ width: `${(dept.spent / dept.budget) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthlyTrends() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Monthly Spending Trends</h2>
        <div className="flex items-center space-x-4">
          <button className="flex items-center text-sm text-gray-600 hover:text-gray-900">
            <Calendar className="h-4 w-4 mr-1" />
            Last 6 Months
            <ChevronDown className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
      <div className="relative h-64">
        <div className="absolute inset-0 flex items-end justify-between">
          {financialMetrics.monthlyTrends.map((month, index) => (
            <div key={month.month} className="flex-1 mx-1">
              <div className="relative h-full flex items-end space-x-1">
                <div
                  className="flex-1 bg-violet-200"
                  style={{
                    height: `${(month.planned / 200000) * 100}%`,
                  }}
                ></div>
                <div
                  className="flex-1 bg-violet-500"
                  style={{
                    height: `${(month.actual / 200000) * 100}%`,
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
          {financialMetrics.metrics.map((metric) => (
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
