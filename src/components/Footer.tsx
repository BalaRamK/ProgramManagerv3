import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare as MessageSquareIcon } from 'lucide-react';

const Footer = () => {
  return (
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
              <li><Link to="/license" className="hover:text-white">License</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
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
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-800 pt-8 text-center">
          <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} ProgramMatrix. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 