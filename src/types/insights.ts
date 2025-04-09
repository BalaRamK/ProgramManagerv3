import { ReactNode } from 'react';

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

export interface ReportConfig {
  metrics: string[];
  dateRange: string;
  visualization: string;
  dataSources: string[];
}

export interface Widget {
  id: number;
  title: string;
  type: string;
  source: string;
  size: string;
}

export interface Document {
  id: number;
  name: string;
  type: string;
  size: string;
  updated: string;
  owner: string;
}

export interface AutomatedInsight {
  id: number;
  type: string;
  icon?: ReactNode;
  summary: string;
  details: string;
  severity?: string;
  category?: string;
  timestamp?: string;
}

export interface ScheduledReport {
  id: number;
  name: string;
  frequency: string;
  time: string;
  recipients: string[];
  config: ReportConfig;
  nextRunDate: string;
}

export interface ReportFile {
  id: number;
  name: string;
  format: string;
  size: string;
  generated: string;
  url: string;
} 