import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Share2,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Sliders,
  Filter,
  Mail,
  Upload,
  Folder,
  Move,
  ExternalLink,
  Info,
  FileText,
  HelpCircle,
  TrendingUp,
  File,
  Grid,
  Loader,
  X,
  Plus,
} from 'lucide-react';
import { 
  ReportConfig, 
  Widget, 
  Document, 
  AutomatedInsight,
  ChartData
} from '../types/insights';
import {
  fetchWidgets,
  updateWidgetOrder,
  updateWidgetSize,
  fetchDocuments,
  uploadDocument,
  generateReport,
  scheduleReport,
  exportReport,
  shareReport,
  fetchAutomatedInsights,
  // fetchAvailableMetrics, // Commented out - needs implementation in service
  // fetchAvailableDataSources, // Commented out - needs implementation in service
  // fetchVisualizationData // Commented out - needs implementation in service
} from '../services/insightsService';
import { useNotification } from '../context/NotificationContext';
import { generateChartData, getWidgetPreviewData } from '../services/chartService';
import { ShareModal } from '../components/ShareModal';

// Tremor components
import {
  Card,
  Title,
  Text,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Badge,
  TextInput,
  Button,
  Select,
  SelectItem,
  Flex,
  Grid as TremorGrid,
  Col,
  Divider,
  Metric,
  List,
  ListItem,
  MultiSelect,
  MultiSelectItem,
  BarChart,
  LineChart,
  DonutChart,
  ProgressBar,
  Legend,
  Color,
  Callout,
  Switch,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Icon
} from '@tremor/react';

// Add new types after the existing imports
interface BatchReport extends ReportConfig {
  id: string;
  name: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  result?: ChartData;
  error?: string;
}

