import React, { useState } from 'react';
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
} from 'lucide-react';

const CustomInsights = () => {
  // Placeholder data for report builder
  const [reportConfig, setReportConfig] = useState({
    metrics: ['Budget Utilization', 'Timeline Progress'],
    dateRange: 'Last 30 Days',
    visualization: 'Bar Chart',
  });

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
  ];

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

  const handleExport = (format) => {
    alert(`Exporting report as ${format}. Export functionality is a placeholder.`);
  };

  const handleScheduleReport = () => {
    alert('Scheduling report. Scheduling functionality is a placeholder.');
  };

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

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Sliders className="mr-2" /> Custom Insights & Reporting
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Custom Report Builder */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <List className="mr-2" /> Custom Report Builder
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Metrics</label>
            <div className="mt-2 space-y-2">
              {['Budget Utilization', 'Timeline Progress', 'Task Completion', 'Risk Mitigation'].map(
                (metric) => (
                  <div key={metric} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={reportConfig.metrics.includes(metric)}
                      onChange={() => handleMetricChange(metric)}
                      className="h-4 w-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">{metric}</label>
                  </div>
                )
              )}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Date Range</label>
            <div className="relative mt-2">
              <select
                value={reportConfig.dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
                <option>Custom Range</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
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
                >
                  {getVisualizationIcon(type)}
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Automated Insights */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <AlertCircle className="mr-2" /> Automated Insights
          </h2>
          <div className="space-y-4">
            {automatedInsights.map((insight) => (
              <div key={insight.id} className="flex items-start p-3 rounded-lg border">
                <div className="mr-3">{insight.icon}</div>
                <div>
                  <div className="font-medium text-gray-900">{insight.summary}</div>
                  <div className="text-sm text-gray-600">{insight.details}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Options */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Download className="mr-2" /> Export Options
          </h2>
          <div className="space-x-4">
            {['PDF', 'CSV', 'PNG'].map((format) => (
              <button
                key={format}
                onClick={() => handleExport(format)}
                className="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center"
              >
                <File className="mr-2 h-4 w-4" />
                {format}
              </button>
            ))}
          </div>
        </div>

        {/* Scheduled Reporting */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Clock className="mr-2" /> Scheduled Reporting
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Frequency</label>
            <div className="relative mt-2">
              <select
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500"
                defaultValue="Weekly"
              >
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Delivery Time</label>
            <div className="relative mt-2">
              <input
                type="time"
                defaultValue="09:00"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <Clock className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>
          </div>
          <button
            onClick={handleScheduleReport}
            className="bg-violet-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
          >
            <Calendar className="mr-2" /> Schedule Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomInsights;
