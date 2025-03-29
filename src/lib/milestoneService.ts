import { supabase } from './supabase';

export interface Milestone {
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
  created_at?: string;
  updated_at?: string;
}

export interface CreateMilestoneInput {
  goal_id: string;
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
    // Validate goal_id
    if (!milestone.goal_id || milestone.goal_id === 'undefined') {
      const error = new Error('Invalid goal ID: must be a valid UUID');
      console.error('Error creating milestone:', error);
      throw error;
    }
    
    // Get current user's ID
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting current user:', userError);
      throw userError;
    }
    
    const userId = userData.user?.id;
    
    if (!userId) {
      throw new Error('No authenticated user found');
    }
    
    console.log('Creating milestone with goal_id:', milestone.goal_id);
    console.log('Current user ID:', userId);
    
    // First verify the goal_id belongs to the current user
    const { data: goalData, error: goalError } = await supabase
      .from('goals')
      .select('id, user_id')
      .eq('id', milestone.goal_id)
      .single();
      
    if (goalError) {
      console.error('Error verifying goal ownership:', goalError);
      throw goalError;
    }
    
    if (goalData.user_id !== userId) {
      throw new Error('You do not have permission to add milestones to this goal');
    }
    
    // Now create the milestone
    const { data, error } = await supabase
      .from('milestones')
      .insert([{
        goal_id: milestone.goal_id,
        title: milestone.title,
        description: milestone.description,
        due_date: milestone.due_date,
        status: milestone.status,
        owner: milestone.owner || 'Unassigned',
        progress: milestone.progress || 0,
        user_id: userId
      }])
      .select('*')
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
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id')
      .eq('program_id', programId);

    if (goalsError) {
      console.error('Error fetching goals:', goalsError);
      throw goalsError;
    }

    if (!goals || goals.length === 0) {
      return [];
    }

    const goalIds = goals.map(g => g.id);
    const { data, error } = await supabase
      .from('milestones')
      .select(`
        id,
        goal_id,
        title,
        description,
        due_date,
        status,
        owner,
        progress,
        tasks,
        dependencies,
        resources,
        user_id,
        created_at,
        updated_at
      `)
      .in('goal_id', goalIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching program milestones:', error);
      throw error;
    }

    return data || [];
  },

  // Get milestones by goal
  async getMilestonesByGoal(goalId: string) {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('goal_id', goalId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error getting milestones by goal:', error);
      throw error;
    }

    return data || [];
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