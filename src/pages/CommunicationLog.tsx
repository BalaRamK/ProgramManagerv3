import React from 'react';
import {
  MessageSquare,
  Filter,
  PlusCircle,
  ChevronDown,
  Edit,
  MessageCircle,
} from 'lucide-react';

const CommunicationLog = () => {
  // Placeholder data for communication logs
  const logs = [
    {
      id: 1,
      type: 'Meeting',
      date: '2024-05-15',
      summary: 'Project Kickoff',
      details: 'Discussed project goals and initial timelines.',
      stakeholder: 'John Doe',
      relatedMilestone: 'Project Start',
      relatedRisk: 'Initial Delay',
      comments: [
        { id: 101, user: 'Jane Smith', text: 'Meeting went well!', timestamp: '2024-05-15 10:30 AM' },
      ],
    },
    {
      id: 2,
      type: 'Feedback',
      date: '2024-05-16',
      summary: 'Stakeholder Feedback',
      details: 'Received positive feedback on the initial proposal.',
      stakeholder: 'Alice Brown',
      relatedMilestone: 'Proposal Review',
      relatedRisk: 'N/A',
      comments: [],
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <MessageSquare className="mr-2" /> Communication Log
      </h1>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <span className="mr-2">Filter by:</span>
          <div className="relative inline-block">
            <select className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              <option>Project</option>
              <option>Stakeholder</option>
              <option>Date</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
        <button className="bg-violet-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center">
          <PlusCircle className="mr-2" /> Add Note
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {logs.map((log) => (
          <div key={log.id} className="border-b border-gray-200 last:border-none">
            <div className="p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium text-gray-900">{log.type} - {log.summary}</div>
                  <div className="text-xs text-gray-500">
                    {log.date} | Stakeholder: {log.stakeholder}
                  </div>
                </div>
                <button className="text-gray-500 hover:text-violet-600">
                  <Edit className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 text-sm text-gray-700">
                {log.details}
              </div>
              {log.relatedMilestone && (
                <div className="mt-1 text-xs text-gray-500">
                  Related Milestone: {log.relatedMilestone}
                </div>
              )}
              {log.relatedRisk && (
                <div className="text-xs text-gray-500">
                  Related Risk: {log.relatedRisk}
                </div>
              )}
              {log.comments.length > 0 && (
                <div className="mt-3">
                  {log.comments.map((comment) => (
                    <div key={comment.id} className="flex items-start mt-2">
                      <MessageCircle className="h-4 w-4 mr-2 text-gray-600" />
                      <div>
                        <div className="text-xs font-medium text-gray-700">{comment.user}</div>
                        <div className="text-xs text-gray-500">{comment.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunicationLog;
