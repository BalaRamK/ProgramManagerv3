import { ReportConfig } from '../types/insights';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

// Generate sample budget utilization data
const generateBudgetData = (): { labels: string[], values: number[] } => {
  const categories = ['Personnel', 'Equipment', 'Marketing', 'Operations', 'Development', 'Research', 'Administration'];
  const utilization = categories.map(() => Math.floor(Math.random() * 50) + 50); // 50-100%
  
  return {
    labels: categories,
    values: utilization
  };
};

// Generate sample timeline progress data
const generateTimelineData = (): { labels: string[], values: number[] } => {
  const phases = ['Planning', 'Design', 'Development', 'Testing', 'Deployment', 'Review'];
  const progress = phases.map(() => Math.floor(Math.random() * 100)); // 0-100%
  
  return {
    labels: phases,
    values: progress
  };
};

// Generate sample task completion data
const generateTaskData = (): { labels: string[], values: number[] } => {
  const teams = ['Team A', 'Team B', 'Team C', 'Team D'];
  const completion = teams.map(() => Math.floor(Math.random() * 70) + 30); // 30-100%
  
  return {
    labels: teams,
    values: completion
  };
};

// Generate sample risk mitigation data
const generateRiskData = (): { labels: string[], values: number[] } => {
  const riskTypes = ['Technical', 'Schedule', 'Cost', 'Resource', 'Scope'];
  const mitigation = riskTypes.map(() => Math.floor(Math.random() * 60) + 40); // 40-100%
  
  return {
    labels: riskTypes,
    values: mitigation
  };
};

// Generate time series data with dates
const generateTimeSeriesData = (): { labels: string[], values: number[] } => {
  const dates = [];
  const values = [];
  
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - (12 - i));
    dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    values.push(Math.floor(Math.random() * 30) + 70); // 70-100
  }
  
  return {
    labels: dates,
    values
  };
};

// Generate chart data based on report configuration
export const generateChartData = (config: ReportConfig): ChartData => {
  const { metrics, visualization, dateRange, dataSources } = config;
  
  const chartData: ChartData = {
    labels: [],
    datasets: [],
  };
  
  // Handle time-based data for certain visualizations
  if (visualization === 'Line Chart') {
    const { labels, values } = generateTimeSeriesData();
    chartData.labels = labels;
    
    metrics.forEach((metric, index) => {
      // Generate slightly different values for each metric
      const metricValues = values.map(v => 
        Math.max(0, Math.min(100, v + Math.floor(Math.random() * 20) - 10))
      );
      
      chartData.datasets.push({
        label: metric,
        data: metricValues,
      });
    });
    
    return chartData;
  }
  
  // For other chart types, generate data based on metrics
  const dataMap: Record<string, { labels: string[], values: number[] }> = {
    'Budget Utilization': generateBudgetData(),
    'Timeline Progress': generateTimelineData(),
    'Task Completion': generateTaskData(),
    'Risk Mitigation': generateRiskData(),
  };
  
  // If multiple metrics, we'll just use the first one for simplicity
  // In a real implementation, we would handle this more sophisticatedly
  if (metrics.length > 0 && dataMap[metrics[0]]) {
    const { labels, values } = dataMap[metrics[0]];
    chartData.labels = labels;
    
    chartData.datasets.push({
      label: metrics[0],
      data: values,
    });
    
    // If there are multiple metrics, add them as additional datasets
    if (metrics.length > 1 && visualization !== 'Pie Chart') {
      for (let i = 1; i < metrics.length; i++) {
        if (dataMap[metrics[i]]) {
          // Use the same labels but different values
          chartData.datasets.push({
            label: metrics[i],
            data: dataMap[metrics[i]].values,
          });
        }
      }
    }
  }
  
  return chartData;
};

// Get demo data for widget preview
export const getWidgetPreviewData = (widgetTitle: string): ChartData => {
  const demoConfig: ReportConfig = {
    metrics: ['Budget Utilization'],
    dateRange: 'Last 30 Days',
    visualization: 'Bar Chart',
    dataSources: ['Financial'],
  };
  
  if (widgetTitle.includes('Budget')) {
    demoConfig.metrics = ['Budget Utilization'];
  } else if (widgetTitle.includes('Task')) {
    demoConfig.metrics = ['Task Completion'];
  } else if (widgetTitle.includes('Risk')) {
    demoConfig.metrics = ['Risk Mitigation'];
  } else if (widgetTitle.includes('Team')) {
    demoConfig.metrics = ['Task Completion'];
  }
  
  return generateChartData(demoConfig);
}; 