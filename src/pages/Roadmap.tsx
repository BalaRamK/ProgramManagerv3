import React, { useState, useEffect, useRef } from 'react';
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
import { milestoneService } from '../lib/milestoneService';

interface Task {
  id?: string;
  title: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  milestone_id?: string;
  assigned_to?: string;
  user_id?: string;
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

interface Milestone {
  id?: string;
  title: string;
  description: string;
  due_date: string;
  goal_id: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'at-risk' | 'delayed';
  progress: number;
  owner: string;
  tasks?: any[];
  dependencies?: string[];
  resources?: any[];
  created_at?: string;
  updated_at?: string;
  user_id: string;
}

interface Goal {
  id: string;
  name: string;
  description: string;
  program_id: string;
  progress: number;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
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
    goal_id: 'g1',
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
    goal_id: 'g1',
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
  } = useSortable({ 
    id: milestone.id || `temp-${Math.random().toString(36).substr(2, 9)}` 
  });

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
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [availableUsers, setAvailableUsers] = useState<{ id: string, name: string, email: string }[]>([]);

  useEffect(() => {
    // Fetch available users for owner selection
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email');
      
      if (error) {
        console.error('Error fetching users:', error);
      } else if (data) {
        setAvailableUsers(data);
      }
    };
    
    fetchUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedMilestone(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTaskToMilestone = () => {
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      completed: false
    };
    
    setEditedMilestone(prev => ({
      ...prev,
      tasks: [...(prev.tasks || []), newTask]
    }));
    
    setNewTaskTitle('');
  };

  const handleToggleTaskCompletion = (taskId: string) => {
    setEditedMilestone(prev => ({
      ...prev,
      tasks: prev.tasks?.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ) || []
    }));
  };

