import React from 'react';
import {
  BarChart3,
  Calendar,
  Clock,
  FileText,
  LineChart,
  PieChart,
  Shield,
  Users,
  Wallet,
  Bell,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export function DashboardPreview() {
  return (
    <div className="relative">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-100 to-blue-100 opacity-30 rounded-xl" />

      {/* Dashboard Preview Container */}
      <div className="relative rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-xl overflow-hidden">
        {/* Top Navigation Bar */}
        <div className="border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center">
              <Users className="h-4 w-4 text-violet-600" />
            </div>
            <span className="text-sm font-medium">Program Dashboard</span>
          </div>
          <div className="flex items-center space-x-3">
            <button className="p-1.5 rounded-lg hover:bg-gray-100" title="View notifications" aria-label="View notifications">
              <Bell className="h-4 w-4 text-gray-600" />
            </button>
            <div className="h-7 w-7 rounded-full bg-gray-200" />
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-600">Budget</p>
                  <p className="text-lg font-semibold mt-1">$1.2M</p>
                </div>
                <div className="flex items-center text-green-500">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="text-xs ml-1">+4%</span>
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full" style={{ width: '65%' }} />
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tasks</p>
                  <p className="text-lg font-semibold mt-1">78/124</p>
                </div>
                <div className="flex items-center text-green-500">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="text-xs ml-1">+12%</span>
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '75%' }} />
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-600">Timeline</p>
                  <p className="text-lg font-semibold mt-1">45/120</p>
                </div>
                <div className="flex items-center text-yellow-500">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs ml-1">38%</span>
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: '38%' }} />
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-600">Risks</p>
                  <p className="text-lg font-semibold mt-1">3 High</p>
                </div>
                <div className="flex items-center text-red-500">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs ml-1">+1</span>
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: '25%' }} />
              </div>
            </div>
          </div>

          {/* Charts Preview */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-gray-700">Budget Overview</h3>
                <BarChart3 className="h-4 w-4 text-gray-400" />
              </div>
              <div className="h-32 flex items-end space-x-2">
                {[65, 45, 75, 55, 60, 45, 85].map((height, i) => (
                  <div key={i} className="flex-1 bg-violet-100 rounded-t" style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-gray-700">Task Progress</h3>
                <PieChart className="h-4 w-4 text-gray-400" />
              </div>
              <div className="h-32 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-8 border-violet-500 border-t-transparent animate-spin" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 