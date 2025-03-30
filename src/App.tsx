import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Roadmap } from './pages/Roadmap';
import KpiFinancial from './pages/KpiFinancial';
import { RiskAnalysis } from './pages/RiskAnalysis';
import AIChat from './pages/AIChat';
import CommunicationLog from './pages/CommunicationLog';
import DocumentCenter from './pages/DocumentCenter';
import Settings from './pages/Settings';
import CustomInsights from './pages/CustomInsights'; // Import CustomInsights
import Documentation from './pages/Documentation';
import { DashboardPreview } from './components/DashboardPreview';
import { AdminVerification } from './pages/AdminVerification';
import { supabase } from './lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { Toaster } from 'react-hot-toast';
import {
  BarChart3 as BarChart3Icon,
  Calendar,
  FileText as FileTextIcon,
  Globe2,
  LayoutDashboard,
  LineChart,
  MessageSquare as MessageSquareIcon,
  Phone,
  PieChart,
  Settings as SettingsIcon,
  Shield,
  Users as UsersIcon,
  Sliders,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface FeatureProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  benefit: string;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function FeatureCard({ icon: Icon, title, description, benefit }: FeatureProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm transition-all hover:shadow-lg">
      <div className="absolute inset-0 feature-gradient opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
            <Icon className="h-6 w-6 text-violet-600" />
          </div>
        </div>
        <h3 className="mb-3 text-xl font-semibold">{title}</h3>
        <p className="mb-4 text-gray-600">{description}</p>
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">Why It Matters:</span> {benefit}
          </p>
        </div>
      </div>
    </div>
  );
}

