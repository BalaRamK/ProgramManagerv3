import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns'; // Ensure date-fns is imported for formatting dates

// Define types for risks and scenarios
interface Risk {
  id: string;
  program_id: string | null;
  milestone_id: string | null;
  description: string;
  probability: number;
  impact: number;
  mitigation_strategy: string;
  update: string[];
  update_date: string;
  program_name?: string;
  organization_name?: string;
  milestone_title?: string;
}

interface Program {
  id: string;
  name: string;
}

interface Scenario {
  id: string;
  title: string;
  description: string;
}

export function ScenarioPlanning() {
  const [budget, setBudget] = useState<number>(100);
  const [timeline, setTimeline] = useState<number>(12);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isAddingRisk, setIsAddingRisk] = useState<boolean>(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [newRisk, setNewRisk] = useState<Risk>({
    id: '',
    program_id: null,
    milestone_id: null,
    description: '',
    probability: 0.5,
    impact: 5,
    mitigation_strategy: '',
    update: [],
    update_date: format(new Date(), 'yyyy-MM-dd')
  });

  // Function to simulate scenario impact
  const simulateScenario = (budget: number, timeline: number): string => {
    return `Simulated impact based on Budget: ${budget} and Timeline: ${timeline} months.`;
  };

  const simulationResult = simulateScenario(budget, timeline);

  // Fetch risks and scenarios from Supabase
  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      console.log('Current user:', userData.user.id); // Debug log

      // Fetch risks from risk_view
      const { data: risksData, error: risksError } = await supabase
        .from('risk_view')
        .select('*');

      if (risksError) {
        console.error('Error fetching risks:', risksError);
      } else {
        console.log('Fetched risks:', risksData); // Debug log
        setRisks(risksData || []);
      }

      // Fetch programs for the dropdown
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('*');

      if (programsError) {
        console.error('Error fetching programs:', programsError);
      } else {
        console.log('Fetched programs:', programsData); // Debug log
        setPrograms(programsData || []);
      }
    };

    fetchData();
  }, []);

  // Function to determine the color based on risk probability
  const getRiskColor = (probability: number) => {
    if (probability >= 0.7) return 'bg-red-200'; // High risk
    if (probability >= 0.4) return 'bg-yellow-200'; // Medium risk
    return 'bg-green-200'; // Low risk
  };

  // Function to handle card click
  const handleCardClick = (risk: Risk) => {
    setSelectedRisk(risk);
    setIsModalOpen(true);
  };

  // Function to close the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRisk(null);
  };

  // Function to handle risk update
  const handleUpdateRisk = async () => {
    if (selectedRisk) {
      const { error } = await supabase
        .from('risks')
        .update({
          program_id: selectedRisk.program_id,
          milestone_id: selectedRisk.milestone_id,
          description: selectedRisk.description,
          probability: selectedRisk.probability,
          impact: selectedRisk.impact,
          mitigation_strategy: selectedRisk.mitigation_strategy,
          update: selectedRisk.update,
          update_date: selectedRisk.update_date
        })
        .eq('id', selectedRisk.id);

      if (error) {
        console.error('Error updating risk:', error);
      } else {
        // Refresh risks after update
        const { data: risksData } = await supabase
          .from('risk_view')
          .select('*');
        if (risksData) {
          setRisks(risksData);
        }
        closeModal();
      }
    }
  };

  // Function to handle risk deletion
  const handleDeleteRisk = async () => {
    if (selectedRisk) {
      const { error } = await supabase.from('risks').delete().eq('id', selectedRisk.id);
      if (error) {
        console.error('Error deleting risk:', error);
      } else {
        // Refresh risks after deletion
        const { data: risksData } = await supabase.from('risk_view').select('*');
        if (risksData) {
          setRisks(risksData);
        }
        closeModal();
      }
    }
  };

  // Add new function to handle risk submission
  const handleSubmitRisk = async () => {
    try {
      if (!newRisk.program_id) {
        console.error('Program ID is required');
        return;
      }

      const { data: newRiskData, error } = await supabase
        .from('risks')
        .insert([{
          program_id: newRisk.program_id,
          milestone_id: newRisk.milestone_id,
          description: newRisk.description,
          probability: newRisk.probability,
          impact: newRisk.impact,
          mitigation_strategy: newRisk.mitigation_strategy,
          update: newRisk.update,
          update_date: newRisk.update_date
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding risk:', error);
      } else {
        // Fetch the complete risk data with program and milestone info
        const { data: updatedRisk } = await supabase
          .from('risk_view')
          .select('*')
          .eq('id', newRiskData.id)
          .single();

        if (updatedRisk) {
          setRisks([...risks, updatedRisk]);
          setIsAddingRisk(false);
          setNewRisk({
            id: '',
            program_id: null,
            milestone_id: null,
            description: '',
            probability: 0.5,
            impact: 5,
            mitigation_strategy: '',
            update: [],
            update_date: format(new Date(), 'yyyy-MM-dd')
          });
        }
      }
    } catch (err) {
      console.error('Error in handleSubmitRisk:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Scenario Planning & Risk Analytics</h1>
          <p className="text-gray-600">Analyze scenarios and manage risks to optimize your program.</p>
        </div>

        {/* What-If Simulation Tools */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">What-If Simulation Tools</h2>
          <p className="text-gray-700 mb-4">
            Use interactive tools to simulate different scenarios by adjusting parameters and see the real-time impact on your program.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label htmlFor="budget-slider" className="block text-sm font-medium text-gray-700">Budget (%)</label>
                <input
                  type="range"
                  id="budget-slider"
                  min="50"
                  max="150"
                  step="10"
                  value={budget}
                  onChange={(e) => setBudget(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <p className="text-sm text-gray-500 mt-1">Current Budget: {budget}%</p>
              </div>
              <div className="mb-4">
                <label htmlFor="timeline-slider" className="block text-sm font-medium text-gray-700">Timeline (Months)</label>
                <input
                  type="range"
                  id="timeline-slider"
                  min="6"
                  max="24"
                  step="1"
                  value={timeline}
                  onChange={(e) => setTimeline(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <p className="text-sm text-gray-500 mt-1">Current Timeline: {timeline} months</p>
              </div>
            </div>
            <div>
              <h3 className="text-md font-semibold mb-2">Simulation Result</h3>
              <div className="p-4 border rounded-md bg-gray-100">
                <p className="text-gray-700">{simulationResult}</p>
                {/* Placeholder for real-time visualization */}
                <div className="mt-4 border p-2 rounded-md bg-white">
                  <p className="text-gray-500 italic text-center">Visualization Placeholder</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Risk Cards */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold">Risk Cards</h2>
              <p className="text-gray-700">
                Manage and analyze program risks with detailed risk cards. View probability, impact, and mitigation actions for each risk.
              </p>
            </div>
            <button
              onClick={() => setIsAddingRisk(true)}
              className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
            >
              + Add Risk
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {risks.map(risk => (
              <div key={risk.id} className={`border rounded-md p-4 ${getRiskColor(risk.probability)}`} onClick={() => handleCardClick(risk)}>
                <h3 className="text-md font-semibold">{risk.description}</h3>
                <p className="text-sm text-gray-600">Probability: {risk.probability}</p>
                <p className="text-sm text-gray-600">Impact: {risk.impact}</p>
                <p className="text-sm text-gray-600">Mitigation Strategy: {risk.mitigation_strategy}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Scenario Comparison */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Scenario Comparison</h2>
          <p className="text-gray-700 mb-4">
            Compare different simulated scenarios side-by-side to understand the trade-offs and make informed decisions.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map(scenario => (
              <div key={scenario.id} className="border rounded-md p-4">
                <h3 className="text-md font-semibold">{scenario.title}</h3>
                <p className="text-sm text-gray-600">{scenario.description}</p>
                {/* Add scenario comparison details here */}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Modal for Risk Details */}
      {isModalOpen && selectedRisk && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-lg font-semibold">{selectedRisk.description}</h2>
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Probability</h3>
                <input 
                  type="number" 
                  value={selectedRisk.probability} 
                  onChange={(e) => setSelectedRisk({ ...selectedRisk, probability: parseFloat(e.target.value) })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  placeholder="Enter probability"
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Impact</h3>
                <input 
                  type="number" 
                  value={selectedRisk.impact} 
                  onChange={(e) => setSelectedRisk({ ...selectedRisk, impact: parseFloat(e.target.value) })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  placeholder="Enter impact"
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Mitigation Strategy</h3>
                <input 
                  type="text" 
                  value={selectedRisk.mitigation_strategy} 
                  onChange={(e) => setSelectedRisk({ ...selectedRisk, mitigation_strategy: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  placeholder="Enter mitigation strategy"
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Latest Updates</h3>
                <textarea 
                  value={selectedRisk.update ? selectedRisk.update.join(', ') : ''}
                  onChange={(e) => setSelectedRisk({ ...selectedRisk, update: e.target.value.split(',').map(update => update.trim()) })}
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  placeholder="Enter latest updates (comma separated)"
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Update Date</h3>
                <input 
                  type="date" 
                  value={selectedRisk.update_date ? format(parseISO(selectedRisk.update_date), 'yyyy-MM-dd') : ''}
                  onChange={(e) => setSelectedRisk({ ...selectedRisk, update_date: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  title="Select update date"
                  placeholder="Select date"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={handleUpdateRisk} className="bg-blue-500 text-white rounded px-4 py-2">Update</button>
              <button onClick={handleDeleteRisk} className="bg-red-500 text-white rounded px-4 py-2 ml-2">Delete</button>
              <button onClick={closeModal} className="bg-gray-300 rounded px-4 py-2 ml-2">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Risk Modal */}
      {isAddingRisk && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Add New Risk</h3>
            <div className="mb-4">
              <label htmlFor="program-select" className="block text-sm font-medium text-gray-700">Program</label>
              <select
                id="program-select"
                value={newRisk.program_id || ''}
                onChange={(e) => setNewRisk({ ...newRisk, program_id: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
              >
                <option value="">Select a program</option>
                {programs.map(program => (
                  <option key={program.id} value={program.id}>{program.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="new-risk-description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="new-risk-description"
                value={newRisk.description}
                onChange={(e) => setNewRisk({ ...newRisk, description: e.target.value })}
                className="mt-1 p-2 border border-gray-300 rounded w-full"
                placeholder="Enter risk description"
              />
            </div>
            <div className="mt-4">
              <label htmlFor="new-risk-probability" className="block text-sm font-medium text-gray-700">Probability (0-1)</label>
              <input
                type="number"
                id="new-risk-probability"
                value={newRisk.probability}
                onChange={(e) => setNewRisk({ ...newRisk, probability: parseFloat(e.target.value) })}
                min="0"
                max="1"
                step="0.1"
                className="mt-1 p-2 border border-gray-300 rounded w-full"
                title="Risk probability between 0 and 1"
                placeholder="Enter probability (0-1)"
              />
            </div>
            <div className="mt-4">
              <label htmlFor="new-risk-impact" className="block text-sm font-medium text-gray-700">Impact (1-10)</label>
              <input
                type="number"
                id="new-risk-impact"
                value={newRisk.impact}
                onChange={(e) => setNewRisk({ ...newRisk, impact: parseInt(e.target.value) })}
                min="1"
                max="10"
                className="mt-1 p-2 border border-gray-300 rounded w-full"
              />
            </div>
            <div className="mt-4">
              <label htmlFor="new-risk-mitigation" className="block text-sm font-medium text-gray-700">Mitigation Strategy</label>
              <textarea
                id="new-risk-mitigation"
                value={newRisk.mitigation_strategy}
                onChange={(e) => setNewRisk({ ...newRisk, mitigation_strategy: e.target.value })}
                className="mt-1 p-2 border border-gray-300 rounded w-full"
                placeholder="Enter mitigation strategy"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSubmitRisk}
                className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
              >
                Save Risk
              </button>
              <button
                onClick={() => setIsAddingRisk(false)}
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
