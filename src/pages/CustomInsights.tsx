import React, { useState, useRef } from 'react';
import {
  BarChart,
  PieChart,
  LineChart,
  Download,
  Share2,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Sliders,
  List,
  Filter,
  ChevronDown,
  Mail,
  File,
  Upload,
  Folder,
  Move,
  Settings,
  ExternalLink,
  Info,
  FileText,
  HelpCircle,
  TrendingUp,
  DollarSign,
  Users,
  Grid,
} from 'lucide-react';

const CustomInsights = () => {
  // State for report builder
  const [reportConfig, setReportConfig] = useState({
    metrics: ['Budget Utilization', 'Timeline Progress'],
    dateRange: 'Last 30 Days',
    visualization: 'Bar Chart',
    dataSources: ['KPIs', 'Financial'],
  });

  // State for widgets and layout
  const [widgets, setWidgets] = useState([
    { id: 1, title: 'Budget Overview', type: 'chart', source: 'Financial', size: 'medium' },
    { id: 2, title: 'Task Completion', type: 'progress', source: 'KPIs', size: 'small' },
    { id: 3, title: 'Risk Assessment', type: 'chart', source: 'Risks', size: 'medium' },
    { id: 4, title: 'Team Performance', type: 'chart', source: 'KPIs', size: 'large' },
  ]);

  // State for document management
  const [documents, setDocuments] = useState([
    { id: 1, name: 'Project Plan.pdf', type: 'pdf', size: '2.4MB', updated: '2023-06-15', owner: 'Alice Johnson' },
    { id: 2, name: 'Budget Forecast.xlsx', type: 'excel', size: '1.8MB', updated: '2023-06-12', owner: 'Bob Smith' },
    { id: 3, name: 'Requirements Spec.docx', type: 'word', size: '3.2MB', updated: '2023-06-10', owner: 'Charlie Brown' },
    { id: 4, name: 'Risk Assessment.pdf', type: 'pdf', size: '1.5MB', updated: '2023-06-08', owner: 'Alice Johnson' },
  ]);

  // State for drag and drop
  const [draggingWidget, setDraggingWidget] = useState(null);
  const dragSourceRef = useRef(null);
  const [activeTab, setActiveTab] = useState('insights');

  // Placeholder data for automated insights
  const automatedInsights = [
    {
      id: 1,
      type: 'Alert',
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      summary: 'Budget exceeding 80% utilization.',
      details: 'Consider reallocating resources to avoid overspending.',
    },
    {
      id: 2,
      type: 'Success',
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      summary: 'Project is on track for timely completion.',
      details: 'All milestones are currently meeting their deadlines.',
    },
    {
      id: 3,
      type: 'Recommendation',
      icon: <TrendingUp className="h-5 w-5 text-blue-500" />,
      summary: 'Resource allocation can be optimized.',
      details: 'Team A is currently under-utilized while Team B is over capacity.',
    },
    {
      id: 4,
      type: 'Information',
      icon: <Info className="h-5 w-5 text-yellow-500" />,
      summary: 'Stakeholder review scheduled next week.',
      details: 'Prepare presentation materials for the quarterly review.',
    },
  ];

  // Handlers for report builder
  const handleMetricChange = (metric) => {
    setReportConfig({
      ...reportConfig,
      metrics: reportConfig.metrics.includes(metric)
        ? reportConfig.metrics.filter((m) => m !== metric)
        : [...reportConfig.metrics, metric],
    });
  };

  const handleDateRangeChange = (range) => {
    setReportConfig({ ...reportConfig, dateRange: range });
  };

  const handleVisualizationChange = (type) => {
    setReportConfig({ ...reportConfig, visualization: type });
  };

  const handleDataSourceChange = (source) => {
    setReportConfig({
      ...reportConfig,
      dataSources: reportConfig.dataSources.includes(source)
        ? reportConfig.dataSources.filter((s) => s !== source)
        : [...reportConfig.dataSources, source],
    });
  };

  // Handlers for export and schedule
  const handleExport = (format) => {
    alert(`Exporting report as ${format}. This would generate and download the report.`);
  };

  const handleShare = () => {
    alert('Sharing report. This would open a dialog to share the report via email.');
  };

  const handleScheduleReport = () => {
    alert('Setting up scheduled report. This would configure automated report delivery.');
  };

  const handleFileUpload = () => {
    alert('File upload functionality would be implemented here.');
  };

  // Widget drag and drop handlers
  const handleDragStart = (e, widget) => {
    setDraggingWidget(widget);
    dragSourceRef.current = e.target;
    e.dataTransfer.effectAllowed = 'move';
    // Required to make dragging work in Firefox
    e.dataTransfer.setData('text/plain', widget.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (!draggingWidget) return;

    const updatedWidgets = [...widgets];
    const sourceIndex = updatedWidgets.findIndex(w => w.id === draggingWidget.id);
    const [removed] = updatedWidgets.splice(sourceIndex, 1);
    updatedWidgets.splice(targetIndex, 0, removed);

    setWidgets(updatedWidgets);
    setDraggingWidget(null);
  };

  const handleDragEnd = () => {
    setDraggingWidget(null);
  };

  const handleWidgetResize = (id, size) => {
    const updatedWidgets = widgets.map(widget => 
      widget.id === id ? { ...widget, size } : widget
    );
    setWidgets(updatedWidgets);
  };

  // Render visualization icon based on type
  const getVisualizationIcon = (type) => {
    switch (type) {
      case 'Bar Chart':
        return <BarChart className="h-4 w-4 mr-2" />;
      case 'Pie Chart':
        return <PieChart className="h-4 w-4 mr-2" />;
      case 'Line Chart':
        return <LineChart className="h-4 w-4 mr-2" />;
      default:
        return <BarChart className="h-4 w-4 mr-2" />;
    }
  };

  // Get icon for document type
  const getDocumentIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'excel':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'word':
        return <FileText className="h-5 w-5 text-blue-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  // Render main content based on active tab
  const renderContent = () => {
    if (activeTab === 'documents') {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <Folder className="mr-2" /> Document Center
            </h2>
            <div className="flex space-x-2">
              <button 
                className="bg-violet-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
                onClick={handleFileUpload}
              >
                <Upload className="mr-2 h-4 w-4" /> Upload
              </button>
              <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium flex items-center">
                <Filter className="mr-2 h-4 w-4" /> Filter
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modified</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getDocumentIcon(doc.type)}
                        <span className="ml-2 text-sm font-medium text-gray-900">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.size}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.updated}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.owner}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button className="text-violet-600 hover:text-violet-900">
                        <Download className="h-4 w-4" aria-label="Download document" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Share2 className="h-4 w-4" aria-label="Share document" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <ExternalLink className="h-4 w-4" aria-label="Preview document" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            <p className="flex items-center">
              <Info className="h-4 w-4 mr-2" />
              Documents are version-controlled. Click on a document to see its history.
            </p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Custom Report Builder */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <List className="mr-2" /> Custom Report Builder
          </h2>
          
          <div className="group relative mb-4">
            <label className="block text-sm font-medium text-gray-700">Metrics</label>
            <div className="mt-2 space-y-2">
              {['Budget Utilization', 'Timeline Progress', 'Task Completion', 'Risk Mitigation'].map(
                (metric) => (
                  <div key={metric} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`metric-${metric}`}
                      checked={reportConfig.metrics.includes(metric)}
                      onChange={() => handleMetricChange(metric)}
                      className="h-4 w-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                      title={`Toggle ${metric}`}
                    />
                    <label htmlFor={`metric-${metric}`} className="ml-2 text-sm text-gray-700">{metric}</label>
                  </div>
                )
              )}
            </div>
            <div className="invisible group-hover:visible absolute -right-5 top-0">
              <div className="bg-black text-white text-xs rounded px-2 py-1 right-0 transform translate-x-full">
                Select metrics to include in your report
              </div>
            </div>
          </div>
          
          <div className="group relative mb-4">
            <label className="block text-sm font-medium text-gray-700">Data Sources</label>
            <div className="mt-2 space-y-2">
              {['KPIs', 'Financial', 'Risks', 'Communications'].map(
                (source) => (
                  <div key={source} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`source-${source}`}
                      checked={reportConfig.dataSources.includes(source)}
                      onChange={() => handleDataSourceChange(source)}
                      className="h-4 w-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                      title={`Toggle ${source}`}
                    />
                    <label htmlFor={`source-${source}`} className="ml-2 text-sm text-gray-700">{source}</label>
                  </div>
                )
              )}
            </div>
            <div className="invisible group-hover:visible absolute -right-5 top-0">
              <div className="bg-black text-white text-xs rounded px-2 py-1 right-0 transform translate-x-full">
                Select data sources to pull information from
              </div>
            </div>
          </div>
          
          <div className="group relative mb-4">
            <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700">Date Range</label>
            <div className="relative mt-2">
              <select
                id="dateRange"
                value={reportConfig.dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500"
                title="Select date range"
              >
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
                <option>Custom Range</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
            <div className="invisible group-hover:visible absolute -right-5 top-0">
              <div className="bg-black text-white text-xs rounded px-2 py-1 right-0 transform translate-x-full">
                Choose the time period for your report
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Visualization</label>
            <div className="mt-2 space-x-4">
              {['Bar Chart', 'Pie Chart', 'Line Chart'].map((type) => (
                <button
                  key={type}
                  onClick={() => handleVisualizationChange(type)}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
                    reportConfig.visualization === type
                      ? 'bg-violet-100 text-violet-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  aria-label={`Select ${type}`}
                >
                  {getVisualizationIcon(type)}
                  {type}
                </button>
              ))}
            </div>
          </div>
          
          <button
            className="mt-4 bg-violet-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
            aria-label="Generate report"
          >
            <BarChart className="mr-2 h-4 w-4" /> Generate Report
          </button>
        </div>

        {/* Automated Insights */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <AlertCircle className="mr-2" /> Automated Insights
            <HelpCircle className="ml-2 h-4 w-4 text-gray-400 cursor-help" title="AI-powered recommendations based on your data" />
          </h2>
          <div className="space-y-4">
            {automatedInsights.map((insight) => (
              <div key={insight.id} className="flex items-start p-3 rounded-lg border hover:bg-gray-50">
                <div className="mr-3">{insight.icon}</div>
                <div>
                  <div className="font-medium text-gray-900">{insight.summary}</div>
                  <div className="text-sm text-gray-600">{insight.details}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customizable Dashboard */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Grid className="mr-2" /> Customizable Dashboard
            <HelpCircle className="ml-2 h-4 w-4 text-gray-400 cursor-help" title="Drag and drop widgets to customize your dashboard" />
          </h2>
          
          <div className="space-y-4">
            {widgets.map((widget, index) => (
              <div 
                key={widget.id}
                draggable
                onDragStart={(e) => handleDragStart(e, widget)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`p-4 border rounded-lg ${draggingWidget?.id === widget.id ? 'opacity-50 border-dashed' : ''} cursor-move`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{widget.title}</h3>
                  <div className="flex space-x-2">
                    <button onClick={() => handleWidgetResize(widget.id, 'small')} className="text-xs bg-gray-200 px-2 py-1 rounded" aria-label="Small size">S</button>
                    <button onClick={() => handleWidgetResize(widget.id, 'medium')} className="text-xs bg-gray-200 px-2 py-1 rounded" aria-label="Medium size">M</button>
                    <button onClick={() => handleWidgetResize(widget.id, 'large')} className="text-xs bg-gray-200 px-2 py-1 rounded" aria-label="Large size">L</button>
                    <Move className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {widget.type === 'chart' && <BarChart className="inline mr-1 h-4 w-4" />}
                  {widget.type === 'progress' && <TrendingUp className="inline mr-1 h-4 w-4" />}
                  Source: {widget.source} • Size: {widget.size}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-sm text-gray-500 flex items-center">
            <Info className="h-4 w-4 mr-2" />
            Drag and drop widgets to rearrange. Click size buttons to resize.
          </div>
        </div>

        {/* Export Options */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Download className="mr-2" /> Export & Share
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Export Format</h3>
              <div className="flex space-x-4">
                {['PDF', 'CSV', 'PNG'].map((format) => (
                  <button
                    key={format}
                    onClick={() => handleExport(format)}
                    className="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center"
                    aria-label={`Export as ${format}`}
                  >
                    <File className="mr-2 h-4 w-4" />
                    {format}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Share Options</h3>
              <button
                onClick={handleShare}
                className="px-4 py-2 rounded-md text-sm font-medium bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center"
                aria-label="Share via email"
              >
                <Mail className="mr-2 h-4 w-4" />
                Email Report
              </button>
            </div>
          </div>
        </div>

        {/* Scheduled Reporting */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Clock className="mr-2" /> Scheduled Reporting
            <HelpCircle className="ml-2 h-4 w-4 text-gray-400 cursor-help" title="Set up recurring reports sent directly to your inbox" />
          </h2>
          <div className="mb-4">
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">Frequency</label>
            <div className="relative mt-2">
              <select
                id="frequency"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500"
                defaultValue="Weekly"
                title="Select report frequency"
              >
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700">Delivery Time</label>
            <div className="relative mt-2">
              <input
                id="deliveryTime"
                type="time"
                defaultValue="09:00"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500"
                title="Select delivery time"
              />
              <Clock className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="recipients" className="block text-sm font-medium text-gray-700">Recipients</label>
            <div className="relative mt-2">
              <input
                id="recipients"
                type="text"
                placeholder="Enter email addresses..."
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500"
                title="Enter recipient email addresses"
              />
              <Mail className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>
          </div>
          <button
            onClick={handleScheduleReport}
            className="bg-violet-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
            aria-label="Schedule report"
          >
            <Calendar className="mr-2" /> Schedule Report
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Sliders className="mr-2" /> Custom Insights & Reporting
      </h1>

      <div className="flex mb-6 space-x-2 border-b">
        <button 
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'insights' ? 'border-b-2 border-violet-600 text-violet-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('insights')}
        >
          Insights Panel
        </button>
        <button 
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'documents' ? 'border-b-2 border-violet-600 text-violet-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('documents')}
        >
          Document Center
        </button>
      </div>

      {renderContent()}
    </div>
  );
};

export default CustomInsights;
