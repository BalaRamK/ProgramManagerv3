import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

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

interface ReportChartProps {
  type: 'Bar Chart' | 'Line Chart' | 'Pie Chart';
  data: ChartData;
  title?: string;
  height?: number;
}

const generateColors = (count: number): string[] => {
  const colors = [
    'rgba(75, 192, 192, 0.6)',
    'rgba(54, 162, 235, 0.6)',
    'rgba(153, 102, 255, 0.6)',
    'rgba(255, 99, 132, 0.6)',
    'rgba(255, 159, 64, 0.6)',
    'rgba(255, 205, 86, 0.6)',
    'rgba(201, 203, 207, 0.6)',
  ];
  
  return Array(count).fill(0).map((_, i) => colors[i % colors.length]);
};

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
};

const ReportChart: React.FC<ReportChartProps> = ({ type, data, title, height = 300 }) => {
  // Create a deep clone of the data to avoid modifying the original
  const formattedData = JSON.parse(JSON.stringify(data));
  
  // Add colors if not provided
  formattedData.datasets.forEach((dataset: any, index: number) => {
    if (!dataset.backgroundColor) {
      if (type === 'Pie Chart') {
        dataset.backgroundColor = generateColors(formattedData.labels.length);
      } else {
        dataset.backgroundColor = generateColors(1)[0];
      }
    }
    
    if (!dataset.borderColor && type === 'Line Chart') {
      dataset.borderColor = dataset.backgroundColor;
      dataset.backgroundColor = 'rgba(0, 0, 0, 0.1)';
    }
    
    if (!dataset.borderWidth) {
      dataset.borderWidth = 1;
    }
  });
  
  const options = {
    ...defaultOptions,
    plugins: {
      ...defaultOptions.plugins,
      title: {
        display: !!title,
        text: title || '',
      },
    },
  };
  
  const chartStyle = { height: `${height}px` };
  
  switch (type) {
    case 'Bar Chart':
      return <div style={chartStyle}><Bar data={formattedData} options={options} /></div>;
    case 'Line Chart':
      return <div style={chartStyle}><Line data={formattedData} options={options} /></div>;
    case 'Pie Chart':
      return <div style={chartStyle}><Pie data={formattedData} options={options} /></div>;
    default:
      return <div>Unsupported chart type</div>;
  }
};

export default ReportChart; 