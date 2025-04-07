import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Filter,
  PlusCircle,
  ChevronDown,
  Edit,
  MessageCircle,
  Download,
  XIcon,
  Trash2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase'; // Ensure supabase is imported
import {
  BarChart,
  Bar as RechartsBar,
  PieChart,
  Pie as RechartsPie,
  LineChart,
  Line as RechartsLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ResponsiveContainer,
} from 'recharts';

// Add new interfaces for report generation
interface ReportConfig {
  metrics: string[];
  dataSources: string[];
  dateRange: string;
  visualization: string;
}

interface ReportData {
  title: string;
  generatedAt: string;
  metrics: {
    name: string;
    value: number;
  }[];
  visualData: any;
  summary: string;
}

interface Message {
  id: string;
  role: 'assistant';
  content: string;
  timestamp: Date;
}

interface SavedReport {
  id: string;
  title: string;
  data: ReportData;
  created_at: string;
}

// Add new interface for communication log
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
  budget_utilization?: number;
  progress?: number;
  completed?: boolean;
  mitigated?: boolean;
}

// Add helper function to check due dates
const getDueStatus = (dueDate: string) => {
  const now = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 3) return 'upcoming';
  return 'normal';
};

const CommunicationLog = () => {
  // Group all useState hooks together at the top
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedLog, setSelectedLog] = useState<CommunicationLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [programs, setPrograms] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [sortCriteria, setSortCriteria] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedMilestone, setSelectedMilestone] = useState<string>('');
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [generatedReport, setGeneratedReport] = useState<ReportData | null>(null);
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    metrics: [],
    dataSources: [],
    dateRange: 'Last 7 Days',
    visualization: 'Bar Chart'
  });
  const [newLog, setNewLog] = useState<{
    type: string;
    message: string;
    program_id: string;
    milestone_id: string;
    risk_id: string;
    user_id: string;
    due_date: string;
    status: CommunicationLog['status'];
    meeting_name: string;
  }>({
    type: '',
    message: '',
    program_id: '',
    milestone_id: '',
    risk_id: '',
    user_id: '',
    due_date: '',
    status: 'pending',
    meeting_name: '',
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [logToDelete, setLogToDelete] = useState<CommunicationLog | null>(null);
  const [notifications, setNotifications] = useState<CommunicationLog[]>([]);

  // Group all useEffect hooks together
  useEffect(() => {
    const fetchLogs = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.error('No authenticated user found');
        return;
      }

      try {
        let { data: userProfile, error: userError } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', userData.user.id)
          .single();

        if (userError) {
          console.error('Error fetching user profile:', userError);
          return;
        }

        if (!userProfile?.organization_id) {
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .insert([{ name: 'Default Organization' }])
            .select()
            .single();

          if (orgError || !orgData) {
            console.error('Error creating default organization:', orgError);
            return;
          }

          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ organization_id: orgData.id })
            .eq('id', userData.user.id)
            .select()
            .single();

          if (updateError || !updatedUser) {
            console.error('Error updating user with organization:', updateError);
            return;
          }

          userProfile = updatedUser;
        }

        if (!userProfile || !userProfile.organization_id) {
          console.error('Failed to get or create organization for user');
          return;
        }

        const { data, error } = await supabase
          .from('communication_logs')
          .select(`
            id,
            type,
            message,
            created_at,
            program_id,
            milestone_id,
            risk_id,
            user_id,
            organization_id,
            due_date,
            status,
            meeting_name
          `)
          .eq('organization_id', userProfile.organization_id);

        if (error) {
          console.error('Error fetching communication logs:', error);
        } else {
          console.log('Successfully fetched logs:', data);
          // Ensure status is set for all logs
          const logsWithStatus = (data || []).map(log => ({
            ...log,
            status: log.status || 'pending' as const
          }));
          setLogs(logsWithStatus);
        }
      } catch (err) {
        console.error('Failed to fetch logs:', err);
      }
      setLoading(false);
    };

    fetchLogs();
  }, []);

  useEffect(() => {
    const fetchRelatedData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      try {
        const { data: programsData, error: programsError } = await supabase
          .from('programs')
          .select('id, name')
          .eq('user_id', userData.user.id);
        
        if (programsError) console.error('Error fetching programs:', programsError);
        else setPrograms(programsData || []);

        const { data: milestonesData, error: milestonesError } = await supabase
          .from('milestones')
          .select('id, title')
          .eq('user_id', userData.user.id);
        
        if (milestonesError) console.error('Error fetching milestones:', milestonesError);
        else setMilestones(milestonesData || []);
        
        const { data: risksData, error: risksError } = await supabase
          .from('risks')
          .select('id, description');
        
        if (risksError) console.error('Error fetching risks:', risksError);
        else setRisks(risksData || []);
        
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name');

        if (usersError) console.error('Error fetching users:', usersError);
        else setUsers(usersData || []);
      } catch (err) {
        console.error('Failed to fetch related data:', err);
      }
    };

    fetchRelatedData();
  }, []);

  useEffect(() => {
    const fetchSavedReports = async () => {
      try {
        const { data: reports, error } = await supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching reports:', error);
        } else {
          setSavedReports(reports || []);
        }
      } catch (err) {
        console.error('Failed to fetch reports:', err);
      }
    };

    fetchSavedReports();
  }, []);

  // Add useEffect to filter notifications
  useEffect(() => {
    const filterNotifications = () => {
      const relevantLogs = logs.filter(log => {
        if (!log.due_date) return false;
        const status = getDueStatus(log.due_date);
        return status === 'overdue' || status === 'upcoming';
      });
      
      // Sort by due date, overdue first
      relevantLogs.sort((a, b) => {
        const statusA = getDueStatus(a.due_date!);
        const statusB = getDueStatus(b.due_date!);
        if (statusA === statusB) {
          return new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime();
        }
        return statusA === 'overdue' ? -1 : 1;
      });

      setNotifications(relevantLogs);
    };

    filterNotifications();
  }, [logs]);

  // Add color mapping for types
  const typeColors: { [key: string]: { bg: string; text: string } } = {
    Program: { bg: 'bg-blue-100', text: 'text-blue-800' },
    Milestone: { bg: 'bg-green-100', text: 'text-green-800' },
    Risk: { bg: 'bg-red-100', text: 'text-red-800' },
    Meeting: { bg: 'bg-purple-100', text: 'text-purple-800' },
    General: { bg: 'bg-gray-100', text: 'text-gray-800' }
  };

  // Add status color mapping
  const statusColors: { [key: string]: { bg: string; text: string } } = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    in_progress: { bg: 'bg-blue-100', text: 'text-blue-800' },
    completed: { bg: 'bg-green-100', text: 'text-green-800' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-800' }
  };

  // Function to handle sorting
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortCriteria(e.target.value);
  };

  // Function to handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Function to handle program filter change
  const handleProgramChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProgram(e.target.value);
  };

  // Function to handle milestone filter change
  const handleMilestoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMilestone(e.target.value);
  };

  // Filter logs based on search query and selected filters
  const filteredLogs = logs.filter(log => {
    const searchText = searchQuery.toLowerCase();
    
    // Find related data objects
    const program = programs.find(p => p.id === log.program_id);
    const milestone = milestones.find(m => m.id === log.milestone_id);
    const risk = risks.find(r => r.id === log.risk_id);
    const user = users.find(u => u.id === log.user_id);
    
    const matchesSearch = (
      log.type?.toLowerCase().includes(searchText) ||
      log.message?.toLowerCase().includes(searchText) ||
      (program?.name && program.name.toLowerCase().includes(searchText)) ||
      (milestone?.title && milestone.title.toLowerCase().includes(searchText)) ||
      (risk?.description && risk.description.toLowerCase().includes(searchText)) ||
      (user?.name && user.name.toLowerCase().includes(searchText))
    );

    const matchesProgram = selectedProgram ? log.program_id === selectedProgram : true;
    const matchesMilestone = selectedMilestone ? log.milestone_id === selectedMilestone : true;

    return matchesSearch && matchesProgram && matchesMilestone;
  });

  if (loading) {
    return <div>Loading...</div>; // Loading state
  }

  // Function to open the edit modal
  const handleEditClick = (log: CommunicationLog) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  // Function to open the add modal
  const openAddModal = () => {
    setIsAddModalOpen(true);
    setNewLog({
      type: '',
      message: '',
      program_id: '',
      milestone_id: '',
      risk_id: '',
      user_id: '',
      due_date: '',
      status: 'pending',
      meeting_name: '',
    });
  };

  // Function to close the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLog(null);
  };

  // Function to close the add modal
  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  // Function to handle log update
  const handleUpdateLog = async () => {
    if (!selectedLog) {
      console.error('No log selected for update');
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('No authenticated user found');
      return;
    }

    try {
      // Get user's organization_id
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', userData.user.id)
        .single();

      if (userError) {
        console.error('Error fetching user profile:', userError);
        return;
      }

      if (!userProfile?.organization_id) {
        console.error('No organization_id found for user');
        return;
      }

      const updateData: Partial<CommunicationLog> = {
        type: selectedLog.type || '',
        message: selectedLog.message || '',
        program_id: selectedLog.program_id || undefined,
        milestone_id: selectedLog.milestone_id || undefined,
        risk_id: selectedLog.risk_id || undefined,
        user_id: userData.user.id,
        organization_id: userProfile.organization_id,
        due_date: selectedLog.due_date,
        status: selectedLog.status,
        meeting_name: selectedLog.meeting_name
      };

      const { data, error } = await supabase
        .from('communication_logs')
        .update(updateData)
        .eq('id', selectedLog.id)
        .select();

      if (error) {
        console.error('Error updating log:', error);
      } else {
        // Refresh logs after update
        const { data: updatedLogs, error: fetchError } = await supabase
          .from('communication_logs')
          .select(`
            id,
            type,
            message,
            created_at,
            program_id,
            milestone_id,
            risk_id,
            user_id,
            organization_id,
            due_date,
            status,
            meeting_name
          `)
          .eq('organization_id', userProfile.organization_id);
        
        if (fetchError) {
          console.error('Error fetching updated logs:', fetchError);
        } else {
          const logsWithStatus = (updatedLogs || []).map(log => ({
            ...log,
            status: (log.status || 'pending') as CommunicationLog['status']
          }));
          setLogs(logsWithStatus);
          closeModal();
        }
      }
    } catch (err) {
      console.error('Failed to update log:', err);
    }
  };

  // Function to handle log deletion
  const handleDeleteLog = async () => {
    if (!logToDelete) return;

    try {
      const { error } = await supabase
        .from('communication_logs')
        .delete()
        .eq('id', logToDelete.id);

      if (error) {
        console.error('Error deleting log:', error);
      } else {
        // Refresh logs after deletion
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;
        
        const { data: userProfile } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', userData.user.id)
          .single();

        if (!userProfile?.organization_id) return;

        const { data } = await supabase
          .from('communication_logs')
          .select(`
            id,
            type,
            message,
            created_at,
            program_id,
            milestone_id,
            risk_id,
            user_id,
            organization_id,
            due_date,
            status,
            meeting_name
          `)
          .eq('organization_id', userProfile.organization_id);
        
        if (data) {
          const logsWithStatus = data.map(log => ({
            ...log,
            status: (log.status || 'pending') as CommunicationLog['status']
          }));
          setLogs(logsWithStatus);
        }
      }
    } catch (err) {
      console.error('Failed to delete log:', err);
    } finally {
      setDeleteConfirmOpen(false);
      setLogToDelete(null);
    }
  };

  // Function to handle adding a new log
  const handleAddLog = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('No authenticated user found');
      return;
    }

    try {
      // Get user's organization_id
      let { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', userData.user.id)
        .single();

      if (userError) {
        console.error('Error fetching user profile:', userError);
        return;
      }

      // If no organization_id found, create a default organization and update user
      if (!userProfile?.organization_id) {
        console.log('No organization found for user, creating default...');
        
        // Create default organization
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert([{ name: 'Default Organization' }])
          .select()
          .single();

        if (orgError || !orgData) {
          console.error('Error creating default organization:', orgError);
          return;
        }

        // Update user with new organization_id
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ organization_id: orgData.id })
          .eq('id', userData.user.id)
          .select()
          .single();

        if (updateError || !updatedUser) {
          console.error('Error updating user with organization:', updateError);
          return;
        }

        userProfile = updatedUser;
      }

      if (!userProfile || !userProfile.organization_id) {
        console.error('Failed to get or create organization for user');
        return;
      }

      // Ensure we don't send empty strings for UUID fields
      const logData: Omit<CommunicationLog, 'id' | 'created_at'> = {
        type: newLog.type || '',
        message: newLog.message || '',
        program_id: newLog.program_id || undefined,
        milestone_id: newLog.milestone_id || undefined,
        risk_id: newLog.risk_id || undefined,
        user_id: userData.user.id,
        organization_id: userProfile.organization_id,
        due_date: newLog.due_date || undefined,
        status: newLog.status,
        meeting_name: newLog.meeting_name || undefined
      };

      const { data, error } = await supabase
        .from('communication_logs')
        .insert([logData])
        .select();

      if (error) {
        console.error('Error adding log:', error);
      } else {
        // Refresh logs after adding
        const { data: updatedLogs, error: fetchError } = await supabase
          .from('communication_logs')
          .select(`
            id,
            type,
            message,
            created_at,
            program_id,
            milestone_id,
            risk_id,
            user_id,
            organization_id,
            due_date,
            status,
            meeting_name
          `)
          .eq('organization_id', userProfile.organization_id);
        
        if (fetchError) {
          console.error('Error fetching updated logs:', fetchError);
        } else {
          const logsWithStatus = (updatedLogs || []).map(log => ({
            ...log,
            status: (log.status || 'pending') as CommunicationLog['status']
          }));
          setLogs(logsWithStatus);
          closeAddModal();
        }
      }
    } catch (err) {
      console.error('Failed to add log:', err);
    }
  };

  // Function to process metrics data
  const processMetricsData = (selectedMetrics: string[]) => {
    const metricsData = [];
    
    if (selectedMetrics.includes('Budget Utilization')) {
      const budgetData = logs
        .filter(log => log.type === 'Program')
        .reduce((acc, log) => acc + (log.budget_utilization || 0), 0);
      metricsData.push({ name: 'Budget Utilization', value: budgetData });
    }

    if (selectedMetrics.includes('Timeline Progress')) {
      const timelineData = logs
        .filter(log => log.type === 'Milestone')
        .reduce((acc, log) => acc + (log.progress || 0), 0) / logs.length;
      metricsData.push({ name: 'Timeline Progress', value: timelineData });
    }

    if (selectedMetrics.includes('Task Completion')) {
      const taskData = logs
        .filter(log => log.type === 'Task')
        .reduce((acc, log) => acc + (log.completed ? 1 : 0), 0);
      metricsData.push({ name: 'Task Completion', value: taskData });
    }

    if (selectedMetrics.includes('Risk Mitigation')) {
      const riskData = logs
        .filter(log => log.type === 'Risk')
        .reduce((acc, log) => acc + (log.mitigated ? 1 : 0), 0);
      metricsData.push({ name: 'Risk Mitigation', value: riskData });
    }

    return metricsData;
  };

  // Function to generate visualization data
  const generateVisualizationData = (type: string, metrics: any[]) => {
    switch (type) {
      case 'Bar Chart':
        return metrics.map(m => ({
          name: m.name,
          value: m.value
        }));
      case 'Pie Chart':
        return metrics.map(m => ({
          name: m.name,
          value: m.value
        }));
      case 'Line Chart':
        // Group logs by date for timeline view
        const timelineData = logs.reduce((acc: any, log) => {
          const date = new Date(log.created_at).toLocaleDateString();
          if (!acc[date]) acc[date] = 0;
          acc[date]++;
          return acc;
        }, {});

        return Object.entries(timelineData).map(([date, count]) => ({
          name: date,
          value: count
        }));
      default:
        return [];
    }
  };

  // Function to generate report summary
  const generateSummary = (metrics: any[]) => {
    let summary = 'Report Summary:\n\n';
    
    metrics.forEach(metric => {
      summary += `${metric.name}: ${metric.value}\n`;
    });

    // Add insights based on the data
    const highestMetric = metrics.reduce((a, b) => a.value > b.value ? a : b);
    const lowestMetric = metrics.reduce((a, b) => a.value < b.value ? a : b);

    summary += `\nKey Insights:\n`;
    summary += `- Highest performing area: ${highestMetric.name}\n`;
    summary += `- Area needing attention: ${lowestMetric.name}\n`;

    return summary;
  };

  // Function to handle report generation
  const handleGenerateReport = async () => {
    try {
      // Get current user and organization
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('No authenticated user found');
      }

      // Get user's organization_id
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', userData.user.id)
        .single();

      if (userError || !userProfile?.organization_id) {
        throw new Error('Failed to get user organization');
      }

      // Process selected metrics
      const metricsData = processMetricsData(reportConfig.metrics);

      // Generate visualization data
      const visualData = generateVisualizationData(reportConfig.visualization, metricsData);

      // Generate report summary
      const summary = generateSummary(metricsData);

      // Create report data
      const report: ReportData = {
        title: `Communication Log Report - ${new Date().toLocaleDateString()}`,
        generatedAt: new Date().toISOString(),
        metrics: metricsData,
        visualData,
        summary
      };

      // Save report to Supabase
      const { data: savedReport, error } = await supabase
        .from('reports')
        .insert([{
          title: report.title,
          data: report,
          created_at: new Date().toISOString(),
          user_id: userData.user.id,
          organization_id: userProfile.organization_id
        }])
        .select()
        .single();

      if (error) throw error;

      setGeneratedReport(report);

      // Show success message
      const successMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Report generated successfully!',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMessage]);

    } catch (error) {
      console.error('Error generating report:', error);
      // Show error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Failed to generate report. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Update the metrics selection handler
  const handleMetricChange = (metric: string) => {
    setReportConfig(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metric)
        ? prev.metrics.filter(m => m !== metric)
        : [...prev.metrics, metric]
    }));
  };

  // Update the data source selection handler
  const handleDataSourceChange = (source: string) => {
    setReportConfig(prev => ({
      ...prev,
      dataSources: prev.dataSources.includes(source)
        ? prev.dataSources.filter(s => s !== source)
        : [...prev.dataSources, source]
    }));
  };

  // Update the visualization type handler
  const handleVisualizationChange = (type: string) => {
    setReportConfig(prev => ({
      ...prev,
      visualization: type
    }));
  };

  // Add function to load a saved report
  const handleLoadReport = (report: SavedReport) => {
    setGeneratedReport(report.data);
    setReportConfig({
      metrics: report.data.metrics.map(m => m.name),
      dataSources: [], // Set based on your data structure
      dateRange: 'Last 7 Days', // Set based on your data structure
      visualization: report.data.visualData.type || 'Bar Chart'
    });
  };

  // Add function to delete a saved report
  const handleDeleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) {
        console.error('Error deleting report:', error);
      } else {
        setSavedReports(prev => prev.filter(r => r.id !== reportId));
      }
    } catch (err) {
      console.error('Failed to delete report:', err);
    }
  };

  // Add handleDeleteClick function
  const handleDeleteClick = (log: CommunicationLog) => {
    setLogToDelete(log);
    setDeleteConfirmOpen(true);
  };

  // Add notification bar component
  const NotificationBar = () => {
    if (notifications.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 border-l-4 border-amber-500 rounded-lg shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-amber-800 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Attention Required
              </h3>
              <span className="text-xs text-amber-700 bg-amber-200 px-2 py-1 rounded-full">
                {notifications.length} {notifications.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <div className="space-y-3">
              {notifications.map((log) => {
                const status = getDueStatus(log.due_date!);
                return (
                  <div 
                    key={log.id} 
                    className={`flex items-center justify-between p-3 rounded-md ${
                      status === 'overdue' ? 'bg-red-50' : 'bg-amber-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`mt-0.5 ${
                        status === 'overdue' ? 'text-red-500' : 'text-amber-500'
                      }`}>
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{log.message}</p>
                        <div className="mt-1 flex items-center space-x-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            status === 'overdue' 
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {status === 'overdue' 
                              ? 'Overdue'
                              : 'Due Soon'}
                          </span>
                          <span className="text-xs text-gray-500">
                            Due: {new Date(log.due_date!).toLocaleDateString()}
                          </span>
                          {log.type && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[log.type]?.bg} ${typeColors[log.type]?.text}`}>
                              {log.type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEditClick(log)}
                      className="text-gray-400 hover:text-violet-600 p-1 rounded-full hover:bg-violet-50"
                      title="Edit log"
                      aria-label="Edit log"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      {/* Add NotificationBar before the header */}
      <NotificationBar />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <MessageSquare className="mr-2 h-6 w-6 text-violet-600" />
          Communication Log
        </h1>
        <button 
          className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-violet-700 transition-colors"
          onClick={openAddModal}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Note
        </button>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input 
                type="text" 
                value={searchQuery} 
                onChange={handleSearchChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Search logs..."
              />
            </div>
            <div className="flex items-center space-x-4">
              <select 
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                onChange={handleProgramChange}
                value={selectedProgram}
                title="Filter by Program"
              >
                <option value="">All Programs</option>
                {programs.map(program => (
                  <option key={program.id} value={program.id}>{program.name}</option>
                ))}
              </select>
              <select 
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                onChange={handleMilestoneChange}
                value={selectedMilestone}
                title="Filter by Milestone"
              >
                <option value="">All Milestones</option>
                {milestones.map(milestone => (
                  <option key={milestone.id} value={milestone.id}>{milestone.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[log.type]?.bg} ${typeColors[log.type]?.text}`}>
                      {log.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{log.message}</div>
                    {log.meeting_name && (
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {log.meeting_name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {programs.find(p => p.id === log.program_id) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {programs.find(p => p.id === log.program_id)?.name}
                        </span>
                      )}
                      {milestones.find(m => m.id === log.milestone_id) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {milestones.find(m => m.id === log.milestone_id)?.title}
                        </span>
                      )}
                      {risks.find(r => r.id === log.risk_id) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {risks.find(r => r.id === log.risk_id)?.description}
                        </span>
                      )}
                      <div className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[log.status]?.bg} ${statusColors[log.status]?.text}`}>
                      {log.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.due_date && new Date(log.due_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEditClick(log)}
                        className="text-violet-600 hover:text-violet-900 p-1 rounded-full hover:bg-violet-50"
                        title="Edit log"
                        aria-label="Edit log"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(log)}
                        className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                        title="Delete log"
                        aria-label="Delete log"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update the Edit Modal */}
      {isModalOpen && selectedLog && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Edit Communication Log</h2>
              <button 
                onClick={closeModal} 
                className="text-gray-400 hover:text-gray-500"
                title="Close modal"
                aria-label="Close edit modal"
              >
                <span className="sr-only">Close</span>
                <XIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <input 
                    type="text" 
                    value={selectedLog.type} 
                    onChange={(e) => setSelectedLog({ ...selectedLog, type: e.target.value })} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                    placeholder="Enter type"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea 
                    value={selectedLog.message} 
                    onChange={(e) => setSelectedLog({ ...selectedLog, message: e.target.value })} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                    rows={3}
                    placeholder="Enter message"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Meeting Name (Optional)</label>
                  <input 
                    type="text" 
                    value={selectedLog.meeting_name || ''} 
                    onChange={(e) => setSelectedLog({ ...selectedLog, meeting_name: e.target.value })} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                    placeholder="Enter meeting name"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Program</label>
                  <select 
                    value={selectedLog.program_id || ''} 
                    onChange={(e) => setSelectedLog({ ...selectedLog, program_id: e.target.value })} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                    title="Select Program"
                  >
                    <option value="">Select Program</option>
                    {programs.map(program => (
                      <option key={program.id} value={program.id}>{program.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Milestone</label>
                  <select 
                    value={selectedLog.milestone_id || ''} 
                    onChange={(e) => setSelectedLog({ ...selectedLog, milestone_id: e.target.value })} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                    title="Select Milestone"
                  >
                    <option value="">Select Milestone</option>
                    {milestones.map(milestone => (
                      <option key={milestone.id} value={milestone.id}>{milestone.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Risk</label>
                  <select 
                    value={selectedLog.risk_id || ''} 
                    onChange={(e) => setSelectedLog({ ...selectedLog, risk_id: e.target.value })} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                    title="Select Risk"
                  >
                    <option value="">Select Risk</option>
                    {risks.map(risk => (
                      <option key={risk.id} value={risk.id}>{risk.description}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select 
                    value={selectedLog.status} 
                    onChange={(e) => setSelectedLog({ 
                      ...selectedLog, 
                      status: e.target.value as CommunicationLog['status']
                    })} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                    title="Select Status"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date and Time</label>
                  <input 
                    type="datetime-local" 
                    value={selectedLog.due_date ? new Date(selectedLog.due_date).toISOString().slice(0, 16) : ''} 
                    onChange={(e) => setSelectedLog({ ...selectedLog, due_date: e.target.value })} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                    title="Due date and time"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500">
                Cancel
              </button>
              <button onClick={handleUpdateLog} className="px-4 py-2 text-sm font-medium text-white bg-violet-600 border border-transparent rounded-md hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500">
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update the Add Modal with the same two-column layout */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Add New Communication Log</h2>
              <button 
                onClick={closeAddModal} 
                className="text-gray-400 hover:text-gray-500"
                title="Close modal"
                aria-label="Close add modal"
              >
                <span className="sr-only">Close</span>
                <XIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <input 
                    type="text" 
                    value={newLog.type} 
                    onChange={(e) => setNewLog({ ...newLog, type: e.target.value })} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                    placeholder="Enter type"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea 
                    value={newLog.message} 
                    onChange={(e) => setNewLog({ ...newLog, message: e.target.value })} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                    rows={3}
                    placeholder="Enter message"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Meeting Name (Optional)</label>
                  <input 
                    type="text" 
                    value={newLog.meeting_name} 
                    onChange={(e) => setNewLog({ ...newLog, meeting_name: e.target.value })} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                    placeholder="Enter meeting name"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Program</label>
                  <select 
                    value={newLog.program_id} 
                    onChange={(e) => setNewLog({ ...newLog, program_id: e.target.value })} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                    title="Select Program"
                  >
                    <option value="">Select Program</option>
                    {programs.map(program => (
                      <option key={program.id} value={program.id}>{program.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Milestone</label>
                  <select 
                    value={newLog.milestone_id} 
                    onChange={(e) => setNewLog({ ...newLog, milestone_id: e.target.value })} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                    title="Select Milestone"
                  >
                    <option value="">Select Milestone</option>
                    {milestones.map(milestone => (
                      <option key={milestone.id} value={milestone.id}>{milestone.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Risk</label>
                  <select 
                    value={newLog.risk_id} 
                    onChange={(e) => setNewLog({ ...newLog, risk_id: e.target.value })} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                    title="Select Risk"
                  >
                    <option value="">Select Risk</option>
                    {risks.map(risk => (
                      <option key={risk.id} value={risk.id}>{risk.description}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select 
                    value={newLog.status} 
                    onChange={(e) => setNewLog({ 
                      ...newLog, 
                      status: e.target.value as CommunicationLog['status']
                    })} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                    title="Select Status"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date and Time</label>
                  <input 
                    type="datetime-local" 
                    value={newLog.due_date} 
                    onChange={(e) => setNewLog({ ...newLog, due_date: e.target.value })} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                    title="Due date and time"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={closeAddModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500">
                Cancel
              </button>
              <button onClick={handleAddLog} className="px-4 py-2 text-sm font-medium text-white bg-violet-600 border border-transparent rounded-md hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500">
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmOpen && logToDelete && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Delete Communication Log</h2>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to delete this log? This action cannot be undone.
              </p>
            </div>
            <div className="mt-5 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setLogToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLog}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationLog;
