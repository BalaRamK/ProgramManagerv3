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
import logo from '../assets/ProgramMatrix_logo.png';
import { Navbar } from '../components/Navbar';

interface ProgramStats {
  budget: {
    total: number;
    spent: number;
    remaining: number;
    departments?: {
      name: string;
      spent: number;
      total: number;
    }[];
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
    recentRisks?: {
      id: string;
      description: string;
      level: 'high' | 'medium' | 'low';
    }[];
  };
  timeline: {
    daysElapsed: number;
    daysRemaining: number;
    percentComplete: number;
  };
  programs: any[];
  milestones: any[];
  kpis: any[];
  recentActivities: {
    id: string;
    type: string;
    title: string;
    user: string;
    time: string;
  }[];
}

export function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [programStats, setProgramStats] = useState<ProgramStats>({
    budget: { 
      total: 0, 
      spent: 0, 
      remaining: 0,
      departments: []
    },
    tasks: { 
      total: 0, 
      completed: 0, 
      inProgress: 0, 
      notStarted: 0 
    },
    risks: { 
      total: 0, 
      high: 0, 
      medium: 0, 
      low: 0,
      recentRisks: []
    },
    timeline: { 
      daysElapsed: 0, 
      daysRemaining: 0, 
      percentComplete: 0 
    },
    programs: [],
    milestones: [],
    kpis: [],
    recentActivities: []
  });
  
  const fetchUserData = async (userId: string) => {
    try {
      // Get user's organization first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user:', userError);
        return;
      }

      const organizationId = userData?.organization_id;

      // Fetch programs
      const { data: programs, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .eq('user_id', userId);

      if (programsError) {
        console.error('Error fetching programs:', programsError);
        return;
      }

      // Fetch milestones
      const { data: milestones, error: milestonesError } = await supabase
        .from('milestones')
        .select('*')
        .in('program_id', programs?.map(p => p.id) || []);

      if (milestonesError) {
        console.error('Error fetching milestones:', milestonesError);
        return;
      }

      // Fetch KPIs
      const { data: kpis, error: kpisError } = await supabase
        .from('kpis')
        .select('*')
        .in('program_id', programs?.map(p => p.id) || []);

      if (kpisError) {
        console.error('Error fetching KPIs:', kpisError);
        return;
      }

      // Fetch financials
      const { data: financials, error: financialsError } = await supabase
        .from('financials')
        .select('*')
        .eq('organization_id', organizationId);

      if (financialsError) {
        console.error('Error fetching financials:', financialsError);
        return;
      }

      // Fetch department financials
      const { data: departmentFinancials, error: deptError } = await supabase
        .from('department_financials')
        .select('*')
        .eq('organization_id', organizationId);

      if (deptError) {
        console.error('Error fetching department financials:', deptError);
        return;
      }

      // Fetch risks
      const { data: risks, error: risksError } = await supabase
        .from('risks')
        .select('*')
        .in('program_id', programs?.map(p => p.id) || []);

      if (risksError) {
        console.error('Error fetching risks:', risksError);
        return;
      }

      // Fetch recent activities
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .in('program_id', programs?.map(p => p.id) || [])
        .order('created_at', { ascending: false })
        .limit(5);

      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
        return;
      }

      // Calculate aggregated stats
      const totalBudget = financials?.[0]?.total_budget || 0;
      const totalSpent = financials?.[0]?.total_spent || 0;

      const departmentStats = departmentFinancials?.reduce((acc, dept) => {
        acc.push({
          name: dept.department_name,
          spent: dept.actual_spend,
          total: dept.planned_spend
        });
        return acc;
      }, [] as { name: string; spent: number; total: number }[]) || [];

      const riskLevels = risks?.reduce(
        (acc, risk) => {
          acc[risk.level]++;
          acc.total++;
          return acc;
        },
        { high: 0, medium: 0, low: 0, total: 0 }
      ) || { high: 0, medium: 0, low: 0, total: 0 };

      const recentRisks = risks
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3)
        .map(risk => ({
          id: risk.id,
          description: risk.description,
          level: risk.level
        }));

      // Calculate timeline stats from programs
      const now = new Date();
      const timelineStats = programs?.reduce(
        (acc, program) => {
          const startDate = new Date(program.start_date);
          const endDate = new Date(program.end_date);
          const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
          const elapsedDays = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
          
          acc.daysElapsed += Math.max(0, Math.min(elapsedDays, totalDays));
          acc.daysRemaining += Math.max(0, totalDays - elapsedDays);
          return acc;
        },
        { daysElapsed: 0, daysRemaining: 0 }
      ) || { daysElapsed: 0, daysRemaining: 0 };

      // Update program stats with real data
      setProgramStats({
        budget: {
          total: totalBudget,
          spent: totalSpent,
          remaining: totalBudget - totalSpent,
          departments: departmentStats
        },
        tasks: {
          total: milestones?.length || 0,
          completed: milestones?.filter(m => m.status === 'completed').length || 0,
          inProgress: milestones?.filter(m => m.status === 'in_progress').length || 0,
          notStarted: milestones?.filter(m => m.status === 'not_started').length || 0
        },
        risks: {
          ...riskLevels,
          recentRisks
        },
        timeline: {
          daysElapsed: Math.round(timelineStats.daysElapsed),
          daysRemaining: Math.round(timelineStats.daysRemaining),
          percentComplete: Math.round((timelineStats.daysElapsed / (timelineStats.daysElapsed + timelineStats.daysRemaining)) * 100)
        },
        programs: programs || [],
        milestones: milestones || [],
        kpis: kpis || [],
        recentActivities: activities?.map(activity => ({
          id: activity.id,
          type: activity.type,
          title: activity.title,
          user: activity.user_name,
          time: formatTimeAgo(new Date(activity.created_at))
        })) || []
      });
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

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
      
      // Initial data fetch
      await fetchUserData(user.id);

      // Set up real-time subscriptions
      const programsSubscription = supabase
        .channel('program-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'programs',
            filter: `user_id=eq.${user.id}`
          },
          () => fetchUserData(user.id)
        )
        .subscribe();

      const milestonesSubscription = supabase
        .channel('milestone-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'milestones'
          },
          () => fetchUserData(user.id)
        )
        .subscribe();

      const financialsSubscription = supabase
        .channel('financial-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'financials'
          },
          () => fetchUserData(user.id)
        )
        .subscribe();

      const risksSubscription = supabase
        .channel('risk-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'risks'
          },
          () => fetchUserData(user.id)
        )
        .subscribe();

      const kpisSubscription = supabase
        .channel('kpi-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'kpis'
          },
          () => fetchUserData(user.id)
        )
        .subscribe();

      const activitiesSubscription = supabase
        .channel('activity-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'activities'
          },
          () => fetchUserData(user.id)
        )
        .subscribe();

      // Cleanup subscriptions on unmount
      return () => {
        programsSubscription.unsubscribe();
        milestonesSubscription.unsubscribe();
        financialsSubscription.unsubscribe();
        risksSubscription.unsubscribe();
        kpisSubscription.unsubscribe();
        activitiesSubscription.unsubscribe();
      };
    };
    
    checkUser();
  }, [navigate]);

  // Navigation handlers for "View Details" buttons
  const handleViewBudgetDetails = () => {
    navigate('/kpi-financial', { state: { activeTab: 'financials' } });
  };

  const handleViewTimelineDetails = () => {
    navigate('/roadmap');
  };

  const handleViewMilestoneDetails = () => {
    navigate('/roadmap', { state: { showMilestones: true } });
  };

  const handleViewRiskDetails = () => {
    navigate('/scenario-planning', { state: { activeTab: 'risks' } });
  };

  const handleViewTaskDetails = () => {
    navigate('/roadmap', { state: { showTasks: true } });
  };

  const handleViewActivityDetails = () => {
    navigate('/communication-log');
  };

  // Helper function to format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  // Helper function to format milestone status
  const getMilestoneStatus = (status: string): 'on-track' | 'at-risk' => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'in_progress':
      case 'not_started':
        return 'on-track';
      case 'delayed':
      case 'at_risk':
        return 'at-risk';
      default:
        return 'on-track';
    }
  };

  // Get upcoming milestones
  const getUpcomingMilestones = () => {
    const now = new Date();
    return programStats.milestones
      .filter(m => new Date(m.due_date) > now)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 4)
      .map(m => ({
        id: m.id,
        title: m.title,
        date: new Date(m.due_date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }),
        status: getMilestoneStatus(m.status)
      }));
  };

  // Simulated data for dashboard components
  const upcomingMilestones = getUpcomingMilestones();

  // Get KPI data
  const getKpiData = () => {
    return programStats.kpis
      .filter(kpi => kpi.current_value !== undefined && kpi.target_value !== undefined)
      .map(kpi => {
        const previousValue = kpi.previous_value || kpi.current_value;
        const trend = kpi.current_value > previousValue ? 'up' : 'down';
        const change = Math.abs(((kpi.current_value - previousValue) / previousValue) * 100).toFixed(1);
        
        return {
          id: kpi.id,
          name: kpi.name,
          value: `${Math.round((kpi.current_value / kpi.target_value) * 100)}%`,
          trend,
          change: `${change}%`
        };
      })
      .slice(0, 4);
  };

  const kpiData = getKpiData();
  
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
              onClick={(e) => { e.preventDefault(); navigate('/settings'); }}
            >
              <Settings className="h-5 w-5 mr-3 text-gray-500" />
              <span>Organization and User Settings</span>
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
          {/*<header className="bg-white shadow-sm sticky top-0 z-0">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center w-1/2">
                <div className="relative w-full max-w-md">
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />/>
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
          </header>*/}

        {/* Main Content Area */}
          <div className="p-6">
            

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
                      <button 
                        onClick={handleViewBudgetDetails}
                        className="text-sm text-violet-600 hover:text-violet-700"
                      >
                        View Details
                      </button>
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
                      {programStats.budget.departments?.map((dept, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm font-medium">{dept.name}</p>
                          <div className="flex items-center mt-2">
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-green-500' : 'bg-purple-500'}`} 
                                style={{ width: `${(dept.spent / dept.total) * 100}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-sm">{Math.round((dept.spent / dept.total) * 100)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Timeline Progress */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-semibold">Timeline Progress</h2>
                      <button 
                        onClick={handleViewTimelineDetails}
                        className="text-sm text-violet-600 hover:text-violet-700"
                      >
                        View Roadmap
                      </button>
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
                      <button 
                        onClick={handleViewMilestoneDetails}
                        className="text-sm text-violet-600 hover:text-violet-700"
                      >
                        View All
                      </button>
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
                      <button 
                        onClick={handleViewRiskDetails}
                        className="text-sm text-violet-600 hover:text-violet-700"
                      >
                        View All Risks
                      </button>
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
                      {programStats.risks.recentRisks?.map(risk => (
                        <div key={risk.id} className="flex items-center justify-between">
                          <span className="text-sm">{risk.description}</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            risk.level === 'high' ? 'bg-red-100 text-red-800' :
                            risk.level === 'medium' ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {risk.level.charAt(0).toUpperCase() + risk.level.slice(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Recent Activity */}
                  <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-semibold">Recent Activity</h2>
                      <button 
                        onClick={handleViewActivityDetails}
                        className="text-sm text-violet-600 hover:text-violet-700"
                      >
                        View All
                      </button>
                    </div>
                    <div className="space-y-4">
                      {programStats.recentActivities.map(activity => (
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
                          <button className="text-gray-400 hover:text-gray-600" title="More options">
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
                      <button 
                        onClick={handleViewTaskDetails}
                        className="text-sm text-violet-600 hover:text-violet-700"
                      >
                        View All Tasks
                      </button>
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
