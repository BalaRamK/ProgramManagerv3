import React, { useState, useEffect } from 'react';
import { format, parseISO, addMonths, startOfYear, endOfYear } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit
} from 'lucide-react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '../lib/supabase';
import { GanttChart } from './GanttChart';
import { NotificationBar } from './NotificationBar';
import { GoalModal } from './GoalModal';
import { MilestoneDetailModal } from './MilestoneDetailModal';
import { milestoneService } from '../lib/milestoneService';
import { CreateMilestoneInput } from '../lib/milestoneService';

interface Program {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  progress: number;
}

interface Goal {
  id: string;
  program_id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  progress: number;
  owner: string;
}

interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  description: string;
  due_date: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'at-risk' | 'delayed';
  owner: string;
  progress: number;
  tasks: any[];
  dependencies: string[];
  resources: any[];
  user_id: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  assigned_to: string;
  due_date: string;
}

interface Resource {
  id: string;
  user_id: string;
  name: string;
  role: string;
}

interface MilestoneDependency {
  id: string;
  milestone_id: string;
  depends_on_milestone_id: string;
}

export function Roadmap() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [filteredMilestones, setFilteredMilestones] = useState<Milestone[]>([]);
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [timeRange, setTimeRange] = useState({
    start: startOfYear(new Date()),
    end: endOfYear(new Date())
  });
  const [showGanttView, setShowGanttView] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [newMilestone, setNewMilestone] = useState<Milestone>({
    id: '',
    goal_id: '',
    title: '',
    description: '',
    due_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'not-started' as const,
    owner: 'Unassigned',
    progress: 0,
    tasks: [],
    dependencies: [],
    resources: [],
    user_id: ''
  });
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch programs
      const { data: programsData } = await supabase
        .from('programs')
        .select('*')
        .eq('user_id', user.id);
      
      if (programsData) {
        setPrograms(programsData);
        
        // Fetch goals for all programs
        const { data: goalsData } = await supabase
          .from('goals')
          .select('*')
          .in('program_id', programsData.map(p => p.id));
        
        if (goalsData) {
          setGoals(goalsData);
          
          // Fetch milestones for all goals
          const { data: milestonesData } = await supabase
            .from('milestones')
            .select(`
              *,
              tasks:tasks,
              dependencies:milestone_dependencies(depends_on_milestone_id),
              resources:milestone_resources(user_id)
            `)
            .in('goal_id', goalsData.map(g => g.id));
          
          if (milestonesData) {
            setMilestones(milestonesData);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const handleGoalToggle = (goalId: string) => {
    const newExpandedGoals = new Set(expandedGoals);
    if (newExpandedGoals.has(goalId)) {
      newExpandedGoals.delete(goalId);
    } else {
      newExpandedGoals.add(goalId);
    }
    setExpandedGoals(newExpandedGoals);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeMilestone = milestones.find(m => m.id === active.id);
    const overMilestone = milestones.find(m => m.id === over.id);

    if (activeMilestone && overMilestone) {
      // Update milestone order in the database
      updateMilestoneOrder(activeMilestone.id, overMilestone.goal_id);
    }
  };

  const updateMilestoneOrder = async (milestoneId: string, newGoalId: string) => {
    try {
      const { error } = await supabase
        .from('milestones')
        .update({ goal_id: newGoalId })
        .eq('id', milestoneId);

      if (!error) {
        fetchData(); // Refresh data after update
      }
    } catch (error) {
      console.error('Error updating milestone order:', error);
    }
  };

  const getStatusColor = (status: string) => {
    return {
      'completed': 'bg-green-100 text-green-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'not-started': 'bg-gray-100 text-gray-800',
      'at-risk': 'bg-red-100 text-red-800',
      'delayed': 'bg-orange-100 text-orange-800'
    }[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'at-risk':
      case 'delayed':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleAddGoal = (programId: string) => {
    console.log('Add Goal button clicked for program ID:', programId);
    setSelectedProgram({ id: programId } as Program);
    setShowGoalModal(true);
  };

  const handleEditGoal = (goal: Goal) => {
    console.log('Edit Goal button clicked for goal:', goal);
    setSelectedGoal(goal);
    setShowGoalModal(true);
  };

  const handleSaveGoal = async (goal: Goal) => {
    try {
      await fetchData();
      setShowGoalModal(false);
      setSelectedProgram(null);
      setSelectedGoal(null);
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const handleAddMilestoneForGoal = (goalId: string) => {
    console.log('Add Milestone button clicked for goal ID:', goalId);
    
    // Extra validation to ensure goal ID is a valid UUID
    if (!goalId || goalId === 'undefined' || goalId === undefined) {
      console.error('Invalid goal ID provided:', goalId);
      alert('Unable to add milestone - invalid goal ID.');
      return;
    }
    
    // Verify this goal belongs to the current user
    const selectedGoal = goals.find(g => g.id === goalId);
    if (!selectedGoal) {
      console.error(`Goal with ID ${goalId} not found in available goals. Available goals:`, goals.map(g => g.id));
      alert('Unable to add milestone - goal not found.');
      return;
    }
    
    console.log('Selected goal:', selectedGoal);
    
    // Set the goal ID directly as string to avoid any type conversion issues
    const goal_id_value = String(goalId);
    console.log('Setting goal_id to:', goal_id_value);
    
    setNewMilestone({
      id: '',
      goal_id: goal_id_value,
      title: '',
      description: '',
      due_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'not-started' as const,
      owner: 'Unassigned',
      progress: 0,
      tasks: [],
      dependencies: [],
      resources: [],
      user_id: ''
    });
    
    console.log('New milestone state set with goal_id:', goal_id_value);
    setIsAddingMilestone(true);
  };

  const handleMilestoneChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewMilestone(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitMilestone = async () => {
    try {
      // Validate goal_id before submitting
      if (!newMilestone.goal_id || newMilestone.goal_id === 'undefined') {
        console.error('Invalid goal ID in handleSubmitMilestone. Current goal_id:', newMilestone.goal_id);
        alert('Please select a valid goal before creating a milestone.');
        return;
      }
      
      console.log('Submitting milestone with goal_id:', newMilestone.goal_id);
      
      const milestoneData: CreateMilestoneInput = {
        goal_id: newMilestone.goal_id,
        title: newMilestone.title,
        description: newMilestone.description,
        due_date: newMilestone.due_date,
        status: newMilestone.status,
        owner: newMilestone.owner || 'Unassigned',
        progress: newMilestone.progress || 0
      };

      await milestoneService.createMilestone(milestoneData);
      await fetchData(); // Refresh all data
      setIsAddingMilestone(false);
      
      // Reset the new milestone form
      setNewMilestone({
        id: '',
        goal_id: '',
        title: '',
        description: '',
        due_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'not-started' as const,
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Program Roadmap</h1>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowGanttView(!showGanttView)}
                className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
              >
                {showGanttView ? 'List View' : 'Gantt View'}
              </button>
            </div>
            <button
              onClick={() => {/* Add program handler */}}
              className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Program
            </button>
          </div>
        </div>

        {/* Notification Bar */}
        <NotificationBar milestones={milestones} />

        {/* Main Content */}
        {showGanttView ? (
          <GanttChart
            items={[
              ...programs.map(p => ({
                id: p.id,
                title: p.name,
                startDate: p.start_date,
                endDate: p.end_date,
                progress: p.progress,
                type: 'program' as const
              })),
              ...goals.map(g => ({
                id: g.id,
                title: g.name,
                startDate: g.start_date,
                endDate: g.end_date,
                progress: g.progress,
                type: 'goal' as const,
                parentId: g.program_id
              })),
              ...milestones.map(m => ({
                id: m.id,
                title: m.title,
                startDate: m.due_date,
                endDate: m.due_date,
                progress: m.progress,
                type: 'milestone' as const,
                parentId: m.goal_id
              }))
            ]}
            startDate={timeRange.start}
            endDate={timeRange.end}
          />
        ) : (
          <div className="space-y-6">
            {/* Programs */}
            {programs.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <h3 className="text-lg font-medium text-gray-700 mb-4">No Programs Found</h3>
                <p className="text-gray-500 mb-6">Start by creating a program, then add goals and milestones.</p>
                <button
                  onClick={() => {/* Add program handler */}}
                  className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
                >
                  <Plus className="w-5 h-5 mr-2 inline" />
                  Add Your First Program
                </button>
              </div>
            ) : (
              programs.map(program => (
                <div key={program.id} className="bg-white rounded-lg shadow-sm p-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => handleProgramToggle(program.id)}
                  >
                    <div className="flex items-center space-x-2">
                      {expandedPrograms.has(program.id) ? 
                        <ChevronUp className="w-5 h-5" /> : 
                        <ChevronDown className="w-5 h-5" />
                      }
                      <h2 className="text-lg font-semibold">{program.name}</h2>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        Progress: {program.progress}%
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddGoal(program.id);
                        }}
                        className="ml-4 px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
                        aria-label="Add goal"
                        title="Add goal to this program"
                      >
                        <Plus className="w-4 h-4 mr-1 inline" />
                        Add Goal
                      </button>
                    </div>
                  </div>

                  {expandedPrograms.has(program.id) && (
                    <div className="mt-4 ml-6 space-y-4">
                      {/* Goals */}
                      {goals.filter(goal => goal.program_id === program.id).length === 0 ? (
                        <div className="bg-gray-50 rounded-lg p-6 text-center">
                          <p className="text-gray-500 mb-4">No goals yet for this program.</p>
                          <button
                            onClick={() => handleAddGoal(program.id)}
                            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 text-sm"
                          >
                            <Plus className="w-4 h-4 mr-1 inline" />
                            Add First Goal
                          </button>
                        </div>
                      ) : (
                        goals
                          .filter(goal => goal.program_id === program.id)
                          .map(goal => (
                            <div key={goal.id} className="bg-gray-50 rounded-lg p-4">
                              <div 
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => handleGoalToggle(goal.id)}
                              >
                                <div className="flex items-center space-x-2">
                                  {expandedGoals.has(goal.id) ? 
                                    <ChevronUp className="w-4 h-4" /> : 
                                    <ChevronDown className="w-4 h-4" />
                                  }
                                  <h3 className="font-medium">{goal.name}</h3>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(goal.status)}`}>
                                    {goal.status}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    Progress: {goal.progress}%
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditGoal(goal);
                                    }}
                                    className="ml-2 text-gray-500 hover:text-gray-700"
                                    aria-label="Edit goal"
                                    title="Edit goal"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddMilestoneForGoal(goal.id);
                                    }}
                                    className="ml-2 px-3 py-1 bg-violet-600 text-white text-xs rounded-md hover:bg-violet-700"
                                    aria-label="Add milestone"
                                    title="Add milestone to this goal"
                                  >
                                    <Plus className="w-3 h-3 mr-1 inline" />
                                    Add Milestone
                                  </button>
                                </div>
                              </div>

                              {expandedGoals.has(goal.id) && (
                                <DndContext
                                  sensors={sensors}
                                  onDragEnd={handleDragEnd}
                                >
                                  <SortableContext items={milestones.map(m => m.id)}>
                                    <div className="mt-4 ml-6 space-y-2">
                                      {/* Milestones */}
                                      {milestones.filter(milestone => milestone.goal_id === goal.id).length === 0 ? (
                                        <div className="bg-white rounded-lg p-4 text-center">
                                          <p className="text-gray-500 mb-2">No milestones yet for this goal.</p>
                                          <button
                                            onClick={() => handleAddMilestoneForGoal(goal.id)}
                                            className="px-3 py-1 bg-violet-600 text-white text-xs rounded-md hover:bg-violet-700"
                                          >
                                            <Plus className="w-3 h-3 mr-1 inline" />
                                            Add First Milestone
                                          </button>
                                        </div>
                                      ) : (
                                        milestones
                                          .filter(milestone => milestone.goal_id === goal.id)
                                          .map(milestone => (
                                            <div
                                              key={milestone.id}
                                              className={`p-3 rounded-lg ${getStatusColor(milestone.status)} cursor-pointer hover:shadow-md transition-shadow`}
                                              onClick={() => {
                                                setSelectedMilestone(milestone);
                                                setShowMilestoneModal(true);
                                              }}
                                            >
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                  {getStatusIcon(milestone.status)}
                                                  <span className="font-medium">{milestone.title}</span>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                  <span className="text-sm">
                                                    Due: {format(parseISO(milestone.due_date), 'MMM d, yyyy')}
                                                  </span>
                                                  <span className="text-sm">
                                                    Progress: {milestone.progress}%
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          ))
                                      )}
                                    </div>
                                  </SortableContext>
                                </DndContext>
                              )}
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Goal Modal */}
        {showGoalModal && (
          <GoalModal
            programId={selectedProgram?.id || ''}
            goal={selectedGoal}
            onClose={() => {
              setShowGoalModal(false);
              setSelectedProgram(null);
              setSelectedGoal(null);
            }}
            onSave={handleSaveGoal}
          />
        )}

        {/* Milestone Modal */}
        {showMilestoneModal && selectedMilestone && (
          <MilestoneDetailModal
            milestone={selectedMilestone}
            allMilestones={milestones}
            onClose={() => {
              setShowMilestoneModal(false);
              setSelectedMilestone(null);
            }}
            onUpdate={async (updatedMilestone) => {
              await fetchData();
              setShowMilestoneModal(false);
              setSelectedMilestone(null);
            }}
          />
        )}

        {/* Add Milestone Modal */}
        {isAddingMilestone && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white pb-4 border-b mb-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Add New Milestone</h2>
                  <button
                    onClick={() => setIsAddingMilestone(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={newMilestone.title}
                    onChange={handleMilestoneChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={newMilestone.description}
                    onChange={handleMilestoneChange}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="due_date"
                    name="due_date"
                    value={newMilestone.due_date}
                    onChange={handleMilestoneChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={newMilestone.status}
                    onChange={handleMilestoneChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                  >
                    <option value="not-started">Not Started</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="at-risk">At Risk</option>
                    <option value="delayed">Delayed</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="owner" className="block text-sm font-medium text-gray-700">
                    Owner
                  </label>
                  <input
                    type="text"
                    id="owner"
                    name="owner"
                    value={newMilestone.owner}
                    onChange={handleMilestoneChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label htmlFor="progress" className="block text-sm font-medium text-gray-700">
                    Progress (%)
                  </label>
                  <input
                    type="number"
                    id="progress"
                    name="progress"
                    value={newMilestone.progress}
                    onChange={handleMilestoneChange}
                    min="0"
                    max="100"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-white pt-4 mt-6 border-t">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsAddingMilestone(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitMilestone}
                    className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
                  >
                    Save Milestone
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 