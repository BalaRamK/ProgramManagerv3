import React, { useState, useEffect } from 'react';
import { Loader, Download, Share2, Calendar } from 'lucide-react';
import ReportChart from '../charts/ReportChart';
import { generateChartData } from '../../services/chartService';
import { ReportConfig } from '../../types/insights';

interface ReportPreviewProps {
  config: ReportConfig;
  isGenerating: boolean;
  onExport: (format: string) => void;
  onShare: () => void;
  onSchedule: () => void;
}

const ReportPreview: React.FC<ReportPreviewProps> = ({
  config,
  isGenerating,
  onExport,
  onShare,
  onSchedule,
}) => {
  const [chartData, setChartData] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!isGenerating && config.metrics.length > 0) {
      const data = generateChartData(config);
      setChartData(data);
      setCurrentTime(new Date());
    }
  }, [config, isGenerating]);

  if (isGenerating) {
    return (
      <div className="p-8 bg-white rounded-lg shadow flex flex-col items-center justify-center">
        <Loader className="h-12 w-12 text-violet-500 animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Generating Report...</h3>
        <p className="text-gray-500 text-center">
          We're crunching the numbers and preparing your report. This may take a few moments.
        </p>
      </div>
    );
  }

  if (!chartData || config.metrics.length === 0) {
    return (
      <div className="p-8 bg-white rounded-lg shadow flex flex-col items-center justify-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Metrics Selected</h3>
        <p className="text-gray-500 text-center">
          Please select at least one metric from the report builder to generate a report.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold mb-1">
          {config.metrics.join(', ')} Report
        </h2>
        <div className="text-sm text-gray-500 flex items-center">
          <span className="mr-4">Data Sources: {config.dataSources.join(', ')}</span>
          <span>Date Range: {config.dateRange}</span>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Report Visualization</h3>
          <div className="h-80">
            <ReportChart type={config.visualization as any} data={chartData} height={300} />
          </div>
        </div>

        {config.metrics.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Key Findings</h3>
            <div className="space-y-4">
              {config.metrics.map((metric) => (
                <div key={metric} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">{metric}</h4>
                  <p className="text-sm text-gray-600">
                    {metric === 'Budget Utilization' && 'Budget utilization is currently at 78%, which is within expected parameters for this phase of the project. Equipment and Marketing categories show higher than average spending.'}
                    {metric === 'Timeline Progress' && 'The project is progressing according to schedule with development phase at 65% completion. Testing phase preparations should begin within the next two weeks.'}
                    {metric === 'Task Completion' && 'Task completion rate varies significantly between teams. Team A has completed 92% of assigned tasks, while Team B is at 74%. Consider resource reallocation.'}
                    {metric === 'Risk Mitigation' && 'Risk mitigation strategies are effectively addressing most risk categories. Technical risks remain the highest concern at a 60% mitigation rate.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
          <div className="p-4 border rounded-lg bg-violet-50">
            <ul className="list-disc ml-5 space-y-2 text-sm text-gray-800">
              <li>Consider reallocating resources from Team A to support Team B's efforts.</li>
              <li>Review technical risk mitigation strategies before the start of the testing phase.</li>
              <li>Monitor marketing expenses which are trending 15% above forecast.</li>
              <li>Schedule milestone review meeting based on current timeline progress.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Generated on {currentTime.toLocaleDateString()} at {currentTime.toLocaleTimeString()}
        </div>

        <div className="flex space-x-4">
          <div className="relative group">
            <button 
              className="px-4 py-2 rounded-md text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 flex items-center"
              aria-label="Export options"
            >
              <Download className="mr-2 h-4 w-4" /> Export
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg hidden group-hover:block z-10">
              <div className="py-1">
                {['PDF', 'CSV', 'PNG'].map((format) => (
                  <button
                    key={format}
                    onClick={() => onExport(format)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as {format}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={onShare}
            className="px-4 py-2 rounded-md text-sm font-medium bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center"
            aria-label="Share report"
          >
            <Share2 className="mr-2 h-4 w-4" /> Share
          </button>

          <button 
            onClick={onSchedule}
            className="px-4 py-2 rounded-md text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 flex items-center"
            aria-label="Schedule report"
          >
            <Calendar className="mr-2 h-4 w-4" /> Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportPreview; 