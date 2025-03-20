import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns'; // Ensure date-fns is imported for formatting dates

// Define types for risks and scenarios
interface Risk {
  id: string; // Assuming UUID is stored as a string
  description: string;
  probability: number; // Assuming probability is a number between 0 and 1
  impact: number; // Assuming impact is a numeric value
  mitigation_strategy: string;
  updates: string[]; // New property for updates
  update_date: string; // New property for the date of the latest update
}

interface Scenario {
  id: string; // Assuming UUID is stored as a string
  title: string;
  description: string;
}

export function ScenarioPlanning() {
  const [budget, setBudget] = useState<number>(100); // Explicitly define type
  const [timeline, setTimeline] = useState<number>(12); // Explicitly define type
  const [risks, setRisks] = useState<Risk[]>([]); // Define type for risks
  const [scenarios, setScenarios] = useState<Scenario[]>([]); // Define type for scenarios
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null); // State for selected risk
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // State for modal visibility

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

      // Fetch risks
      const { data: risksData, error: risksError } = await supabase
        .from('risks')
        .select('*')
        .eq('user_id', userData.user.id);
      if (risksData) {
        setRisks(risksData);
      }
      if (risksError) {
        console.error('Error fetching risks:', risksError);
      }

      // Fetch scenarios
      const { data: scenariosData, error: scenariosError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('user_id', userData.user.id);
      if (scenariosData) {
        setScenarios(scenariosData);
      }
      if (scenariosError) {
        console.error('Error fetching scenarios:', scenariosError);
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
          probability: selectedRisk.probability,
          impact: selectedRisk.impact,
          mitigation_strategy: selectedRisk.mitigation_strategy,
        })
        .eq('id', selectedRisk.id);

      if (error) {
        console.error('Error updating risk:', error);
      } else {
        // Refresh risks after update
        const { data: risksData } = await supabase.from('risks').select('*');
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
        const { data: risksData } = await supabase.from('risks').select('*');
        if (risksData) {
          setRisks(risksData);
        }
        closeModal();
      }
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
          <h2 className="text-lg font-semibold mb-4">Risk Cards</h2>
          <p className="text-gray-700 mb-4">
            Manage and analyze program risks with detailed risk cards. View probability, impact, and mitigation actions for each risk.
          </p>
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
                  value={selectedRisk.updates ? selectedRisk.updates.join(', ') : ''}
                  onChange={(e) => setSelectedRisk({ ...selectedRisk, updates: e.target.value.split(',').map(update => update.trim()) })}
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
    </div>
  );
}
