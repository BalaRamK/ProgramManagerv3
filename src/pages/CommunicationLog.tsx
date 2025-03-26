import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Filter,
  PlusCircle,
  ChevronDown,
  Edit,
  MessageCircle,
  Download,
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

const CommunicationLog = () => {
  const [logs, setLogs] = useState<any[]>([]); // State to hold communication logs
  const [loading, setLoading] = useState<boolean>(true); // Loading state
  const [messages, setMessages] = useState<Message[]>([]); // State for messages
  const [selectedLog, setSelectedLog] = useState<any | null>(null); // State for the selected log
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // State for modal visibility
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false); // State for add modal visibility
  const [programs, setPrograms] = useState<any[]>([]); // State for programs
  const [milestones, setMilestones] = useState<any[]>([]); // State for milestones
  const [risks, setRisks] = useState<any[]>([]); // State for risks
  const [users, setUsers] = useState<any[]>([]); // State for users
  const [sortCriteria, setSortCriteria] = useState<string>(''); // State for sorting criteria
  const [searchQuery, setSearchQuery] = useState<string>(''); // State for search query
  const [selectedProgram, setSelectedProgram] = useState<string>(''); // State for selected program
  const [selectedMilestone, setSelectedMilestone] = useState<string>(''); // State for selected milestone

  // State for new log
  const [newLog, setNewLog] = useState({
    type: '',
    message: '',
    program_id: '',
    milestone_id: '',
    risk_id: '',
    user_id: '',
  });

  // State for report generation
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    metrics: [],
    dataSources: [],
    dateRange: 'Last 7 Days',
    visualization: 'Bar Chart'
  });
  const [generatedReport, setGeneratedReport] = useState<ReportData | null>(null);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);

  // Color mapping for types
  const typeColors: { [key: string]: string } = {
    Program: 'bg-blue-100 text-blue-800',
    Milestone: 'bg-green-100 text-green-800',
    Risk: 'bg-red-100 text-red-800',
    User: 'bg-yellow-100 text-yellow-800',
  };

  // Fetch communication logs from Supabase
  useEffect(() => {
    const fetchLogs = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.error('No authenticated user found');
        return;
      }

      try {
        // Get user's organization_id first
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

        console.log('User profile for fetch:', userProfile);

        // Fetch logs for the user's organization
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
            organization_id
          `)
          .eq('organization_id', userProfile.organization_id);

        if (error) {
          console.error('Error fetching communication logs:', error);
        } else {
          console.log('Successfully fetched logs:', data);
          setLogs(data || []); // Ensure data is not null
        }
      } catch (err) {
        console.error('Failed to fetch logs:', err);
      }
      setLoading(false);
    };

    fetchLogs();
  }, []); // Fetch logs on component mount

  // Fetch related data for programs, milestones, risks, and users
  useEffect(() => {
    const fetchRelatedData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      try {
        // Fetch programs
        const { data: programsData, error: programsError } = await supabase
          .from('programs')
          .select('id, name')
          .eq('user_id', userData.user.id);
        
        if (programsError) console.error('Error fetching programs:', programsError);
        else setPrograms(programsData || []);

        // Fetch milestones
        const { data: milestonesData, error: milestonesError } = await supabase
          .from('milestones')
          .select('id, title')
          .eq('user_id', userData.user.id);
        
        if (milestonesError) console.error('Error fetching milestones:', milestonesError);
        else setMilestones(milestonesData || []);
        
        // Fetch risks - without user_id filter
        const { data: risksData, error: risksError } = await supabase
          .from('risks')
          .select('id, description');
        
        if (risksError) console.error('Error fetching risks:', risksError);
        else setRisks(risksData || []);
        
        // Fetch users - without user_id filter
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
  const handleEditClick = (log: any) => {
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

      console.log('User profile for update:', userProfile);

      // Ensure we don't send empty strings for UUID fields
      const updateData = {
        type: selectedLog.type || '',
        message: selectedLog.message || '',
        program_id: selectedLog.program_id || null,
        milestone_id: selectedLog.milestone_id || null,
        risk_id: selectedLog.risk_id || null,
        user_id: userData.user.id,
        organization_id: userProfile.organization_id
      };

      console.log('Attempting to update log with data:', updateData);
      
      const { data, error } = await supabase
        .from('communication_logs')
        .update(updateData)
        .eq('id', selectedLog.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating log:', error);
        if (error.code === '42501') {
          console.error('RLS Policy violation. User:', userData.user.id, 'Organization:', userProfile.organization_id);
        }
      } else {
        console.log('Successfully updated log:', data);
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
            organization_id
          `)
          .eq('organization_id', userProfile.organization_id);
        
        if (fetchError) {
          console.error('Error fetching updated logs:', fetchError);
        } else {
          setLogs(updatedLogs || []); // Ensure data is not null
          closeModal();
        }
      }
    } catch (err) {
      console.error('Failed to update log:', err);
    }
  };

  // Function to handle log deletion
  const handleDeleteLog = async () => {
    if (selectedLog) {
      const { error } = await supabase.from('communication_logs').delete().eq('id', selectedLog.id);
      if (error) {
        console.error('Error deleting log:', error);
      } else {
        // Refresh logs after deletion
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;
        
        const { data } = await supabase.from('communication_logs').select(`
          id,
          type,
          message,
          created_at,
          program_id,
          milestone_id,
          risk_id,
          user_id
        `)
        .eq('user_id', userData.user.id);
        
        setLogs(data || []); // Ensure data is not null
        closeModal();
      }
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

      console.log('User profile:', userProfile);

      // Ensure we don't send empty strings for UUID fields
      const logData = {
        type: newLog.type || '',
        message: newLog.message || '',
        program_id: newLog.program_id || null,
        milestone_id: newLog.milestone_id || null,
        risk_id: newLog.risk_id || null,
        user_id: userData.user.id,
        organization_id: userProfile.organization_id
      };

      console.log('Attempting to insert log with data:', logData);
      
      const { data, error } = await supabase
        .from('communication_logs')
        .insert([logData])
        .select()
        .single();

      if (error) {
        console.error('Error adding log:', error);
        if (error.code === '42501') {
          console.error('RLS Policy violation. User:', userData.user.id, 'Organization:', userProfile.organization_id);
        }
      } else {
        console.log('Successfully added log:', data);
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
            organization_id
          `)
          .eq('organization_id', userProfile.organization_id);
        
        if (fetchError) {
          console.error('Error fetching updated logs:', fetchError);
        } else {
          setLogs(updatedLogs || []); // Ensure data is not null
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

  // Add function to fetch saved reports
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

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <MessageSquare className="mr-2" /> Communication Log
      </h1>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <span className="mr-2">Search:</span>
          <input 
            type="text" 
            value={searchQuery} 
            onChange={handleSearchChange} 
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="Search logs..."
          />
        </div>
        <div className="flex items-center">
          <span className="mr-2">Filter by Program:</span>
          <select 
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            onChange={handleProgramChange}
            title="Filter by Program"
          >
            <option value="">All Programs</option>
            {programs.map(program => (
              <option key={program.id} value={program.id}>{program.name}</option>
            ))}
            </select>
          </div>
        <div className="flex items-center">
          <span className="mr-2">Filter by Milestone:</span>
          <select 
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            onChange={handleMilestoneChange}
            title="Filter by Milestone"
          >
            <option value="">All Milestones</option>
            {milestones.map(milestone => (
              <option key={milestone.id} value={milestone.id}>{milestone.title}</option>
            ))}
          </select>
        </div>
        <button className="bg-violet-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center" onClick={openAddModal}>
          <PlusCircle className="mr-2" /> Add Note
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <div key={log.id} className={`border-b border-gray-200 last:border-none ${typeColors[log.type]} hover:bg-gray-200`}>
              <div className="p-4 cursor-pointer">
              <div className="flex justify-between items-start">
                <div>
                    <div className="text-sm font-medium text-gray-900">{log.type} - {log.message}</div>
                  <div className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleDateString()} | 
                      {programs.find(p => p.id === log.program_id)?.name && ` Program: ${programs.find(p => p.id === log.program_id)?.name}`} 
                      {milestones.find(m => m.id === log.milestone_id)?.title && ` | Milestone: ${milestones.find(m => m.id === log.milestone_id)?.title}`} 
                      {risks.find(r => r.id === log.risk_id)?.description && ` | Risk: ${risks.find(r => r.id === log.risk_id)?.description}`} 
                      {users.find(u => u.id === log.user_id)?.name && ` | User: ${users.find(u => u.id === log.user_id)?.name}`}
                    </div>
                  </div>
                  <button className="text-gray-500 hover:text-violet-600" aria-label="Edit log" onClick={() => handleEditClick(log)}>
                  <Edit className="h-4 w-4" />
                </button>
                </div>
                {log.comments && log.comments.length > 0 && (
                <div className="mt-3">
                    {log.comments.map((comment: { id: number; user: string; text: string }) => (
                    <div key={comment.id} className="flex items-start mt-2">
                      <MessageCircle className="h-4 w-4 mr-2 text-gray-600" />
                      <div>
                        <div className="text-xs font-medium text-gray-700">{comment.user}</div>
                        <div className="text-xs text-gray-500">{comment.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          ))
        ) : (
          <div className="p-4 text-gray-500">No logs found.</div>
        )}
      </div>

      {/* Modal for Editing Log */}
      {isModalOpen && selectedLog && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-lg font-semibold">Edit Communication Log</h2>
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Type</h3>
                <input 
                  type="text" 
                  value={selectedLog.type} 
                  onChange={(e) => setSelectedLog({ ...selectedLog, type: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  placeholder="Enter type"
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Message</h3>
                <textarea 
                  value={selectedLog.message} 
                  onChange={(e) => setSelectedLog({ ...selectedLog, message: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  placeholder="Enter message"
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Program</h3>
                <select 
                  value={selectedLog.program_id} 
                  onChange={(e) => setSelectedLog({ ...selectedLog, program_id: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  title="Select Program"
                >
                  <option value="">Select Program</option>
                  {programs.map(program => (
                    <option key={program.id} value={program.id}>{program.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Milestone</h3>
                <select 
                  value={selectedLog.milestone_id} 
                  onChange={(e) => setSelectedLog({ ...selectedLog, milestone_id: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  title="Select Milestone"
                >
                  <option value="">Select Milestone</option>
                  {milestones.map(milestone => (
                    <option key={milestone.id} value={milestone.id}>{milestone.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Risk</h3>
                <select 
                  value={selectedLog.risk_id} 
                  onChange={(e) => setSelectedLog({ ...selectedLog, risk_id: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  title="Select Risk"
                >
                  <option value="">Select Risk</option>
                  {risks.map(risk => (
                    <option key={risk.id} value={risk.id}>{risk.description}</option>
                  ))}
                </select>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">User</h3>
                <select 
                  value={selectedLog.user_id} 
                  onChange={(e) => setSelectedLog({ ...selectedLog, user_id: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  title="Select User"
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={handleUpdateLog} className="bg-blue-500 text-white rounded px-4 py-2">Update</button>
              <button onClick={handleDeleteLog} className="bg-red-500 text-white rounded px-4 py-2 ml-2">Delete</button>
              <button onClick={closeModal} className="bg-gray-300 rounded px-4 py-2 ml-2">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Adding New Log */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-lg font-semibold">Add New Communication Log</h2>
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Type</h3>
                <input 
                  type="text" 
                  value={newLog.type} 
                  onChange={(e) => setNewLog({ ...newLog, type: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  placeholder="Enter type"
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Message</h3>
                <textarea 
                  value={newLog.message} 
                  onChange={(e) => setNewLog({ ...newLog, message: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  placeholder="Enter message"
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Program</h3>
                <select 
                  value={newLog.program_id} 
                  onChange={(e) => setNewLog({ ...newLog, program_id: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  title="Select Program"
                >
                  <option value="">Select Program</option>
                  {programs.map(program => (
                    <option key={program.id} value={program.id}>{program.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Milestone</h3>
                <select 
                  value={newLog.milestone_id} 
                  onChange={(e) => setNewLog({ ...newLog, milestone_id: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  title="Select Milestone"
                >
                  <option value="">Select Milestone</option>
                  {milestones.map(milestone => (
                    <option key={milestone.id} value={milestone.id}>{milestone.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Risk</h3>
                <select 
                  value={newLog.risk_id} 
                  onChange={(e) => setNewLog({ ...newLog, risk_id: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  title="Select Risk"
                >
                  <option value="">Select Risk</option>
                  {risks.map(risk => (
                    <option key={risk.id} value={risk.id}>{risk.description}</option>
                  ))}
                </select>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">User</h3>
                <select 
                  value={newLog.user_id} 
                  onChange={(e) => setNewLog({ ...newLog, user_id: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  title="Select User"
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={handleAddLog} className="bg-blue-500 text-white rounded px-4 py-2">Add</button>
              <button onClick={closeAddModal} className="bg-gray-300 rounded px-4 py-2 ml-2">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Report Configuration Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Report Configuration</h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Metrics</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportConfig.metrics.includes('Budget Utilization')}
                  onChange={() => handleMetricChange('Budget Utilization')}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="ml-2">Budget Utilization</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportConfig.metrics.includes('Timeline Progress')}
                  onChange={() => handleMetricChange('Timeline Progress')}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="ml-2">Timeline Progress</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportConfig.metrics.includes('Task Completion')}
                  onChange={() => handleMetricChange('Task Completion')}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="ml-2">Task Completion</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportConfig.metrics.includes('Risk Mitigation')}
                  onChange={() => handleMetricChange('Risk Mitigation')}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="ml-2">Risk Mitigation</span>
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Data Sources</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportConfig.dataSources.includes('KPIs')}
                  onChange={() => handleDataSourceChange('KPIs')}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="ml-2">KPIs</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportConfig.dataSources.includes('Financial')}
                  onChange={() => handleDataSourceChange('Financial')}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="ml-2">Financial</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportConfig.dataSources.includes('Risks')}
                  onChange={() => handleDataSourceChange('Risks')}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="ml-2">Risks</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportConfig.dataSources.includes('Communications')}
                  onChange={() => handleDataSourceChange('Communications')}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="ml-2">Communications</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Visualization</h3>
          <div className="grid grid-cols-3 gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="visualization"
                value="Bar Chart"
                checked={reportConfig.visualization === 'Bar Chart'}
                onChange={(e) => handleVisualizationChange(e.target.value)}
                className="rounded-full border-gray-300 text-violet-600 focus:ring-violet-500"
              />
              <span className="ml-2">Bar Chart</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="visualization"
                value="Pie Chart"
                checked={reportConfig.visualization === 'Pie Chart'}
                onChange={(e) => handleVisualizationChange(e.target.value)}
                className="rounded-full border-gray-300 text-violet-600 focus:ring-violet-500"
              />
              <span className="ml-2">Pie Chart</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="visualization"
                value="Line Chart"
                checked={reportConfig.visualization === 'Line Chart'}
                onChange={(e) => handleVisualizationChange(e.target.value)}
                className="rounded-full border-gray-300 text-violet-600 focus:ring-violet-500"
              />
              <span className="ml-2">Line Chart</span>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleGenerateReport}
            disabled={reportConfig.metrics.length === 0 || reportConfig.dataSources.length === 0}
            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Generated Report Section */}
      {generatedReport && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">{generatedReport.title}</h2>
            <button
              onClick={() => {
                const element = document.createElement('a');
                const file = new Blob([generatedReport.summary], { type: 'text/plain' });
                element.href = URL.createObjectURL(file);
                element.download = `${generatedReport.title}.txt`;
                document.body.appendChild(element);
                element.click();
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Metrics Summary</h3>
              <div className="space-y-2">
                {generatedReport.metrics.map((metric, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{metric.name}:</span>
                    <span className="font-medium">{metric.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Visualization</h3>
              <div className="h-64 bg-gray-50 rounded-lg p-4">
                <ResponsiveContainer width="100%" height="100%">
                  {reportConfig.visualization === 'Bar Chart' ? (
                    <BarChart data={generatedReport.visualData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <RechartsBar dataKey="value" fill="#818CF8" />
                    </BarChart>
                  ) : reportConfig.visualization === 'Pie Chart' ? (
                    <PieChart>
                      <RechartsPie
                        data={generatedReport.visualData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#818CF8"
                        label
                      />
                      <RechartsTooltip />
                      <RechartsLegend />
                    </PieChart>
                  ) : (
                    <LineChart data={generatedReport.visualData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <RechartsLine type="monotone" dataKey="value" stroke="#818CF8" />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Report Summary</h3>
            <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-sm">
              {generatedReport.summary}
            </pre>
          </div>
        </div>
      )}

      {/* Saved Reports Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Saved Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedReports.map(report => (
            <div key={report.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-md font-medium">{report.title}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleLoadReport(report)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Load report"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete report"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Created: {new Date(report.created_at).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">
                Metrics: {report.data.metrics.length}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunicationLog;
