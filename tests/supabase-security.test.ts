import { createClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Replace these with your actual Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Test users (replace with actual test users from your database)
const testUserMokac = {
  email: 'mokac34340@gamebcs.com',
  password: process.env.TEST_USER_PASSWORD,
  organization_id: '667368e4-32f5-4423-8630-663b1eb6bf48'
};

const testUserAtos = {
  email: 'balaramk93@gmail.com',
  password: process.env.TEST_USER_ATOS_PASSWORD,
  organization_id: '900c31c8-5b60-4ae6-ab9f-7fdfe786bb2d'
};

describe('Supabase Security Policies', () => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  describe('Organization Access Control', () => {
    it('should only allow access to user\'s organization', async () => {
      // Sign in as Mokac user
      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email: testUserMokac.email,
        password: testUserMokac.password!
      });
      
      expect(error).toBeNull();
      expect(session).not.toBeNull();

      // Try to fetch organizations
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*');

      expect(orgsError).toBeNull();
      expect(orgs).not.toBeNull();
      expect(orgs?.length).toBe(1);
      expect(orgs?.[0].id).toBe(testUserMokac.organization_id);
    });

    it('should not allow access to other organizations', async () => {
      // Try to fetch specific organization that user doesn't belong to
      const { data: otherOrg, error: otherOrgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', testUserAtos.organization_id)
        .single();

      expect(otherOrg).toBeNull();
      // The error might be null because RLS just filters the data
    });
  });

  describe('Views Access Control', () => {
    it('should only show profits_monthly for user\'s organization', async () => {
      const { data: profits, error: profitsError } = await supabase
        .from('profits_monthly')
        .select('*');

      expect(profitsError).toBeNull();
      profits?.forEach(profit => {
        expect(profit.organization_id).toBe(testUserMokac.organization_id);
      });
    });

    it('should only show goal_progress_view for user\'s organization', async () => {
      const { data: goals, error: goalsError } = await supabase
        .from('goal_progress_view')
        .select('*');

      expect(goalsError).toBeNull();
      // Verify through program_id -> organization_id relationship
      const { data: programs } = await supabase
        .from('programs')
        .select('id, organization_id')
        .in('id', goals?.map(g => g.program_id) || []);

      programs?.forEach(program => {
        expect(program.organization_id).toBe(testUserMokac.organization_id);
      });
    });

    it('should only show milestone_view for user\'s organization', async () => {
      const { data: milestones, error: milestonesError } = await supabase
        .from('milestone_view')
        .select('*');

      expect(milestonesError).toBeNull();
      // Each milestone should be associated with a goal in user's organization
      const { data: programs } = await supabase
        .from('programs')
        .select('id, organization_id')
        .in('id', milestones?.map(m => m.program_id) || []);

      programs?.forEach(program => {
        expect(program.organization_id).toBe(testUserMokac.organization_id);
      });
    });

    it('should only show risk_view for user\'s organization', async () => {
      const { data: risks, error: risksError } = await supabase
        .from('risk_view')
        .select('*');

      expect(risksError).toBeNull();
      risks?.forEach(risk => {
        expect(risk.organization_name).toBe('mokac actual test');
      });
    });
  });

  describe('Cross-Organization Access', () => {
    it('should switch users and verify data isolation', async () => {
      // First sign out
      await supabase.auth.signOut();

      // Sign in as Atos user
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: testUserAtos.email,
        password: testUserAtos.password!
      });

      expect(loginError).toBeNull();

      // Try to access data
      const { data: atosRisks } = await supabase
        .from('risk_view')
        .select('*');

      // Should only see Atos risks
      atosRisks?.forEach(risk => {
        expect(risk.organization_name).toBe('Atos');
      });

      // Try to access Mokac data
      const { data: mokacData } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', testUserMokac.organization_id)
        .single();

      expect(mokacData).toBeNull();
    });
  });

  // Cleanup after tests
  afterAll(async () => {
    await supabase.auth.signOut();
  });
}); 