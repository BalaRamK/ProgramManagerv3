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
  BookOpen,
  DollarSign,
  Filter,
  PlusCircle,
  ChevronDown,
  Edit,
  MessageCircle,
  Download,
  XIcon,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserOrgManagement } from '../components/UserOrgManagement';
import logo from '../assets/ProgramMatrix_logo.png';
import { Navbar } from '../components/Navbar';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

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
  risks: RiskStats;
  timeline: {
    daysElapsed: number;
    daysRemaining: number;
    percentComplete: number;
    averageProgress: number;
    averageDaysElapsed: number;
    averageDaysRemaining: number;
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
  goals: any[];
  orgStats: {
    totalOrganizations: number;
    totalUsers: number;
    usersByType: {
      internal: number;
      external: number;
      admin: number;
    };
    usersByRegion: {
      [key: string]: number;
    };
  };
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

interface MonthlyProfitData {
  period: string;
  total_revenue: number;
  total_cost: number;
  profit: number;
  roi: number;
}

interface CommunicationLog {
  id: string;
  type: string;
  message: string;
  program_id?: string;
  milestone_id?: string;
  risk_id?: string;
  user_id?: string;
  organization_id?: string;
  created_at: string;
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  meeting_name?: string;
}

interface RiskView {
  id: string;
  program_id: string;
  description: string;
  probability: number;
  impact: number;
  level: string;
  program_name: string;
  status: string;
}

interface ProgramRiskStats {
  program_name: string;
  count: number;
  high: number;
  medium: number;
  low: number;
}

interface RiskStats {
  high: number;
  medium: number;
  low: number;
  total: number;
  total_score: number;
  recentRisks: Array<{
    id: string;
    program_name: string;
    count: number;
    level: 'high' | 'medium' | 'low';
  }>;
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
      high: 0, 
      medium: 0, 
      low: 0,
      total: 0,
      total_score: 0,
      recentRisks: []
    },
    timeline: { 
      daysElapsed: 0, 
      daysRemaining: 0, 
      percentComplete: 0,
      averageProgress: 0,
      averageDaysElapsed: 0,
      averageDaysRemaining: 0
    },
    programs: [],
    milestones: [],
    kpis: [],
    recentActivities: [],
    goals: [],
    orgStats: {
      totalOrganizations: 0,
      totalUsers: 0,
      usersByType: {
        internal: 0,
        external: 0,
        admin: 0
      },
      usersByRegion: {}
    }
  });
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
  const [profitData, setProfitData] = useState<MonthlyProfitData[]>([]);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [communicationLogs, setCommunicationLogs] = useState<CommunicationLog[]>([]);
  
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

      // Fetch all organizations and users
      const { data: organizations, error: orgsError } = await supabase
        .from('organizations')
        .select('*');

      if (orgsError) {
        console.error('Error fetching organizations:', orgsError);
        return;
      }

      const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return;
      }

      // Calculate organization and user statistics
      const orgStats = {
        totalOrganizations: organizations?.length || 0,
        totalUsers: allUsers?.length || 0,
        usersByType: {
          internal: allUsers?.filter(u => u.user_type === 'internal').length || 0,
          external: allUsers?.filter(u => u.user_type === 'external').length || 0,
          admin: allUsers?.filter(u => u.role === 'admin').length || 0
        },
        usersByRegion: allUsers?.reduce((acc: { [key: string]: number }, user) => {
          const region = user.region || 'unknown';
          acc[region] = (acc[region] || 0) + 1;
          return acc;
        }, {}) || {}
      };

      // Update program stats with organization statistics
      setProgramStats(prevStats => ({
        ...prevStats,
        orgStats
      }));

      // Fetch programs
      const { data: programs, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .eq('user_id', userId);

      if (programsError) {
        console.error('Error fetching programs:', programsError);
        return;
      }

      // First fetch goals for all programs
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .in('program_id', programs?.map(p => p.id) || []);

      if (goalsError) {
        console.error('Error fetching goals:', goalsError);
        return;
      }

      // Then fetch milestones using goal_ids
      const { data: milestones, error: milestonesError } = await supabase
        .from('milestones')
        .select('*')
        .in('goal_id', goals?.map(g => g.id) || []);

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
      const { data: financialsData, error: financialsError } = await supabase
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

      // Fetch risks with program information
      const { data: risks, error: risksError } = await supabase
        .from('risk_view')
        .select(`
          id,
          program_id,
          description,
          probability,
          impact,
          level,
          program_name,
          status
        `)
        .eq('status', 'open');

      if (risksError) {
        console.error('Error fetching risks:', risksError);
        return;
      }

      // Calculate risk statistics
      const riskStats: RiskStats = {
        high: 0,
        medium: 0,
        low: 0,
        total: 0,
        total_score: 0,
        recentRisks: []
      };

      // Group risks by program to find top risky programs
      const programRisks = risks?.reduce((acc, risk: RiskView) => {
        const level = risk.probability >= 0.7 ? 'high' : risk.probability >= 0.4 ? 'medium' : 'low';
        
        // Count by risk level
        riskStats[level as keyof Pick<RiskStats, 'high' | 'medium' | 'low'>]++;
        riskStats.total++;
        
        // Calculate total risk score (average of all risk scores)
        riskStats.total_score += (risk.probability * risk.impact);

        // Group by program
        if (!acc[risk.program_id]) {
          acc[risk.program_id] = {
            program_name: risk.program_name,
            count: 0,
            high: 0,
            medium: 0,
            low: 0
          };
        }
        acc[risk.program_id].count++;
        acc[risk.program_id][level as keyof Pick<ProgramRiskStats, 'high' | 'medium' | 'low'>]++;
        
        return acc;
      }, {} as Record<string, ProgramRiskStats>) || {};

      // Calculate average risk score
      riskStats.total_score = riskStats.total > 0 ? 
        (riskStats.total_score / riskStats.total) : 0;

      // Get top programs by risk count and add to recentRisks
      riskStats.recentRisks = Object.entries(programRisks)
        .map(([id, data]) => ({
          id,
          program_name: data.program_name,
          count: data.count,
          level: data.high > 0 ? 'high' as const : data.medium > 0 ? 'medium' as const : 'low' as const
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      // Update program stats with risk information
      setProgramStats(prevStats => ({
        ...prevStats,
        risks: riskStats
      }));

      // Calculate aggregated stats
      const aggregatedStats = {
        total: programs?.length || 0,
        active: programs?.filter(p => p.status === 'active').length || 0,
        completed: programs?.filter(p => p.status === 'completed').length || 0,
        onTrack: programs?.filter(p => p.status === 'active' && p.health === 'on_track').length || 0,
        atRisk: programs?.filter(p => p.status === 'active' && p.health === 'at_risk').length || 0,
        offTrack: programs?.filter(p => p.status === 'active' && p.health === 'off_track').length || 0,
      };

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

      const timelineMetrics = calculateCombinedTimelineMetrics(programs || [], goals || []);

      // Update program stats with real data
      setProgramStats(prevStats => ({
        ...prevStats,
        timeline: {
          ...timelineMetrics,
          daysElapsed: timelineMetrics.averageDaysElapsed,
          daysRemaining: timelineMetrics.averageDaysRemaining,
          percentComplete: timelineMetrics.averageProgress
        },
        programs: programs || [],
        milestones: milestones || [],
        goals: goals || [],
        tasks: {
          total: milestones?.length || 0,
          completed: milestones?.filter(m => m.status?.toLowerCase() === 'completed').length || 0,
          inProgress: milestones?.filter(m => ['in_progress', 'in-progress'].includes(m.status?.toLowerCase())).length || 0,
          notStarted: milestones?.filter(m => !['completed', 'in_progress', 'in-progress'].includes(m.status?.toLowerCase())).length || 0
        }
      }));

      console.log('Updated program stats:', {
        programs: programs?.length || 0,
        goals: goals?.length || 0,
        timeline: timelineMetrics
      });
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
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

      const goalsSubscription = supabase
        .channel('goals-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'goals'
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

      // Remove activities subscription since the table doesn't exist

      // Cleanup subscriptions on unmount
      return () => {
        programsSubscription.unsubscribe();
        goalsSubscription.unsubscribe();
        milestonesSubscription.unsubscribe();
        financialsSubscription.unsubscribe();
        risksSubscription.unsubscribe();
        kpisSubscription.unsubscribe();
      };
    };
    
    checkUser();
  }, [navigate]);

  // Add this new effect for fetching financial metrics across all organizations
  useEffect(() => {
    const calculateYearlyMetrics = async () => {
      if (!user?.id) return;

      try {
        // First get all organizations for the user
        const { data: userOrgs, error: userOrgsError } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id);

        if (userOrgsError) {
          console.error('Error fetching user organizations:', userOrgsError);
          return;
        }

        const orgIds = userOrgs.map(org => org.organization_id).filter(Boolean);
        
        if (orgIds.length === 0) return;

        const currentYear = new Date().getFullYear();
        const lastYear = currentYear - 1;

        // Fetch current year data for all organizations
        const { data: currentYearData, error: currentYearError } = await supabase
          .from('profits_monthly')
          .select('profit, revenue, total_cost')
          .in('organization_id', orgIds)
          .eq('year', currentYear);

        if (currentYearError) {
          console.error('Error fetching current year data:', currentYearError);
          return;
        }

        // Fetch previous year data for all organizations
        const { data: previousYearData, error: previousYearError } = await supabase
          .from('profits_monthly')
          .select('profit')
          .in('organization_id', orgIds)
          .eq('year', lastYear);

        if (previousYearError) {
          console.error('Error fetching previous year data:', previousYearError);
          return;
        }

        // Calculate combined metrics
        const currentYearMetrics = currentYearData?.reduce((acc, curr) => ({
          totalProfit: acc.totalProfit + (Number(curr.profit) || 0),
          totalRevenue: acc.totalRevenue + (Number(curr.revenue) || 0),
          totalCost: acc.totalCost + (Number(curr.total_cost) || 0)
        }), { totalProfit: 0, totalRevenue: 0, totalCost: 0 });

        const previousYearTotalProfit = previousYearData?.reduce((acc, curr) => 
          acc + (Number(curr.profit) || 0), 0) || 0;

        const profitIncrease = (currentYearMetrics?.totalProfit || 0) - previousYearTotalProfit;
        const profitIncreasePercentage = previousYearTotalProfit !== 0 
          ? ((profitIncrease / Math.abs(previousYearTotalProfit)) * 100)
          : 0;

        const totalRoi = currentYearMetrics?.totalRevenue !== 0
          ? ((currentYearMetrics?.totalProfit || 0) / (currentYearMetrics?.totalRevenue || 1)) * 100
          : 0;

        setYearlyMetrics({
          totalProfit: currentYearMetrics?.totalProfit || 0,
          totalRoi: totalRoi,
          totalCost: currentYearMetrics?.totalCost || 0,
          profitIncrease,
          profitIncreasePercentage
        });

      } catch (error) {
        console.error('Error calculating yearly metrics:', error);
      }
    };

    calculateYearlyMetrics();
  }, [user?.id]);

  // Update the profit data fetching to combine all organizations
  useEffect(() => {
    const fetchFinancialData = async () => {
      if (!user?.id) return;

      try {
        // Get all organizations for the user
        const { data: userOrgs, error: userOrgsError } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id);

        if (userOrgsError) {
          console.error('Error fetching user organizations:', userOrgsError);
          return;
        }

        const orgIds = userOrgs.map(org => org.organization_id).filter(Boolean);
        
        if (orgIds.length === 0) return;

        let query = supabase
          .from('profits_monthly')
          .select('*')
          .in('organization_id', orgIds)
          .eq('year', selectedYear);

        if (selectedMonth !== null) {
          query = query.eq('month', selectedMonth + 1);
        }

        const { data: profitsData, error: profitsError } = await query.order('month', { ascending: true });

        if (profitsError) {
          console.error('Error fetching profits:', profitsError);
          setProfitData([]);
          return;
        }

        // Transform and combine the data for all organizations
        let monthlyData: MonthlyProfitData[];
        
        if (selectedMonth !== null) {
          // Combine all organization data for the selected month
          const combinedMonthData = profitsData.reduce((acc, curr) => ({
            revenue: (acc.revenue || 0) + (Number(curr.revenue) || 0),
            total_cost: (acc.total_cost || 0) + (Number(curr.total_cost) || 0),
            profit: (acc.profit || 0) + (Number(curr.profit) || 0),
            roi: (acc.roi || 0) + (Number(curr.roi) || 0)
          }), {});

          monthlyData = [{
            period: new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            total_revenue: combinedMonthData.revenue || 0,
            total_cost: combinedMonthData.total_cost || 0,
            profit: combinedMonthData.profit || 0,
            roi: combinedMonthData.roi || 0
          }];
        } else {
          // Combine data for all months
          monthlyData = Array.from({ length: 12 }, (_, monthIndex) => {
            const monthData = profitsData.filter(p => p.month === monthIndex + 1);
            const combinedData = monthData.reduce((acc, curr) => ({
              revenue: (acc.revenue || 0) + (Number(curr.revenue) || 0),
              total_cost: (acc.total_cost || 0) + (Number(curr.total_cost) || 0),
              profit: (acc.profit || 0) + (Number(curr.profit) || 0),
              roi: (acc.roi || 0) + (Number(curr.roi) || 0)
            }), {});

            return {
              period: new Date(selectedYear, monthIndex).toLocaleDateString('en-US', { month: 'short' }),
              total_revenue: combinedData.revenue || 0,
              total_cost: combinedData.total_cost || 0,
              profit: combinedData.profit || 0,
              roi: combinedData.roi || 0
            };
          });
        }

        setProfitData(monthlyData);
      } catch (error) {
        console.error('Error in fetchFinancialData:', error);
        setProfitData([]);
      }
    };

    fetchFinancialData();
  }, [user?.id, selectedYear, selectedMonth]);

  // Add useEffect to fetch communication logs
  useEffect(() => {
    const fetchCommunicationLogs = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      try {
        const { data: userProfile } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', userData.user.id)
          .single();

        if (!userProfile?.organization_id) return;

        const { data, error } = await supabase
          .from('communication_logs')
          .select('*')
          .eq('organization_id', userProfile.organization_id);

        if (error) {
          console.error('Error fetching communication logs:', error);
        } else {
          setCommunicationLogs(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch communication logs:', err);
      }
    };

    fetchCommunicationLogs();
  }, []);

  // Navigation handlers for "View Details" buttons
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

  // Update the calculateCombinedTimelineMetrics function to use goal progress
  const calculateCombinedTimelineMetrics = (programs: any[], goals: any[]) => {
    const now = new Date();
    let totalProgress = 0;
    let totalDaysElapsed = 0;
    let totalDaysRemaining = 0;
    let activePrograms = 0;

    programs.forEach(program => {
      const startDate = new Date(program.start_date);
      const endDate = new Date(program.end_date);
      
      // Only consider active programs
      if (now <= endDate) {
        activePrograms++;
        
        // Calculate days
        const totalDuration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        const elapsed = Math.max(0, (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const remaining = Math.max(0, (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Get program's goals and calculate average progress
        const programGoals = goals.filter(g => g.program_id === program.id);
        let programProgress = 0;
        
        if (programGoals.length > 0) {
          programProgress = programGoals.reduce((sum, goal) => sum + (goal.progress || 0), 0) / programGoals.length;
        }
        
        totalProgress += programProgress;
        totalDaysElapsed += elapsed;
        totalDaysRemaining += remaining;

        console.log(`Program ${program.name} progress:`, {
          numGoals: programGoals.length,
          programProgress
        });
      }
    });

    const metrics = {
      averageProgress: activePrograms > 0 ? Math.round(totalProgress / activePrograms) : 0,
      averageDaysElapsed: activePrograms > 0 ? Math.round(totalDaysElapsed / activePrograms) : 0,
      averageDaysRemaining: activePrograms > 0 ? Math.round(totalDaysRemaining / activePrograms) : 0
    };

    console.log('Timeline metrics:', metrics);
    return metrics;
  };

  // Update the getGoalStatus function for upcoming goals
  const getGoalStatus = (goal: any): { status: string; color: string; iconColor: string } => {
    const now = new Date();
    const endDate = new Date(goal.end_date);
    const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const progress = goal.progress || 0;

    if (diffDays < 0) {
      return { 
        status: 'Overdue', 
        color: 'bg-red-100', 
        iconColor: 'text-red-600'
      };
    } else if (diffDays <= 1) {
      return { 
        status: 'Due Today/Tomorrow', 
        color: 'bg-yellow-100', 
        iconColor: 'text-yellow-600'
      };
    } else if (diffDays <= 3) {
      return { 
        status: progress >= 80 ? 'Almost Complete' : 'Due Soon', 
        color: progress >= 80 ? 'bg-green-50' : 'bg-yellow-50', 
        iconColor: progress >= 80 ? 'text-green-600' : 'text-yellow-600'
      };
    }
    return { 
      status: progress >= 90 ? 'On Track' : 'In Progress', 
      color: progress >= 90 ? 'bg-green-100' : 'bg-blue-100', 
      iconColor: progress >= 90 ? 'text-green-600' : 'text-blue-600'
    };
  };

  // Get upcoming goals
  const getUpcomingGoals = () => {
    const now = new Date();
    return programStats.goals
      .filter(g => new Date(g.end_date) > now)
      .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
      .slice(0, 4)
      .map(g => ({
        id: g.id,
        name: g.name,
        date: new Date(g.end_date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }),
        status: getGoalStatus(g).status
      }));
  };

  // Simulated data for dashboard components
  const upcomingGoals = getUpcomingGoals();

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

  // Add helper function to check due dates
  const getDueStatus = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 3) return 'upcoming';
    return 'normal';
  };

  // Add function to get urgent communications
  const getUrgentCommunications = () => {
    return communicationLogs
      .filter(log => {
        if (!log.due_date) return false;
        const status = getDueStatus(log.due_date);
        return status === 'overdue' || status === 'upcoming';
      })
      .sort((a, b) => {
        const statusA = getDueStatus(a.due_date!);
        const statusB = getDueStatus(b.due_date!);
        if (statusA === statusB) {
          return new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime();
        }
        return statusA === 'overdue' ? -1 : 1;
      })
      .slice(0, 5); // Show only top 5 urgent items
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white/80 backdrop-blur-sm shadow-lg z-10 fixed h-full border-r border-gray-200">
          <div className="p-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <LayoutDashboard className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
                <p className="text-sm text-gray-500">Program Overview</p>
              </div>
            </div>
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
              onClick={(e) => { e.preventDefault(); navigate('/settings'); }}
            >
              <Users className="h-5 w-5 mr-3 text-gray-500" />
              <span>Organization and User Settings</span>
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
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 ml-64 pt-10"> {/* Added pt-10 here */}
          {/* Main Content Area */}
          <div className="p-8">
            {/* Dashboard Content */}
            {activeTab === 'overview' && (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
                  <p className="text-gray-600 text-lg">Welcome back{user?.user_metadata?.name ? `, ${user.user_metadata.name}` : ''}! Here's what's happening with your programs.</p>
                </div>
                
                {/* KPI Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {kpiData.map(kpi => (
                    <div key={kpi.id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 cursor-pointer border border-gray-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-500">{kpi.name}</p>
                          <p className="text-2xl font-bold mt-1 bg-gradient-to-r from-violet-600 to-violet-800 bg-clip-text text-transparent">{kpi.value}</p>
                        </div>
                        <div className={`flex items-center ${kpi.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {kpi.trend === 'up' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                          <span className="text-sm font-medium ml-1">{kpi.change}</span>
                        </div>
                      </div>
                      <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${kpi.trend === 'up' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-rose-400 to-rose-500'}`} 
                          style={{ width: kpi.value }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Financial Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Profit (Current Year)</p>
                        <p className="text-2xl font-bold mt-1 bg-gradient-to-r from-violet-600 to-violet-800 bg-clip-text text-transparent">
                          ${yearlyMetrics.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className={`flex items-center ${yearlyMetrics.profitIncreasePercentage >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
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

                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total ROI</p>
                        <p className="text-2xl font-bold mt-1 bg-gradient-to-r from-violet-600 to-violet-800 bg-clip-text text-transparent">
                          {yearlyMetrics.totalRoi.toFixed(2)}%
                        </p>
                      </div>
                      <div className={`flex items-center ${yearlyMetrics.totalRoi >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {yearlyMetrics.totalRoi >= 0 ? (
                          <ArrowUpRight className="h-5 w-5" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Cost</p>
                        <p className="text-2xl font-bold mt-1 bg-gradient-to-r from-violet-600 to-violet-800 bg-clip-text text-transparent">
                          ${yearlyMetrics.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">YoY Profit Change</p>
                        <p className="text-2xl font-bold mt-1 bg-gradient-to-r from-violet-600 to-violet-800 bg-clip-text text-transparent">
                          ${yearlyMetrics.profitIncrease.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className={`flex items-center ${yearlyMetrics.profitIncrease >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
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
                
                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Timeline Progress */}
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Program Timeline</h2>
                        <p className="text-sm text-gray-500 mt-1">Overall progress tracking</p>
                      </div>
                      <button 
                        onClick={handleViewTimelineDetails}
                        className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center"
                      >
                        View Roadmap
                        <ChevronRight className="h-4 w-4 ml-1" />
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
                          <span className="text-3xl font-bold">
                            {programStats.timeline.percentComplete}%
                          </span>
                          <span className="text-sm text-gray-500">Avg. Complete</span>
                        </div>
                      </div>
                      <div className="mt-6 w-full grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">Avg. Days Elapsed</p>
                          <p className="text-xl font-bold">{programStats.timeline.daysElapsed}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">Avg. Days Remaining</p>
                          <p className="text-xl font-bold">{programStats.timeline.daysRemaining}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Upcoming Goals */}
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Upcoming Goals</h2>
                        <p className="text-sm text-gray-500 mt-1">Next milestones to achieve</p>
                      </div>
                      <button 
                        onClick={handleViewMilestoneDetails}
                        className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center"
                      >
                        View All
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      {programStats.goals
                        ?.filter(g => new Date(g.end_date) >= new Date())
                        .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
                        .slice(0, 4)
                        .map(goal => {
                          const statusInfo = getGoalStatus(goal);
                          const daysLeft = Math.ceil((new Date(goal.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                          return (
                            <div key={goal.id} className="bg-gray-50/50 p-4 rounded-xl hover:bg-gray-50 transition-colors duration-200">
                              <div className="flex items-start space-x-4">
                                <div className={`flex-shrink-0 w-12 h-12 ${statusInfo.color} rounded-xl flex items-center justify-center`}>
                                  <Calendar className={`h-6 w-6 ${statusInfo.iconColor}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                    <h3 className="text-sm font-semibold text-gray-900 truncate pr-2">
                                      {goal.name}
                                    </h3>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.iconColor}`}>
                                      {statusInfo.status}
                                    </span>
                                  </div>
                                  <div className="mt-1 flex items-center gap-2">
                                    <span className="text-sm text-gray-500 truncate">
                                      Due {new Date(goal.end_date).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric'
                                      })}
                                    </span>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-sm text-gray-500">
                                      {daysLeft} days left
                                    </span>
                                  </div>
                                  <div className="mt-2">
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full ${statusInfo.status === 'On Track' ? 'bg-emerald-500' : statusInfo.status === 'Due Soon' ? 'bg-amber-500' : 'bg-violet-500'}`}
                                          style={{ width: `${goal.progress || 0}%` }}
                                        />
                                      </div>
                                      <span className="text-xs font-medium text-gray-500">{goal.progress || 0}%</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                  
                  {/* Tasks Progress */}
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Goal Progress</h2>
                        <p className="text-sm text-gray-500 mt-1">Overall completion status</p>
                      </div>
                      <button 
                        onClick={handleViewTaskDetails}
                        className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center"
                      >
                        View All Goals
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                    <div className="space-y-6">
                      {(() => {
                        const goals = programStats.goals || [];
                        const stats = {
                          completed: goals.filter(g => (g.progress || 0) >= 100).length,
                          nearlyComplete: goals.filter(g => (g.progress || 0) >= 75 && (g.progress || 0) < 100).length,
                          inProgress: goals.filter(g => (g.progress || 0) > 0 && (g.progress || 0) < 75).length,
                          notStarted: goals.filter(g => !g.progress || g.progress === 0).length,
                          total: goals.length
                        };
                        
                        return (
                          <>
                            <div className="bg-gray-50/50 p-4 rounded-xl">
                              <div className="flex justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                  <span className="text-sm font-medium text-gray-900">Completed</span>
                                </div>
                                <span className="text-sm text-gray-500">{stats.completed}/{stats.total}</span>
                              </div>
                              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500" 
                                  style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="bg-gray-50/50 p-4 rounded-xl">
                              <div className="flex justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                  <span className="text-sm font-medium text-gray-900">Nearly Complete (≥75%)</span>
                                </div>
                                <span className="text-sm text-gray-500">{stats.nearlyComplete}/{stats.total}</span>
                              </div>
                              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500" 
                                  style={{ width: `${(stats.nearlyComplete / stats.total) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="bg-gray-50/50 p-4 rounded-xl">
                              <div className="flex justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                                  <span className="text-sm font-medium text-gray-900">In Progress</span>
                                </div>
                                <span className="text-sm text-gray-500">{stats.inProgress}/{stats.total}</span>
                              </div>
                              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-violet-400 to-violet-500" 
                                  style={{ width: `${(stats.inProgress / stats.total) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="bg-gray-50/50 p-4 rounded-xl">
                              <div className="flex justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                                  <span className="text-sm font-medium text-gray-900">Not Started</span>
                                </div>
                                <span className="text-sm text-gray-500">{stats.notStarted}/{stats.total}</span>
                              </div>
                              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-gray-300 to-gray-400" 
                                  style={{ width: `${(stats.notStarted / stats.total) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  
                  {/* Risk Summary */}
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                          <AlertTriangle className="h-5 w-5 text-violet-600 mr-2" />
                          Risk Summary
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Overview of program risks</p>
                      </div>
                      <button 
                        onClick={() => navigate('/scenario-planning')}
                        className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center"
                      >
                        View Details
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                    <div className="space-y-6">
                      {/* Risk Level Summary */}
                      <div className="bg-gray-50/50 p-4 rounded-xl">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Risk Levels</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-200"></div>
                              <span className="text-sm text-gray-600">High Risk</span>
                            </div>
                            <span className="text-sm font-medium">
                              {programStats.risks.high}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-yellow-200"></div>
                              <span className="text-sm text-gray-600">Medium Risk</span>
                            </div>
                            <span className="text-sm font-medium">
                              {programStats.risks.medium}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-200"></div>
                              <span className="text-sm text-gray-600">Low Risk</span>
                            </div>
                            <span className="text-sm font-medium">
                              {programStats.risks.low}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Program Risk Distribution */}
                      <div className="bg-gray-50/50 p-4 rounded-xl">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Top Programs by Risk</h3>
                        <div className="space-y-3">
                          {programStats.risks.recentRisks?.slice(0, 3).map((risk, index) => (
                            <div key={risk.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  risk.level === 'high' ? 'bg-red-200' : 
                                  risk.level === 'medium' ? 'bg-yellow-200' : 
                                  'bg-green-200'
                                }`}></div>
                                <span className="text-sm text-gray-600 truncate max-w-[180px]">
                                  {risk.program_name || 'Unnamed Program'}
                                </span>
                              </div>
                              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100">
                                {risk.count} risks
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Total Risk Score */}
                      <div className="bg-gray-50/50 p-4 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-sm font-medium text-gray-900">Overall Risk Score</h3>
                          <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                            programStats.risks.total_score >= 7 ? 'bg-red-100 text-red-700' :
                            programStats.risks.total_score >= 4 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {programStats.risks.total_score.toFixed(1)}/10
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              programStats.risks.total_score >= 7 ? 'bg-gradient-to-r from-red-400 to-red-500' :
                              programStats.risks.total_score >= 4 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                              'bg-gradient-to-r from-green-400 to-green-500'
                            }`}
                            style={{ width: `${(programStats.risks.total_score / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Communication Alerts */}
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                          <MessageSquare className="h-5 w-5 text-violet-600 mr-2" />
                          Communication Alerts
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Recent updates and notifications</p>
                      </div>
                      <button 
                        onClick={() => navigate('/communication-log')}
                        className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center"
                      >
                        View All
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {getUrgentCommunications().map((log) => {
                        const status = getDueStatus(log.due_date!);
                        return (
                          <div 
                            key={log.id} 
                            className={`p-3 rounded-lg ${
                              status === 'overdue' ? 'bg-red-50' : 'bg-amber-50'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`mt-0.5 ${
                                status === 'overdue' ? 'text-red-500' : 'text-amber-500'
                              }`}>
                                <AlertCircle className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{log.message}</p>
                                <div className="mt-1 flex items-center space-x-2">
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                    status === 'overdue' 
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {status === 'overdue' ? 'Overdue' : 'Due Soon'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    Due: {new Date(log.due_date!).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {getUrgentCommunications().length === 0 && (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500">No urgent communications</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Organization & User Statistics */}
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                          <Users className="h-5 w-5 text-violet-600 mr-2" />
                          Organization & Users
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Overview of organizations and users</p>
                      </div>
                      <button 
                        onClick={() => navigate('/settings')}
                        className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center"
                      >
                        Manage
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Organization Summary */}
                      <div className="bg-gray-50/50 p-4 rounded-xl">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Organization Summary</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                            <span className="text-sm text-gray-600">Total Organizations</span>
                            <span className="text-lg font-semibold text-violet-600">
                              {programStats.orgStats.totalOrganizations}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                            <span className="text-sm text-gray-600">Total Users</span>
                            <span className="text-lg font-semibold text-violet-600">
                              {programStats.orgStats.totalUsers}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* User Distribution */}
                      <div className="bg-gray-50/50 p-4 rounded-xl">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">User Distribution</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-violet-200"></div>
                              <span className="text-sm text-gray-600">Internal Users</span>
                            </div>
                            <span className="text-sm font-medium">
                              {programStats.orgStats.usersByType.internal}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-200"></div>
                              <span className="text-sm text-gray-600">External Users</span>
                            </div>
                            <span className="text-sm font-medium">
                              {programStats.orgStats.usersByType.external}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-emerald-200"></div>
                              <span className="text-sm text-gray-600">Admin Users</span>
                            </div>
                            <span className="text-sm font-medium">
                              {programStats.orgStats.usersByType.admin}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Regional Distribution */}
                      <div className="bg-gray-50/50 p-4 rounded-xl">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Regional Distribution</h3>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {Object.entries(programStats.orgStats.usersByRegion)
                            .sort(([, a], [, b]) => b - a)
                            .map(([region, count]) => (
                              <div key={region} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 capitalize">
                                  {region.replace('_', ' ')}
                                </span>
                                <span className="text-sm font-medium px-2 py-1 rounded-full bg-gray-100">
                                  {count} users
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Charts */}
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Financial Overview</h2>
                      <p className="text-sm text-gray-500 mt-1">Revenue, cost, and profit analysis</p>
                    </div>
                    <div className="flex gap-4">
                      <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                        <SelectTrigger className="w-[120px] bg-white border border-gray-200">
                          <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 5 }, (_, i) => currentYear - i).map(year => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select 
                        value={selectedMonth !== null ? selectedMonth.toString() : 'all'} 
                        onValueChange={(value) => setSelectedMonth(value === 'all' ? null : parseInt(value))}
                      >
                        <SelectTrigger className="w-[140px] bg-white border border-gray-200">
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

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="rounded-2xl border border-gray-100 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900">Revenue vs Cost Trend</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartsLineChart data={profitData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                            <Legend />
                            <Line type="monotone" dataKey="total_revenue" name="Revenue" stroke="#8884d8" />
                            <Line type="monotone" dataKey="total_cost" name="Cost" stroke="#82ca9d" />
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-gray-100 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900">Profit & ROI Trend</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartsLineChart data={profitData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip formatter={(value, name) => name === 'roi' ? `${Number(value).toFixed(2)}%` : `$${Number(value).toLocaleString()}`} />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="profit" name="Profit" stroke="#8884d8" />
                            <Line yAxisId="right" type="monotone" dataKey="roi" name="ROI (%)" stroke="#82ca9d" />
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
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

