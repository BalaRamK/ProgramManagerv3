import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Filter,
  PlusCircle,
  ChevronDown,
  Edit,
  MessageCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase'; // Ensure supabase is imported

const CommunicationLog = () => {
  const [logs, setLogs] = useState<any[]>([]); // State to hold communication logs
  const [loading, setLoading] = useState<boolean>(true); // Loading state
  const [selectedLog, setSelectedLog] = useState<any | null>(null); // State for the selected log
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // State for modal visibility
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false); // State for add modal visibility
  const [programs, setPrograms] = useState<any[]>([]); // State for programs
  const [milestones, setMilestones] = useState<any[]>([]); // State for milestones
  const [risks, setRisks] = useState<any[]>([]); // State for risks
  const [users, setUsers] = useState<any[]>([]); // State for users
  const [sortCriteria, setSortCriteria] = useState<string>(''); // State for sorting criteria
  const [searchQuery, setSearchQuery] = useState<string>(''); // State for search query
  const [selectedProgram, setSelectedProgram] = useState<string>(''); // State for selected program
  const [selectedMilestone, setSelectedMilestone] = useState<string>(''); // State for selected milestone

  // State for new log
  const [newLog, setNewLog] = useState({
    type: '',
    message: '',
    program_id: '',
    milestone_id: '',
    risk_id: '',
    user_id: '',
  });

  // Color mapping for types
  const typeColors: { [key: string]: string } = {
    Program: 'bg-blue-100 text-blue-800',
    Milestone: 'bg-green-100 text-green-800',
    Risk: 'bg-red-100 text-red-800',
    User: 'bg-yellow-100 text-yellow-800',
  };

  // Fetch communication logs from Supabase
  useEffect(() => {
    const fetchLogs = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase.from('communication_logs').select(`
        id,
        type,
        message,
        created_at,
        programs (name),
        milestones (title),
        risks (description),
        users (name)
      `)
      .eq('user_id', userData.user.id);

      if (error) {
        console.error('Error fetching communication logs:', error);
      } else {
        setLogs(data || []); // Ensure data is not null
      }
      setLoading(false);
    };

    fetchLogs();
  }, []); // Fetch logs on component mount

  // Fetch related data for programs, milestones, risks, and users
  useEffect(() => {
    const fetchRelatedData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: programsData } = await supabase
        .from('programs')
        .select('*')
        .eq('user_id', userData.user.id);
      
      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('*')
        .eq('user_id', userData.user.id);
      
      const { data: risksData } = await supabase
        .from('risks')
        .select('*')
        .eq('user_id', userData.user.id);
      
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', userData.user.organization_id);

      setPrograms(programsData || []); // Ensure data is not null
      setMilestones(milestonesData || []); // Ensure data is not null
      setRisks(risksData || []); // Ensure data is not null
      setUsers(usersData || []); // Ensure data is not null
    };

    fetchRelatedData();
  }, []);

  // Function to handle sorting
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortCriteria(e.target.value);
  };

  // Function to handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Function to handle program filter change
  const handleProgramChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProgram(e.target.value);
  };

  // Function to handle milestone filter change
  const handleMilestoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMilestone(e.target.value);
  };

  // Filter logs based on search query and selected filters
  const filteredLogs = logs.filter(log => {
    const searchText = searchQuery.toLowerCase();
    const matchesSearch = (
      log.type.toLowerCase().includes(searchText) ||
      log.message.toLowerCase().includes(searchText) ||
      (log.programs?.name && log.programs.name.toLowerCase().includes(searchText)) ||
      (log.milestones?.title && log.milestones.title.toLowerCase().includes(searchText)) ||
      (log.risks?.description && log.risks.description.toLowerCase().includes(searchText)) ||
      (log.users?.name && log.users.name.toLowerCase().includes(searchText))
    );

    const matchesProgram = selectedProgram ? log.program_id === selectedProgram : true;
    const matchesMilestone = selectedMilestone ? log.milestone_id === selectedMilestone : true;

    return matchesSearch && matchesProgram && matchesMilestone;
  });

  if (loading) {
    return <div>Loading...</div>; // Loading state
  }

  // Function to open the edit modal
  const handleEditClick = (log: any) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  // Function to open the add modal
  const openAddModal = () => {
    setIsAddModalOpen(true);
    setNewLog({
      type: '',
      message: '',
      program_id: '',
      milestone_id: '',
      risk_id: '',
      user_id: '',
    });
  };

  // Function to close the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLog(null);
  };

  // Function to close the add modal
  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  // Function to handle log update
  const handleUpdateLog = async () => {
    if (selectedLog) {
      const { error } = await supabase
        .from('communication_logs')
        .update({
          type: selectedLog.type,
          message: selectedLog.message,
          program_id: selectedLog.program_id,
          milestone_id: selectedLog.milestone_id,
          risk_id: selectedLog.risk_id,
          user_id: selectedLog.user_id,
        })
        .eq('id', selectedLog.id);

      if (error) {
        console.error('Error updating log:', error);
      } else {
        // Refresh logs after update
        const { data } = await supabase.from('communication_logs').select('*');
        setLogs(data || []); // Ensure data is not null
        closeModal();
      }
    }
  };

  // Function to handle log deletion
  const handleDeleteLog = async () => {
    if (selectedLog) {
      const { error } = await supabase.from('communication_logs').delete().eq('id', selectedLog.id);
      if (error) {
        console.error('Error deleting log:', error);
      } else {
        // Refresh logs after deletion
        const { data } = await supabase.from('communication_logs').select('*');
        setLogs(data || []); // Ensure data is not null
        closeModal();
      }
    }
  };

  // Function to handle adding a new log
  const handleAddLog = async () => {
    const { error } = await supabase
      .from('communication_logs')
      .insert([newLog]);

    if (error) {
      console.error('Error adding log:', error);
    } else {
      // Refresh logs after adding
      const { data } = await supabase.from('communication_logs').select('*');
      setLogs(data || []); // Ensure data is not null
      closeAddModal();
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <MessageSquare className="mr-2" /> Communication Log
      </h1>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <span className="mr-2">Search:</span>
          <input 
            type="text" 
            value={searchQuery} 
            onChange={handleSearchChange} 
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="Search logs..."
          />
        </div>
        <div className="flex items-center">
          <span className="mr-2">Filter by Program:</span>
          <select 
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            onChange={handleProgramChange}
          >
            <option value="">All Programs</option>
            {programs.map(program => (
              <option key={program.id} value={program.id}>{program.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center">
          <span className="mr-2">Filter by Milestone:</span>
          <select 
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            onChange={handleMilestoneChange}
          >
            <option value="">All Milestones</option>
            {milestones.map(milestone => (
              <option key={milestone.id} value={milestone.id}>{milestone.title}</option>
            ))}
          </select>
        </div>
        <button className="bg-violet-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center" onClick={openAddModal}>
          <PlusCircle className="mr-2" /> Add Note
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <div key={log.id} className={`border-b border-gray-200 last:border-none ${typeColors[log.type]} hover:bg-gray-200`}>
              <div className="p-4 cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{log.type} - {log.message}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleDateString()} | 
                      {log.programs?.name && ` Program: ${log.programs.name}`} 
                      {log.milestones?.title && ` | Milestone: ${log.milestones.title}`} 
                      {log.risks?.description && ` | Risk: ${log.risks.description}`} 
                      {log.users?.name && ` | User: ${log.users.name}`}
                    </div>
                  </div>
                  <button className="text-gray-500 hover:text-violet-600" aria-label="Edit log" onClick={() => handleEditClick(log)}>
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
                {log.comments && log.comments.length > 0 && (
                  <div className="mt-3">
                    {log.comments.map((comment: { id: number; user: string; text: string }) => (
                      <div key={comment.id} className="flex items-start mt-2">
                        <MessageCircle className="h-4 w-4 mr-2 text-gray-600" />
                        <div>
                          <div className="text-xs font-medium text-gray-700">{comment.user}</div>
                          <div className="text-xs text-gray-500">{comment.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-gray-500">No logs found.</div>
        )}
      </div>

      {/* Modal for Editing Log */}
      {isModalOpen && selectedLog && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-lg font-semibold">Edit Communication Log</h2>
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Type</h3>
                <input 
                  type="text" 
                  value={selectedLog.type} 
                  onChange={(e) => setSelectedLog({ ...selectedLog, type: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  placeholder="Enter type"
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Message</h3>
                <textarea 
                  value={selectedLog.message} 
                  onChange={(e) => setSelectedLog({ ...selectedLog, message: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  placeholder="Enter message"
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Program</h3>
                <select 
                  value={selectedLog.program_id} 
                  onChange={(e) => setSelectedLog({ ...selectedLog, program_id: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  title="Select Program"
                >
                  <option value="">Select Program</option>
                  {programs.map(program => (
                    <option key={program.id} value={program.id}>{program.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Milestone</h3>
                <select 
                  value={selectedLog.milestone_id} 
                  onChange={(e) => setSelectedLog({ ...selectedLog, milestone_id: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  title="Select Milestone"
                >
                  <option value="">Select Milestone</option>
                  {milestones.map(milestone => (
                    <option key={milestone.id} value={milestone.id}>{milestone.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Risk</h3>
                <select 
                  value={selectedLog.risk_id} 
                  onChange={(e) => setSelectedLog({ ...selectedLog, risk_id: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  title="Select Risk"
                >
                  <option value="">Select Risk</option>
                  {risks.map(risk => (
                    <option key={risk.id} value={risk.id}>{risk.description}</option>
                  ))}
                </select>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">User</h3>
                <select 
                  value={selectedLog.user_id} 
                  onChange={(e) => setSelectedLog({ ...selectedLog, user_id: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  title="Select User"
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={handleUpdateLog} className="bg-blue-500 text-white rounded px-4 py-2">Update</button>
              <button onClick={handleDeleteLog} className="bg-red-500 text-white rounded px-4 py-2 ml-2">Delete</button>
              <button onClick={closeModal} className="bg-gray-300 rounded px-4 py-2 ml-2">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Adding New Log */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-lg font-semibold">Add New Communication Log</h2>
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Type</h3>
                <input 
                  type="text" 
                  value={newLog.type} 
                  onChange={(e) => setNewLog({ ...newLog, type: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  placeholder="Enter type"
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Message</h3>
                <textarea 
                  value={newLog.message} 
                  onChange={(e) => setNewLog({ ...newLog, message: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  placeholder="Enter message"
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Program</h3>
                <select 
                  value={newLog.program_id} 
                  onChange={(e) => setNewLog({ ...newLog, program_id: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  title="Select Program"
                >
                  <option value="">Select Program</option>
                  {programs.map(program => (
                    <option key={program.id} value={program.id}>{program.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Milestone</h3>
                <select 
                  value={newLog.milestone_id} 
                  onChange={(e) => setNewLog({ ...newLog, milestone_id: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  title="Select Milestone"
                >
                  <option value="">Select Milestone</option>
                  {milestones.map(milestone => (
                    <option key={milestone.id} value={milestone.id}>{milestone.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Risk</h3>
                <select 
                  value={newLog.risk_id} 
                  onChange={(e) => setNewLog({ ...newLog, risk_id: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  title="Select Risk"
                >
                  <option value="">Select Risk</option>
                  {risks.map(risk => (
                    <option key={risk.id} value={risk.id}>{risk.description}</option>
                  ))}
                </select>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">User</h3>
                <select 
                  value={newLog.user_id} 
                  onChange={(e) => setNewLog({ ...newLog, user_id: e.target.value })} 
                  className="mt-1 p-2 border border-gray-300 rounded w-full"
                  title="Select User"
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={handleAddLog} className="bg-blue-500 text-white rounded px-4 py-2">Add</button>
              <button onClick={closeAddModal} className="bg-gray-300 rounded px-4 py-2 ml-2">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationLog;
