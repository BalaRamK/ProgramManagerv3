import { Widget, Document, AutomatedInsight, ReportConfig, ChartData } from '../types/insights.ts';

// Mock data for widgets
const mockWidgets: Widget[] = [
  { id: 1, title: 'Budget Overview', type: 'chart', source: 'Financial', size: 'medium' },
  { id: 2, title: 'Task Completion', type: 'progress', source: 'KPIs', size: 'small' },
  { id: 3, title: 'Risk Assessment', type: 'chart', source: 'Risks', size: 'medium' },
  { id: 4, title: 'Team Performance', type: 'chart', source: 'KPIs', size: 'large' },
];

// Mock data for documents
const mockDocuments: Document[] = [
  { id: 1, name: 'Project Plan.pdf', type: 'pdf', size: '2.4MB', updated: '2023-06-15', owner: 'Alice Johnson' },
  { id: 2, name: 'Budget Forecast.xlsx', type: 'excel', size: '1.8MB', updated: '2023-06-12', owner: 'Bob Smith' },
  { id: 3, name: 'Requirements Spec.docx', type: 'word', size: '3.2MB', updated: '2023-06-10', owner: 'Charlie Brown' },
  { id: 4, name: 'Risk Assessment.pdf', type: 'pdf', size: '1.5MB', updated: '2023-06-08', owner: 'Alice Johnson' },
];

// Fetch widgets
export const fetchWidgets = async (): Promise<Widget[]> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockWidgets), 500);
  });
};

// Update widget order
export const updateWidgetOrder = async (widgets: Widget[]): Promise<Widget[]> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => resolve(widgets), 500);
  });
};

// Update widget size
export const updateWidgetSize = async (id: number, size: string): Promise<Widget[]> => {
  // Simulate API call
  const updatedWidgets = mockWidgets.map(widget => 
    widget.id === id ? { ...widget, size } : widget
  );
  
  return new Promise((resolve) => {
    setTimeout(() => resolve(updatedWidgets), 500);
  });
};

// Fetch documents
export const fetchDocuments = async (): Promise<Document[]> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockDocuments), 500);
  });
};

// Upload document
export const uploadDocument = async (file: File): Promise<Document> => {
  // Simulate API call
  const newDocument: Document = {
    id: mockDocuments.length + 1,
    name: file.name,
    type: file.name.split('.').pop() || 'unknown',
    size: `${(file.size / (1024 * 1024)).toFixed(1)}MB`,
    updated: new Date().toISOString().split('T')[0],
    owner: 'Current User',
  };
  
  return new Promise((resolve) => {
    setTimeout(() => {
      mockDocuments.push(newDocument);
      resolve(newDocument);
    }, 1000);
  });
};

// Generate report
export const generateReport = async (config: ReportConfig): Promise<ChartData> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate sample data for demonstration
      const data: ChartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: config.metrics.map((metric: string) => ({
          label: metric,
          data: Array.from({ length: 6 }, () => Math.floor(Math.random() * 100))
        }))
      };
      resolve(data);
    }, 1500);
  });
};

// Schedule report
export const scheduleReport = async (
  config: ReportConfig, 
  frequency: string, 
  time: string, 
  recipients: string[]
): Promise<boolean> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 1000);
  });
};

// Export report
export const exportReport = async (format: string, config: ReportConfig): Promise<string> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`report_${Date.now()}.${format.toLowerCase()}`);
    }, 1000);
  });
};

// Share report
export const shareReport = async (emails: string[], config: ReportConfig): Promise<boolean> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 1000);
  });
};

// Fetch automated insights
export const fetchAutomatedInsights = async (): Promise<any[]> => {
  // Simulate API call with dynamic data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          type: 'Alert',
          severity: 'high',
          summary: 'Budget exceeding 80% utilization.',
          details: 'Consider reallocating resources to avoid overspending.',
          category: 'Financial',
          timestamp: new Date().toISOString(),
        },
        {
          id: 2,
          type: 'Success',
          severity: 'info',
          summary: 'Project is on track for timely completion.',
          details: 'All milestones are currently meeting their deadlines.',
          category: 'Timeline',
          timestamp: new Date().toISOString(),
        },
        {
          id: 3,
          type: 'Recommendation',
          severity: 'medium',
          summary: 'Resource allocation can be optimized.',
          details: 'Team A is currently under-utilized while Team B is over capacity.',
          category: 'Resources',
          timestamp: new Date().toISOString(),
        },
        {
          id: 4,
          type: 'Information',
          severity: 'low',
          summary: 'Stakeholder review scheduled next week.',
          details: 'Prepare presentation materials for the quarterly review.',
          category: 'Meetings',
          timestamp: new Date().toISOString(),
        },
      ]);
    }, 700);
  });
}; 