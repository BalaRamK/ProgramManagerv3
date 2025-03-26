import React, { useState, useEffect } from 'react';
import { format, parseISO, addMonths, startOfYear, endOfYear, startOfQuarter, endOfQuarter, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  Search,
  Move,
  ZoomIn,
  ZoomOut,
  MessageSquare,
  ChevronDown,
  ChevronUp
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
import { supabase } from '../lib/supabase';
import { milestoneService, Milestone } from '../lib/milestoneService';

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

interface Program {
  id: string;
  organization_id: string;
  user_id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  created_at: string;
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

interface Organization {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
}

// Sample data for milestones (this should be fetched from a separate milestones table)
const initialMilestones: Milestone[] = [
      {
        id: 'm1',
        title: 'Requirements Gathering',
        description: 'Collect and analyze project requirements',
    due_date: '2025-01-15',
        status: 'completed',
        owner: 'John Doe',
        progress: 100,
    tasks: [],
        dependencies: [],
    resources: [],
    program_id: 'p1',
    user_id: ''
      },
      {
        id: 'm2',
        title: 'Design Phase',
        description: 'Create detailed design specifications',
    due_date: '2025-03-01',
        status: 'in-progress',
        owner: 'Jane Smith',
        progress: 60,
    tasks: [],
        dependencies: ['m1'],
    resources: [],
    program_id: 'p1',
    user_id: ''
  }
];

// Add types for props in SortableMilestone and MilestoneDetailView
interface SortableMilestoneProps {
  milestone: Milestone;
  onClick: () => void;
  isSelected: boolean;
  showDetailView: boolean;
}

function SortableMilestone({ milestone, onClick, isSelected, showDetailView }: SortableMilestoneProps) {
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

  // Color coding based on status
  const statusColor = {
    'completed': 'bg-green-50 border border-green-200',
    'in-progress': 'bg-yellow-50 border border-yellow-200',
    'not-started': 'bg-red-50 border border-red-200',
    'at-risk': 'bg-orange-50 border border-orange-200',
    'delayed': 'bg-red-200 border border-red-300'
  }[milestone.status] || 'bg-gray-50 border border-gray-200';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative p-3 rounded-lg shadow-sm cursor-move ${statusColor} ${isSelected ? 'ring-2 ring-violet-500' : ''}`}
      onClick={onClick}
    >
      <h4 className="font-medium text-sm mb-1">{milestone.title}</h4>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">
          {format(parseISO(milestone.due_date), 'MMM d')}
        </span>
        <span className={`px-2 py-0.5 rounded-full ${statusColor}`}>
          {milestone.status.replace('-', ' ')}
        </span>
      </div>
    </div>
  );
}

// Add types for props in MilestoneDetailView
interface MilestoneDetailViewProps {
  milestone: Milestone;
  onClose: () => void;
  onEdit: (milestone: Milestone) => void;
  onDelete: (milestoneId: string) => void;
}

function MilestoneDetailView({ milestone, onClose, onEdit, onDelete }: MilestoneDetailViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMilestone, setEditedMilestone] = useState<Milestone>(milestone);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedMilestone(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updatedMilestone = await milestoneService.updateMilestone(editedMilestone.id, {
        title: editedMilestone.title,
        description: editedMilestone.description,
        due_date: editedMilestone.due_date,
        status: editedMilestone.status,
        owner: editedMilestone.owner,
        progress: editedMilestone.progress,
        tasks: editedMilestone.tasks,
        dependencies: editedMilestone.dependencies,
        resources: editedMilestone.resources
      });
      onEdit(updatedMilestone);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving milestone:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await milestoneService.deleteMilestone(milestone.id);
      onDelete(milestone.id);
    } catch (error) {
      console.error('Error deleting milestone:', error);
    } finally {
      setLoading(false);
    }
  };

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
                aria-label="Close panel"
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
              {isEditing ? (
                <>
              <div>
                    <label htmlFor="milestone-title" className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      id="milestone-title"
                      name="title"
                      value={editedMilestone.title}
                      onChange={handleChange}
                      className="mt-2 p-2 border border-gray-300 rounded w-full"
                      placeholder="Enter milestone title"
                    />
              </div>
              <div>
                    <label htmlFor="milestone-description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      id="milestone-description"
                      name="description"
                      value={editedMilestone.description}
                      onChange={handleChange}
                      className="mt-2 p-2 border border-gray-300 rounded w-full"
                      placeholder="Enter milestone description"
                    />
                </div>
                  <div>
                    <label htmlFor="milestone-due-date" className="block text-sm font-medium text-gray-700">Due Date</label>
                    <input
                      type="date"
                      id="milestone-due-date"
                      name="due_date"
                      value={editedMilestone.due_date}
                      onChange={handleChange}
                      className="mt-2 p-2 border border-gray-300 rounded w-full"
                    />
              </div>
              <div>
                    <label htmlFor="milestone-status" className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      id="milestone-status"
                      name="status"
                      value={editedMilestone.status}
                      onChange={handleChange}
                      className="mt-2 p-2 border border-gray-300 rounded w-full"
                    >
                      <option value="not-started">Not Started</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="at-risk">At Risk</option>
                      <option value="delayed">Delayed</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="milestone-owner" className="block text-sm font-medium text-gray-700">Owner</label>
                      <input
                      type="text"
                      id="milestone-owner"
                      name="owner"
                      value={editedMilestone.owner}
                      onChange={handleChange}
                      className="mt-2 p-2 border border-gray-300 rounded w-full"
                      placeholder="Enter milestone owner"
                    />
                    </div>
                  <div>
                    <label htmlFor="milestone-progress" className="block text-sm font-medium text-gray-700">Progress</label>
                    <input
                      type="number"
                      id="milestone-progress"
                      name="progress"
                      value={editedMilestone.progress}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      className="mt-2 p-2 border border-gray-300 rounded w-full"
                    />
                </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Description</h3>
                    <p className="mt-2 text-sm text-gray-900">{milestone.description}</p>
              </div>
              <div>
                    <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                    <p className="mt-2 text-sm text-gray-900">{format(parseISO(milestone.due_date), 'MMM d, yyyy')}</p>
                      </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <p className="mt-2 text-sm text-gray-900">{milestone.status.replace('-', ' ')}</p>
                    </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Owner</h3>
                    <p className="mt-2 text-sm text-gray-900">{milestone.owner}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Progress</h3>
                    <p className="mt-2 text-sm text-gray-900">{milestone.progress}%</p>
                  </div>
                  {milestone.tasks && milestone.tasks.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Tasks</h3>
                      <ul className="mt-2 space-y-1">
                        {milestone.tasks.map((task, index) => (
                          <li key={index} className="text-sm text-gray-900">
                            {task.title} - {task.completed ? 'Completed' : 'Pending'}
                          </li>
                        ))}
                      </ul>
                </div>
                  )}
                  {milestone.dependencies && milestone.dependencies.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Dependencies</h3>
                      <ul className="mt-2 space-y-1">
                        {milestone.dependencies.map((dep, index) => (
                          <li key={index} className="text-sm text-gray-900">{dep}</li>
                        ))}
                      </ul>
              </div>
                  )}
                  {milestone.resources && milestone.resources.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Resources</h3>
                      <ul className="mt-2 space-y-1">
                        {milestone.resources.map((resource, index) => (
                          <li key={index} className="text-sm text-gray-900">{resource.title}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex space-x-3">
              {isEditing ? (
              <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-md hover:bg-violet-700 disabled:opacity-50"
                  aria-label="Save milestone"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                className="flex-1 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-md hover:bg-violet-700"
                  aria-label="Edit milestone"
              >
                Edit
              </button>
              )}
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                aria-label="Delete milestone"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgramDetailView({ program, onClose, onEdit, onDelete }: { program: Program; onClose: () => void; onEdit: (updatedProgram: Program) => void; onDelete: (programId: string) => void; }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProgram, setEditedProgram] = useState<Program>(program);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedProgram(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    onEdit(editedProgram);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50">
      <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl">
        <div className="h-full flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{program.name}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500" aria-label="Close panel">
                <span className="sr-only">Close panel</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {isEditing ? (
                <>
                  <div>
                    <label htmlFor="program-name" className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      id="program-name"
                      name="name"
                      value={editedProgram.name}
                      onChange={handleChange}
                      className="mt-2 p-2 border border-gray-300 rounded w-full"
                      placeholder="Enter program name"
                    />
                  </div>
                  <div>
                    <label htmlFor="program-description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      id="program-description"
                      name="description"
                      value={editedProgram.description}
                      onChange={handleChange}
                      className="mt-2 p-2 border border-gray-300 rounded w-full"
                      placeholder="Enter program description"
                    />
                  </div>
                  <div>
                    <label htmlFor="program-start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      id="program-start-date"
                      name="start_date"
                      value={editedProgram.start_date}
                      onChange={handleChange}
                      className="mt-2 p-2 border border-gray-300 rounded w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="program-end-date" className="block text-sm font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      id="program-end-date"
                      name="end_date"
                      value={editedProgram.end_date}
                      onChange={handleChange}
                      className="mt-2 p-2 border border-gray-300 rounded w-full"
                      title="Program end date"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Description</h3>
                    <p className="mt-2 text-sm text-gray-900">{program.description}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                    <p className="mt-2 text-sm text-gray-900">{format(parseISO(program.start_date), 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                    <p className="mt-2 text-sm text-gray-900">{format(parseISO(program.end_date), 'MMM d, yyyy')}</p>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex space-x-3">
              {isEditing ? (
                <button onClick={handleSave} className="flex-1 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-md hover:bg-violet-700">
                  Save
                </button>
              ) : (
                <button onClick={() => setIsEditing(true)} className="flex-1 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-md hover:bg-violet-700">
                  Edit
                </button>
              )}
              <button onClick={() => onDelete(program.id)} className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50">
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
  const [programs, setPrograms] = useState<Program[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [timeRange, setTimeRange] = useState({
    start: startOfYear(new Date()),
    end: endOfYear(new Date())
  });
  const [currentView, setCurrentView] = useState<'quarters' | 'months'>('quarters');
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipText, setTooltipText] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState<Milestone>({
    id: '',
    program_id: '',
    title: '',
    description: '',
    due_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'not-started',
    owner: 'Unassigned',
    progress: 0,
    tasks: [],
    dependencies: [],
    resources: [],
    user_id: ''
  });
  const [startMonth, setStartMonth] = useState<Date | null>(null);
  const [endMonth, setEndMonth] = useState<Date | null>(null);
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>(programs);
  const [filteredMilestones, setFilteredMilestones] = useState<Milestone[]>([]);
  const [isAddingProgram, setIsAddingProgram] = useState(false);
  const [newProgram, setNewProgram] = useState<Program>({
    id: '',
    organization_id: '',
    user_id: '',
    name: '',
    description: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    created_at: format(new Date(), 'yyyy-MM-dd')
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

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
    const { active, over } = event;

    if (over) {
      const activeMilestone = milestones.find(m => m.id === active.id);
      const overMilestone = milestones.find(m => m.id === over.id);

      if (activeMilestone && overMilestone) {
        const updatedMilestones = [...milestones];
        const activeIndex = updatedMilestones.indexOf(activeMilestone);
        const overIndex = updatedMilestones.indexOf(overMilestone);

        // Swap the positions
        [updatedMilestones[activeIndex], updatedMilestones[overIndex]] = [updatedMilestones[overIndex], updatedMilestones[activeIndex]];

        setMilestones(updatedMilestones);
      }
    }
  };

  const handleProgramToggle = (programId: string) => {
    const newExpandedPrograms = new Set(expandedPrograms);
    if (newExpandedPrograms.has(programId)) {
      newExpandedPrograms.delete(programId);
    } else {
      newExpandedPrograms.add(programId);
    }
    setExpandedPrograms(newExpandedPrograms);
  };

  const handleMilestoneClick = (milestone: Milestone) => {
    console.log('Milestone clicked:', milestone);
    setSelectedMilestone(milestone);
    setShowDetailView(true);
  };

  const handleMilestoneEdit = (milestone: Milestone) => {
    console.log('Editing milestone:', milestone);
    setSelectedMilestone(milestone);
    setShowDetailView(true);
  };

  const handleMilestoneDelete = async (milestoneId: string) => {
    try {
      // Get the program_id before deleting the milestone
      const milestone = milestones.find(m => m.id === milestoneId);
      if (!milestone) return;

      await milestoneService.deleteMilestone(milestoneId);
      
      // Fetch updated milestones for this program
      const updatedMilestones = await milestoneService.getMilestonesByProgram(milestone.program_id);
      
      // Update the milestones state by replacing milestones for this program
      const otherMilestones = milestones.filter(m => m.program_id !== milestone.program_id);
      const allMilestones = [...otherMilestones, ...updatedMilestones];
      
      setMilestones(allMilestones);
      setFilteredMilestones(allMilestones);
      setShowDetailView(false);
      setSelectedMilestone(null);
    } catch (error) {
      console.error('Error deleting milestone:', error);
    }
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

  const handleAddMilestoneForProgram = (programId: string) => {
    console.log('Add Milestone button clicked for program ID:', programId); // Log to verify the button click
    setNewMilestone(prev => ({ ...prev, program_id: programId })); // Set the program ID for the new milestone
    setIsAddingMilestone(true); // Show the form for adding a milestone
    console.log('isAddingMilestone set to true'); // Log to confirm state change
  };

  const handleMilestoneChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewMilestone(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitMilestone = async () => {
    try {
      const milestoneData = {
        program_id: newMilestone.program_id,
        title: newMilestone.title,
        description: newMilestone.description,
        due_date: newMilestone.due_date,
        status: newMilestone.status,
        owner: newMilestone.owner,
        progress: newMilestone.progress,
        tasks: newMilestone.tasks,
        dependencies: newMilestone.dependencies,
        resources: newMilestone.resources
      };

      const newMilestoneData = await milestoneService.createMilestone(milestoneData);
      
      // Fetch updated milestones for this program
      const updatedMilestones = await milestoneService.getMilestonesByProgram(newMilestone.program_id);
      
      // Update the milestones state by replacing milestones for this program
      const otherMilestones = milestones.filter(m => m.program_id !== newMilestone.program_id);
      const allMilestones = [...otherMilestones, ...updatedMilestones];
      
      setMilestones(allMilestones);
      setFilteredMilestones(allMilestones);
      setIsAddingMilestone(false);
      
      // Reset the new milestone form
      setNewMilestone({
        id: '',
        program_id: '',
        title: '',
        description: '',
        due_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'not-started',
        owner: 'Unassigned',
      progress: 0,
      tasks: [],
      dependencies: [],
        resources: [],
        user_id: ''
      });
    } catch (err) {
      console.error('Error in handleSubmitMilestone:', err);
    }
  };

  // Add visual connectors for dependencies (simple representation)
  const renderDependencyConnectors = (milestone: Milestone) => {
    return milestone.dependencies.map(depId => {
      const dependency = milestones.find(m => m.id === depId);
      if (dependency) {
        return (
          <div key={depId} className="connector" style={{ /* styles for connector */ }}>
            {/* Connector logic here */}
          </div>
        );
      }
      return null;
    });
  };

  // Add zoom and pan functionality
  const handleZoomIn = () => {
    // Logic to zoom in
  };

  const handleZoomOut = () => {
    // Logic to zoom out
  };

  // Add tooltips
  const renderTooltips = () => {
    return (
      <div className="tooltip">
        <p>Drag to reposition milestones and adjust timelines.</p>
        <p>Click on a milestone to see detailed progress and related tasks.</p>
      </div>
    );
  };

  // Fetch programs and milestones from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get the current user's ID
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('Error getting user:', userError);
          return;
        }

        // Clear existing data when user changes
        setPrograms([]);
        setMilestones([]);

        // Fetch programs for the current user
        const { data: programsData, error: programsError } = await supabase
          .from('programs')
          .select('*')
          .eq('user_id', user.id);

        if (programsError) {
          console.error('Error fetching programs:', programsError);
        } else if (programsData) {
          console.log('Fetched programs for user:', user.id, programsData);
          setPrograms(programsData);

          // Fetch milestones for each program
          const allMilestones = [];
          for (const program of programsData) {
            const programMilestones = await milestoneService.getMilestonesByProgram(program.id);
            allMilestones.push(...programMilestones);
          }
          console.log('Fetched all milestones:', allMilestones);
          setMilestones(allMilestones);
          setFilteredMilestones(allMilestones);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchData();
      } else if (event === 'SIGNED_OUT') {
        setPrograms([]);
        setMilestones([]);
      }
    });

    // Initial fetch
    fetchData();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Add this function in the Roadmap component
  const getStatusColor = (status: string) => {
    return {
      'completed': 'bg-green-50 border border-green-200',
      'in-progress': 'bg-yellow-50 border border-yellow-200',
      'not-started': 'bg-red-50 border border-red-200',
      'at-risk': 'bg-orange-50 border border-orange-200',
      'delayed': 'bg-red-200 border border-red-300'
    }[status] || 'bg-gray-50 border border-gray-200';
  };

  const handleApplyFilter = () => {
    const filtered = milestones.filter(milestone => {
      const milestoneDate = parseISO(milestone.due_date);
      return isWithinInterval(milestoneDate, {
        start: startMonth || timeRange.start,
        end: endMonth ? endOfMonth(endMonth) : timeRange.end,
      });
    });
    setFilteredMilestones(filtered);
  };

  // Update the useEffect to set filteredMilestones when milestones change
  useEffect(() => {
    setFilteredMilestones(milestones);
  }, [milestones]);

  // Update the handleSubmitProgram function
  const handleSubmitProgram = async () => {
    try {
      // Get the current user's ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user || !user.email) {
        console.error('Error getting user:', userError);
        return;
      }

      // Get the user's organization or create one if it doesn't exist
      let orgId;
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (orgError && orgError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error getting organization:', orgError);
        return;
      }

      if (!orgData) {
        // Create a new organization for the user
        const { data: newOrg, error: createOrgError } = await supabase
          .from('organizations')
          .insert([{
            name: `${user.email}'s Organization`,
            user_id: user.id
          }])
          .select()
          .single();

        if (createOrgError) {
          console.error('Error creating organization:', createOrgError);
          return;
        }

        orgId = newOrg.id;
      } else {
        orgId = orgData.id;
      }

      // Create a new user record if it doesn't exist
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single();

      if (userDataError && userDataError.code !== 'PGRST116') {
        console.error('Error getting user data:', userDataError);
        return;
      }

      if (!userData) {
        const { error: createUserError } = await supabase
          .from('users')
          .insert([{
            name: user.email.split('@')[0],
            email: user.email,
            organization_id: orgId
          }]);

        if (createUserError) {
          console.error('Error creating user:', createUserError);
          return;
        }
      }

      // Insert the new program
      const { error } = await supabase
        .from('programs')
        .insert([{
          organization_id: orgId,
          user_id: user.id,
          name: newProgram.name,
          description: newProgram.description,
          start_date: newProgram.start_date,
          end_date: newProgram.end_date,
          created_at: newProgram.created_at
        }]);

      if (error) {
        console.error('Error adding program:', error);
      } else {
        setPrograms([...programs, { ...newProgram, id: `p${Date.now()}` }]);
        setIsAddingProgram(false);
        setNewProgram({
          id: '',
          organization_id: '',
          user_id: '',
          name: '',
          description: '',
          start_date: format(new Date(), 'yyyy-MM-dd'),
          end_date: format(new Date(), 'yyyy-MM-dd'),
          created_at: format(new Date(), 'yyyy-MM-dd')
        });
      }
    } catch (err) {
      console.error('Error in handleSubmitProgram:', err);
    }
  };

  // Fetch organizations and users from Supabase
  useEffect(() => {
    const fetchOrganizationsAndUsers = async () => {
      try {
        // Get the current user's ID
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('Error getting user:', userError);
          return;
        }

        // Fetch organizations for the current user
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('user_id', user.id);

        if (orgError) {
          console.error('Error fetching organizations:', orgError);
        } else if (orgData) {
          console.log('Fetched organizations for user:', user.id, orgData);
          setOrganizations(orgData);
        }

        // Fetch users for the current user's organization
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .eq('organization_id', orgData?.[0]?.id); // Use the first organization's ID

        if (usersError) {
          console.error('Error fetching users:', usersError);
        } else if (usersData) {
          console.log('Fetched users for organization:', orgData?.[0]?.id, usersData);
          setUsers(usersData);
        }
      } catch (err) {
        console.error('Error fetching organizations and users:', err);
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchOrganizationsAndUsers();
      } else if (event === 'SIGNED_OUT') {
        setOrganizations([]);
        setUsers([]);
      }
    });

    // Initial fetch
    fetchOrganizationsAndUsers();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleProgramEdit = async (updatedProgram: Program) => {
    const { error } = await supabase
      .from('programs')
      .update(updatedProgram)
      .eq('id', updatedProgram.id);

    if (error) {
      console.error('Error updating program:', error);
    } else {
      setPrograms(programs.map(p => (p.id === updatedProgram.id ? updatedProgram : p)));
      setSelectedProgram(null);
    }
  };

  const handleProgramDelete = async (programId: string) => {
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', programId);

    if (error) {
      console.error('Error deleting program:', error);
    } else {
      setPrograms(programs.filter(p => p.id !== programId));
      setSelectedProgram(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Program Roadmap</h1>
          <p className="text-gray-600">Strategic timeline and milestones for your program</p>
        </div>

        {/* Filter by Month */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <h2 className="text-lg font-semibold">Filter by Month</h2>
          <div className="flex items-center justify-between mt-2">
            <div className="flex space-x-4">
              <div>
                <label htmlFor="start-month" className="block text-sm font-medium text-gray-700">Start Month</label>
                <input
                  type="month"
                  id="start-month"
                  onChange={(e) => setStartMonth(new Date(e.target.value))}
                  className="mt-1 p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label htmlFor="end-month" className="block text-sm font-medium text-gray-700">End Month</label>
                <input
                  type="month"
                  id="end-month"
                  onChange={(e) => setEndMonth(new Date(e.target.value))}
                  className="mt-1 p-2 border border-gray-300 rounded"
                />
              </div>
              <button
                onClick={handleApplyFilter}
                className="ml-4 px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
              >
                Apply
              </button>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setIsAddingProgram(true)}
                className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                + Add Program
              </button>
            </div>
          </div>
        </div>

        {/* Programs and Milestones View */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6">
            {programs.map(program => (
              <div key={program.id} className="mb-8 border border-gray-300 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium mb-0">{program.name}</h3>
                    <button onClick={() => handleProgramToggle(program.id)} aria-label="Toggle program" className="ml-2 flex items-center">
                      {expandedPrograms.has(program.id) ? (
                        <ChevronUp className="h-5 w-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-600" />
                      )}
              </button>
                  </div>
                  <div className="flex items-center">
              <button
                      onClick={() => handleAddMilestoneForProgram(program.id)} // Add milestone button
                      className="ml-4 px-2 py-1 bg-violet-600 text-white rounded-md hover:bg-violet-700"
                      aria-label="Add Milestone"
                    >
                      Add Milestone
              </button>
              <button
                      onClick={() => {
                        console.log('View Program Details clicked for:', program); // Debug log
                        setSelectedProgram(program);
                        setShowDetailView(true);
                      }}
                      className="ml-4 px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      aria-label="View Program Details"
                    >
                      View Program Details
              </button>
            </div>
          </div>
                {/* Display Start and End Dates */}
                <div className="mt-2 text-sm text-gray-600">
                  <p>Start Date: {format(parseISO(program.start_date), 'MMM d, yyyy')}</p>
                  <p>End Date: {format(parseISO(program.end_date), 'MMM d, yyyy')}</p>
        </div>
                {expandedPrograms.has(program.id) && (
                  <div className="ml-4">
          <DndContext
            sensors={sensors}
            onDragEnd={handleDragEnd}
          >
                      <SortableContext items={filteredMilestones.map(m => m.id)}>
                      <div className="space-y-4">
                          {filteredMilestones.filter(m => m.program_id === program.id).map(milestone => (
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
                    </DndContext>
                  </div>
                )}
                </div>
              ))}
            </div>
        </div>

        {/* Add Milestone Form as a Modal */}
        {isAddingMilestone && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-96">
              <h3 className="text-lg font-medium mb-4">Add New Milestone</h3>
              <div>
                <label htmlFor="new-milestone-title" className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  id="new-milestone-title"
                  name="title"
                  value={newMilestone.title}
                  onChange={handleMilestoneChange}
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  placeholder="Enter milestone title"
                />
              </div>
              <div className="mt-4">
                <label htmlFor="new-milestone-description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="new-milestone-description"
                  name="description"
                  value={newMilestone.description}
                  onChange={handleMilestoneChange}
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  placeholder="Enter milestone description"
                />
              </div>
              <div className="mt-4">
                <label htmlFor="new-milestone-due-date" className="block text-sm font-medium text-gray-700">Due Date</label>
                <input
                  type="date"
                  id="new-milestone-due-date"
                  name="due_date"
                  value={newMilestone.due_date}
                  onChange={handleMilestoneChange}
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                />
              </div>
              <div className="mt-4">
                <label htmlFor="new-milestone-status" className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  id="new-milestone-status"
                  name="status"
                  value={newMilestone.status}
                  onChange={handleMilestoneChange}
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                >
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="at-risk">At Risk</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSubmitMilestone}
                  className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
                >
                  Save Milestone
                </button>
                <button
                  onClick={() => setIsAddingMilestone(false)}
                  className="ml-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Milestone Form */}
        {showDetailView && selectedMilestone && (
          <MilestoneDetailView
            milestone={selectedMilestone}
            onClose={() => {
              setShowDetailView(false);
              setSelectedMilestone(null);
            }}
            onEdit={(editedMilestone) => {
              // Update the milestone with the new status
              handleMilestoneEdit(editedMilestone);
            }}
            onDelete={handleMilestoneDelete}
          />
        )}

        {showDetailView && selectedProgram && (
          <ProgramDetailView
            program={selectedProgram}
            onClose={() => {
              setShowDetailView(false);
              setSelectedProgram(null);
            }}
            onEdit={handleProgramEdit}
            onDelete={handleProgramDelete}
          />
        )}

        <div className="zoom-controls">
          <button onClick={handleZoomIn}>Zoom In</button>
          <button onClick={handleZoomOut}>Zoom Out</button>
      </div>
        {renderTooltips()}

        {/* Test Color Coding */}
      </div>

      {/* Add Program Modal */}
      {isAddingProgram && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Add New Program</h3>
            <div>
              <label htmlFor="new-program-name" className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                id="new-program-name"
                name="name"
                value={newProgram.name}
                onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                className="mt-1 p-2 border border-gray-300 rounded w-full"
                placeholder="Enter program name"
              />
            </div>
            <div className="mt-4">
              <label htmlFor="new-program-description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="new-program-description"
                name="description"
                value={newProgram.description}
                onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                className="mt-1 p-2 border border-gray-300 rounded w-full"
                placeholder="Enter program description"
              />
            </div>
            <div className="mt-4">
              <label htmlFor="new-program-start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                id="new-program-start-date"
                name="start_date"
                value={newProgram.start_date}
                onChange={(e) => setNewProgram({ ...newProgram, start_date: e.target.value })}
                className="mt-1 p-2 border border-gray-300 rounded w-full"
              />
            </div>
            <div className="mt-4">
              <label htmlFor="new-program-end-date" className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                id="new-program-end-date"
                name="end_date"
                value={newProgram.end_date}
                onChange={(e) => setNewProgram({ ...newProgram, end_date: e.target.value })}
                className="mt-1 p-2 border border-gray-300 rounded w-full"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSubmitProgram}
                className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
              >
                Save Program
              </button>
              <button
                onClick={() => setIsAddingProgram(false)}
                className="ml-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
