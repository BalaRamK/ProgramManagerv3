import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { X, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  description: string;
  due_date: string;
  status: string;
  owner: string;
  progress: number;
  tasks: Task[];
  dependencies: string[];
  resources: Resource[];
}

interface MilestoneDetailModalProps {
  milestone: Milestone;
  allMilestones: Milestone[];
  onClose: () => void;
  onUpdate: (updatedMilestone: Milestone) => void;
}

export function MilestoneDetailModal({
  milestone,
  allMilestones,
  onClose,
  onUpdate
}: MilestoneDetailModalProps) {
  const [editedMilestone, setEditedMilestone] = useState<Milestone>(milestone);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'not-started',
    due_date: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedDependency, setSelectedDependency] = useState<string>('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditedMilestone(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTaskChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTask = async () => {
    if (!newTask.title) return;

    try {
      const { data: taskData, error } = await supabase
        .from('tasks')
        .insert([
          {
            milestone_id: milestone.id,
            title: newTask.title,
            description: newTask.description,
            status: newTask.status,
            due_date: newTask.due_date
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const updatedMilestone = {
        ...editedMilestone,
        tasks: [...editedMilestone.tasks, taskData]
      };

      setEditedMilestone(updatedMilestone);
      setNewTask({
        title: '',
        description: '',
        status: 'not-started',
        due_date: format(new Date(), 'yyyy-MM-dd')
      });
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      const updatedMilestone = {
        ...editedMilestone,
        tasks: editedMilestone.tasks.filter(task => task.id !== taskId)
      };

      setEditedMilestone(updatedMilestone);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleAddDependency = async () => {
    if (!selectedDependency) return;

    try {
      const { error } = await supabase
        .from('milestone_dependencies')
        .insert([
          {
            milestone_id: milestone.id,
            depends_on_milestone_id: selectedDependency
          }
        ]);

      if (error) throw error;

      const updatedMilestone = {
        ...editedMilestone,
        dependencies: [...editedMilestone.dependencies, selectedDependency]
      };

      setEditedMilestone(updatedMilestone);
      setSelectedDependency('');
    } catch (error) {
      console.error('Error adding dependency:', error);
    }
  };

  const handleRemoveDependency = async (dependencyId: string) => {
    try {
      const { error } = await supabase
        .from('milestone_dependencies')
        .delete()
        .eq('milestone_id', milestone.id)
        .eq('depends_on_milestone_id', dependencyId);

      if (error) throw error;

      const updatedMilestone = {
        ...editedMilestone,
        dependencies: editedMilestone.dependencies.filter(id => id !== dependencyId)
      };

      setEditedMilestone(updatedMilestone);
    } catch (error) {
      console.error('Error removing dependency:', error);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('milestones')
        .update({
          title: editedMilestone.title,
          description: editedMilestone.description,
          due_date: editedMilestone.due_date,
          status: editedMilestone.status,
          owner: editedMilestone.owner,
          progress: editedMilestone.progress
        })
        .eq('id', milestone.id);

      if (error) throw error;

      onUpdate(editedMilestone);
      onClose();
    } catch (error) {
      console.error('Error updating milestone:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Milestone Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
              title="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={editedMilestone.title}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                aria-label="Milestone title"
                title="Milestone title"
                placeholder="Enter milestone title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                name="due_date"
                value={editedMilestone.due_date.split('T')[0]}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                aria-label="Milestone due date"
                title="Milestone due date"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={editedMilestone.status}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                aria-label="Milestone status"
                title="Milestone status"
              >
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="at-risk">At Risk</option>
                <option value="delayed">Delayed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Progress
              </label>
              <input
                type="number"
                name="progress"
                value={editedMilestone.progress}
                onChange={handleChange}
                min="0"
                max="100"
                className="w-full p-2 border rounded-md"
                aria-label="Milestone progress"
                title="Milestone progress"
                placeholder="Enter progress percentage"
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={editedMilestone.description}
              onChange={handleChange}
              rows={4}
              className="w-full p-2 border rounded-md"
              aria-label="Milestone description"
              title="Milestone description"
              placeholder="Enter milestone description"
            />
          </div>

          {/* Tasks */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Tasks</h3>
            <div className="space-y-4">
              {editedMilestone.tasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <h4 className="font-medium">{task.title}</h4>
                    <p className="text-sm text-gray-500">{task.description}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                        {task.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        Due: {format(parseISO(task.due_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-red-500 hover:text-red-700"
                    aria-label={`Delete task ${task.title}`}
                    title={`Delete task ${task.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {/* Add Task Form */}
              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="title"
                    value={newTask.title}
                    onChange={handleTaskChange}
                    placeholder="Task title"
                    aria-label="Task title"
                    title="Task title"
                    className="p-2 border rounded-md"
                  />
                  <input
                    type="text"
                    name="description"
                    value={newTask.description}
                    onChange={handleTaskChange}
                    placeholder="Task description"
                    aria-label="Task description"
                    title="Task description"
                    className="p-2 border rounded-md"
                  />
                  <select
                    name="status"
                    value={newTask.status}
                    onChange={handleTaskChange}
                    className="p-2 border rounded-md"
                    aria-label="Task status"
                    title="Task status"
                  >
                    <option value="not-started">Not Started</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <input
                    type="date"
                    name="due_date"
                    value={newTask.due_date}
                    onChange={handleTaskChange}
                    className="p-2 border rounded-md"
                    aria-label="Task due date"
                    title="Task due date"
                  />
                </div>
                <button
                  onClick={handleAddTask}
                  className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>

          {/* Dependencies */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Dependencies</h3>
            <div className="space-y-4">
              {editedMilestone.dependencies.map(depId => {
                const dependentMilestone = allMilestones.find(m => m.id === depId);
                return (
                  <div
                    key={depId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <span>{dependentMilestone?.title}</span>
                    <button
                      onClick={() => handleRemoveDependency(depId)}
                      className="text-red-500 hover:text-red-700"
                      aria-label={`Remove dependency ${dependentMilestone?.title}`}
                      title={`Remove dependency ${dependentMilestone?.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

              {/* Add Dependency Form */}
              <div className="border-t pt-4 mt-4">
                <select
                  value={selectedDependency}
                  onChange={e => setSelectedDependency(e.target.value)}
                  className="w-full p-2 border rounded-md mb-4"
                  aria-label="Select milestone dependency"
                  title="Select milestone dependency"
                >
                  <option value="">Select a milestone...</option>
                  {allMilestones
                    .filter(m => m.id !== milestone.id)
                    .map(m => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                </select>
                <button
                  onClick={handleAddDependency}
                  className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
                >
                  Add Dependency
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}