function HomePage() {
  // Mock data similar to what's in Dashboard.tsx
  const programStats = {
    budget: { total: 1250000, spent: 450000, remaining: 800000 },
    tasks: { total: 124, completed: 78, inProgress: 32, notStarted: 14 },
    risks: { total: 18, high: 3, medium: 7, low: 8 },
    timeline: { daysElapsed: 45, daysRemaining: 75, percentComplete: 38 }
  };

  // Mock data for KPIs
  const kpiData = [
    { id: 1, name: 'Budget Utilization', value: '36%', trend: 'up', change: '4%' },
    { id: 2, name: 'Timeline Progress', value: '38%', trend: 'up', change: '2%' },
    { id: 3, name: 'Task Completion', value: '63%', trend: 'up', change: '5%' },
    { id: 4, name: 'Risk Mitigation', value: '72%', trend: 'down', change: '3%' }
  ];

  // Mock data for upcoming milestones
  const upcomingMilestones = [
    { id: 1, title: 'Vendor Selection Finalized', date: 'Jun 15, 2025', status: 'on-track' },
    { id: 2, title: 'Prototype Testing Complete', date: 'Jun 28, 2025', status: 'at-risk' },
    { id: 3, title: 'Stakeholder Review Meeting', date: 'Jul 10, 2025', status: 'on-track' }
  ];

  return (
    <div className="min-h-screen bg-white pt-16">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 gradient-bg opacity-5" />
        <div className="relative">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Dashboard Preview */}
              <div className="bg-gray-50 rounded-xl shadow-lg overflow-hidden">
                {/* Dashboard Header */}
                <div className="bg-gray-900 p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Program Overview</h2>
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center">
                        <UsersIcon className="h-5 w-5 text-violet-600" />
                      </div>
                      <span className="text-sm font-medium">Program Manager</span>
                    </div>
                  </div>
                </div>

                {/* KPI Overview */}
                <div className="grid grid-cols-2 gap-4 p-4">
                  {kpiData.map(kpi => (
                    <div key={kpi.id} className="bg-white rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-500">{kpi.name}</p>
                          <p className="text-xl font-bold mt-1">{kpi.value}</p>
                        </div>
                        <div className={`flex items-center ${kpi.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                          {kpi.trend === 'up' ? 
                            <ArrowUpRight className="h-4 w-4" /> : 
                            <ArrowDownRight className="h-4 w-4" />
                          }
                          <span className="text-xs font-medium ml-1">{kpi.change}</span>
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${kpi.trend === 'up' ? 'bg-green-500' : 'bg-red-500'}`} 
                          style={{ width: kpi.value }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Timeline Progress */}
                <div className="p-4 border-t border-gray-100">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-semibold">Timeline Progress</h3>
                      <p className="text-xs text-gray-500">{programStats.timeline.daysElapsed + programStats.timeline.daysRemaining} days total</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="relative h-16 w-16">
                        <svg className="h-full w-full" viewBox="0 0 100 100">
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="45" 
                            fill="none" 
                            stroke="#f3f4f6" 
                            strokeWidth="10"
                          />
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="45" 
                            fill="none" 
                            stroke="#8b5cf6" 
                            strokeWidth="10"
                            strokeDasharray="283"
                            strokeDashoffset={283 * (1 - programStats.timeline.percentComplete / 100)}
                            transform="rotate(-90 50 50)"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <span className="text-lg font-bold">{programStats.timeline.percentComplete}%</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-500">Days Elapsed</p>
                            <p className="text-sm font-bold">{programStats.timeline.daysElapsed}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-500">Remaining</p>
                            <p className="text-sm font-bold">{programStats.timeline.daysRemaining}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upcoming Milestones */}
                <div className="p-4 border-t border-gray-100">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="text-sm font-semibold mb-3">Upcoming Milestones</h3>
                    <div className="space-y-3">
                      {upcomingMilestones.map((milestone) => (
                        <div key={milestone.id} className="flex items-center p-2 rounded-md bg-gray-50">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            milestone.status === 'on-track' ? 'bg-green-100' : 'bg-orange-100'
                          } mr-3`}>
                            <Calendar className={`h-4 w-4 ${
                              milestone.status === 'on-track' ? 'text-green-600' : 'text-orange-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{milestone.title}</p>
                            <p className="text-xs text-gray-500">{milestone.date}</p>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            milestone.status === 'on-track' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {milestone.status === 'on-track' ? 'On Track' : 'At Risk'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Text Content */}
              <div className="flex flex-col justify-center">
                <h1 className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl">
                  Revolutionize Your Program Management
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
                  Discover ProgramMatrix—the all-in-one, self-contained suite that empowers you to plan,
                  execute, and optimize every aspect of your programs from one intuitive dashboard.
                </p>
                <div className="mt-10 flex flex-col items-center sm:flex-row gap-4">
                  <button className="inline-flex h-12 items-center justify-center rounded-full bg-gray-900 px-8 text-sm font-medium text-white transition-colors hover:bg-gray-700">
                    Get Started
                  </button>
                  <button className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-gray-900 ring-1 ring-gray-900/10 transition-colors hover:bg-gray-50 hover:ring-gray-900/20">
                    Watch Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Overview Section */}
      <section className="relative">
        <div className="absolute inset-0 gradient-bg" />
        <div className="relative">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center text-white">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Welcome to ProgramMatrix
              </h2>
              <p className="mt-6 text-lg leading-8 text-violet-100">
                ProgramMatrix is built exclusively for program managers who demand a 360° view of their
                programs. From strategic roadmapping to detailed financial oversight, risk management, and
                beyond, manage every detail in one secure, customizable platform—no external integrations
                required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 bg-gray-50/50" />
        <div className="relative">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Key Features</h2>
              <p className="mt-4 text-lg text-gray-600">
                Everything you need to manage complex programs, all in one place.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-7xl gap-8 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={FileTextIcon}
                title="All-in-One Data Entry & Management"
                description="Capture every program detail—from tasks and milestones to budgets and stakeholder feedback—directly within the app."
                benefit="Maintain a single source of truth with complete control over your data."
              />
              <FeatureCard
                icon={Calendar}
                title="Dynamic Program Roadmapping"
                description="Build and adjust visual roadmaps that highlight key initiatives, dependencies, and timelines."
                benefit="Stay agile and keep your team aligned with a clear, visual strategic plan."
              />
              <FeatureCard
                icon={LineChart}
                title="Scenario Planning & What-If Analysis"
                description="Simulate various scenarios by tweaking variables like resource allocation and budget."
                benefit="Empower data-driven decision-making to foresee challenges and seize opportunities."
              />
              <FeatureCard
                icon={BarChart3Icon}
                title="Integrated Financial Management"
                description="Track budgets, forecast costs, and monitor actual versus planned expenditures."
                benefit="Gain real-time insights into your program's fiscal health for better financial planning."
              />
              <FeatureCard
                icon={Shield}
                title="Risk & Opportunity Tracker"
                description="Log potential risks and opportunities along with their estimated impact and likelihood."
                benefit="Proactively mitigate risks and capitalize on opportunities with built-in analysis tools."
              />
              <FeatureCard
                icon={UsersIcon}
                title="Stakeholder Engagement"
                description="Record stakeholder feedback, meeting notes, and decision logs in a centralized location."
                benefit="Enhance transparency and ensure every voice is heard throughout the program lifecycle."
              />
              <FeatureCard
                icon={LayoutDashboard}
                title="Customizable Dashboards"
                description="Tailor dashboards to display the KPIs and metrics that matter most to your program."
                benefit="Turn raw data into actionable insights that drive strategic decisions."
              />
              <FeatureCard
                icon={MessageSquareIcon}
                title="Collaboration Repository"
                description="Organize and store all program-related documents in one accessible repository."
                benefit="Improve team collaboration by keeping every essential file at your fingertips."
              />
              <FeatureCard
                icon={SettingsIcon}
                title="Strategy Alignment"
                description="Visualize how individual projects contribute to overarching organizational goals."
                benefit="Ensure every initiative is aligned with your strategic vision for maximum impact."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
              Choose the Right Plan for Your Program Management Needs
            </h2>
            <p className="text-lg text-gray-600">
              Flexible pricing options designed to scale with your team—from individual users to enterprise-level organizations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Free</h3>
                <p className="text-violet-600 font-medium mb-6">
                  Ideal For: Individual users and small teams getting started
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Access to all standard modules</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Document Upload module not available</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Limited email and community support</span>
                  </li>
                </ul>
                <div className="space-y-3">
                  <Link
                    to="/signup"
                    className="block w-full bg-violet-600 text-white text-center py-3 px-4 rounded-lg hover:bg-violet-700 transition-colors duration-200"
                  >
                    Get Started
                  </Link>
                  <button
                    onClick={() => window.open('https://programmatrix.lemonsqueezy.com/buy/22cc536d-8562-49d1-853f-bbb4a7b997ab', '_blank')}
                    className="block w-full bg-green-100 text-green-700 text-center py-3 px-4 rounded-lg hover:bg-green-200 transition-colors duration-200"
                  >
                    Contribute
                  </button>
                </div>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden relative">
              <div className="absolute top-0 right-0 bg-violet-600 text-white px-4 py-1 rounded-bl-lg text-sm font-medium">
                Coming Soon...
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Pro</h3>
                <p className="text-violet-600 font-medium mb-6">
                  Ideal For: Growing teams needing enhanced functionality
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$5</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Everything in Free</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Document Upload module</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Request specific modules</span>
                  </li>
                </ul>
                <Link
                  to="/signup?plan=pro"
                  className="block w-full bg-violet-600 text-white text-center py-3 px-4 rounded-lg hover:bg-violet-700 transition-colors duration-200"
                >
                  Coming Soon...
                </Link>
              </div>
            </div>

            {/* Executive Plan */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Executive</h3>
                <p className="text-violet-600 font-medium mb-6">
                  Ideal For: Enterprise-level organizations with custom needs
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Tailored modules for your company</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Deployed in your environment</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Dedicated Admin modules</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Full white-glove support</span>
                  </li>
                </ul>
                <button
                  onClick={() => window.location.href = 'mailto:balaramakrishnasaikarumanchi0@gmail.com?subject=Executive Plan Inquiry'}
                  className="block w-full bg-gray-900 text-white text-center py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors duration-200"
                >
                  Get In Touch
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Welcome to Your Dashboard
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Once you log in, you'll enter a personalized workspace designed to give you a real-time,
                comprehensive overview of your entire program.
              </p>
            </div>
            <div className="mt-16">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative">
        <div className="absolute inset-0 gradient-bg" />
        <div className="relative">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Get Started Today!
              </h2>
              <p className="mt-6 text-lg leading-8 text-violet-100">
                Experience the power of holistic program management with ProgramMatrix. Whether you're
                planning, executing, or analyzing, our platform gives you the tools you need to drive
                success—on your terms.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <button className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50">
                  Sign Up Now
                </button>
                <button className="inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-medium text-white ring-1 ring-white/20 transition-colors hover:bg-white/10">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-lg font-semibold text-white">ProgramMatrix</h3>
              <p className="mt-4 text-sm text-gray-400">
                Your all-in-one solution for comprehensive program management.
              </p>
            </div>
            <div>
              <h4 className="text-base font-semibold text-white">Features</h4>
              <ul className="mt-4 space-y-2 text-sm text-gray-400">
                <li>Roadmapping</li>
                <li>Financial Management</li>
                <li>Risk Analysis</li>
                <li>Stakeholder Management</li>
              </ul>
            </div>
            <div>
              <h4 className="text-base font-semibold text-white">Resources</h4>
              <ul className="mt-4 space-y-2 text-sm text-gray-400">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Blog</li>
                <li>Case Studies</li>
              </ul>
            </div>
            <div>
              <h4 className="text-base font-semibold text-white">Contact</h4>
              <ul className="mt-4 space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Globe2 className="h-4 w-4" /> https://program-matrix.vercel.app/
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> +91 94927 06718
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 text-center">
            <p className="text-sm text-gray-400">&copy; 2025 ProgramMatrix. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user as User | null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

const ADMIN_EMAIL = 'balaramakrishnasaikarumanchi0@gmail.com';

interface AdminRouteProps {
  children: React.ReactNode;
}

function AdminRoute({ children }: AdminRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return user?.email === ADMIN_EMAIL ? children : <Navigate to="/" />;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<><Navbar /><HomePage /></>} />
        <Route path="/login" element={<><Navbar /><Login /></>} />
        <Route path="/signup" element={<><Navbar /><Signup /></>} />
        <Route
          path="/admin/verification"
          element={
            <AdminRoute>
              <Navbar />
              <AdminVerification />
            </AdminRoute>
          }
        />
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/roadmap"
          element={
            <ProtectedRoute>
              <Navbar />
              <Roadmap />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kpi"
          element={
            <ProtectedRoute>
              <Navbar />
              <KpiFinancial />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scenario-planning"
          element={
            <ProtectedRoute>
              <Navbar />
              <RiskAnalysis />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-chat"
          element={
            <ProtectedRoute>
              <AIChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/communication-log"
          element={
            <ProtectedRoute>
              <Navbar />
              <CommunicationLog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/document-center"
          element={
            <ProtectedRoute>
              <Navbar />
              <DocumentCenter />
            </ProtectedRoute>
          }
        />
         <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Navbar />
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/custom-insights"
          element={
            <ProtectedRoute>
              <Navbar />
              <CustomInsights />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documentation"
          element={
            <ProtectedRoute>
              <Documentation />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
