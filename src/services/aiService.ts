import { generateDeepseekSuggestions } from './deepseekService';
import { supabase } from '../lib/supabase';

interface AIModelConfig {
  promptTemplate: string;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  impact: {
    timeline: number;
    budget: number;
    resources: number;
  };
}

interface SaveScenarioParams {
  programId: string;
  title: string;
  description: string;
  parameterChanges: {
    timeline?: number;
    budget?: number;
    resources?: number;
  };
  predictedOutcome: {
    timeline?: number;
    budget?: number;
    resources?: number;
  };
}

type Strategy = 'acceleration' | 'cost-optimization' | 'resource-optimization' | 'balanced';

class AIService {
  private isLoading: boolean = false;
  private useDeepseek: boolean = true;
  private config: AIModelConfig = {
    promptTemplate: `You are an AI assistant helping with program management scenario analysis.
Current program context:
- Budget: {budget}%
- Timeline: {timeline} months
- Resources: {resources}
- Known Risks: {risks}

User query: {query}

Analyze the scenario and provide 2-3 actionable suggestions. For each suggestion, include:
1. A clear title
2. A detailed description
3. Impact on timeline (in months)
4. Impact on budget (in percentage)
5. Impact on resource allocation (in percentage)`
  };

  async loadModel() {
    if (this.isLoading) return;
    this.isLoading = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error loading AI model:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  private analyzeQuery(query: string): string {
    const keywords = query.toLowerCase().split(' ');
    if (keywords.some(k => k.includes('fast') || k.includes('quick') || k.includes('speed'))) {
      return 'acceleration';
    }
    if (keywords.some(k => k.includes('cost') || k.includes('budget') || k.includes('save'))) {
      return 'cost-optimization';
    }
    if (keywords.some(k => k.includes('resource') || k.includes('team') || k.includes('staff'))) {
      return 'resource-optimization';
    }
    return 'balanced';
  }

  async generateSuggestions(query: string, context: any): Promise<Suggestion[]> {
    if (this.useDeepseek) {
      try {
        const response = await generateDeepseekSuggestions(query, context);
        return response.suggestions.map((suggestion, index) => ({
          id: `suggestion-${Date.now()}-${index}`,
          ...suggestion
        }));
      } catch (error) {
        console.error('Error using DeepSeek API, falling back to rule-based suggestions:', error);
        this.useDeepseek = false;
      }
    }

    // Fallback to rule-based suggestions
    const strategy = this.analyzeQuery(query);
    const timestamp = Date.now();
    const suggestions: Record<Strategy, Suggestion[]> = {
      'acceleration': [
        {
          id: `suggestion-${timestamp}-1`,
          title: 'Accelerated Timeline',
          description: 'Increase team capacity by 20% to reduce project timeline. This can be achieved by bringing in additional contractors or reallocating resources from lower-priority projects.',
          impact: {
            timeline: -2,
            budget: 15,
            resources: 20
          }
        },
        {
          id: `suggestion-${timestamp}-2`,
          title: 'Fast-Track Critical Path',
          description: 'Identify and optimize critical path activities. Implement parallel execution where possible and add resources to bottleneck tasks.',
          impact: {
            timeline: -1.5,
            budget: 10,
            resources: 15
          }
        }
      ],
      'cost-optimization': [
        {
          id: `suggestion-${timestamp}-1`,
          title: 'Resource Optimization',
          description: 'Implement agile methodologies and cross-functional teams to improve resource utilization. This approach can help reduce redundancies and improve team efficiency.',
          impact: {
            timeline: 0,
            budget: -10,
            resources: -5
          }
        },
        {
          id: `suggestion-${timestamp}-2`,
          title: 'Cost Control Measures',
          description: 'Implement stricter budget controls and optimize resource allocation. Review and renegotiate vendor contracts where possible.',
          impact: {
            timeline: 1,
            budget: -15,
            resources: -10
          }
        }
      ],
      'resource-optimization': [
        {
          id: `suggestion-${timestamp}-1`,
          title: 'Team Restructuring',
          description: 'Reorganize teams into cross-functional units to improve efficiency and reduce handoffs. Implement agile practices for better resource utilization.',
          impact: {
            timeline: -0.5,
            budget: -5,
            resources: -15
          }
        },
        {
          id: `suggestion-${timestamp}-2`,
          title: 'Skill Enhancement',
          description: 'Invest in training and upskilling existing team members. This will improve productivity and reduce the need for additional hiring.',
          impact: {
            timeline: 0.5,
            budget: 5,
            resources: -10
          }
        }
      ],
      'balanced': [
        {
          id: `suggestion-${timestamp}-1`,
          title: 'Hybrid Approach',
          description: 'Combine selective team expansion with process optimization. Focus on critical path activities while streamlining non-critical tasks.',
          impact: {
            timeline: -1,
            budget: 5,
            resources: 10
          }
        },
        {
          id: `suggestion-${timestamp}-2`,
          title: 'Agile Transformation',
          description: 'Gradually transition to agile methodologies while maintaining existing processes. This balanced approach ensures stability while improving efficiency.',
          impact: {
            timeline: 0,
            budget: 0,
            resources: 0
          }
        }
      ]
    };

    return suggestions[strategy as Strategy] || suggestions['balanced'];
  }

  async saveScenario({
    programId,
    title,
    description,
    parameterChanges,
    predictedOutcome
  }: SaveScenarioParams) {
    const { data, error } = await supabase
      .from('scenarios')
      .insert([
        {
          program_id: programId,
          title,
          description,
          parameter_changes: parameterChanges,
          predicted_outcome: predictedOutcome
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving scenario:', error);
      throw error;
    }

    return data;
  }

  resetSession() {
    this.useDeepseek = true;
  }
}

export const aiService = new AIService(); 