  const handleRemoveTaskFromMilestone = (taskId: string) => {
    setEditedMilestone(prev => ({
      ...prev,
      tasks: prev.tasks?.filter(task => task.id !== taskId) || []
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      if (!editedMilestone.id) {
        console.error('Cannot update milestone: Missing ID');
        return;
      }
      
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
      
      if (!milestone.id) {
        console.error('Cannot delete milestone: Missing ID');
        return;
      }
      
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
              <div className="flex items-center">
                
              <h2 className="text-lg font-semibold">{milestone.title}</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
                aria-label="Close panel"
                title="Close panel"
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
                    <select
                      id="milestone-owner"
                      name="owner"
                      value={editedMilestone.owner}
                      onChange={handleChange}
                      className="mt-2 p-2 border border-gray-300 rounded w-full"
                    >
                      <option value="">Select Owner</option>
                      {availableUsers.map(user => (
                        <option key={user.id} value={user.email}>{user.name} ({user.email})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="milestone-progress" className="block text-sm font-medium text-gray-700">Progress (%)</label>
                    <select
                      id="milestone-progress"
                      name="progress"
                      value={editedMilestone.progress}
                      onChange={handleChange}
                      className="mt-2 p-2 border border-gray-300 rounded w-full"
                    >
                      {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(value => (
                        <option key={value} value={value}>{value}%</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tasks</label>
                <div className="mt-2 space-y-2">
                      {editedMilestone.tasks && editedMilestone.tasks.map((task, index) => (
                        <div key={task.id || index} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={task.completed}
                            onChange={() => handleToggleTaskCompletion(task.id || '')}
                        className="h-4 w-4 text-violet-600 rounded"
                            aria-label={`Task: ${task.title}`}
                            title={`Toggle completion for: ${task.title}`}
                          />
                          <span className={`flex-1 ${task.completed ? 'line-through text-gray-400' : ''}`}>
                            {task.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTaskFromMilestone(task.id || '')}
                            className="text-red-500 hover:text-red-700"
                            aria-label={`Remove task: ${task.title}`}
                            title={`Remove task: ${task.title}`}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                    </div>
                  ))}
                      <div className="flex mt-2">
                        <input
                          type="text"
                          id="edit-task-input"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="Add a task"
                          className="flex-1 p-2 border border-gray-300 rounded-l"
                          aria-label="New task title"
                        />
                        <button
                          type="button"
                          onClick={handleAddTaskToMilestone}
                          className="px-3 py-2 bg-violet-600 text-white rounded-r"
                          aria-label="Add task"
                          title="Add task"
                        >
                          Add
                        </button>
                </div>
              </div>
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
                    <div className="mt-2 h-2 w-full bg-gray-200 rounded">
                      <div 
                        className="h-full bg-violet-600 rounded" 
                        style={{ width: `${milestone.progress}%` }}
                      ></div>
                    </div>
                    <p className="mt-1 text-sm text-gray-900 text-right">{milestone.progress}%</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Tasks</h3>
                    {milestone.tasks && milestone.tasks.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {milestone.tasks.map((task, index) => (
                          <li key={task.id || index} className="flex items-center text-sm">
                            <span className={`${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                              {task.title}
                            </span>
                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100">
                              {task.completed ? 'Completed' : 'Pending'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-gray-500 italic">No tasks added</p>
                    )}
                </div>
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
              <div className="flex items-center">
                
                <h2 className="text-lg font-semibold">{program.name}</h2>
              </div>
              <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-gray-500" 
                aria-label="Close panel"
                title="Close panel"
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

// Add GoalModal component
interface GoalModalProps {
  programId: string;
  onClose: () => void;
  onSubmit: (goal: Partial<Goal>) => void;
}

function GoalModal({ programId, onClose, onSubmit }: GoalModalProps) {
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    name: '',
    description: '',
    program_id: programId,
    progress: 0,
    status: 'not-started'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewGoal(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(newGoal);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <div className="flex items-center mb-4">
         
          <h3 className="text-lg font-medium">Add New Goal</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="goal-name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              id="goal-name"
              name="name"
              value={newGoal.name}
              onChange={handleChange}
              className="mt-1 p-2 border border-gray-300 rounded w-full"
              placeholder="Enter goal name"
              required
            />
          </div>
          <div className="mt-4">
            <label htmlFor="goal-description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="goal-description"
              name="description"
              value={newGoal.description}
              onChange={handleChange}
              className="mt-1 p-2 border border-gray-300 rounded w-full"
              placeholder="Enter goal description"
            />
          </div>
          <div className="mt-4">
            <label htmlFor="goal-status" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="goal-status"
              name="status"
              value={newGoal.status}
              onChange={handleChange}
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
              type="submit"
              className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
            >
              Save Goal
            </button>
            <button
              type="button"
              onClick={onClose}
              className="ml-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
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
    title: '',
    description: '',
    due_date: new Date().toISOString().split('T')[0],
    goal_id: '',
    status: 'not-started',
    progress: 0,
    owner: '',
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
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);
  const [viewType, setViewType] = useState<'step' | 'gantt'>('step');
  const [newTask, setNewTask] = useState<Task>({
    title: '',
    completed: false
  });
  const [availableUsers, setAvailableUsers] = useState<{ id: string, name: string, email: string }[]>([]);

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
      // Get the goal_id before deleting the milestone
      const milestone = milestones.find(m => m.id === milestoneId);
      if (!milestone) return;

      await milestoneService.deleteMilestone(milestoneId);
      
      // Fetch updated milestones for this goal
      const updatedMilestones = await milestoneService.getMilestonesByGoal(milestone.goal_id);
      
      // Update the milestones state by replacing milestones for this goal
      const otherMilestones = milestones.filter(m => m.goal_id !== milestone.goal_id);
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

  const handleAddGoalForProgram = (programId: string) => {
    console.log('Add Goal button clicked for program ID:', programId);
    // Find the program
    const program = programs.find(p => p.id === programId);
    if (!program) {
      console.error(`Program with ID ${programId} not found`);
      return;
    }
    
    setSelectedProgram(program);
    setShowGoalModal(true);
  };

  const handleSubmitGoal = async (goalData: Partial<Goal>) => {
    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('Error getting user');
        return;
      }

      // Add the user_id to the goal data
      const newGoal = {
        ...goalData,
        user_id: user.id
      };

      // Insert the new goal
      const { data, error } = await supabase
        .from('goals')
        .insert([newGoal])
        .select()
        .single();

      if (error) {
        console.error('Error creating goal:', error);
      } else {
        console.log('Goal created successfully:', data);
        
        // Refresh data to get the updated goals
        fetchData();
        setShowGoalModal(false);
      }
    } catch (error) {
      console.error('Error in handleSubmitGoal:', error);
    }
  };

  const handleAddMilestoneForGoal = (goalId: string) => {
    console.log('Add Milestone button clicked for goal ID:', goalId);
    
    // Validate goal exists
    const selectedGoal = goals.find(g => g.id === goalId);
    if (!selectedGoal) {
      console.error(`Goal with ID ${goalId} not found`);
      return;
    }
    
    console.log('Selected goal:', selectedGoal);
    
    // Set the correct values for the new milestone
    setNewMilestone({
      goal_id: goalId,
      title: '',
      description: '',
      due_date: new Date().toISOString().split('T')[0],
      status: 'not-started',
      progress: 0,
      owner: user?.email || '',
      tasks: [],
      dependencies: [],
      resources: [],
      user_id: user?.id || ''
    });
    
    setIsAddingMilestone(true);
  };

  const handleSubmitMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingMilestone(true);

    try {
      const milestoneData = {
        title: newMilestone.title,
        description: newMilestone.description,
        due_date: newMilestone.due_date,
        goal_id: newMilestone.goal_id,
        status: newMilestone.status,
        progress: newMilestone.progress,
        owner: newMilestone.owner,
        user_id: user?.id,
        tasks: [],
        dependencies: [],
      resources: []
    };
    
      console.log('Creating milestone with data:', milestoneData);
      
      const { data, error } = await milestoneService.createMilestone(milestoneData);

      if (error) {
        console.error('Error creating milestone:', error);
        console.log('Failed to create milestone');
      } else {
        console.log('Milestone created successfully:', data);
        console.log('Milestone created successfully');
        setIsAddingMilestone(false);
        
        // Refresh data
        fetchData();
        
        // Reset form
        setNewMilestone({
          goal_id: '',
          title: '',
          description: '',
          due_date: new Date().toISOString().split('T')[0],
          status: 'not-started',
          progress: 0,
          owner: user?.email || '',
          tasks: [],
          dependencies: [],
          resources: [],
          user_id: user?.id || ''
        });
      }
    } catch (error) {
      console.error('Error in handleSubmitMilestone:', error);
      console.log('An unexpected error occurred');
    } finally {
      setIsAddingMilestone(false);
    }
  };

  // Fix the renderDependencyConnectors function
  const renderDependencyConnectors = (milestone: Milestone) => {
    // Handle the case where dependencies might be undefined
    if (!milestone.dependencies || milestone.dependencies.length === 0) {
      return null;
    }
    
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

  // Add a proper fetchData function
  const fetchData = async () => {
    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('Error getting user:', user);
        return;
      }

      // Clear existing data when user changes
      setPrograms([]);
      setGoals([]);
      setMilestones([]);

      // Fetch programs for the current user
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .eq('user_id', user.id);

      if (programsError) {
        console.error('Error fetching programs:', programsError);
        return;
      }
      
      if (programsData) {
        console.log('Fetched programs for user:', user.id, programsData);
        setPrograms(programsData);

        // Fetch goals for all programs
        const { data: goalsData, error: goalsError } = await supabase
          .from('goals')
          .select('*')
          .in('program_id', programsData.map(p => p.id));
        
        if (goalsError) {
          console.error('Error fetching goals:', goalsError);
          return;
        }
        
        if (goalsData) {
          console.log('Fetched goals:', goalsData);
          setGoals(goalsData);
          
          // Fetch milestones for all goals
          const { data: milestonesData, error: milestonesError } = await supabase
            .from('milestones')
            .select('*')
            .in('goal_id', goalsData.map(g => g.id));
          
          if (milestonesError) {
            console.error('Error fetching milestones:', milestonesError);
            return;
          }
          
          if (milestonesData) {
            console.log('Fetched milestones:', milestonesData);
            setMilestones(milestonesData);
            setFilteredMilestones(milestonesData);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

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
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('Error getting user:', user);
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

  // Add useEffect to call fetchData
  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchData();
      } else if (event === 'SIGNED_OUT') {
        setPrograms([]);
        setGoals([]);
        setMilestones([]);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Update the program listing template to include goals and milestones
  const renderProgramHierarchy = () => {
    return programs.map(program => (
      <div key={program.id} className="mb-6 bg-white rounded-lg shadow-md">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center">
            <button 
              onClick={() => handleProgramToggle(program.id)} 
              className="mr-2"
              aria-label="Toggle program"
            >
              {expandedPrograms.has(program.id) ? (
                <ChevronUp className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              )}
            </button>
            <h3 className="text-lg font-medium">{program.name}</h3>
          </div>
          <button
            onClick={() => handleAddGoalForProgram(program.id)}
            className="px-3 py-1 bg-violet-600 text-white rounded-md hover:bg-violet-700 text-sm"
            aria-label="Add Goal"
          >
            <Plus className="inline h-4 w-4 mr-1" />
            Add Goal
          </button>
        </div>

        {expandedPrograms.has(program.id) && (
          <div className="p-4">
            {/* Goals for this program */}
            {goals.filter(goal => goal.program_id === program.id).length === 0 ? (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-2">No goals yet for this program.</p>
                <button
                  onClick={() => handleAddGoalForProgram(program.id)}
                  className="px-3 py-1 bg-violet-600 text-white rounded-md hover:bg-violet-700 text-sm"
                >
                  <Plus className="inline h-3 w-3 mr-1" />
                  Add First Goal
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {goals
                  .filter(goal => goal.program_id === program.id)
                  .map(goal => (
                    <div key={goal.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <button 
                            onClick={() => handleGoalToggle(goal.id)} 
                            className="mr-2"
                            aria-label="Toggle goal"
                          >
                            {expandedGoals.has(goal.id) ? (
                              <ChevronUp className="h-4 w-4 text-gray-600" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-600" />
                            )}
                          </button>
                          <h4 className="font-medium">{goal.name}</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            Progress: {goal.progress}%
                          </span>
                          <button
                            onClick={() => handleAddMilestoneForGoal(goal.id)}
                            className="px-2 py-1 bg-violet-600 text-white rounded-md hover:bg-violet-700 text-xs"
                            aria-label="Add Milestone"
                          >
                            <Plus className="inline h-3 w-3 mr-1" />
                            Add Milestone
                          </button>
                        </div>
                      </div>

                      {expandedGoals.has(goal.id) && (
                        <div className="pl-6 mt-2 space-y-2">
                          {/* Milestones for this goal */}
                          {milestones.filter(milestone => milestone.goal_id === goal.id).length === 0 ? (
                            <div className="text-center p-3 bg-white rounded-lg">
                              <p className="text-gray-500 text-sm mb-1">No milestones yet for this goal.</p>
                              <button
                                onClick={() => handleAddMilestoneForGoal(goal.id)}
                                className="px-2 py-1 bg-violet-600 text-white rounded-md hover:bg-violet-700 text-xs"
                              >
                                <Plus className="inline h-2 w-2 mr-1" />
                                Add First Milestone
                              </button>
                            </div>
                          ) : (
                            milestones
                              .filter(milestone => milestone.goal_id === goal.id)
                              .map(milestone => (
                                <div
                                  key={milestone.id}
                                  className={`p-2 rounded ${getStatusColor(milestone.status)} cursor-pointer`}
                                  onClick={() => handleMilestoneClick(milestone)}
                                >
                                  <div className="text-sm font-medium">{milestone.title}</div>
                                  <div className="flex justify-between text-xs mt-1">
                                    <span>Due: {format(parseISO(milestone.due_date), 'MMM d, yyyy')}</span>
                                    <span>Progress: {milestone.progress}%</span>
                                  </div>
                                </div>
                              ))
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    ));
  };

  const handleGoalToggle = (goalId: string) => {
    setExpandedGoals(prevState => {
      const newState = new Set(prevState);
      if (newState.has(goalId)) {
        newState.delete(goalId);
      } else {
        newState.add(goalId);
      }
      return newState;
    });
  };

  // Add task management functions for new milestone form
  const handleAddTask = () => {
    if (!newTask.title.trim()) return;
    
    setNewMilestone(prev => ({
      ...prev,
      tasks: [...(prev.tasks || []), { ...newTask, id: `task-${Date.now()}` }]
    }));
    
    setNewTask({
      title: '',
      completed: false
    });
  };

  const handleRemoveTask = (taskIndex: number) => {
    setNewMilestone(prev => ({
      ...prev,
      tasks: prev.tasks?.filter((_, index) => index !== taskIndex) || []
    }));
  };

  // Add Gantt chart rendering function
  const renderGanttChart = () => {
    return (
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Gantt Chart Timeline Header */}
          <div className="flex border-b pb-2">
            <div className="w-64 flex-shrink-0 px-4 font-medium">Task</div>
            {timePeriods.map(period => (
              <div key={period.id} className="w-32 text-center text-sm">
                <div>{period.label}</div>
                <div className="text-xs text-gray-500">{period.subLabel}</div>
              </div>
            ))}
          </div>
          
          {/* Program Rows */}
          {programs.map(program => (
            <div key={program.id} className="mt-4">
              <div className="flex items-center py-2 bg-gray-50 rounded">
                <div className="w-64 flex-shrink-0 px-4 font-semibold">{program.name}</div>
                {timePeriods.map(period => (
                  <div key={period.id} className="w-32 border-l border-gray-200"></div>
                ))}
              </div>
              
              {/* Goal Rows */}
              {goals
                .filter(goal => goal.program_id === program.id)
                .map(goal => (
                  <div key={goal.id} className="ml-4 mt-2">
                    <div className="flex items-center py-2 bg-gray-100 rounded">
                      <div className="w-60 flex-shrink-0 px-4 font-medium">{goal.name}</div>
                      {timePeriods.map(period => (
                        <div key={period.id} className="w-32 border-l border-gray-200"></div>
                      ))}
                    </div>
                    
                    {/* Milestone Rows */}
                    {milestones
                      .filter(milestone => milestone.goal_id === goal.id)
                      .map(milestone => {
                        const milestoneDate = parseISO(milestone.due_date);
                        const startPeriodIndex = timePeriods.findIndex(
                          period => isWithinInterval(milestoneDate, { start: period.start, end: period.end })
                        );
                        
                        return (
                          <div key={milestone.id} className="ml-4 flex items-center h-12 relative">
                            <div className="w-56 flex-shrink-0 px-4">{milestone.title}</div>
                            {timePeriods.map((period, index) => (
                              <div key={period.id} className="w-32 border-l border-gray-200 relative">
                                {index === startPeriodIndex && (
                                  <div 
                                    className={`absolute top-1 h-10 rounded-md cursor-pointer opacity-80 ${getStatusColor(milestone.status)}`}
                                    style={{ width: '90%', left: '5%' }}
                                    onClick={() => handleMilestoneClick(milestone)}
                                  >
                                    <div className="px-2 py-1 text-xs truncate">{milestone.title}</div>
                                    <div className="h-1 bg-gray-200 rounded-full mt-1 mx-2">
                                      <div 
                                        className="h-full bg-violet-600 rounded-full" 
                                        style={{ width: `${milestone.progress}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="mb-8">
          <div className="flex items-center">

            <div>
          <h1 className="text-2xl font-bold text-gray-900">Program Roadmap</h1>
          <p className="text-gray-600">Strategic timeline and milestones for your program</p>
            </div>
          </div>
        </div>

        {/* Controls and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
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
                className="mt-7 px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
              >
                Apply
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 mt-6">
                <span className="text-sm font-medium text-gray-700">View:</span>
              <button
                  onClick={() => setViewType('step')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    viewType === 'step' 
                      ? 'bg-violet-600 text-white' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  Step View
              </button>
              <button
                  onClick={() => setViewType('gantt')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    viewType === 'gantt' 
                      ? 'bg-violet-600 text-white' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  Gantt Chart
              </button>
              </div>
              <button
                onClick={() => setIsAddingProgram(true)}
                className="mt-7 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                + Add Program
              </button>
            </div>
          </div>
        </div>

        {/* Programs and Milestones View */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
            {viewType === 'step' ? renderProgramHierarchy() : renderGanttChart()}
          </div>
        </div>

        {/* Add Milestone Form as a Modal */}
        {isAddingMilestone && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center mb-4">

                <h3 className="text-lg font-medium">Add New Milestone</h3>
              </div>
              <form onSubmit={handleSubmitMilestone}>
                <div>
                  <label htmlFor="new-milestone-title" className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    id="new-milestone-title"
                    name="title"
                    value={newMilestone.title}
                    onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                    className="mt-1 p-2 border border-gray-300 rounded w-full"
                    placeholder="Enter milestone title"
                    required
                  />
                </div>
                <div className="mt-4">
                  <label htmlFor="new-milestone-description" className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    id="new-milestone-description"
                    name="description"
                    value={newMilestone.description}
                    onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
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
                    onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
                    className="mt-1 p-2 border border-gray-300 rounded w-full"
                    required
                  />
                </div>
                <div className="mt-4">
                  <label htmlFor="new-milestone-status" className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    id="new-milestone-status"
                    name="status"
                    value={newMilestone.status}
                    onChange={(e) => setNewMilestone({ ...newMilestone, status: e.target.value as 'not-started' | 'in-progress' | 'completed' | 'at-risk' | 'delayed' })}
                    className="mt-1 p-2 border border-gray-300 rounded w-full"
                    required
                  >
                    <option value="not-started">Not Started</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="at-risk">At Risk</option>
                    <option value="delayed">Delayed</option>
                  </select>
                </div>
                <div className="mt-4">
                  <label htmlFor="new-milestone-owner" className="block text-sm font-medium text-gray-700">Owner</label>
                  <select
                    id="new-milestone-owner"
                    name="owner"
                    value={newMilestone.owner}
                    onChange={(e) => setNewMilestone({ ...newMilestone, owner: e.target.value })}
                    className="mt-1 p-2 border border-gray-300 rounded w-full"
                  >
                    <option value="">Select Owner</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.email}>{user.name} ({user.email})</option>
                    ))}
                  </select>
                      </div>
                <div className="mt-4">
                  <label htmlFor="new-milestone-progress" className="block text-sm font-medium text-gray-700">Progress (%)</label>
                  <select
                    id="new-milestone-progress"
                    name="progress"
                    value={newMilestone.progress}
                    onChange={(e) => setNewMilestone({ ...newMilestone, progress: parseInt(e.target.value) })}
                    className="mt-1 p-2 border border-gray-300 rounded w-full"
                  >
                    {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(value => (
                      <option key={value} value={value}>{value}%</option>
                    ))}
                  </select>
                  </div>
                <div className="mt-4">
                  <label htmlFor="new-task-input" className="block text-sm font-medium text-gray-700">Tasks</label>
                  <div className="mt-2 space-y-2">
                    {newMilestone.tasks?.map((task, index) => (
                      <div key={task.id || index} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => {
                            const updatedTasks = [...(newMilestone.tasks || [])];
                            updatedTasks[index].completed = !updatedTasks[index].completed;
                            setNewMilestone({ ...newMilestone, tasks: updatedTasks });
                          }}
                          className="h-4 w-4 text-violet-600 rounded"
                          aria-label={`Task: ${task.title}`}
                          title={`Toggle completion for: ${task.title}`}
                        />
                        <span className={task.completed ? 'line-through text-gray-400' : ''}>
                          {task.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTask(index)}
                          className="text-red-500 hover:text-red-700"
                          aria-label={`Remove task: ${task.title}`}
                          title={`Remove task: ${task.title}`}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                </div>
              ))}
                    <div className="flex mt-2">
                      <input
                        type="text"
                        id="new-task-input"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        placeholder="Add a task"
                        className="flex-1 p-2 border border-gray-300 rounded-l"
                        aria-label="New task title"
                      />
                      <button
                        type="button"
                        onClick={handleAddTask}
                        className="px-3 py-2 bg-violet-600 text-white rounded-r"
                        aria-label="Add task"
                        title="Add task"
                      >
                        Add
                      </button>
            </div>
        </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
                  >
                    Save Milestone
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingMilestone(false)}
                    className="ml-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Goal Modal and Detail Views */}
        {showGoalModal && selectedProgram && (
          <GoalModal
            programId={selectedProgram.id}
            onClose={() => setShowGoalModal(false)}
            onSubmit={handleSubmitGoal}
          />
        )}

        {showDetailView && selectedMilestone && (
          <MilestoneDetailView
            milestone={selectedMilestone}
            onClose={() => {
              setShowDetailView(false);
              setSelectedMilestone(null);
            }}
            onEdit={(editedMilestone) => {
              handleMilestoneEdit(editedMilestone);
            }}
            onDelete={handleMilestoneDelete}
          />
        )}

        {showDetailView && selectedProgram && !showGoalModal && (
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

        {/* Add Program Modal */}
        {isAddingProgram && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-96">
              <div className="flex items-center mb-4">

                <h3 className="text-lg font-medium">Add New Program</h3>
              </div>
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
                  required
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
    </div>
  );
}
