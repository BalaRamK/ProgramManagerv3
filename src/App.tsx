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
import CustomInsights from './pages/CustomInsights';
import Documentation from './pages/Documentation';
import NewDocumentation from './pages/NewDocumentation';
import { DashboardPreview } from './components/DashboardPreview';
import { AdminVerification } from './pages/AdminVerification';
import { Pricing } from './pages/Pricing';
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
import { OrganizationUserSettings } from './pages/OrganizationUserSettings';
import NavNotificationBar from './components/NavNotificationBar';
import { Features } from './pages/Features';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

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
  // Mock data used in the preview components remains the same
  const programStats = {
    budget: { total: 1250000, spent: 450000, remaining: 800000 },
    tasks: { total: 124, completed: 78, inProgress: 32, notStarted: 14 },
    risks: { total: 18, high: 3, medium: 7, low: 8 },
    timeline: { daysElapsed: 45, daysRemaining: 75, percentComplete: 38 }
  };
  const kpiData = [
    { id: 1, name: 'Budget Utilization', value: '36%', trend: 'up', change: '4%' },
    { id: 2, name: 'Timeline Progress', value: '38%', trend: 'up', change: '2%' },
    { id: 3, name: 'Task Completion', value: '63%', trend: 'up', change: '5%' },
    { id: 4, name: 'Risk Mitigation', value: '72%', trend: 'down', change: '3%' }
  ];
  const upcomingMilestones = [
    { id: 1, title: 'Vendor Selection Finalized', date: 'Jun 15, 2025', status: 'on-track' },
    { id: 2, title: 'Prototype Testing Complete', date: 'Jun 28, 2025', status: 'at-risk' },
    { id: 3, title: 'Stakeholder Review Meeting', date: 'Jul 10, 2025', status: 'on-track' }
  ];

  // Helper component for feature highlights
  const FeatureHighlight = ({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>, title: string, description: string }) => (
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center">
        <Icon className="h-6 w-6 text-violet-600" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-gray-600">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gray-50 py-20 sm:py-28 lg:py-32">
        <div className="absolute inset-0 gradient-bg opacity-5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Text Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Stop Juggling Tools.</span>
                <span className="block bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent mt-1">
                  Manage Your Entire Program Here.
                </span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600 max-w-xl mx-auto lg:mx-0">
                ProgramMatrix offers a unified, self-contained platform for program managers. Plan, track, analyze, and report on every aspect of your program—from high-level strategy to detailed financials—all in one place.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-violet-600 px-8 py-3 text-base font-medium text-white hover:bg-violet-700 transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  Get Started Free
                </Link>
                <Link
                  to="/features"
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-8 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200 shadow-sm"
                >
                  Explore Features
                </Link>
              </div>
              <p className="mt-6 text-sm text-gray-500">No credit card required.</p>
            </div>

            {/* Right Column - Dashboard Preview */}
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 p-4 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
               {/* Mini Dashboard Header */}
               <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                       <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center ring-2 ring-violet-200">
                         <LayoutDashboard className="h-5 w-5 text-violet-600" />
                       </div>
                       <h2 className="text-lg font-semibold text-gray-800">Program Dashboard</h2>
                  </div>
                   <span className="text-xs font-medium text-gray-400 italic">Sample View</span>
               </div>

               {/* KPI Row */}
               <div className="grid grid-cols-2 gap-4 mb-4">
                 {kpiData.map(kpi => (
                   <div key={kpi.id} className="bg-gray-50 rounded-lg p-3 shadow-sm border border-gray-100">
                     <p className="text-xs font-medium text-gray-500 truncate">{kpi.name}</p>
                     <div className="flex items-baseline justify-between mt-1">
                       <p className="text-lg font-bold text-gray-900">{kpi.value}</p>
                       <div className={`flex items-center text-xs font-medium ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                         {kpi.trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                         <span>{kpi.change}</span>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>

               {/* Timeline & Milestones Section */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Timeline */}
                 <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                     <div className="flex justify-between items-center mb-2">
                       <h3 className="text-sm font-semibold text-gray-700">Timeline Progress</h3>
                       <span className="text-sm font-bold text-violet-600">{programStats.timeline.percentComplete}%</span>
                     </div>
                     <div className="w-full bg-gray-200 rounded-full h-2.5">
                       <div className="bg-gradient-to-r from-violet-500 to-indigo-600 h-2.5 rounded-full" style={{ width: `${programStats.timeline.percentComplete}%` }}></div>
                     </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>{programStats.timeline.daysElapsed} Days Elapsed</span>
                        <span>{programStats.timeline.daysRemaining} Days Remaining</span>
                      </div>
                 </div>

                 {/* Upcoming Milestones */}
                 <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 h-full">
                   <h3 className="text-sm font-semibold text-gray-700 mb-3">Upcoming Milestones</h3>
                   <div className="space-y-2">
                     {upcomingMilestones.slice(0, 2).map((milestone) => ( // Show 2 milestones
                       <div key={milestone.id} className="flex items-center">
                         <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center mr-2 ${
                           milestone.status === 'on-track' ? 'bg-green-100' : 'bg-orange-100'
                         }`}>
                           <Calendar className={`h-3.5 w-3.5 ${
                             milestone.status === 'on-track' ? 'text-green-600' : 'text-orange-600'
                           }`} />
                         </div>
                         <div className="flex-1 text-xs">
                           <p className="font-medium text-gray-700 truncate">{milestone.title}</p>
                           <p className="text-gray-500">{milestone.date}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </header>

      {/* Problem / Why ProgramMatrix Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Tired of Disconnected Program Data?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Managing complex programs often means juggling spreadsheets, documents across different drives, endless email chains, and specialized tools for finance, risk, and planning. This fragmentation leads to missed insights, delayed decisions, and strategic misalignment.
            </p>
            <p className="mt-4 text-lg leading-8 text-gray-600 font-medium text-violet-700">
              ProgramMatrix replaces the chaos with a single source of truth.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              One Platform, Complete Control
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Explore the integrated modules designed to streamline every phase of your program lifecycle.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            <FeatureHighlight
              icon={LayoutDashboard}
              title="Unified Dashboard"
              description="Get a 360° view of program health, KPIs, risks, and milestones in one customizable interface."
            />
            <FeatureHighlight
              icon={Calendar}
              title="Dynamic Roadmapping"
              description="Visualize timelines, dependencies, and strategic initiatives. Easily adjust plans as things change."
            />
            <FeatureHighlight
              icon={LineChart} /* Or PieChart */
              title="KPI & Financial Tracking"
              description="Monitor profits, RoI, track costs and revenue, and generate financial reports."
            />
            <FeatureHighlight
              icon={Shield}
              title="Risk Planning"
              description="Identify, assess, and mitigate risks. Monitor closed risks and plan to mitigate existing ones with color coding."
            />
             <FeatureHighlight
              icon={FileTextIcon}
              title="Document Center"
              description="Centralize all program-related documents. Keep everything organized and accessible."
            />
             <FeatureHighlight
              icon={MessageSquareIcon} /* Or UsersIcon */
              title="Communication & Stakeholders"
              description="Log meeting notes, decisions, and stakeholder feedback to maintain alignment."
            />
            <FeatureHighlight
              icon={Sliders} /* Or Globe2 */
              title="Custom Insights & AI Chat"
              description="Leverage AI assistance for data analysis and suggestions. Don't shy away to ask questions."
            />
             <FeatureHighlight
              icon={SettingsIcon}
              title="Customized Dashboards"
              description="Generate tailored reports. Share, Export and Schedule reports in bulk according to program needs."
            />
             <FeatureHighlight
              icon={UsersIcon} /* Reuse for Org Settings */
              title="Organization & User Management"
              description="Manage team access, roles, and permissions securely (Admin functionality)."
            />
          </div>
        </div>
      </section>

      {/* Benefits Section (How it Helps) */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Unlock Program Success
              </h2>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                ProgramMatrix empowers you to move faster, make smarter decisions, and keep everyone aligned.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 mb-4">
                        <Globe2 className="h-6 w-6 text-violet-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Gain Total Visibility</h3>
                    <p className="text-gray-600">Understand program status instantly with integrated data and dashboards.</p>
                </div>
                <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 mb-4">
                        <ArrowUpRight className="h-6 w-6 text-violet-600" /> {/* Or similar icon for decision */}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Make Data-Driven Decisions</h3>
                    <p className="text-gray-600">Leverage real-time insights, forecasts, and scenario analysis.</p>
                </div>
                 <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 mb-4">
                        <UsersIcon className="h-6 w-6 text-violet-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Enhance Collaboration</h3>
                    <p className="text-gray-600">Keep stakeholders informed and documents centralized for seamless teamwork.</p>
                </div>
            </div>
        </div>
      </section>

      {/* Social Proof Section - Temporarily Hidden */}
      {/*
      <section className="py-12 bg-violet-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-semibold">Trusted by Leading Program Managers</h3>
          <p className="mt-2 opacity-80">(Social proof/logos coming soon!)</p>
        </div>
      </section>
      */}

      {/* Pricing Section */}
      <section className="relative py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600">
              Choose the plan that fits your needs. Start free, scale as you grow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100">
              <div className="p-8 flex flex-col h-full">
                 <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                    <p className="text-gray-500 mb-6">
                      For individuals and small teams getting started.
                    </p>
                    <p className="text-4xl font-bold mb-6">$0</p>
                    <ul className="space-y-3 text-sm text-gray-600 mb-8">
                      <li className="flex items-center">
                        <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Core Modules Included (Roadmap, KPI, Risk, etc.)
                      </li>
                      <li className="flex items-center">
                        <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Community & Email Support
                      </li>
                      <li className="flex items-center">
                        <svg className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                        Excludes Document Upload Module
                      </li>
                       <li className="flex items-center">
                        <svg className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                        Excludes AI Chat Features
                      </li>
                    </ul>
                 </div>
                <div className="mt-auto">
                  <Link
                    to="/signup"
                    className="block w-full bg-violet-600 text-white text-center py-3 px-4 rounded-lg hover:bg-violet-700 transition-colors duration-200 font-medium"
                  >
                    Sign Up Free
                  </Link>
                </div>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden relative border-2 border-violet-600">
              <div className="absolute top-0 right-0 bg-violet-600 text-white px-4 py-1 rounded-bl-lg text-sm font-medium shadow">
                Coming Soon
              </div>
              <div className="p-8 flex flex-col h-full">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                    <p className="text-gray-500 mb-6">
                      For growing teams needing full capabilities.
                    </p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold">$5</span>
                      <span className="text-gray-600"> / user / month</span>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-600 mb-8">
                      <li className="flex items-center">
                        <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Everything in Free, plus:
                      </li>
                       <li className="flex items-center">
                        <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Document Upload Module
                      </li>
                      <li className="flex items-center">
                        <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        AI Chat Features
                      </li>
                       <li className="flex items-center">
                        <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Priority Support
                      </li>
                      <li className="flex items-center">
                        <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Ability to Request Modules
                      </li>
                    </ul>
                </div>
                <div className="mt-auto">
                    <button
                      disabled // Disable button as it's coming soon
                      className="block w-full bg-violet-600 text-white text-center py-3 px-4 rounded-lg font-medium cursor-not-allowed opacity-50"
                    >
                     Get Notified
                    </button>
                </div>
              </div>
            </div>

            {/* Executive Plan */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100">
              <div className="p-8 flex flex-col h-full">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Executive</h3>
                    <p className="text-gray-500 mb-6">
                      For large organizations with custom deployment needs.
                    </p>
                    <p className="text-4xl font-bold mb-6">Custom</p>
                    <ul className="space-y-3 text-sm text-gray-600 mb-8">
                      <li className="flex items-center">
                        <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Everything in Pro, plus:
                      </li>
                      <li className="flex items-center">
                        <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Tailored Modules & Features
                      </li>
                      <li className="flex items-center">
                         <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        On-Premise or Private Cloud Deployment
                      </li>
                       <li className="flex items-center">
                        <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Dedicated Admin & Security Modules
                      </li>
                      <li className="flex items-center">
                        <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        White-Glove Onboarding & Support
                      </li>
                    </ul>
                </div>
                <div className="mt-auto">
                    <button
                      onClick={() => window.location.href = 'mailto:balaramakrishnasaikarumanchi0@gmail.com?subject=Executive Plan Inquiry'}
                      className="block w-full bg-gray-800 text-white text-center py-3 px-4 rounded-lg hover:bg-gray-900 transition-colors duration-200 font-medium"
                    >
                      Contact Sales
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative bg-violet-800">
         <div className="absolute inset-0 gradient-bg opacity-20" />
         <div className="relative max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
           <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
             Ready to Streamline Your Program Management?
           </h2>
           <p className="mt-6 max-w-2xl mx-auto text-lg leading-8 text-violet-100">
             Take control of your programs with ProgramMatrix. Sign up today for free and experience the difference a unified platform can make.
           </p>
           <div className="mt-10">
             <Link
               to="/signup"
               className="inline-flex items-center justify-center rounded-md border border-transparent bg-white px-8 py-3 text-base font-medium text-violet-700 hover:bg-gray-100 transition-colors duration-200 shadow-lg"
             >
               Get Started Free Now
             </Link>
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
                 Unified Program Management. Simplified.
               </p>
             </div>
             <div>
               <h4 className="text-base font-semibold text-white">Core Features</h4>
               <ul className="mt-4 space-y-2 text-sm text-gray-400">
                 <li><Link to="/features" className="hover:text-white">Dashboard</Link></li>
                 <li><Link to="/features" className="hover:text-white">Roadmapping</Link></li>
                 <li><Link to="/features" className="hover:text-white">Financials & KPIs</Link></li>
                 <li><Link to="/features" className="hover:text-white">Risk Analysis</Link></li>
                 <li><Link to="/features" className="hover:text-white">Document Center</Link></li>
               </ul>
             </div>
             <div>
               <h4 className="text-base font-semibold text-white">Resources</h4>
               <ul className="mt-4 space-y-2 text-sm text-gray-400">
                 <li><Link to="/documentation" className="hover:text-white">Documentation</Link></li>
                 <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
                 {/* Add links if Blog/Case Studies exist */}
                 <li><span className="opacity-50">Blog & Case Studies (Coming Soon)</span></li>
                 <li><span className="opacity-50">Community (Coming Soon)</span></li>
               </ul>
             </div>
             <div>
               <h4 className="text-base font-semibold text-white">Contact</h4>
               <ul className="mt-4 space-y-2 text-sm text-gray-400">
                 <li className="flex items-center gap-2">
                   <MessageSquareIcon className="h-4 w-4" />
                   <a href="mailto:balaramakrishnasaikarumanchi0@gmail.com" className="hover:text-white">Email Support</a>
                 </li>
                 {/* <li className="flex items-center gap-2">
                   <Phone className="h-4 w-4" /> +91 94927 06718
                 </li> */}
               </ul>
             </div>
           </div>
           <div className="mt-8 border-t border-gray-800 pt-8 text-center">
             <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} ProgramMatrix. All rights reserved.</p>
           </div>
         </div>
      </footer>

    </div>
  );
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <NotificationProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <NavNotificationBar />
          <Toaster position="top-right"/>
          <Routes>
            <Route path="/" element={<><Navbar /><HomePage /></>} />
            <Route path="/login" element={<><Navbar /><Login /></>} />
            <Route path="/signup" element={<><Navbar /><Signup /></>} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<><Navbar /><Pricing /></>} />
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
                  <OrganizationUserSettings />
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
                  <NewDocumentation />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App;
