import React, { useState, useEffect } from 'react';
import { format, parseISO, addMonths, startOfYear, endOfYear } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  Search,
  Move,
  ZoomIn,
  ZoomOut,
  MessageSquare
} from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

interface Milestone {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'at-risk' | 'delayed';
  owner: string;
  progress: number;
  tasks: Task[];
  dependencies: string[];
  comments: Comment[];
  resources: Resource[];
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

interface Resource {
  id: string;
  name: string;
  role: string;
}

interface Initiative {
  id: string;
  name: string;
  milestones: Milestone[];
}

interface TimeRange {
  start: Date;
  end: Date;
}

interface TimePeriod {
  id: string;
  label: string;
  subLabel: string;
  start: Date;
  end: Date;
}

// Sample data
const initialInitiatives: Initiative[] = [
  {
    id: '1',
    name: 'Product Development',
    milestones: [
      {
        id: 'm1',
        title: 'Requirements Gathering',
        description: 'Collect and analyze project requirements',
        startDate: '2025-01-15',
        endDate: '2025-02-28',
        status: 'completed',
        owner: 'John Doe',
        progress: 100,
        tasks: [
          { id: 't1', title: 'Stakeholder interviews', completed: true },
          { id: 't2', title: 'Document requirements', completed: true }
        ],
        dependencies: [],
        comments: [
          {
            id: 'c1',
            author: 'John Doe',
            text: 'All requirements have been documented',
            timestamp: '2025-02-28T10:00:00Z'
          }
        ],
        resources: [
          { id: 'r1', name: 'John Doe', role: 'Product Manager' }
        ]
      },
      {
        id: 'm2',
        title: 'Design Phase',
        description: 'Create detailed design specifications',
        startDate: '2025-03-01',
        endDate: '2025-04-15',
        status: 'in-progress',
        owner: 'Jane Smith',
        progress: 60,
        tasks: [
          { id: 't3', title: 'UI/UX Design', completed: true },
          { id: 't4', title: 'Technical Architecture', completed: false }
        ],
        dependencies: ['m1'],
        comments: [],
        resources: [
          { id: 'r2', name: 'Jane Smith', role: 'Lead Designer' }
        ]
      }
    ]
  }
];

function SortableMilestone({ milestone, onClick, isSelected, showDetailView }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: milestone.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        relative p-3 rounded-lg shadow-sm cursor-move
        ${milestone.status === 'completed' ? 'bg-green-50 border border-green-200' :
          milestone.status === 'in-progress' ? 'bg-blue-50 border border-blue-200' :
          milestone.status === 'at-risk' ? 'bg-orange-50 border border-orange-200' :
          milestone.status === 'delayed' ? 'bg-red-50 border border-red-200' :
          'bg-gray-50 border border-gray-200'}
        ${isSelected ? 'ring-2 ring-violet-500' : ''}
      `}
      onClick={onClick}
    >
      <h4 className="font-medium text-sm mb-1">{milestone.title}</h4>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">
          {format(parseISO(milestone.startDate), 'MMM d')}
        </span>
        <span className={`
          px-2 py-0.5 rounded-full
          ${milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
            milestone.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
            milestone.status === 'at-risk' ? 'bg-orange-100 text-orange-800' :
            milestone.status === 'delayed' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'}
        `}>
          {milestone.status.replace('-', ' ')}
        </span>
      </div>
    </div>
  );
}

function MilestoneDetailView({ milestone, onClose, onEdit, onDelete }) {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50">
      <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl">
        <div className="h-full flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{milestone.title}</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close panel</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-2 text-sm text-gray-900">{milestone.description}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Timeline</h3>
                <div className="mt-2 text-sm text-gray-900">
                  <p>Start: {format(parseISO(milestone.startDate), 'MMM d, yyyy')}</p>
                  <p>End: {format(parseISO(milestone.endDate), 'MMM d, yyyy')}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Tasks</h3>
                <div className="mt-2 space-y-2">
                  {milestone.tasks.map(task => (
                    <div key={task.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        className="h-4 w-4 text-violet-600 rounded"
                        readOnly
                      />
                      <span className="ml-2 text-sm text-gray-900">{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Comments</h3>
                <div className="mt-2 space-y-4">
                  {milestone.comments.map(comment => (
                    <div key={comment.id} className="text-sm">
                      <div className="font-medium text-gray-900">{comment.author}</div>
                      <div className="text-gray-700">{comment.text}</div>
                      <div className="text-xs text-gray-500">
                        {format(parseISO(comment.timestamp), 'MMM d, yyyy HH:mm')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex space-x-3">
              <button
                onClick={() => onEdit(milestone)}
                className="flex-1 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-md hover:bg-violet-700"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(milestone.id)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Roadmap() {
  const [initiatives, setInitiatives] = useState<Initiative[]>(initialInitiatives);
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: startOfYear(new Date()),
    end: endOfYear(new Date())
  });
  const [currentView, setCurrentView] = useState<'quarters' | 'months'>('quarters');
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipText, setTooltipText] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Generate time periods based on current view
  const timePeriods: TimePeriod[] = React.useMemo(() => {
    const periods: TimePeriod[] = [];
    let current = timeRange.start;
    let index = 0;

    while (current < timeRange.end) {
      const start = current;
      const end = currentView === 'quarters'
        ? addMonths(start, 3)
        : addMonths(start, 1);

      periods.push({
        id: `period-${index}`,
        label: currentView === 'quarters'
          ? `Q${Math.floor(start.getMonth() / 3) + 1}`
          : format(start, 'MMM'),
        subLabel: format(start, 'yyyy'),
        start,
        end
      });

      current = end;
      index++;
    }

    return periods;
  }, [timeRange, currentView]);

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    // Handle milestone repositioning logic here
  };

  const handleMilestoneClick = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setShowDetailView(true);
  };

  const handleMilestoneEdit = (milestone: Milestone) => {
    // Implement milestone editing logic
  };

  const handleMilestoneDelete = (milestoneId: string) => {
    // Implement milestone deletion logic
  };

  const navigateTimeline = (direction: 'prev' | 'next') => {
    const months = currentView === 'quarters' ? 3 : 1;
    setTimeRange(prev => ({
      start: direction === 'prev' ? addMonths(prev.start, -months) : addMonths(prev.start, months),
      end: direction === 'prev' ? addMonths(prev.end, -months) : addMonths(prev.end, months)
    }));
  };

  const getMilestonePosition = (milestone: Milestone) => {
    // Calculate position based on dates and timeline width
    // This would be implemented with actual positioning logic
    return {
      left: '10%',
      width: '200px'
    };
  };

  const handleAddMilestone = () => {
    const newMilestone: Milestone = {
      id: `m${Date.now()}`,
      title: 'New Milestone',
      description: 'Add description',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
      status: 'not-started',
      owner: 'Assign Owner',
      progress: 0,
      tasks: [],
      dependencies: [],
      comments: [],
      resources: []
    };
    
    const updatedInitiatives = [...initiatives];
    updatedInitiatives[0] = {
      ...updatedInitiatives[0],
      milestones: [...updatedInitiatives[0].milestones, newMilestone]
    };
    
    setInitiatives(updatedInitiatives);
    setSelectedMilestone(newMilestone);
    setShowDetailView(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Program Roadmap</h1>
          <p className="text-gray-600">Strategic timeline and milestones for your program</p>
        </div>

        {/* Roadmap Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateTimeline('prev')}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-lg font-medium">
                {format(timeRange.start, 'MMMM yyyy')}
              </span>
              <button
                onClick={() => navigateTimeline('next')}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentView('quarters')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  currentView === 'quarters' ? 'bg-violet-100 text-violet-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Quarters
              </button>
              <button
                onClick={() => setCurrentView('months')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  currentView === 'months' ? 'bg-violet-100 text-violet-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Months
              </button>
              <button
                onClick={handleAddMilestone}
                className="ml-4 px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Milestone
              </button>
            </div>
          </div>
        </div>

        {/* Timeline View */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="p-6">
              {initiatives.map(initiative => (
                <div key={initiative.id} className="mb-8">
                  <h3 className="text-lg font-medium mb-4">{initiative.name}</h3>
                  <div className="relative">
                    <SortableContext items={initiative.milestones.map(m => m.id)}>
                      <div className="space-y-4">
                        {initiative.milestones.map(milestone => (
                          <SortableMilestone
                            key={milestone.id}
                            milestone={milestone}
                            onClick={() => handleMilestoneClick(milestone)}
                            isSelected={selectedMilestone?.id === milestone.id}
                            showDetailView={showDetailView}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                </div>
              ))}
            </div>
          </DndContext>
        </div>

        {/* Detail View */}
        {showDetailView && selectedMilestone && (
          <MilestoneDetailView
            milestone={selectedMilestone}
            onClose={() => {
              setShowDetailView(false);
              setSelectedMilestone(null);
            }}
            onEdit={handleMilestoneEdit}
            onDelete={handleMilestoneDelete}
          />
        )}
      </div>
    </div>
  );
}
