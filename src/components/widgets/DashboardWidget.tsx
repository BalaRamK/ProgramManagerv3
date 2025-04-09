import React, { useState, useEffect } from 'react';
import { Move, BarChart, TrendingUp, Maximize2, Minimize2, MoreHorizontal, Settings } from 'lucide-react';
import ReportChart from '../charts/ReportChart';
import { getWidgetPreviewData } from '../../services/chartService';
import { Widget } from '../../types/insights';

interface DashboardWidgetProps {
  widget: Widget;
  onResize: (id: number, size: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, widget: Widget) => void;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({ widget, onResize, onDragStart }) => {
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfiguring, setIsConfiguring] = useState(false);

  useEffect(() => {
    // Simulate loading chart data
    setIsLoading(true);
    
    // Small delay to simulate loading
    const timer = setTimeout(() => {
      const data = getWidgetPreviewData(widget.title);
      setChartData(data);
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [widget.title]);

  const getHeightClass = () => {
    switch (widget.size) {
      case 'small':
        return 'h-40';
      case 'large':
        return 'h-96';
      case 'medium':
      default:
        return 'h-64';
    }
  };

  const getWidgetIcon = () => {
    switch (widget.type) {
      case 'chart':
        return <BarChart className="h-5 w-5 text-violet-500" />;
      case 'progress':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      default:
        return <BarChart className="h-5 w-5 text-violet-500" />;
    }
  };

  const getChartType = () => {
    if (widget.title.includes('Budget')) {
      return 'Bar Chart';
    } else if (widget.title.includes('Progress') || widget.title.includes('Performance')) {
      return 'Line Chart';
    } else if (widget.title.includes('Risk')) {
      return 'Pie Chart';
    }
    return 'Bar Chart';
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, widget)}
      className={`p-4 border rounded-lg bg-white transition-all duration-300 ${
        getHeightClass()
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          {getWidgetIcon()}
          <h3 className="font-medium ml-2">{widget.title}</h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onResize(widget.id, 'small')}
            className={`p-1 rounded hover:bg-gray-100 ${widget.size === 'small' ? 'text-violet-600' : 'text-gray-400'}`}
            title="Small size"
          >
            <Minimize2 className="h-4 w-4" aria-label="Small size" />
          </button>
          <button
            onClick={() => onResize(widget.id, 'medium')}
            className={`p-1 rounded hover:bg-gray-100 ${widget.size === 'medium' ? 'text-violet-600' : 'text-gray-400'}`}
            title="Medium size"
          >
            <BarChart className="h-4 w-4" aria-label="Medium size" />
          </button>
          <button
            onClick={() => onResize(widget.id, 'large')}
            className={`p-1 rounded hover:bg-gray-100 ${widget.size === 'large' ? 'text-violet-600' : 'text-gray-400'}`}
            title="Large size"
          >
            <Maximize2 className="h-4 w-4" aria-label="Large size" />
          </button>
          <button 
            onClick={() => setIsConfiguring(!isConfiguring)}
            className="p-1 rounded hover:bg-gray-100 text-gray-400"
            title="Widget settings"
          >
            <Settings className="h-4 w-4" aria-label="Widget settings" />
          </button>
          <div className="p-1 text-gray-400 cursor-move">
            <Move className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-2">
        Source: {widget.source}
      </div>

      <div className="flex-1 h-[calc(100%-3rem)] relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-700"></div>
          </div>
        ) : isConfiguring ? (
          <div className="p-3 bg-gray-50 rounded h-full">
            <h4 className="font-medium text-sm mb-2">Widget Configuration</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Data source:</span>
                <span className="font-medium">{widget.source}</span>
              </div>
              <div className="flex justify-between">
                <span>Chart type:</span>
                <span className="font-medium">{getChartType()}</span>
              </div>
              <div className="flex justify-between">
                <span>Auto refresh:</span>
                <span className="font-medium">Every 30 minutes</span>
              </div>
              <button className="mt-2 w-full py-1 px-2 text-xs bg-violet-50 text-violet-600 rounded border border-violet-200">
                Advanced Settings
              </button>
            </div>
          </div>
        ) : chartData ? (
          <ReportChart type={getChartType() as any} data={chartData} height={widget.size === 'small' ? 100 : widget.size === 'large' ? 300 : 180} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            No data available
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardWidget; 