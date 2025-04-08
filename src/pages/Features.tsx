import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  LineChart,
  Shield,
  FileText as FileTextIcon,
  MessageSquare as MessageSquareIcon,
  Sliders,
  Settings as SettingsIcon,
  Users as UsersIcon,
  ArrowRight,
  CheckCircle,
  BarChart3, // Added for Financials
  BrainCircuit, // Placeholder for AI Chat
  FolderKanban, // Placeholder for Roadmap/Project Views
  Target, // Placeholder for Strategy/Goals
} from 'lucide-react';
import { Navbar } from '../components/Navbar'; // Assuming Navbar is needed

// Feature-specific illustration components
const DashboardIllustration = ({ className }: { className?: string }) => (
  <div className={`bg-gradient-to-br from-violet-50 to-indigo-50 rounded-lg p-6 ${className}`}>
    <div className="grid grid-cols-3 gap-4 mb-4">
      {/* KPI Cards */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-violet-100">
        <div className="inline-flex items-center h-6 px-2 bg-violet-200 rounded text-xs text-violet-600 font-medium mb-2 w-full">Budget</div>
        <div className="inline-flex items-center justify-center h-8 w-full bg-green-100 rounded text-sm text-green-800 font-semibold">
          75% Utilized
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border border-violet-100">
        <div className="inline-flex items-center h-6 px-2 bg-violet-200 rounded text-xs text-violet-600 font-medium mb-2 w-full">Timeline</div>
        <div className="inline-flex items-center justify-center h-8 w-full bg-yellow-100 rounded text-sm text-yellow-800 font-semibold">
          At Risk
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border border-violet-100">
        <div className="inline-flex items-center h-6 px-2 bg-violet-200 rounded text-xs text-violet-600 font-medium mb-2 w-full">Tasks</div>
        <div className="inline-flex items-center justify-center h-8 w-full bg-green-100 rounded text-sm text-green-800 font-semibold">
          65% Done
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="col-span-2 bg-white p-4 rounded-lg shadow-sm border border-violet-100">
        <div className="inline-flex items-center h-6 px-2 bg-violet-200 rounded text-xs text-violet-600 font-medium mb-3 w-auto">Risk Overview</div>
        <div className="h-32 bg-violet-100 rounded flex items-center justify-center text-sm text-violet-500 italic">Chart Area</div>
      </div>

      {/* Quick View */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-violet-100">
        <div className="inline-flex items-center h-6 px-2 bg-violet-200 rounded text-xs text-violet-600 font-medium mb-3">Milestones</div>
        <div className="space-y-2">
          <div className="inline-flex items-center h-8 w-full px-2 bg-green-100 rounded text-xs text-green-700">Phase 1 Complete</div>
          <div className="inline-flex items-center h-8 w-full px-2 bg-violet-100 rounded text-xs text-violet-700">Phase 2 Started</div>
        </div>
      </div>

      {/* Calendar/Timeline View */}
      <div className="col-span-3 bg-white p-4 rounded-lg shadow-sm border border-violet-100">
        <div className="inline-flex items-center h-6 px-2 bg-violet-200 rounded text-xs text-violet-600 font-medium mb-3">Weekly Activity</div>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-12 bg-violet-100 rounded flex items-center justify-center text-xs text-violet-500">{`Day ${i + 1}`}</div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const RoadmapIllustration = ({ className }: { className?: string }) => (
  <div className={`bg-gradient-to-br from-violet-50 to-indigo-50 rounded-lg p-6 ${className}`}>
    <div className="space-y-4">
      {/* Program Level */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-violet-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="inline-flex items-center h-6 px-2 bg-violet-200 rounded text-xs text-violet-600 font-medium">Program: Alpha</div>
          <div className="inline-flex items-center h-6 px-2 bg-green-200 rounded text-xs text-green-700 font-medium">On Track</div>
        </div>
        
        {/* Goal 1 */}
        <div className="ml-4 border-l-2 border-violet-200 pl-4 py-2">
          <div className="inline-flex items-center h-6 px-2 bg-violet-300 rounded text-xs text-violet-700 font-medium mb-2">Goal: Launch UI</div>
          
          {/* Milestone 1.1 */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-shrink-0 h-3 w-3 bg-violet-400 rounded-full"></div>
            <div className="flex-1 flex items-center justify-between gap-2">
              <div className="inline-flex items-center h-6 px-2 bg-violet-100 rounded text-xs text-violet-600">Milestone: Design</div>
              <div className="inline-flex items-center justify-center h-6 w-16 bg-green-200 rounded text-xs text-green-700 font-medium">100%</div>
            </div>
          </div>
          
          {/* Milestone 1.2 */}
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 h-3 w-3 bg-violet-400 rounded-full"></div>
            <div className="flex-1 flex items-center justify-between gap-2">
              <div className="inline-flex items-center h-6 px-2 bg-violet-100 rounded text-xs text-violet-600">Milestone: Dev</div>
              <div className="inline-flex items-center justify-center h-6 w-16 bg-yellow-200 rounded text-xs text-yellow-700 font-medium">60%</div>
            </div>
          </div>
        </div>
        
        {/* Goal 2 */}
        <div className="ml-4 border-l-2 border-violet-200 pl-4 py-2 mt-2">
          <div className="inline-flex items-center h-6 px-2 bg-violet-300 rounded text-xs text-violet-700 font-medium mb-2">Goal: API Integration</div>
          
          {/* Milestone 2.1 */}
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 h-3 w-3 bg-violet-400 rounded-full"></div>
            <div className="flex-1 flex items-center justify-between gap-2">
              <div className="inline-flex items-center h-6 px-2 bg-violet-100 rounded text-xs text-violet-600">Milestone: Testing</div>
              <div className="inline-flex items-center justify-center h-6 w-16 bg-red-200 rounded text-xs text-red-700 font-medium">10%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Task View */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { title: 'Task: UI Mockup', progress: 'Done', bgColor: 'bg-green-100', textColor: 'text-green-700' },
          { title: 'Task: API Endpoint', progress: 'In Prog', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
          { title: 'Task: User Test', progress: 'Todo', bgColor: 'bg-gray-100', textColor: 'text-gray-700' }
        ].map((task, i) => (
          <div key={i} className="bg-white p-3 rounded-lg shadow-sm border border-violet-100">
            <div className="inline-flex items-center h-6 w-full px-2 bg-violet-200 rounded text-xs text-violet-600 font-medium mb-2">{task.title}</div>
            <div className={`inline-flex items-center justify-center h-6 w-full ${task.bgColor} rounded text-xs ${task.textColor} font-medium`}>
              {task.progress}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const FinancialIllustration = ({ className }: { className?: string }) => (
  <div className={`bg-gradient-to-br from-violet-50 to-indigo-50 rounded-lg p-6 ${className}`}>
    <div className="grid grid-cols-2 gap-4">
      {/* Bar Chart */}
      <div className="col-span-2 bg-white p-4 rounded-lg shadow-sm border border-violet-100">
        <div className="inline-flex items-center h-6 px-2 bg-violet-200 rounded text-xs text-violet-600 font-medium mb-4">Monthly Profit</div>
        <div className="relative h-32">
          <div className="absolute bottom-0 left-0 right-0 flex justify-around items-end h-full">
            {[60, 80, 50, 70, 90, 65].map((h, i) => (
              <div key={i} className="w-8 bg-violet-400 rounded-t transition-all hover:bg-violet-500" style={{ height: `${h}%` }}></div>
            ))}
          </div>
        </div>
      </div>

      {/* Budget vs Actual */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-violet-100">
        <div className="inline-flex items-center h-6 px-2 bg-violet-200 rounded text-xs text-violet-600 font-medium mb-4">Budget Status</div>
        <div className="space-y-3">
          <div className="relative">
            <div className="h-8 w-full bg-gray-100 rounded overflow-hidden">
              <div className="absolute top-0 left-0 h-8 bg-green-400 rounded flex items-center px-2" style={{width: '60%'}}>
                <span className="text-xs text-white font-medium">Actual: $60k</span>
              </div>
            </div>
            <div className="mt-1">
              <span className="text-xs text-gray-600">Planned: $100k</span>
            </div>
          </div>
        </div>
      </div>

      {/* ROI/KPI */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-violet-100">
        <div className="inline-flex items-center h-6 px-2 bg-violet-200 rounded text-xs text-violet-600 font-medium mb-4">ROI</div>
        <div className="h-[88px] rounded overflow-hidden flex items-center justify-center">
          <div className="relative h-20 w-20">
            <svg className="transform -rotate-90" width="100%" height="100%" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e6e6e6" strokeWidth="3"></path>
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="75, 100" strokeLinecap="round"></path>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-semibold text-violet-700">75%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const RiskIllustration = ({ className }: { className?: string }) => (
  <div className={`bg-gradient-to-br from-violet-50 to-indigo-50 rounded-lg p-6 ${className}`}>
    <div className="space-y-4">
      {/* High Risk */}
      <div className="bg-red-50 p-4 rounded-lg shadow-sm border border-red-200">
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center h-6 px-2 bg-red-200 rounded text-xs text-red-800 font-medium">Risk: API Downtime</div>
          <div className="inline-flex items-center justify-center h-6 w-16 bg-red-300 rounded text-xs text-red-900 font-semibold">High</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-sm text-red-700">
          <p className="font-medium mb-1">Impact:</p>
          <p className="text-xs">Service disruption for users</p>
          <p className="font-medium mt-2 mb-1">Mitigation:</p>
          <p className="text-xs">Implement fallback cache system</p>
        </div>
      </div>

      {/* Medium Risk */}
      <div className="bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center h-6 px-2 bg-yellow-200 rounded text-xs text-yellow-800 font-medium">Risk: Resource Shortage</div>
          <div className="inline-flex items-center justify-center h-6 w-16 bg-yellow-300 rounded text-xs text-yellow-900 font-semibold">Med</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-sm text-yellow-700">
          <p className="font-medium mb-1">Impact:</p>
          <p className="text-xs">Delayed deliverables</p>
          <p className="font-medium mt-2 mb-1">Mitigation:</p>
          <p className="text-xs">Cross-train team members</p>
        </div>
      </div>

      {/* Low Risk */}
      <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200">
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center h-6 px-2 bg-green-200 rounded text-xs text-green-800 font-medium">Risk: Scope Creep</div>
          <div className="inline-flex items-center justify-center h-6 w-16 bg-green-300 rounded text-xs text-green-900 font-semibold">Low</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-sm text-green-700">
          <p className="font-medium mb-1">Impact:</p>
          <p className="text-xs">Minor timeline adjustments</p>
          <p className="font-medium mt-2 mb-1">Mitigation:</p>
          <p className="text-xs">Strict change control process</p>
        </div>
      </div>
    </div>
  </div>
);

const DocumentIllustration = ({ className }: { className?: string }) => (
  <div className={`bg-gradient-to-br from-violet-50 to-indigo-50 rounded-lg p-6 ${className} relative`}>
    {/* Coming Soon Overlay */}
    <div className="absolute inset-0 bg-gray-500 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
      <span className="bg-violet-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">Coming Soon</span>
    </div>

    <div className="grid grid-cols-3 gap-4 opacity-50"> {/* Lower opacity for background */}
      {/* File List */}
      <div className="col-span-3 bg-white p-4 rounded-lg shadow-sm border border-violet-100">
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 w-32 bg-violet-200 rounded text-xs text-violet-600 px-1">Files</div>
          <div className="flex space-x-1">
            <div className="h-5 w-5 bg-violet-100 rounded"></div>
            <div className="h-5 w-5 bg-violet-100 rounded"></div>
          </div>
        </div>
        <div className="space-y-1">
          {[ { name: 'Proposal.docx', date: 'May 10' }, { name: 'Notes.pdf', date: 'May 12' }, { name: 'Budget.xlsx', date: 'May 14' } ].map((doc, i) => (
            <div key={i} className="flex items-center p-2 bg-violet-50 rounded">
              <div className="h-6 w-6 bg-violet-200 rounded mr-2"></div>
              <div className="flex-grow">
                <div className="h-3 w-24 bg-violet-200 rounded mb-0.5 text-[10px] px-1 text-violet-700">{doc.name}</div>
                <div className="h-2 w-16 bg-violet-100 rounded text-[9px] px-1 text-violet-500">{doc.date}</div>
              </div>
              <div className="ml-auto flex space-x-1">
                <div className="h-5 w-5 bg-violet-100 rounded"></div>
                <div className="h-5 w-5 bg-violet-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Upload Area */}
      <div className="col-span-3 flex justify-center items-center p-4 bg-violet-100 rounded-lg border-2 border-dashed border-violet-300">
        <div className="text-center">
          <div className="h-10 w-10 bg-violet-200 rounded-full mx-auto mb-1"></div>
          <div className="h-3 w-24 bg-violet-200 rounded mx-auto text-[10px] text-violet-600">Drag & Drop</div>
        </div>
      </div>
    </div>
  </div>
);

const CommunicationIllustration = ({ className }: { className?: string }) => (
  <div className={`bg-gradient-to-br from-violet-50 to-indigo-50 rounded-lg p-6 ${className}`}>
    <div className="space-y-4">
      {/* Log Entry 1 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-violet-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-violet-200 rounded-full flex items-center justify-center">
              <MessageSquareIcon className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-violet-700">Meeting Notes</div>
              <div className="text-xs text-violet-500">May 15</div>
            </div>
          </div>
          <div className="inline-flex items-center h-6 px-2 bg-blue-100 rounded text-xs text-blue-700 font-medium">Program: Alpha</div>
        </div>
        <div className="space-y-2 text-sm text-gray-600 pl-11">
          <p className="flex items-start gap-2">
            <span className="font-medium">Decision:</span>
            <span>Approved budget adjustment</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="font-medium">Action:</span>
            <span>Update financial forecast (@Bob)</span>
          </p>
        </div>
      </div>

      {/* Log Entry 2 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-violet-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-violet-200 rounded-full flex items-center justify-center">
              <MessageSquareIcon className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-violet-700">Stakeholder Update</div>
              <div className="text-xs text-violet-500">May 16</div>
            </div>
          </div>
          <div className="inline-flex items-center h-6 px-2 bg-red-100 rounded text-xs text-red-700 font-medium">Risk: #102</div>
        </div>
        <div className="space-y-2 text-sm text-gray-600 pl-11">
          <p className="flex items-start gap-2">
            <span className="font-medium">Feedback:</span>
            <span>Concerns raised about timeline</span>
          </p>
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-violet-100">
        <div className="inline-flex items-center h-6 px-2 bg-violet-200 rounded text-xs text-violet-600 font-medium mb-3">New Log Entry</div>
        <div className="bg-violet-50 rounded-lg p-3 text-sm text-violet-400 italic">Type your message here...</div>
        <div className="flex justify-end mt-3">
          <button className="inline-flex items-center h-8 px-4 bg-violet-200 rounded text-sm text-violet-600 font-medium hover:bg-violet-300 transition-colors">
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
);

const AIIllustration = ({ className }: { className?: string }) => (
  <div className={`bg-gradient-to-br from-violet-50 to-indigo-50 rounded-lg p-6 ${className}`}>
    <div className="space-y-4">
      {/* AI Message */}
      <div className="bg-violet-100 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 bg-violet-400 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-medium">AI</div>
          <div className="space-y-2 text-sm text-violet-700">
            <p>The budget utilization is currently at 75%.</p>
            <p>High-risk area identified: Vendor dependency for API integration.</p>
            <div className="mt-3 p-2 bg-violet-200 rounded text-xs">
              Recommendation: Schedule vendor review meeting within next 5 days.
            </div>
          </div>
        </div>
      </div>

      {/* User Message */}
      <div className="bg-white p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 bg-gray-400 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-medium">You</div>
          <div className="space-y-2 text-sm text-gray-700">
            <p>What are the upcoming milestones for Q2?</p>
          </div>
        </div>
      </div>

      {/* AI Response */}
      <div className="bg-violet-100 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 bg-violet-400 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-medium">AI</div>
          <div className="space-y-2 text-sm text-violet-700">
            <p className="font-medium">Upcoming Q2 Milestones:</p>
            <ul className="space-y-2 list-disc list-inside text-xs">
              <li>Development Complete (May 25)</li>
              <li>User Testing Phase (June 5)</li>
              <li>Production Deployment (June 20)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white p-3 rounded-lg border border-violet-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask about your program..."
            className="flex-1 h-10 px-3 bg-violet-50 rounded text-sm text-violet-700 placeholder-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <button 
            className="h-10 w-10 bg-violet-200 rounded-lg flex items-center justify-center text-violet-600 hover:bg-violet-300 transition-colors"
            aria-label="Send message"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

const SettingsIllustration = ({ className }: { className?: string }) => (
  <div className={`bg-gradient-to-br from-violet-50 to-indigo-50 rounded-lg p-6 ${className} relative`}>
    {/* Coming Soon Overlay */}
    <div className="absolute inset-0 bg-gray-500 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
      <span className="bg-violet-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">Coming Soon</span>
    </div>

    <div className="grid grid-cols-2 gap-4 opacity-50"> {/* Lower opacity for background */}
      {/* User Profile */}
      <div className="col-span-2 bg-white p-4 rounded-lg shadow-sm border border-violet-100">
        <div className="h-4 w-24 bg-violet-200 rounded mb-3 text-xs text-violet-600 px-1">User Profile</div>
        <div className="space-y-2">
          <div className="flex items-center">
            <div className="h-6 w-20 bg-violet-100 rounded mr-2 text-xs px-1 text-violet-600">Name:</div>
            <div className="h-6 flex-1 bg-violet-50 rounded text-xs px-1 text-violet-700">John Doe</div>
          </div>
          <div className="flex items-center">
            <div className="h-6 w-20 bg-violet-100 rounded mr-2 text-xs px-1 text-violet-600">Email:</div>
            <div className="h-6 flex-1 bg-violet-50 rounded text-xs px-1 text-violet-700">john@example.com</div>
          </div>
        </div>
      </div>
      {/* Preferences */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-violet-100">
        <div className="h-4 w-20 bg-violet-200 rounded mb-3 text-xs text-violet-600 px-1">Preferences</div>
        <div className="space-y-2">
          <div className="h-6 w-full bg-violet-100 rounded text-xs px-1 text-violet-700">Notifications: ON</div>
          <div className="h-6 w-full bg-violet-100 rounded text-xs px-1 text-violet-700">Layout: Grid</div>
        </div>
      </div>
      {/* Modules */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-violet-100">
        <div className="h-4 w-24 bg-violet-200 rounded mb-3 text-xs text-violet-600 px-1">Active Modules</div>
        <div className="grid grid-cols-2 gap-1">
          <div className="h-5 w-full bg-violet-100 rounded text-[10px] px-1 text-violet-700">Roadmap</div>
          <div className="h-5 w-full bg-violet-100 rounded text-[10px] px-1 text-violet-700">Financials</div>
          <div className="h-5 w-full bg-violet-100 rounded text-[10px] px-1 text-violet-700">Risk Analysis</div>
          <div className="h-5 w-full bg-violet-100 rounded text-[10px] px-1 text-violet-700">AI Chat</div>
        </div>
      </div>
    </div>
  </div>
);

const OrgManagementIllustration = ({ className }: { className?: string }) => (
  <div className={`bg-gradient-to-br from-violet-50 to-indigo-50 rounded-lg p-6 ${className}`}>
    <div className="space-y-3">
      {/* User List */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-violet-100">
        <div className="h-4 w-32 bg-violet-200 rounded mb-3 text-xs text-violet-600 px-1">Team Members</div>
        <div className="space-y-2">
          {[ { name: 'Alice B.', role: 'Admin' }, { name: 'Bob J.', role: 'Editor'}, { name: 'Charlie K.', role: 'Viewer'} ].map((user, i) => (
            <div key={i} className="flex items-center">
              <div className="h-8 w-8 bg-violet-100 rounded-full mr-2"></div>
              <div className="flex-grow">
                <div className="h-3 w-16 bg-violet-200 rounded mb-0.5 text-[10px] px-1 text-violet-700">{user.name}</div>
                <div className="h-2 w-12 bg-violet-100 rounded text-[9px] px-1 text-violet-500">{user.role}</div>
              </div>
              <div className="ml-auto">
                <div className="h-5 w-16 bg-violet-100 rounded text-[10px] px-1 text-violet-600">Manage</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-3 rounded-lg shadow-sm border border-violet-100 text-center">
          <div className="h-3 w-16 bg-violet-200 rounded mb-1 text-[10px] px-1 text-violet-600 mx-auto">Invite User</div>
          <div className="h-6 w-full bg-violet-100 rounded"></div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-violet-100 text-center">
          <div className="h-3 w-16 bg-violet-200 rounded mb-1 text-[10px] px-1 text-violet-600 mx-auto">Roles</div>
          <div className="h-6 w-full bg-violet-100 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

interface FeatureDetailProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  details: string[];
  imageSide?: 'left' | 'right';
}

const FeatureDetailSection: React.FC<FeatureDetailProps> = ({
  icon: Icon,
  title,
  description,
  details,
  imageSide = 'right',
}) => {
  const getIllustration = () => {
    switch (title) {
      case "Unified Dashboard":
        return <DashboardIllustration className="w-full max-w-2xl mx-auto" />;
      case "Dynamic Roadmapping & Planning":
        return <RoadmapIllustration className="w-full max-w-2xl mx-auto" />;
      case "Integrated Financial Management":
        return <FinancialIllustration className="w-full max-w-2xl mx-auto" />;
      case "Risk Analysis & Scenario Planning":
        return <RiskIllustration className="w-full max-w-2xl mx-auto" />;
      case "Centralized Document Center":
        return <DocumentIllustration className="w-full max-w-2xl mx-auto" />;
      case "Communication & Stakeholder Log":
        return <CommunicationIllustration className="w-full max-w-2xl mx-auto" />;
      case "AI-Powered Insights & Chat":
        return <AIIllustration className="w-full max-w-2xl mx-auto" />;
      case "Customization & Settings":
        return <SettingsIllustration className="w-full max-w-2xl mx-auto" />;
      case "Organization & User Management":
        return <OrgManagementIllustration className="w-full max-w-2xl mx-auto" />;
      default:
        return <DashboardIllustration className="w-full max-w-2xl mx-auto" />;
    }
  };

  const imageColumn = (
    <div className="flex items-center justify-center lg:p-8 relative">
      <div className="w-full max-w-2xl">
        {getIllustration()}
        {/* Add subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-violet-50/30 to-transparent pointer-events-none rounded-lg"></div>
      </div>
    </div>
  );

  const textColumn = (
    <div className="lg:py-8 max-w-xl mx-auto">
      <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-violet-100 mb-6 transition-transform hover:scale-110">
        <Icon className="h-7 w-7 text-violet-600" />
      </div>
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">{title}</h2>
      <p className="text-lg text-gray-600 mb-8 leading-relaxed">{description}</p>
      <ul className="space-y-4">
        {details.map((detail, index) => (
          <li key={index} className="flex items-start group">
            <CheckCircle className="h-5 w-5 text-violet-500 mr-3 mt-1 flex-shrink-0 transition-colors group-hover:text-violet-600" />
            <span className="text-gray-700 transition-colors group-hover:text-gray-900">
              {detail.includes('Coming') ? (
                <>
                  {detail.split(' - ')[0]}
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                    Coming Soon
                  </span>
                </>
              ) : (
                detail
              )}
            </span>
          </li>
        ))}
      </ul>
      <Link 
        to="/signup" 
        className="mt-8 inline-flex items-center px-4 py-2 rounded-lg text-violet-600 font-medium hover:text-violet-800 hover:bg-violet-50 transition-all duration-200 group"
      >
        Get started with {title}
        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );

  return (
    <section className="py-16 sm:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center ${imageSide === 'left' ? 'lg:grid-flow-col-dense' : ''}`}>
          {imageSide === 'left' ? (
            <>
              <div className="lg:col-start-1 transform hover:scale-[1.02] transition-transform duration-300">{imageColumn}</div>
              <div className="lg:col-start-2">{textColumn}</div>
            </>
          ) : (
            <>
              <div className="lg:col-start-1">{textColumn}</div>
              <div className="lg:col-start-2 transform hover:scale-[1.02] transition-transform duration-300">{imageColumn}</div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};


export function Features() {
  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <header className="bg-gradient-to-b from-violet-50 via-violet-50/50 to-white py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-violet-100/25 bg-[size:20px_20px] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Explore the Power of{' '}
            <span className="relative">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">ProgramMatrix</span>
              <span className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-violet-600/50 to-indigo-600/50 blur-sm"></span>
            </span>
          </h1>
          <p className="mt-8 text-xl leading-8 text-gray-600 max-w-3xl mx-auto">
            Dive deep into the features that make ProgramMatrix the ultimate unified platform for program managers seeking clarity, control, and efficiency.
          </p>
          <div className="mt-12">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-xl border border-transparent bg-violet-600 px-8 py-4 text-lg font-medium text-white hover:bg-violet-700 transition-all duration-200 shadow-lg hover:shadow-violet-500/25 transform hover:-translate-y-0.5"
            >
              Start Your Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Feature Sections */}
      <FeatureDetailSection
        icon={LayoutDashboard}
        title="Unified Dashboard"
        description="Gain instant clarity with a comprehensive, real-time overview of your entire program portfolio. Customize your view to focus on what matters most."
        details={[
          'At-a-glance view of key health metrics and KPIs.',
          'Track budget utilization, timeline progress, and task completion rates.',
          'Identify emerging risks and upcoming milestones.',
          'Personalize layout with drag-and-drop widgets. - Coming soon',
          'Consolidated view across multiple projects or initiatives.'
        ]}
        imageSide="right"
      />

       <FeatureDetailSection
        icon={FolderKanban} // Or Calendar
        title="Dynamic Roadmapping & Planning"
        description="Build, visualize, and adapt strategic roadmaps. Align initiatives, track dependencies, and communicate plans effectively across your organization."
        details={[
          'Create visual timelines with milestones, phases, and tasks.',
          'Map dependencies between different workstreams or projects.',
          'Track progress against planned schedules.',
          'Easily adjust timelines and reallocate resources.',
          'Shareable views for stakeholder alignment. - Coming Soon'
        ]}
        imageSide="left"
      />

      <FeatureDetailSection
        icon={BarChart3} // Or LineChart/PieChart
        title="Integrated Financial Management"
        description="Maintain complete control over program financials. Track budgets, forecast costs, and analyze expenditures without switching tools."
        details={[
          'Track budget allocation vs. actual spend in real-time.',
          'Forecast future costs based on current progress and scope.',
          'Manage different cost types (CapEx, OpEx).',
          'Generate financial summary reports.',
          'Link financial data directly to program milestones and deliverables.'
        ]}
        imageSide="right"
      />

       <FeatureDetailSection
        icon={Shield}
        title="Risk Analysis & Scenario Planning"
        description="Proactively identify, assess, and mitigate program risks. Simulate potential scenarios to understand impacts and make data-driven decisions."
        details={[
          'Log potential risks with impact, probability, and mitigation plans.',
          'Visualize risk exposure across your program.',
          'Track risk status and mitigation progress.',
          'Generate risk assessment reports. - Coming Soon'
        ]}
        imageSide="left"
      />

      <FeatureDetailSection
        icon={FileTextIcon}
        title="Centralized Document Center"
        description="Keep all your essential program documents organized, accessible, and version-controlled in one secure repository."
        details={[
          'Upload and organize documents by project, phase, or category.',
          'Version history tracking for key documents.',
          'Secure access controls and permissions.',
          'Link documents directly to tasks, risks, or milestones.',
          'Facilitates easy sharing and collaboration.'
        ]}
        imageSide="right"
      />

       <FeatureDetailSection
        icon={MessageSquareIcon}
        title="Communication & Stakeholder Log"
        description="Maintain a clear record of key communications, decisions, and stakeholder feedback to ensure alignment and transparency."
        details={[
          'Log meeting minutes, action items, and key decisions.',
          'Track stakeholder feedback and engagement levels.',
          'Associate communications with specific program elements.',
          'Maintain a historical record for audit trails.',
          'Improve accountability and follow-through.'
        ]}
        imageSide="left"
      />

       <FeatureDetailSection
        icon={BrainCircuit} // Or Sliders
        title="AI-Powered Insights & Chat"
        description="Leverage the power of AI to analyze your program data, generate custom insights, and get intelligent suggestions."
        details={[
          '(Pro Plan Feature)',
          'Ask natural language questions about your program data.',
          'Receive AI-driven suggestions for risk mitigation or optimization.',
          'Identify trends and anomalies automatically.',
          'Generate custom reports based on specific queries.',
          'Streamline data analysis and reporting tasks.'
        ]}
        imageSide="right"
      />

      <FeatureDetailSection
        icon={SettingsIcon}
        title="Customization & Settings"
        description="Tailor ProgramMatrix to fit your specific program methodologies, terminology, and organizational needs."
        details={[
          'Configure custom fields for tasks, risks, and other elements.',
          'Define custom program phases and workflows.',
          'Set up notification preferences.',
          'Adjust platform settings to match company standards.',
          '(Executive Plan) Tailored module development.'
        ]}
        imageSide="left"
      />

       <FeatureDetailSection
        icon={UsersIcon}
        title="Organization & User Management"
        description="Securely manage user access, roles, and permissions across your organization (Available for Admins)."
        details={[
          'Invite and manage team members.',
          'Define roles with specific permissions (e.g., Viewer, Editor, Admin). - Coming Soon',
          'Assign users to specific programs or projects.',
          'Maintain secure access control.',
          '(Executive Plan) Integration with SSO/Identity Providers.'
        ]}
        imageSide="right"
      />

      {/* Final CTA Section */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-600 to-violet-800"></div>
        <div className="relative py-24 sm:py-32">
          <div className="max-w-3xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Ready to Transform Your Program Management?
            </h2>
            <p className="mt-6 text-xl leading-8 text-violet-100">
              Stop juggling tools and start unifying your workflow. Experience the clarity and control of ProgramMatrix today.
            </p>
            <div className="mt-12">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-xl border-2 border-white bg-white/10 backdrop-blur-sm px-8 py-4 text-lg font-medium text-white hover:bg-white hover:text-violet-700 transition-all duration-200 shadow-lg hover:shadow-white/25 transform hover:-translate-y-0.5"
              >
                Get Started Free Now
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
} 