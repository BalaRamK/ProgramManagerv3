import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  LogOut,
  ChevronRight,
  Layers,
  MessageSquare,
  FolderOpen,
  LayoutDashboard,
  User,
  Briefcase,
  Lightbulb,
  Zap,
  BookOpen
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserOrgManagement } from '../components/UserOrgManagement';
import { Navbar } from '../components/Navbar';

interface ProgramStats {
  budget: {
    total: number;
    spent: number;
    remaining: number;
  };
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
  };
  risks: {
    total: number;
    high: number;
    medium: number;
    low: number;
  };
  timeline: {
    daysElapsed: number;
    daysRemaining: number;
    percentComplete: number;
  };
  programs?: any[];
  milestones?: any[];
  kpis?: any[];
}

export function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [programStats, setProgramStats] = useState<ProgramStats>({
    budget: { total: 1250000, spent: 450000, remaining: 800000 },
    tasks: { total: 124, completed: 78, inProgress: 32, notStarted: 14 },
    risks: { total: 18, high: 3, medium: 7, low: 8 },
    timeline: { daysElapsed: 45, daysRemaining: 75, percentComplete: 38 }
  });
  
  // Check if user is logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        navigate('/login');
        return;
      }
      setUser(user);
      setLoading(false);
      
      // Fetch user-specific data
      await fetchUserData(user.id);
    };
    
    checkUser();
  }, [navigate]);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch programs for the current user
      const { data: programs, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .eq('user_id', userId);

      if (programsError) {
        console.error('Error fetching programs:', programsError);
        return;
      }

      // Fetch milestones for the current user
      const { data: milestones, error: milestonesError } = await supabase
        .from('milestones')
        .select('*')
        .eq('user_id', userId);

      if (milestonesError) {
        console.error('Error fetching milestones:', milestonesError);
        return;
      }

      // Fetch KPIs for the current user
      const { data: kpis, error: kpisError } = await supabase
        .from('kpis')
        .select('*')
        .eq('user_id', userId);

      if (kpisError) {
        console.error('Error fetching KPIs:', kpisError);
        return;
      }

      // Update state with user-specific data
      setProgramStats({
        ...programStats,
        programs: programs || [],
        milestones: milestones || [],
        kpis: kpis || []
      });
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  // Simulated data for dashboard components
  const recentActivities = [
    { id: 1, type: 'task', title: 'Updated roadmap for Q3', user: 'Alex Johnson', time: '2 hours ago' },
    { id: 2, type: 'risk', title: 'New risk identified: Supply chain delay', user: 'Maria Garcia', time: '4 hours ago' },
    { id: 3, type: 'budget', title: 'Budget allocation adjusted for Marketing', user: 'David Kim', time: '6 hours ago' },
    { id: 4, type: 'stakeholder', title: 'New stakeholder feedback recorded', user: 'Sarah Williams', time: 'Yesterday' },
    { id: 5, type: 'milestone', title: 'Phase 1 completion approved', user: 'You', time: 'Yesterday' }
  ];
  
  const upcomingMilestones = [
    { id: 1, title: 'Vendor Selection Finalized', date: 'Jun 15, 2025', status: 'on-track' },
    { id: 2, title: 'Prototype Testing Complete', date: 'Jun 28, 2025', status: 'at-risk' },
    { id: 3, title: 'Stakeholder Review Meeting', date: 'Jul 10, 2025', status: 'on-track' },
    { id: 4, title: 'Phase 2 Kickoff', date: 'Jul 15, 2025', status: 'on-track' }
  ];

  const kpiData = [
    { id: 1, name: 'Budget Utilization', value: '36%', trend: 'up', change: '4%' },
    { id: 2, name: 'Timeline Progress', value: '38%', trend: 'up', change: '2%' },
    { id: 3, name: 'Task Completion', value: '63%', trend: 'up', change: '5%' },
    { id: 4, name: 'Risk Mitigation', value: '72%', trend: 'down', change: '3%' }
  ];
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };
  
  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'task': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'risk': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'budget': return <Wallet className="h-5 w-5 text-blue-500" />;
      case 'stakeholder': return <Users className="h-5 w-5 text-purple-500" />;
      case 'milestone': return <Calendar className="h-5 w-5 text-violet-500" />;
      default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white shadow-md z-10 fixed h-full">
          
          <div className="p-6">
              <img 
                src="/dist/assets/ProgramMatrix_logo.png" 
                alt="ProgramMatrix Logo" 
                className="h-8 w-auto mr-2" 
              />
          </div>
          <nav className="mt-2">
            <div className="px-4 py-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Main</p>
            </div>
            <a 
              href="#" 
              className="flex items-center px-6 py-3 text-gray-900 bg-violet-50 border-r-4 border-violet-600"
              onClick={(e) => { e.preventDefault(); setActiveTab('overview'); }}
            >
              <LayoutDashboard className="h-5 w-5 mr-3 text-violet-600" />
              <span className="font-medium">Dashboard</span>
            </a>
            <a 
              href="#" 
              className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50"
              onClick={(e) => { e.preventDefault(); setActiveTab('roadmap'); navigate('/roadmap'); }}
            >
              <Calendar className="h-5 w-5 mr-3 text-gray-500" />
              <span>Roadmap & Milestones</span>
            </a>
            <a 
              href="#" 
              className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50"
              onClick={(e) => { e.preventDefault(); setActiveTab('kpi'); navigate('/kpi')}}
            >
              <BarChart3 className="h-5 w-5 mr-3 text-gray-500" />
              <span>KPI & Financials</span>
            </a>
            <a 
              href="#" 
              className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50"
              onClick={(e) => { e.preventDefault(); setActiveTab('scenario'); navigate('/scenario-planning')}}
            >
              <Lightbulb className="h-5 w-5 mr-3 text-gray-500" />
              <span>Risk Analysis</span>
            </a>
            <a 
              href="#" 
              className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50"
              onClick={(e) => { e.preventDefault(); setActiveTab('communication'); navigate('/communication-log')}}
            >
              <MessageSquare className="h-5 w-5 mr-3 text-gray-500" />
              <span>Communication Hub</span>
            </a>
            <a 
              href="#" 
              className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50"
              onClick={(e) => { e.preventDefault(); setActiveTab('documents'); navigate('/document-center')}}
            >
              <FolderOpen className="h-5 w-5 mr-3 text-gray-500" />
              <span>Document Center</span>
            </a>
            <a 
              href="#" 
              className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50"
              onClick={(e) => { e.preventDefault(); setActiveTab('insights'); navigate('/custom-insights'); }}
            >
              <Zap className="h-5 w-5 mr-3 text-gray-500" />
              <span>Custom Insights</span>
            </a>
            <a 
              href="#" 
              className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50"
              onClick={(e) => { e.preventDefault(); navigate('/documentation'); }}
            >
              <BookOpen className="h-5 w-5 mr-3 text-gray-500" />
              <span>Documentation</span>
            </a>
            
            <div className="px-4 py-2 mt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
            </div>
            <a 
              href="#" 
              className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50"
              onClick={(e) => { e.preventDefault(); setActiveTab('settings'); navigate('/settings')}}
            >
              <Settings className="h-5 w-5 mr-3 text-gray-500" />
              <span>Settings</span>
            </a>
            <a 
              href="#" 
              className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3 text-gray-500" />
              <span>Sign Out</span>
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 ml-64">
          {/* Top Navigation */}
          <header className="bg-white shadow-sm sticky top-0 z-0">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center w-1/2">
                <div className="relative w-full max-w-md">
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  className="relative p-2 rounded-full hover:bg-gray-100"
                  aria-label="Notifications"
                >
                  <Bell className="h-6 w-6 text-gray-600" />
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-white"></span>
                </button>
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-violet-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user?.email?.split('@')[0] || 'User'}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <div className="p-6">
            {/* User and Organization Management */}
            <div className="mb-8">
              <UserOrgManagement />
            </div>

            {/* Dashboard Content */}
            {activeTab === 'overview' && (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                  <p className="text-gray-600">Welcome back{user?.user_metadata?.name ? `, ${user.user_metadata.name}` : ''}! Here's what's happening with your programs.</p>
                </div>
                
                {/* KPI Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  {kpiData.map(kpi => (
                    <div key={kpi.id} className="bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-500">{kpi.name}</p>
                          <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                        </div>
                        <div className={`flex items-center ${kpi.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                          {kpi.trend === 'up' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                          <span className="text-sm font-medium ml-1">{kpi.change}</span>
                        </div>
                      </div>
                      <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${kpi.trend === 'up' ? 'bg-green-500' : 'bg-red-500'}`} 
                          style={{ width: kpi.value }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Budget Overview */}
                  <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-semibold">Budget Overview</h2>
                      <button className="text-sm text-violet-600 hover:text-violet-700">View Details</button>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Total Budget</p>
                        <p className="text-xl font-bold">${(programStats.budget.total / 1000).toFixed(1)}K</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Spent</p>
                        <p className="text-xl font-bold">${(programStats.budget.spent / 1000).toFixed(1)}K</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Remaining</p>
                        <p className="text-xl font-bold">${(programStats.budget.remaining / 1000).toFixed(1)}K</p>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-violet-500" 
                        style={{ width: `${(programStats.budget.spent / programStats.budget.total) * 100}%` }}
                      ></div>
                    </div>
                    <div className="mt-6 grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-medium">Development</p>
                        <div className="flex items-center mt-2">
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: '65%' }}></div>
                          </div>
                          <span className="ml-2 text-sm">65%</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-medium">Marketing</p>
                        <div className="flex items-center mt-2">
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: '40%' }}></div>
                          </div>
                          <span className="ml-2 text-sm">40%</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-medium">Operations</p>
                        <div className="flex items-center mt-2">
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500" style={{ width: '25%' }}></div>
                          </div>
                          <span className="ml-2 text-sm">25%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Timeline Progress */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-semibold">Timeline Progress</h2>
                      <button className="text-sm text-violet-600 hover:text-violet-700">View Roadmap</button>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="relative h-40 w-40">
                        <svg className="h-full w-full" viewBox="0 0 100 100">
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="45" 
                            fill="none" 
                            stroke="#f3f4f6" 
                            strokeWidth="10"
                          />
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="45" 
                            fill="none" 
                            stroke="#8b5cf6" 
                            strokeWidth="10"
                            strokeDasharray="283"
                            strokeDashoffset={283 * (1 - programStats.timeline.percentComplete / 100)}
                            transform="rotate(-90 50 50)"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <span className="text-3xl font-bold">{programStats.timeline.percentComplete}%</span>
                          <span className="text-sm text-gray-500">Complete</span>
                        </div>
                      </div>
                      <div className="mt-6 w-full grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">Days Elapsed</p>
                          <p className="text-xl font-bold">{programStats.timeline.daysElapsed}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">Days Remaining</p>
                          <p className="text-xl font-bold">{programStats.timeline.daysRemaining}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Upcoming Milestones */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-semibold">Upcoming Milestones</h2>
                      <button className="text-sm text-violet-600 hover:text-violet-700">View All</button>
                    </div>
                    <div className="space-y-4">
                      {upcomingMilestones.map(milestone => (
                        <div key={milestone.id} className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="mr-4">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              milestone.status === 'on-track' ? 'bg-green-100' : 'bg-orange-100'
                            }`}>
                              <Calendar className={`h-5 w-5 ${
                                milestone.status === 'on-track' ? 'text-green-600' : 'text-orange-600'
                              }`} />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{milestone.title}</p>
                            <p className="text-sm text-gray-500">{milestone.date}</p>
                          </div>
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              milestone.status === 'on-track' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {milestone.status === 'on-track' ? 'On Track' : 'At Risk'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Risk Summary */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-semibold">Risk Summary</h2>
                      <button className="text-sm text-violet-600 hover:text-violet-700">View All Risks</button>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-red-50 rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-700">High</p>
                        <p className="text-2xl font-bold text-red-600">{programStats.risks.high}</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-700">Medium</p>
                        <p className="text-2xl font-bold text-orange-600">{programStats.risks.medium}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-700">Low</p>
                        <p className="text-2xl font-bold text-green-600">{programStats.risks.low}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Supply Chain Delays</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          High
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Resource Availability</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Medium
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Stakeholder Alignment</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Medium
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Recent Activity */}
                  <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-semibold">Recent Activity</h2>
                      <button className="text-sm text-violet-600 hover:text-violet-700">View All</button>
                    </div>
                    <div className="space-y-4">
                      {recentActivities.map(activity => (
                        <div key={activity.id} className="flex items-start p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="mr-4 mt-1">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{activity.title}</p>
                            <p className="text-sm text-gray-500">
                              <span>{activity.user}</span> • <span>{activity.time}</span>
                            </p>
                          </div>
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Task Progress */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-semibold">Task Progress</h2>
                      <button className="text-sm text-violet-600 hover:text-violet-700">View All Tasks</button>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Completed</span>
                          <span className="text-sm text-gray-500">{programStats.tasks.completed}/{programStats.tasks.total}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500" 
                            style={{ width: `${(programStats.tasks.completed / programStats.tasks.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">In Progress</span>
                          <span className="text-sm text-gray-500">{programStats.tasks.inProgress}/{programStats.tasks.total}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500" 
                            style={{ width: `${(programStats.tasks.inProgress / programStats.tasks.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Not Started</span>
                          <span className="text-sm text-gray-500">{programStats.tasks.notStarted}/{programStats.tasks.total}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gray-500" 
                            style={{ width: `${(programStats.tasks.notStarted / programStats.tasks.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Customization Hint */}
                <div className="mt-6 bg-violet-50 rounded-xl p-4 border border-violet-100">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <Zap className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-violet-800">Customize your dashboard</h3>
                      <p className="mt-1 text-sm text-violet-600">
                        Drag and drop widgets to rearrange them, or click on any widget to see more details.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {activeTab !== 'overview' && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {activeTab === 'roadmap' && 'Roadmap & Milestones'}
                    {activeTab === 'kpi' && 'KPI & Financial Health'}
                    {activeTab === 'scenario' && 'Scenario Planning & Risk Analytics'}
                    {activeTab === 'communication' && 'Communication Hub'}
                    {activeTab === 'documents' && 'Document Center'}
                    {activeTab === 'insights' && 'Custom Insights & Reporting'}
                    {activeTab === 'settings' && 'Settings & Customization'}
                  </h2>
                  <p className="text-gray-600 mb-6">This page is under construction.</p>
                  <button 
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      activeTab === 'overview'
                        ? 'bg-violet-100 text-violet-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="View Overview"
                    onClick={() => setActiveTab('overview')}
                  >
                    Overview
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
