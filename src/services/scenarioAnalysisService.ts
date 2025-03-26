import { supabase } from '../lib/supabase';

interface ScenarioContext {
  budget: number;
  timeline: number;
  resources: any[];
  risks: any[];
}

interface ScenarioSuggestion {
  id: string;
  title: string;
  description: string;
  strategy: 'acceleration' | 'cost-optimization' | 'resource-optimization' | 'balanced';
  impact: {
    timeline: number;
    budget: number;
    resources: number;
  };
  confidence: number;
  risks: string[];
}

interface Scenario {
  id: string;
  program_id: string;
  title: string;
  description: string;
  parameter_changes: {
    timeline: number;
    budget: number;
    resources: number;
  };
  predicted_outcomes: {
    timeline: number;
    budget: number;
    resources: number;
  };
  created_at: string;
}

class ScenarioAnalysisService {
  private static strategies = {
    acceleration: {
      name: 'Acceleration Strategy',
      description: 'Focus on speeding up program delivery while maintaining quality',
      impact: {
        timeline: -2, // Reduce timeline by 2 months
        budget: 10,   // Increase budget by 10%
        resources: 15 // Increase resources by 15%
      }
    },
    'cost-optimization': {
      name: 'Cost Optimization Strategy',
      description: 'Optimize program costs while maintaining timeline and quality',
      impact: {
        timeline: 0,
        budget: -15,  // Reduce budget by 15%
        resources: -5  // Reduce resources by 5%
      }
    },
    'resource-optimization': {
      name: 'Resource Optimization Strategy',
      description: 'Optimize resource allocation and utilization',
      impact: {
        timeline: 1,
        budget: -5,   // Reduce budget by 5%
        resources: -10 // Reduce resources by 10%
      }
    },
    balanced: {
      name: 'Balanced Strategy',
      description: 'Balance timeline, cost, and resource optimization',
      impact: {
        timeline: -1, // Reduce timeline by 1 month
        budget: -5,   // Reduce budget by 5%
        resources: -5  // Reduce resources by 5%
      }
    }
  };

  private static analyzeQuery(query: string): 'acceleration' | 'cost-optimization' | 'resource-optimization' | 'balanced' {
    const keywords = {
      acceleration: ['speed', 'fast', 'quick', 'accelerate', 'hurry', 'rush', 'expedite'],
      'cost-optimization': ['cost', 'budget', 'money', 'expensive', 'cheap', 'save', 'spend'],
      'resource-optimization': ['resource', 'team', 'staff', 'people', 'workforce', 'capacity']
    };

    const queryLower = query.toLowerCase();
    let maxMatches = 0;
    let bestStrategy: keyof typeof keywords = 'balanced';

    for (const [strategy, words] of Object.entries(keywords)) {
      const matches = words.filter(word => queryLower.includes(word)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestStrategy = strategy as keyof typeof keywords;
      }
    }

    return bestStrategy;
  }

  private static calculateConfidence(context: ScenarioContext, strategy: keyof typeof ScenarioAnalysisService.strategies): number {
    let confidence = 0.7; // Base confidence

    // Adjust confidence based on context
    const { budget, timeline, resources, risks } = context;
    const impact = ScenarioAnalysisService.strategies[strategy].impact;

    // Budget confidence
    if (strategy === 'cost-optimization' && budget > 100) {
      confidence += 0.1; // Higher confidence if budget is over 100%
    }

    // Timeline confidence
    if (strategy === 'acceleration' && timeline > 6) {
      confidence += 0.1; // Higher confidence for longer timelines
    }

    // Resource confidence
    if (strategy === 'resource-optimization' && resources.length > 5) {
      confidence += 0.1; // Higher confidence with more resources
    }

    // Risk adjustment
    if (risks.length > 0) {
      confidence -= 0.1; // Lower confidence with existing risks
    }

    return Math.min(Math.max(confidence, 0.5), 0.9); // Keep between 0.5 and 0.9
  }

  private static generateRisks(strategy: keyof typeof ScenarioAnalysisService.strategies): string[] {
    const riskTemplates = {
      acceleration: [
        'Quality may be impacted by accelerated timeline',
        'Team burnout risk due to increased pace',
        'Resource availability may be constrained'
      ],
      'cost-optimization': [
        'Quality may be impacted by reduced budget',
        'Resource quality may be affected',
        'Scope may need to be adjusted'
      ],
      'resource-optimization': [
        'Timeline may be impacted by reduced resources',
        'Team workload may increase',
        'Knowledge transfer may be affected'
      ],
      balanced: [
        'Balanced approach may not optimize any single aspect',
        'Multiple changes may increase complexity',
        'Team may need time to adjust to changes'
      ]
    };

    return riskTemplates[strategy];
  }

  public static async generateSuggestions(query: string, context: ScenarioContext): Promise<ScenarioSuggestion[]> {
    const strategy = this.analyzeQuery(query);
    const baseStrategy = this.strategies[strategy];
    const confidence = this.calculateConfidence(context, strategy);
    const risks = this.generateRisks(strategy);

    // Generate variations of the base strategy
    const suggestions: ScenarioSuggestion[] = [
      {
        id: `suggestion-${Date.now()}-1`,
        title: baseStrategy.name,
        description: baseStrategy.description,
        strategy,
        impact: { ...baseStrategy.impact },
        confidence,
        risks
      },
      {
        id: `suggestion-${Date.now()}-2`,
        title: `${baseStrategy.name} (Conservative)`,
        description: `${baseStrategy.description} with more conservative impact estimates`,
        strategy,
        impact: {
          timeline: baseStrategy.impact.timeline * 0.7,
          budget: baseStrategy.impact.budget * 0.7,
          resources: baseStrategy.impact.resources * 0.7
        },
        confidence: confidence * 0.9,
        risks: [...risks, 'Conservative approach may limit potential benefits']
      },
      {
        id: `suggestion-${Date.now()}-3`,
        title: `${baseStrategy.name} (Aggressive)`,
        description: `${baseStrategy.description} with more aggressive impact estimates`,
        strategy,
        impact: {
          timeline: baseStrategy.impact.timeline * 1.3,
          budget: baseStrategy.impact.budget * 1.3,
          resources: baseStrategy.impact.resources * 1.3
        },
        confidence: confidence * 0.8,
        risks: [...risks, 'Aggressive approach may increase implementation risks']
      }
    ];

    return suggestions;
  }

  public static async saveScenario(params: {
    program_id: string;
    title: string;
    description: string;
    parameter_changes: {
      timeline: number;
      budget: number;
      resources: number;
    };
    predicted_outcomes: {
      timeline: number;
      budget: number;
      resources: number;
    };
  }): Promise<Scenario> {
    try {
      const { data, error } = await supabase
        .from('scenarios')
        .insert([{
          program_id: params.program_id,
          title: params.title,
          description: params.description,
          parameter_changes: params.parameter_changes,
          predicted_outcomes: params.predicted_outcomes
        }])
        .select()
        .single();

      if (error) {
        console.error('Error saving scenario:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in saveScenario:', error);
      throw error;
    }
  }

  public static async getScenarios(program_id: string): Promise<Scenario[]> {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('program_id', program_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching scenarios:', error);
      throw error;
    }

    return data;
  }
}

export default ScenarioAnalysisService; 