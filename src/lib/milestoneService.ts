import { supabase } from './supabase';

export interface Milestone {
  id: string;
  program_id: string;
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
  created_at?: string;
  updated_at?: string;
}

export interface CreateMilestoneInput {
  program_id: string;
  title: string;
  description: string;
  due_date: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'at-risk' | 'delayed';
  owner: string;
  progress?: number;
  tasks?: any[];
  dependencies?: string[];
  resources?: any[];
}

export const milestoneService = {
  // Create a new milestone
  async createMilestone(milestone: CreateMilestoneInput) {
    const { data, error } = await supabase
      .from('milestones')
      .insert([{
        ...milestone,
        owner: milestone.owner || 'Unassigned'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating milestone:', error);
      throw error;
    }

    return data;
  },

  // Get all milestones
  async getMilestones() {
    const { data, error } = await supabase
      .from('milestone_view')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching milestones:', error);
      throw error;
    }

    return data;
  },

  // Get a single milestone by ID
  async getMilestoneById(id: string) {
    const { data, error } = await supabase
      .from('milestone_view')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching milestone:', error);
      throw error;
    }

    return data;
  },

  // Get milestones by program ID
  async getMilestonesByProgram(programId: string) {
    const { data, error } = await supabase
      .from('milestone_view')
      .select('*')
      .eq('program_id', programId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching program milestones:', error);
      throw error;
    }

    return data;
  },

  // Update a milestone
  async updateMilestone(id: string, updates: Partial<CreateMilestoneInput>) {
    const { data, error } = await supabase
      .from('milestones')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating milestone:', error);
      throw error;
    }

    return data;
  },

  // Delete a milestone
  async deleteMilestone(id: string) {
    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting milestone:', error);
      throw error;
    }
  },

  // Update milestone status
  async updateMilestoneStatus(id: string, status: Milestone['status']) {
    const { data, error } = await supabase
      .from('milestones')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating milestone status:', error);
      throw error;
    }

    return data;
  },

  // Update milestone progress
  async updateMilestoneProgress(id: string, progress: number) {
    const { data, error } = await supabase
      .from('milestones')
      .update({ progress })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating milestone progress:', error);
      throw error;
    }

    return data;
  },

  // Update milestone tasks
  async updateMilestoneTasks(id: string, tasks: any[]) {
    const { data, error } = await supabase
      .from('milestones')
      .update({ tasks })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating milestone tasks:', error);
      throw error;
    }

    return data;
  },

  // Update milestone dependencies
  async updateMilestoneDependencies(id: string, dependencies: string[]) {
    const { data, error } = await supabase
      .from('milestones')
      .update({ dependencies })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating milestone dependencies:', error);
      throw error;
    }

    return data;
  },

  // Update milestone resources
  async updateMilestoneResources(id: string, resources: any[]) {
    const { data, error } = await supabase
      .from('milestones')
      .update({ resources })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating milestone resources:', error);
      throw error;
    }

    return data;
  }
}; 