const CustomInsights = () => {
  const { showNotification } = useNotification();
  
  // State for report builder
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    metrics: ['Budget Utilization', 'Timeline Progress'],
    dateRange: 'Last 30 Days',
    visualization: 'Bar Chart',
    dataSources: ['KPIs', 'Financial'],
  });

  // Loading states
  const [widgetsLoading, setWidgetsLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [exportingReport, setExportingReport] = useState(false);
  const [selectedTab, setSelectedTab] = useState('insights');

  // State for widgets and layout
  const [widgets, setWidgets] = useState<Widget[]>([]);

  // State for document management
  const [documents, setDocuments] = useState<Document[]>([]);

  // State for automated insights
  const [insights, setInsights] = useState<any[]>([]);

  // State for drag and drop
  const [draggingWidget, setDraggingWidget] = useState<Widget | null>(null);
  const dragSourceRef = useRef<HTMLDivElement | null>(null);

  // File input reference
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Report chart data
  const [reportData, setReportData] = useState<ChartData | null>(null);

  // State for dynamic options
  const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);
  const [availableDataSources, setAvailableDataSources] = useState<string[]>([]);
  const [filteredMetrics, setFilteredMetrics] = useState<string[]>([]); // Metrics filtered by selected source
  const [optionsLoading, setOptionsLoading] = useState(true);

  // Placeholder mapping - replace with actual logic/data from backend
  const dataSourceMetricMap: Record<string, string[]> = {
    Programs: ['Count', 'Program: Status', 'Program: Health'],
    Goals: ['Count', 'Goal: Progress (%)'],
    Milestones: ['Count', 'Milestone: Status', 'Milestone: Completion Rate (%)'],
    Risks: ['Count', 'Risk: Level', 'Risk: Status', 'Risk: Score'],
    Financials: ['Financial: Profit', 'Financial: Revenue', 'Financial: Cost', 'Financial: ROI (%)'],
    KPIs: ['Count', 'KPI: Progress (%)', 'KPI: Variance'],
    Users: ['Count', 'User: Count by Role'],
    'Communication Logs': ['Count', 'Communication: Count by Type', 'Communication: Status'],
  };

  // Modal states
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareConfig, setShareConfig] = useState({
    email: '',
    message: '',
    expiryDays: 7
  });

  // Add new state for batch reports
  const [batchReports, setBatchReports] = useState<BatchReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isAddingReport, setIsAddingReport] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    loadInitialOptions(); // Fetch dynamic options first
    loadWidgets();
    loadDocuments();
    loadInsights();
  }, []);
  
  // Generate report data whenever config changes
  useEffect(() => {
    if (reportConfig.metrics.length > 0) {
      // Generate sample data for demonstration
      const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: reportConfig.metrics.map(metric => ({
          label: metric,
          data: Array.from({ length: 6 }, () => Math.floor(Math.random() * 100))
        }))
      };
      setReportData(data);
    }
  }, [reportConfig]);

  // Effect to update filtered metrics when selected data sources change
  useEffect(() => {
    if (reportConfig.dataSources.length === 0) {
      setFilteredMetrics([]); // No sources selected, no metrics
    } else {
      // Collect all metrics relevant to the selected data sources
      const relevantMetrics = new Set<string>();
      reportConfig.dataSources.forEach(source => {
        dataSourceMetricMap[source]?.forEach(metric => relevantMetrics.add(metric));
      });
      // Filter available metrics based on the relevant set
      setFilteredMetrics(availableMetrics.filter(metric => relevantMetrics.has(metric)));
    }
    // Reset selected metrics if they are no longer valid for the selected sources
    setReportConfig(prev => ({
      ...prev,
      metrics: prev.metrics.filter(metric => filteredMetrics.includes(metric))
    }));
  }, [reportConfig.dataSources, availableMetrics]); // Re-run when sources or all metrics change

  // Fetch available metrics and data sources
  const loadInitialOptions = async () => {
    setOptionsLoading(true);
    try {
      // Assume these functions exist in insightsService - COMMENTED OUT FOR NOW
      // const [metrics, dataSources] = await Promise.all([
      //   fetchAvailableMetrics(), 
      //   fetchAvailableDataSources()
      // ]);
      // setAvailableMetrics(metrics || []);
      // setAvailableDataSources(dataSources || []);
      
      // Use placeholder data until service functions are implemented
      console.warn('Using placeholder options for metrics/data sources.');
      // More realistic placeholder options based on Dashboard data
      setAvailableMetrics([
        'Count',
        'Program: Status',
        'Program: Health',
        'Goal: Progress (%)',
        'Milestone: Status',
        'Milestone: Completion Rate (%)',
        'Risk: Level',
        'Risk: Status',
        'Risk: Score',
        'Financial: Profit',
        'Financial: Revenue',
        'Financial: Cost',
        'Financial: ROI (%)',
        'KPI: Progress (%)',
        'KPI: Variance',
        'User: Count by Role',
        'Communication: Count by Type',
        'Communication: Status'
      ]); 
      setAvailableDataSources([
        'Programs',
        'Goals',
        'Milestones',
        'Risks',
        'Financials',
        'KPIs',
        'Users',
        'Communication Logs'
      ]); 

    } catch (error) {
      console.error('Failed to load report options:', error);
      showNotification('error', 'Failed to load report builder options.');
      setAvailableMetrics([]); 
      setAvailableDataSources([]);
    } finally {
      setOptionsLoading(false);
    }
  };

  // Load widgets from API
  const loadWidgets = async () => {
    try {
      setWidgetsLoading(true);
      const data = await fetchWidgets();
      setWidgets(data);
    } catch (error) {
      console.error('Failed to load widgets:', error);
      showNotification('error', 'Failed to load widgets. Please try again later.');
    } finally {
      setWidgetsLoading(false);
    }
  };

  // Load documents from API
  const loadDocuments = async () => {
    try {
      setDocumentsLoading(true);
      const data = await fetchDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Failed to load documents:', error);
      showNotification('error', 'Failed to load documents. Please try again later.');
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Load insights from API
  const loadInsights = async () => {
    try {
      setInsightsLoading(true);
      const data = await fetchAutomatedInsights();
      setInsights(data);
    } catch (error) {
      console.error('Failed to load insights:', error);
      showNotification('error', 'Failed to load insights. Please try again later.');
    } finally {
      setInsightsLoading(false);
    }
  };

  // Handlers for report builder
  const handleMetricChange = (values: string[]) => {
    setReportConfig({
      ...reportConfig,
      metrics: values,
    });
  };

  const handleDateRangeChange = (range: string) => {
    setReportConfig({ ...reportConfig, dateRange: range });
  };

  const handleVisualizationChange = (type: string) => {
    setReportConfig({ ...reportConfig, visualization: type });
  };

  const handleDataSourceChange = (values: string[]) => {
    setReportConfig({
      ...reportConfig,
      dataSources: values,
    });
  };

  // Generate report handler
  const handleGenerateReport = async () => {
    if (reportConfig.metrics.length === 0) {
      showNotification('warning', 'Please select at least one metric');
      return;
    }
    
    setGeneratingReport(true);
    try {
      // In a real implementation, this would call your backend
      const data = await generateReport(reportConfig);
      setReportData(data);
      showNotification('success', 'Report generated successfully!');
    } catch (error) {
      console.error('Failed to generate report:', error);
      setReportData(null);
      showNotification('error', 'Failed to generate report. Please try again later.');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Export handlers
  const handleExportImage = () => {
    if (!reportData) {
      showNotification('warning', 'No data to export');
      return;
    }

    // Create a temporary canvas element
    const chartElement = document.querySelector('.h-\\[320px\\] > div > canvas') as HTMLCanvasElement;
    if (!chartElement) {
      showNotification('error', 'Could not find chart element');
      return;
    }

    // Create a download link
    const link = document.createElement('a');
    link.download = `${getReportTitle()}.png`;
    link.href = chartElement.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('success', 'Chart exported as PNG successfully!');
  };

  const handleExportExcel = () => {
    if (!reportData) {
      showNotification('warning', 'No data to export');
      return;
    }

    // Convert data to CSV format
    const headers = ['Category', ...reportData.datasets.map((d: { label: string }) => d.label)];
    const rows = reportData.labels.map((label: string, index: number) => {
      return [
        label,
        ...reportData.datasets.map((d: { data: number[] }) => d.data[index])
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row: (string | number)[]) => row.join(','))
    ].join('\n');

    // Create a Blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${getReportTitle()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('success', 'Data exported as CSV successfully!');
  };

  // Share handler
  const handleShare = () => {
    if (!reportData) {
      showNotification('warning', 'Generate a report before sharing');
      return;
    }
    setShowShareModal(true);
  };

  // Schedule handler
  const handleScheduleReport = () => {
    if (!reportData) {
      showNotification('warning', 'Generate a report before scheduling');
      return;
    }
    showNotification('info', 'Scheduling functionality is not implemented in this version.');
  };

  // Share submit handler
  const handleShareSubmit = (data: any) => {
    // TODO: Implement share functionality
    console.log('Sharing with data:', data); // Placeholder
    setShowShareModal(false);
    showNotification('success', 'Report shared (simulation)'); // Placeholder
  };

  const handleFileUpload = () => {
    // Trigger file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    try {
      const newDoc = await uploadDocument(files[0]);
      setDocuments([...documents, newDoc]);
      showNotification('success', `File ${newDoc.name} uploaded successfully!`);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      showNotification('error', 'Failed to upload file. Please try again later.');
    }
  };

  // Widget drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, widget: Widget) => {
    setDraggingWidget(widget);
    dragSourceRef.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    // Required to make dragging work in Firefox
    e.dataTransfer.setData('text/plain', widget.id.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetWidget: Widget) => {
    e.preventDefault();
    if (!draggingWidget) return;
    
    const draggedIndex = widgets.findIndex(w => w.id === draggingWidget.id);
    const targetIndex = widgets.findIndex(w => w.id === targetWidget.id);
    
    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
      setDraggingWidget(null);
      return;
    }

    const newWidgets = [...widgets];
    const [removed] = newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(targetIndex, 0, removed);
    
    setWidgets(newWidgets);
    setDraggingWidget(null);
    
    // Simulate API call to update widget order
    updateWidgetOrder(newWidgets)
      .then(() => console.log('Widget order updated'))
      .catch(err => {
        console.error('Failed to update widget order:', err);
        showNotification('error', 'Failed to save new widget order.');
        // Optionally revert state on error
        setWidgets(widgets);
      });
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDraggingWidget(null);
  };

  const handleWidgetResize = async (id: number, size: string) => {
    const updatedWidgets = widgets.map(widget => 
      widget.id === id ? { ...widget, size } : widget
    );
    setWidgets(updatedWidgets);
    
    try {
      await updateWidgetSize(id, size);
    } catch (error) {
      console.error('Failed to update widget size:', error);
      // Consider rolling back UI state or showing an error
    }
  };

  // Format chart data for Tremor
  const formatChartData = (data: ChartData) => {
    if (!data || !data.labels || !data.datasets) return [];
    
    return data.labels.map((label: string, i: number) => {
      const item: Record<string, string | number> = { category: label };
      data.datasets.forEach((dataset: { label: string; data: number[] }) => {
        item[dataset.label] = dataset.data[i];
      });
      return item;
    });
  };
  
  // Get insight severity color
  const getInsightSeverityColor = (severity: string): Color => {
    switch (severity) {
      case 'high': return 'rose';
      case 'medium': return 'amber';
      case 'low': return 'emerald';
      case 'info': return 'blue';
      default: return 'gray';
    }
  };
  
  // Get document icon and color
  const getDocumentIconColor = (type: string): { icon: any, color: Color } => {
    switch (type) {
      case 'pdf': return { icon: FileText, color: 'rose' };
      case 'excel': return { icon: FileText, color: 'emerald' };
      case 'word': return { icon: FileText, color: 'blue' };
      default: return { icon: File, color: 'gray' };
    }
  };

  // Get report title
  const getReportTitle = () => {
    if (reportConfig.metrics.length === 0) return 'Select metrics to generate a report';
    return reportConfig.metrics.join(', ') + ' Report';
  };

  // Define badge colors
  const badgeColors: Record<string, string> = {
    'KPIs': 'blue',
    'Financial': 'emerald',
    'Risks': 'amber',
    'Communications': 'violet',
  };

  const getChartComponent = (widget: Widget, formattedData: any, chartData: any) => {
    if (widget.type !== 'chart') return null;
    
    const commonProps = {
      data: formattedData,
      showAnimation: true
    };

    if (widget.title.includes('Risk')) {
      return (
        <DonutChart
          {...commonProps}
          category={chartData?.datasets?.[0]?.label || 'Value'}
          index="category"
          colors={["purple", "violet", "fuchsia", "indigo"]}
          valueFormatter={(v) => `${v}%`}
          showLabel={false}
        />
      );
    }

    if (widget.title.includes('Performance') || widget.title.includes('Team')) {
      return (
        <LineChart
          {...commonProps}
          index="category"
          categories={chartData?.datasets?.[0]?.label ? [chartData.datasets[0].label] : ['Value']}
          colors={["purple"]}
          yAxisWidth={32}
          connectNulls={true}
          showXAxis={true}
          showYAxis={true}
        />
      );
    }

    return null;
  };

  // Helper to get Tailwind class based on widget size
  const getWidgetSizeClass = (size: string): string => {
    switch (size) {
      case 'small': return 'col-span-1';
      case 'large': return 'md:col-span-2 lg:col-span-2';
      default: return 'md:col-span-1 lg:col-span-1'; // medium
    }
  };

  // Helper function to generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Function to add a new report to batch
  const handleAddReport = () => {
    const newReport: BatchReport = {
      id: generateId(),
      name: `Report ${batchReports.length + 1}`,
      metrics: [],
      dateRange: 'Last 30 Days',
      visualization: 'Bar Chart',
      dataSources: [],
      status: 'pending'
    };
    setBatchReports([...batchReports, newReport]);
    setSelectedReportId(newReport.id);
    setIsAddingReport(false);
  };

  // Function to update a batch report
  const handleUpdateBatchReport = (id: string, updates: Partial<BatchReport>) => {
    setBatchReports(reports => 
      reports.map(report => 
        report.id === id ? { ...report, ...updates } : report
      )
    );
  };

  // Function to remove a report from batch
  const handleRemoveReport = (id: string) => {
    setBatchReports(reports => reports.filter(report => report.id !== id));
    if (selectedReportId === id) {
      setSelectedReportId(null);
    }
  };

  // Function to generate all batch reports
  const handleGenerateBatchReports = async () => {
    for (const report of batchReports) {
      if (report.metrics.length === 0) continue;

      handleUpdateBatchReport(report.id, { status: 'generating' });
      try {
        const data = await generateReport(report);
        handleUpdateBatchReport(report.id, { 
          status: 'completed',
          result: data
        });
      } catch (error) {
        handleUpdateBatchReport(report.id, { 
          status: 'error',
          error: 'Failed to generate report'
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Custom Insights & Reporting</h2>
            <p className="mt-1 text-sm text-gray-500">Generate custom reports and analyze your data</p>
          </div>
          <Badge color="purple" size="sm" className="font-medium">Beta</Badge>
        </div>

        <div className="mb-8">
          <div className="border-b border-gray-200">
            <ul className="flex -mb-px space-x-8">
              <li>
                <button 
                  onClick={() => setSelectedTab('insights')}
                  className={`pb-4 px-1 border-b-2 transition-colors duration-200 ${
                    selectedTab === 'insights' 
                      ? 'border-purple-600 text-purple-600 font-medium' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Single Report
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setSelectedTab('batch')}
                  className={`pb-4 px-1 border-b-2 transition-colors duration-200 ${
                    selectedTab === 'batch' 
                      ? 'border-purple-600 text-purple-600 font-medium' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Batch Reports
                </button>
              </li>
            </ul>
          </div>
        </div>
            
        {selectedTab === 'insights' && (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            {/* Report Builder - Takes 2 columns */}
            <div className="xl:col-span-2">
              <Card className="rounded-xl shadow-sm border border-gray-200 overflow-visible z-10 bg-white/50 backdrop-blur-sm">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Report Builder</h3>
                      <p className="text-sm text-gray-500 mt-1">Create custom reports from your data sources</p>
                    </div>
                  </div>
            
                  {optionsLoading ? (
                    <div className="h-60 flex items-center justify-center">
                      <Loader className="h-8 w-8 text-purple-500 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Data Sources First */}
                      <div className="relative z-30">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">Data Sources</label>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{reportConfig.dataSources.length} selected</span>
                        </div>
                        <MultiSelect
                          value={reportConfig.dataSources}
                          onValueChange={handleDataSourceChange}
                          placeholder="Select data source(s)..."
                          className="w-full [&>button]:border-gray-300 [&>button]:shadow-sm [&>button]:ring-purple-500 [&>div[role=listbox]]:bg-white [&>div[role=listbox]]:shadow-xl [&>div[role=listbox]]:border [&>div[role=listbox]]:border-gray-200 [&>div[role=listbox]]:rounded-lg [&>div[role=listbox]]:mt-1 [&>div[role=listbox]]:max-h-60 [&>div[role=listbox]]:overflow-auto [&>div[role=listbox]]:z-50"
                        >
                          {availableDataSources.map(source => (
                            <MultiSelectItem 
                              key={source} 
                              value={source}
                              className="hover:bg-purple-50 data-[selected=true]:bg-purple-50 data-[selected=true]:text-purple-900 px-3 py-2 text-gray-900 bg-white cursor-pointer flex items-center"
                              aria-label={`Data source: ${source}`}
                            >
                              <div className="flex items-center w-full">
                                <Folder className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{source}</span>
                              </div>
                            </MultiSelectItem>
                          ))}
                        </MultiSelect>
                      </div>
                      
                      {/* Metrics Second - depends on Data Sources */}
                      <div className="relative z-20">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">Metrics</label>
                          <span className="text-xs text-gray-500">{reportConfig.metrics.length} selected</span>
                        </div>
                        <MultiSelect 
                          value={reportConfig.metrics}
                          onValueChange={handleMetricChange}
                          placeholder={reportConfig.dataSources.length === 0 ? "Select a data source first" : "Select metric(s)..."}
                          className="w-full [&>button]:border-gray-300 [&>button]:shadow-sm [&>button]:ring-purple-500 [&>div[role=listbox]]:bg-white [&>div[role=listbox]]:shadow-lg [&>div[role=listbox]]:border [&>div[role=listbox]]:border-gray-200 [&>div[role=listbox]]:rounded-md [&>div[role=listbox]]:mt-1 [&>div[role=listbox]]:max-h-60 [&>div[role=listbox]]:overflow-auto [&>div[role=listbox]]:z-50"
                          disabled={reportConfig.dataSources.length === 0}
                          aria-label="Metrics selection"
                        >
                          {filteredMetrics.map(metric => (
                            <MultiSelectItem 
                              key={metric} 
                              value={metric}
                              className="hover:bg-purple-50 data-[selected=true]:bg-purple-50 data-[selected=true]:text-purple-900 px-3 py-2 text-gray-900 bg-white cursor-pointer flex items-center"
                              aria-label={`Metric: ${metric}`}
                            >
                              <div className="flex items-center w-full">
                                <TrendingUp className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{metric}</span>
                              </div>
                            </MultiSelectItem>
                          ))}
                        </MultiSelect>
                        {reportConfig.dataSources.length === 0 && (
                          <p className="mt-2 text-xs text-gray-500 flex items-center">
                            <Info className="h-3 w-3 mr-1" />
                            Select at least one data source to view available metrics
                          </p>
                        )}
                      </div>
                      
                      {/* Date Range */}
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">Date Range</label>
                          <span className="text-xs text-purple-600 font-medium">{reportConfig.dateRange}</span>
                        </div>
                        <Select 
                          value={reportConfig.dateRange}
                          onValueChange={handleDateRangeChange}
                          className="w-full [&>button]:border-gray-300 [&>button]:shadow-sm [&>button]:ring-purple-500 [&>div[role=listbox]]:bg-white [&>div[role=listbox]]:shadow-lg [&>div[role=listbox]]:border [&>div[role=listbox]]:border-gray-200 [&>div[role=listbox]]:rounded-md [&>div[role=listbox]]:mt-1 [&>div[role=listbox]]:max-h-60 [&>div[role=listbox]]:overflow-auto [&>div[role=listbox]]:z-50"
                        >
                          <SelectItem value="Last 7 Days" className="hover:bg-purple-50 px-3 py-2 text-gray-900 bg-white cursor-pointer">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                              <span className="truncate">Last 7 Days</span>
                            </span>
                          </SelectItem>
                          <SelectItem value="Last 30 Days" className="hover:bg-purple-50 px-3 py-2 text-gray-900 bg-white cursor-pointer">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                              <span className="truncate">Last 30 Days</span>
                            </span>
                          </SelectItem>
                          <SelectItem value="Last 90 Days" className="hover:bg-purple-50 px-3 py-2 text-gray-900 bg-white cursor-pointer">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                              <span className="truncate">Last 90 Days</span>
                            </span>
                          </SelectItem>
                          <SelectItem value="Custom Range" className="hover:bg-purple-50 px-3 py-2 text-gray-900 bg-white cursor-pointer">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                              <span className="truncate">Custom Range</span>
                            </span>
                          </SelectItem>
                        </Select>
                      </div>
                      
                      {/* Visualization */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">Visualization</label>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => handleVisualizationChange('Bar Chart')}
                            className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                              reportConfig.visualization === 'Bar Chart'
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-200 hover:border-purple-200 hover:bg-purple-50/50'
                            }`}
                          >
                            <div className={`h-6 w-6 mb-2 ${reportConfig.visualization === 'Bar Chart' ? 'text-purple-600' : 'text-gray-400'}`}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="12" width="6" height="8" rx="1" />
                                <rect x="9" y="8" width="6" height="12" rx="1" />
                                <rect x="15" y="4" width="6" height="16" rx="1" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium">Bar Chart</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVisualizationChange('Line Chart')}
                            className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                              reportConfig.visualization === 'Line Chart'
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-200 hover:border-purple-200 hover:bg-purple-50/50'
                            }`}
                          >
                            <div className={`h-6 w-6 mb-2 ${reportConfig.visualization === 'Line Chart' ? 'text-purple-600' : 'text-gray-400'}`}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 12l5-5 5 5 5-5 3 3" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium">Line Chart</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVisualizationChange('Pie Chart')}
                            className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                              reportConfig.visualization === 'Pie Chart'
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-200 hover:border-purple-200 hover:bg-purple-50/50'
                            }`}
                          >
                            <div className={`h-6 w-6 mb-2 ${reportConfig.visualization === 'Pie Chart' ? 'text-purple-600' : 'text-gray-400'}`}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2v10l4.24 4.24" />
                                <circle cx="12" cy="12" r="10" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium">Pie Chart</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleGenerateReport}
                    loading={generatingReport}
                    loadingText="Generating..."
                    className="w-full mt-8 bg-purple-600 hover:bg-purple-700 text-white border-purple-600 hover:border-purple-700 shadow-md transition-all duration-200 rounded-lg py-2.5"
                    disabled={reportConfig.metrics.length === 0}
                    icon={reportConfig.metrics.length === 0 ? AlertCircle : undefined}
                  >
                    {reportConfig.metrics.length === 0 ? 'Select metrics to generate' : 'Generate Report'}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Report Preview - Takes 3 columns */}
            <div className="xl:col-span-3">
              <Card className="rounded-xl shadow-sm border border-gray-200 flex flex-col bg-white/50 backdrop-blur-sm min-h-[600px]">
                {generatingReport ? (
                  <div className="flex-grow flex flex-col items-center justify-center p-6">
                    <Loader className="h-8 w-8 text-purple-500 animate-spin mb-3" />
                    <p className="text-sm text-gray-500">Generating report...</p>
                  </div>
                ) : reportConfig.metrics.length === 0 ? (
                  <div className="flex-grow flex flex-col items-center justify-center p-6">
                    <div className="bg-gray-50 rounded-full p-4 mb-4">
                      <TrendingUp className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">Select metrics to generate a report</p>
                  </div>
                ) : (
                  <>
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900">{getReportTitle()}</h3>
                        <Badge color="purple" className="px-3 py-1">
                          {reportConfig.dateRange}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-6 flex-grow">
                      {reportData && (
                        <div className="h-[400px]"> {/* Increased height for better visualization */}
                          {reportConfig.visualization === 'Bar Chart' && (
                            <BarChart
                              data={formatChartData(reportData)}
                              index="category"
                              categories={reportData.datasets.map((d: { label: string }) => d.label)}
                              colors={["purple", "violet"]}
                              yAxisWidth={48}
                              showAnimation={true}
                            />
                          )}
                          {reportConfig.visualization === 'Line Chart' && (
                            <LineChart
                              data={formatChartData(reportData)}
                              index="category"
                              categories={reportData.datasets.map((d: { label: string }) => d.label)}
                              colors={["purple", "violet"]}
                              yAxisWidth={48}
                              connectNulls={true}
                              showAnimation={true}
                            />
                          )}
                          {reportConfig.visualization === 'Pie Chart' && (
                            <DonutChart
                              data={formatChartData(reportData)}
                              category="value"
                              index="category"
                              colors={["purple", "violet", "fuchsia", "indigo"]}
                              valueFormatter={(v) => `${v}%`}
                              showAnimation={true}
                            />
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="px-6 py-4 border-t border-gray-200 bg-white rounded-b-xl">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Info className="h-4 w-4" />
                          <span>Last updated: {new Date().toLocaleTimeString()}</span>
                        </div>
                        <div className="flex space-x-3">
                          <div className="relative">
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={Download}
                              onClick={() => {
                                const menu = document.getElementById('export-menu');
                                if (menu) menu.classList.toggle('hidden');
                              }}
                              disabled={exportingReport}
                              title="Export options"
                              className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm rounded-lg"
                            >
                              Export
                            </Button>
                            <div
                              id="export-menu"
                              className="hidden absolute right-0 mt-2 w-48 rounded-lg shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-50 border border-gray-200"
                            >
                              <div className="py-1" role="menu">
                                <button
                                  onClick={handleExportImage}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                                  role="menuitem"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download as PNG
                                </button>
                                <button
                                  onClick={handleExportExcel}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                                  role="menuitem"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Download as CSV
                                </button>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Share2}
                            onClick={handleShare}
                            title="Share report"
                            className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm rounded-lg"
                          >
                            Share
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </Card>
            </div>
          </div>
        )}

        {selectedTab === 'batch' && (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            {/* Batch Reports List - Takes 2 columns */}
            <div className="xl:col-span-2">
              <Card className="rounded-xl shadow-sm border border-gray-200 overflow-visible z-10 bg-white/50 backdrop-blur-sm">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Batch Reports</h3>
                      <p className="text-sm text-gray-500 mt-1">Configure multiple reports to generate at once</p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Plus}
                      onClick={() => setIsAddingReport(true)}
                      className="border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
                    >
                      Add Report
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {batchReports.map(report => (
                      <div
                        key={report.id}
                        onClick={() => setSelectedReportId(report.id)}
                        className={`p-4 rounded-lg border ${
                          selectedReportId === report.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50'
                        } cursor-pointer transition-all duration-200`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{report.name}</h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {report.metrics.length} metrics selected
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 ${
                                report.status === 'completed' 
                                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                  : report.status === 'error'
                                  ? 'bg-red-100 text-red-700 border border-red-200'
                                  : report.status === 'generating'
                                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                  : 'bg-gray-100 text-gray-700 border border-gray-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                report.status === 'completed'
                                  ? 'bg-emerald-500'
                                  : report.status === 'error'
                                  ? 'bg-red-500'
                                  : report.status === 'generating'
                                  ? 'animate-pulse bg-amber-500'
                                  : 'bg-gray-500'
                              }`} />
                              {report.status}
                            </Badge>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveReport(report.id);
                              }}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title="Remove report"
                              aria-label="Remove report"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {batchReports.length === 0 && !isAddingReport && (
                      <div className="text-center py-8">
                        <div className="bg-gray-50 rounded-full p-3 mx-auto w-fit mb-4">
                          <Plus className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">No reports configured yet</p>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setIsAddingReport(true)}
                          className="mt-4"
                        >
                          Add your first report
                        </Button>
                      </div>
                    )}

                    {isAddingReport && (
                      <div className="p-4 rounded-lg border border-purple-500 bg-purple-50">
                        <input
                          type="text"
                          placeholder="Report name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddReport();
                            }
                          }}
                          autoFocus
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsAddingReport(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleAddReport}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleGenerateBatchReports}
                    loading={batchReports.some(r => r.status === 'generating')}
                    loadingText="Generating..."
                    className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white border-purple-600 hover:border-purple-700 shadow-md transition-all duration-200 rounded-lg py-2.5"
                    disabled={batchReports.length === 0}
                  >
                    Generate All Reports
                  </Button>
                </div>
              </Card>
            </div>

            {/* Report Configuration - Takes 3 columns */}
            <div className="xl:col-span-3">
              <Card className="rounded-xl shadow-sm border border-gray-200 flex flex-col bg-white/50 backdrop-blur-sm min-h-[600px]">
                {!selectedReportId ? (
                  <div className="flex-grow flex flex-col items-center justify-center p-6">
                    <div className="bg-gray-50 rounded-full p-4 mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">Select a report to configure</p>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="mb-8">
                      <input
                        type="text"
                        value={batchReports.find(r => r.id === selectedReportId)?.name || ''}
                        onChange={(e) => handleUpdateBatchReport(selectedReportId, { name: e.target.value })}
                        className="text-xl font-semibold text-gray-900 bg-transparent border-0 border-b-2 border-transparent hover:border-gray-200 focus:border-purple-500 focus:ring-0 w-full"
                        title="Report name"
                        aria-label="Report name"
                      />
                    </div>

                    {/* Reuse the same configuration UI as single report */}
                    <div className="space-y-6">
                      {/* Data Sources */}
                      <div className="relative z-30">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">Data Sources</label>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {batchReports.find(r => r.id === selectedReportId)?.dataSources.length || 0} selected
                          </span>
                        </div>
                        <MultiSelect
                          value={batchReports.find(r => r.id === selectedReportId)?.dataSources || []}
                          onValueChange={(values) => handleUpdateBatchReport(selectedReportId, { dataSources: values })}
                          placeholder="Select data source(s)..."
                          className="w-full [&>button]:border-gray-300 [&>button]:shadow-sm [&>button]:ring-purple-500 [&>div[role=listbox]]:bg-white [&>div[role=listbox]]:shadow-xl [&>div[role=listbox]]:border [&>div[role=listbox]]:border-gray-200 [&>div[role=listbox]]:rounded-lg [&>div[role=listbox]]:mt-1 [&>div[role=listbox]]:max-h-60 [&>div[role=listbox]]:overflow-auto [&>div[role=listbox]]:z-50"
                        >
                          {availableDataSources.map(source => (
                            <MultiSelectItem 
                              key={source} 
                              value={source}
                              className="hover:bg-purple-50 data-[selected=true]:bg-purple-50 data-[selected=true]:text-purple-900 px-3 py-2 text-gray-900 bg-white cursor-pointer flex items-center"
                            >
                              <div className="flex items-center w-full">
                                <Folder className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{source}</span>
                              </div>
                            </MultiSelectItem>
                          ))}
                        </MultiSelect>
                      </div>

                      {/* Add other configuration sections (metrics, date range, visualization) similar to single report */}
                      {/* ... */}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            onSubmit={handleShareSubmit}
          />
        )}
      </div>
    </div>
  );
};

export default CustomInsights;
