import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { Download, Share2, Filter, TableIcon, GridIcon } from 'lucide-react';

// Define types for risks and programs
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
  status: 'open' | 'closed';
}

interface Program {
  id: string;
  name: string;
  organization_id: string;
}

interface Milestone {
  id: string;
  title: string;
  due_date: string;
  status: string;
}

export function RiskAnalysis() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isAddingRisk, setIsAddingRisk] = useState<boolean>(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showClosedRisks, setShowClosedRisks] = useState<boolean>(false);
  const [newRisk, setNewRisk] = useState<Risk>({
    id: '',
    program_id: null,
    milestone_id: null,
    description: '',
    probability: 0.5,
    impact: 5,
    mitigation_strategy: '',
    update: [],
    update_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'open'
  });

  // Fetch risks and programs from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        // Fetch risks with all fields including status
        const { data: risksData, error: risksError } = await supabase
          .from('risk_view')
          .select(`
            id,
            program_id,
            milestone_id,
            description,
            probability,
            impact,
            mitigation_strategy,
            update,
            update_date,
            program_name,
            organization_name,
            milestone_title,
            status
          `) as { data: Risk[] | null, error: any };

        if (risksError) {
          console.error('Error fetching risks:', risksError);
          return;
        }

        // Ensure all risks have required fields
        const processedRisks = (risksData || []).map(risk => ({
          ...risk,
          update: risk.update || [],
          status: risk.status || 'open'
        }));

        setRisks(processedRisks);

        // Fetch programs for the dropdown
        const { data: programsData, error: programsError } = await supabase
          .from('programs')
          .select('id, name, organization_id');

        if (programsError) {
          console.error('Error fetching programs:', programsError);
          return;
        }

        setPrograms(programsData || []);
      } catch (err) {
        console.error('Error in fetchData:', err);
      }
    };

    fetchData();
  }, []);

  // Add function to fetch milestones for a program
  const fetchMilestones = async (programId: string) => {
    const { data: milestonesData, error } = await supabase
      .from('milestones')
      .select('id, title, due_date, status')
      .eq('program_id', programId);

    if (error) {
      console.error('Error fetching milestones:', error);
      return;
    }

    setMilestones(milestonesData || []);
  };

  // Update program selection handler
  const handleProgramChange = (programId: string) => {
    setNewRisk({ ...newRisk, program_id: programId, milestone_id: null });
    if (programId) {
      fetchMilestones(programId);
    } else {
      setMilestones([]);
    }
  };

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
          update_date: selectedRisk.update_date,
          status: selectedRisk.status
        })
        .eq('id', selectedRisk.id);

      if (error) {
        console.error('Error updating risk:', error);
      } else {
        // Refresh risks after update
        const { data: risksData } = await supabase
          .from('risk_view')
          .select(`
            id,
            program_id,
            milestone_id,
            description,
            probability,
            impact,
            mitigation_strategy,
            update,
            update_date,
            program_name,
            organization_name,
            milestone_title,
            status
          `) as { data: Risk[] | null, error: any };

        if (risksData) {
          const processedRisks = risksData.map(risk => ({
            ...risk,
            update: risk.update || [],
            status: risk.status || 'open'
          }));
          setRisks(processedRisks);
        }
        closeModal();
      }
    }
  };

  // Function to handle risk status change
  const handleStatusChange = async (risk: Risk, newStatus: 'open' | 'closed') => {
    const { error } = await supabase
      .from('risks')
      .update({ status: newStatus })
      .eq('id', risk.id);

    if (error) {
      console.error('Error updating risk status:', error);
    } else {
      // Refresh risks after update
      const { data: risksData } = await supabase
        .from('risk_view')
        .select(`
          id,
          program_id,
          milestone_id,
          description,
          probability,
          impact,
          mitigation_strategy,
          update,
          update_date,
          program_name,
          organization_name,
          milestone_title,
          status
        `) as { data: Risk[] | null, error: any };

      if (risksData) {
        const processedRisks = risksData.map(risk => ({
          ...risk,
          update: risk.update || [],
          status: risk.status || 'open'
        }));
        setRisks(processedRisks);
      }
    }
  };

  // Function to handle risk submission
  const handleSubmitRisk = async () => {
    try {
      if (!newRisk.program_id) {
        console.error('Program ID is required');
        return;
      }

      // First, insert the new risk
      const { data: newRiskData, error: insertError } = await supabase
        .from('risks')
        .insert({
          program_id: newRisk.program_id,
          milestone_id: newRisk.milestone_id,
          description: newRisk.description,
          probability: newRisk.probability,
          impact: newRisk.impact,
          mitigation_strategy: newRisk.mitigation_strategy,
          update: newRisk.update || [], // Ensure update is an array
          update_date: format(new Date(), 'yyyy-MM-dd'),
          status: 'open' // Set initial status as open
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting risk:', insertError);
        return;
      }

      if (newRiskData) {
        // Refresh the entire risks list
        const { data: refreshedRisks, error: refreshError } = await supabase
          .from('risk_view')
          .select(`
            id,
            program_id,
            milestone_id,
            description,
            probability,
            impact,
            mitigation_strategy,
            update,
            update_date,
            program_name,
            organization_name,
            milestone_title,
            status
          `) as { data: Risk[] | null, error: any };

        if (refreshError) {
          console.error('Error refreshing risks:', refreshError);
        } else if (refreshedRisks) {
          const processedRisks = refreshedRisks.map(risk => ({
            ...risk,
            update: risk.update || [],
            status: risk.status || 'open'
          }));
          setRisks(processedRisks);
          setIsAddingRisk(false);
          // Reset the new risk form
          setNewRisk({
            id: '',
            program_id: null,
            milestone_id: null,
            description: '',
            probability: 0.5,
            impact: 5,
            mitigation_strategy: '',
            update: [],
            update_date: format(new Date(), 'yyyy-MM-dd'),
            status: 'open'
          });
        }
      }
    } catch (err) {
      console.error('Error in handleSubmitRisk:', err);
    }
  };

  const openRisks = risks.filter(risk => risk.status === 'open');
  const closedRisks = risks.filter(risk => risk.status === 'closed');

  // Update the table headers and rows to include program and milestone info
  const tableHeaders = (
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Milestone</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Probability</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impact</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mitigation</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
    </tr>
  );

  // Update the risk card to show program and milestone info
  const RiskCard = ({ risk }: { risk: Risk }) => (
    <div className={`border rounded-md p-4 ${getRiskColor(risk.probability)}`}>
      <div className="flex justify-between">
        <h3 className="text-md font-semibold">{risk.description}</h3>
        <button
          onClick={() => handleStatusChange(risk, 'closed')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Close
        </button>
      </div>
      <p className="text-sm text-gray-600">Program: {risk.program_name}</p>
      {risk.milestone_title && (
        <p className="text-sm text-gray-600">Milestone: {risk.milestone_title}</p>
      )}
      <p className="text-sm text-gray-600">Probability: {risk.probability}</p>
      <p className="text-sm text-gray-600">Impact: {risk.impact}</p>
      <p className="text-sm text-gray-600">Mitigation: {risk.mitigation_strategy}</p>
      <button
        onClick={() => handleCardClick(risk)}
        className="mt-2 text-violet-600 hover:text-violet-700 text-sm"
      >
        View Details
      </button>
    </div>
  );

  // Update the Add Risk Modal to include milestone selection
  const AddRiskForm = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="program-select" className="block text-sm font-medium text-gray-700">Program</label>
        <select
          id="program-select"
          value={newRisk.program_id || ''}
          onChange={(e) => handleProgramChange(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
        >
          <option value="">Select a program</option>
          {programs.map(program => (
            <option key={program.id} value={program.id}>{program.name}</option>
          ))}
        </select>
      </div>

      {newRisk.program_id && (
        <div>
          <label htmlFor="milestone-select" className="block text-sm font-medium text-gray-700">Milestone (Optional)</label>
          <select
            id="milestone-select"
            value={newRisk.milestone_id || ''}
            onChange={(e) => setNewRisk({ ...newRisk, milestone_id: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
          >
            <option value="">Select a milestone</option>
            {milestones.map(milestone => (
              <option key={milestone.id} value={milestone.id}>{milestone.title}</option>
            ))}
          </select>
        </div>
      )}

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
  );

  // Update the Risk Details Modal to include milestone selection
  const RiskDetailsModal = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-500">Program</h3>
        <p className="mt-1 text-sm text-gray-900">{selectedRisk?.program_name}</p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-500">Milestone</h3>
        <select
          id="milestone-select"
          value={selectedRisk?.milestone_id || ''}
          onChange={(e) => setSelectedRisk({ ...selectedRisk!, milestone_id: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
        >
          <option value="">Select a milestone</option>
          {milestones.map(milestone => (
            <option key={milestone.id} value={milestone.id}>{milestone.title}</option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-500">Probability</h3>
        <input 
          type="number" 
          value={selectedRisk?.probability} 
          onChange={(e) => setSelectedRisk({ ...selectedRisk!, probability: parseFloat(e.target.value) })} 
          className="mt-1 p-2 border border-gray-300 rounded w-full"
          placeholder="Enter probability"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">Impact</h3>
        <input 
          type="number" 
          value={selectedRisk?.impact} 
          onChange={(e) => setSelectedRisk({ ...selectedRisk!, impact: parseFloat(e.target.value) })} 
          className="mt-1 p-2 border border-gray-300 rounded w-full"
          placeholder="Enter impact"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">Mitigation Strategy</h3>
        <input 
          type="text" 
          value={selectedRisk?.mitigation_strategy} 
          onChange={(e) => setSelectedRisk({ ...selectedRisk!, mitigation_strategy: e.target.value })} 
          className="mt-1 p-2 border border-gray-300 rounded w-full"
          placeholder="Enter mitigation strategy"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">Latest Updates</h3>
        <textarea 
          value={selectedRisk?.update ? selectedRisk.update.join(', ') : ''}
          onChange={(e) => setSelectedRisk({ ...selectedRisk!, update: e.target.value.split(',').map(update => update.trim()) })}
          className="mt-1 p-2 border border-gray-300 rounded w-full"
          placeholder="Enter latest updates (comma separated)"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">Update Date</h3>
        <input 
          type="date" 
          value={selectedRisk?.update_date ? format(parseISO(selectedRisk.update_date), 'yyyy-MM-dd') : ''}
          onChange={(e) => setSelectedRisk({ ...selectedRisk!, update_date: e.target.value })} 
          className="mt-1 p-2 border border-gray-300 rounded w-full"
          title="Select update date"
          placeholder="Select date"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">Status</h3>
        <select
          id="risk-status"
          aria-label="Risk Status"
          value={selectedRisk?.status}
          onChange={(e) => setSelectedRisk({ ...selectedRisk!, status: e.target.value as 'open' | 'closed' })}
          className="mt-1 p-2 border border-gray-300 rounded w-full"
        >
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Risk Analysis</h1>
          <p className="text-gray-600">Manage and analyze program risks.</p>
        </div>

        {/* Risk Management Section */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold">Open Risks</h2>
              <p className="text-gray-700">
                Manage and analyze active program risks.
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
                className="p-2 rounded-md hover:bg-gray-100"
                title={viewMode === 'cards' ? 'Switch to table view' : 'Switch to card view'}
              >
                {viewMode === 'cards' ? <TableIcon size={20} /> : <GridIcon size={20} />}
              </button>
              <button
                onClick={() => setIsAddingRisk(true)}
                className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
              >
                + Add Risk
              </button>
            </div>
          </div>

          {/* Open Risks View */}
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {openRisks.map(risk => (
                <RiskCard key={risk.id} risk={risk} />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  {tableHeaders}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {openRisks.map(risk => (
                    <tr key={risk.id} className={getRiskColor(risk.probability)}>
                      <td className="px-6 py-4 whitespace-nowrap">{risk.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{risk.program_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{risk.milestone_title}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{risk.probability}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{risk.impact}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{risk.mitigation_strategy}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleCardClick(risk)}
                          className="text-violet-600 hover:text-violet-700 mr-3"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleStatusChange(risk, 'closed')}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Close
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Closed Risks Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Closed Risks</h2>
              <button
                onClick={() => setShowClosedRisks(!showClosedRisks)}
                className="text-violet-600 hover:text-violet-700"
              >
                {showClosedRisks ? 'Hide Closed Risks' : 'Show Closed Risks'}
              </button>
            </div>

            {showClosedRisks && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    {tableHeaders}
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {closedRisks.map(risk => (
                      <tr key={risk.id} className={getRiskColor(risk.probability)}>
                        <td className="px-6 py-4 whitespace-nowrap">{risk.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{risk.program_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{risk.milestone_title}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{risk.probability}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{risk.impact}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{risk.mitigation_strategy}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleCardClick(risk)}
                            className="text-violet-600 hover:text-violet-700 mr-3"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleStatusChange(risk, 'open')}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            Reopen
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Risk Details Modal */}
      {isModalOpen && selectedRisk && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-lg font-semibold">{selectedRisk.description}</h2>
            <RiskDetailsModal />
            <div className="flex justify-end mt-4">
              <button onClick={handleUpdateRisk} className="bg-violet-600 text-white rounded px-4 py-2">Update</button>
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
            <AddRiskForm />
          </div>
        </div>
      )}
    </div>
  );
}
