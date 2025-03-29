import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

interface GoalModalProps {
  programId: string;
  goal: Goal | null | undefined;
  onClose: () => void;
  onSave: (goal: Goal) => Promise<void>;
}

export function GoalModal({ programId, goal, onClose, onSave }: GoalModalProps) {
  const [formData, setFormData] = useState<Partial<Goal>>(
    goal || {
      program_id: programId,
      name: '',
      description: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      status: 'not-started',
      progress: 0,
      owner: ''
    }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (goal) {
        // Update existing goal
        const { data, error } = await supabase
          .from('goals')
          .update(formData)
          .eq('id', goal.id)
          .select()
          .single();

        if (error) throw error;
        if (data) onSave(data);
      } else {
        // Create new goal
        const { data, error } = await supabase
          .from('goals')
          .insert([formData])
          .select()
          .single();

        if (error) throw error;
        if (data) onSave(data);
      }

      onClose();
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {goal ? 'Edit Goal' : 'Create New Goal'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
              title="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded-md"
                  aria-label="Goal name"
                  title="Goal name"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full p-2 border rounded-md"
                  aria-label="Goal description"
                  title="Goal description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="start_date"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Start Date
                  </label>
                  <input
                    id="start_date"
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded-md"
                    aria-label="Goal start date"
                    title="Goal start date"
                  />
                </div>

                <div>
                  <label
                    htmlFor="end_date"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    End Date
                  </label>
                  <input
                    id="end_date"
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded-md"
                    aria-label="Goal end date"
                    title="Goal end date"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded-md"
                  aria-label="Goal status"
                  title="Goal status"
                >
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="at-risk">At Risk</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="owner"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Owner
                </label>
                <input
                  id="owner"
                  type="text"
                  name="owner"
                  value={formData.owner}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  aria-label="Goal owner"
                  title="Goal owner"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
              >
                {goal ? 'Save Changes' : 'Create Goal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 