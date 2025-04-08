import React from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  X,
  MessageSquare,
  Calendar,
  Shield,
  FileText,
  Users,
  Settings,
  Sliders,
  Globe2
} from 'lucide-react';

const PricingFeature = ({ included = true, children }: { included?: boolean; children: React.ReactNode }) => (
  <li className="flex items-center space-x-3">
    {included ? (
      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
    ) : (
      <X className="h-5 w-5 text-red-500 flex-shrink-0" />
    )}
    <span className="text-gray-600">{children}</span>
  </li>
);

const features = {
  core: [
    'Core Modules Included (Roadmap, KPI, Risk, etc.)',
    'Community & Email Support',
  ],
  pro: [
    'Everything in Free, plus:',
    'Document Upload Module',
    'AI Chat Features',
    'Priority Support',
    'Ability to Request Modules',
  ],
  executive: [
    'Everything in Pro, plus:',
    'Tailored Modules & Features',
    'On-Premise or Private Cloud Deployment',
    'Dedicated Admin & Security Modules',
    'White-Glove Onboarding & Support',
  ],
};

export function Pricing() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Simple, Transparent Pricing
            </h1>
            <p className="mt-4 text-xl text-gray-600">
              Choose the plan that fits your needs. Start free, scale as you grow.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Free</h2>
              <p className="text-gray-500 mb-6">
                For individuals and small teams getting started.
              </p>
              <p className="text-4xl font-bold mb-6">$0</p>
              <ul className="space-y-4 mb-8">
                {features.core.map((feature, index) => (
                  <PricingFeature key={index}>{feature}</PricingFeature>
                ))}
                <PricingFeature included={false}>Excludes Document Upload Module</PricingFeature>
                <PricingFeature included={false}>Excludes AI Chat Features</PricingFeature>
              </ul>
              <Link
                to="/signup"
                className="block w-full bg-violet-600 text-white text-center py-3 px-4 rounded-lg hover:bg-violet-700 transition-colors duration-200 font-medium"
              >
                Sign Up Free
              </Link>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden relative border-2 border-violet-600">
            <div className="absolute top-0 right-0 bg-violet-600 text-white px-4 py-1 rounded-bl-lg text-sm font-medium shadow">
              Coming Soon
            </div>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pro</h2>
              <p className="text-gray-500 mb-6">
                For growing teams needing full capabilities.
              </p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$5</span>
                <span className="text-gray-600"> / user / month</span>
              </div>
              <ul className="space-y-4 mb-8">
                {features.pro.map((feature, index) => (
                  <PricingFeature key={index}>{feature}</PricingFeature>
                ))}
              </ul>
              <button
                disabled
                className="block w-full bg-violet-600 text-white text-center py-3 px-4 rounded-lg font-medium cursor-not-allowed opacity-50"
              >
                Get Notified
              </button>
            </div>
          </div>

          {/* Executive Plan */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Executive</h2>
              <p className="text-gray-500 mb-6">
                For large organizations with custom deployment needs.
              </p>
              <p className="text-4xl font-bold mb-6">Custom</p>
              <ul className="space-y-4 mb-8">
                {features.executive.map((feature, index) => (
                  <PricingFeature key={index}>{feature}</PricingFeature>
                ))}
              </ul>
              <button
                onClick={() => window.location.href = 'mailto:balaramakrishnasaikarumanchi0@gmail.com?subject=Executive Plan Inquiry'}
                className="block w-full bg-gray-800 text-white text-center py-3 px-4 rounded-lg hover:bg-gray-900 transition-colors duration-200 font-medium"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">Compare Plans</h2>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Features</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Free</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Pro</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Executive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Core Modules</td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Document Upload</td>
                  <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">AI Chat Features</td>
                  <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Priority Support</td>
                  <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Custom Deployment</td>
                  <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold mb-3">How do I get started?</h3>
              <p className="text-gray-600">
                When you sign up, you're on the Free plan by default. The Free plan is designed for teams just starting out with visual collaboration: you can access core modules and features to manage your programs effectively.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold mb-3">Can I change plans later?</h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. When Pro plans become available, you'll be able to seamlessly upgrade and access additional features.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold mb-3">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit cards. For Executive plans, we can arrange alternative payment methods including bank transfers and purchase orders.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold mb-3">Do you offer special pricing for non-profits?</h3>
              <p className="text-gray-600">
                Yes, we offer special pricing for non-profit organizations. Please contact our sales team to learn more about our non-profit program.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 