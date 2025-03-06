import React, { useState } from 'react';
import {
  File,
  Folder,
  Search,
  Upload,
  ChevronDown,
  Share2,
  FilePlus,
  Trash2,
} from 'lucide-react';

const DocumentCenter = () => {
  // Placeholder data for documents
  const [documents, setDocuments] = useState([
    {
      id: 1,
      name: 'Project Proposal.docx',
      type: 'docx',
      date: '2024-05-10',
      sharedWith: ['John Doe', 'Jane Smith'],
    },
    {
      id: 2,
      name: 'Meeting Notes.pdf',
      type: 'pdf',
      date: '2024-05-12',
      sharedWith: ['Alice Brown'],
    },
    {
      id: 3,
      name: 'Budget Spreadsheet.xlsx',
      type: 'xlsx',
      date: '2024-05-14',
      sharedWith: ['John Doe', 'Bob Johnson'],
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    // In a real application, you would handle the file upload here
    console.log('Files dropped:', event.dataTransfer.files);
    alert('File upload functionality is a placeholder. See console for details.');
  };

  const handleUploadClick = () => {
    // In a real application, you would trigger a file input click here
    alert('File upload functionality is a placeholder.');
  };

  const handleFileClick = (document) => {
    // Placeholder for previewing or adding comments
    alert(`Clicked on ${document.name}. Preview and comment functionality are placeholders.`);
  };

  const handleShareClick = (document) => {
    // Placeholder for sharing functionality
    alert(`Sharing ${document.name}. Sharing and permissions functionality are placeholders.`);
  };

  const handleDeleteClick = (document) => {
    // Placeholder for delete functionality
    setDocuments(documents.filter((doc) => doc.id !== document.id));
    alert(`${document.name} deleted. Delete functionality is a placeholder.`);
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Folder className="mr-2" /> Document Center
      </h1>

      <div className="flex justify-between items-center mb-4">
        <div className="relative w-1/2">
          <input
            type="text"
            placeholder="Search documents..."
            className="border border-gray-300 rounded-md px-3 py-2 pl-10 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        </div>
        <button
          className="bg-violet-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
          onClick={handleUploadClick}
        >
          <Upload className="mr-2" /> Upload
        </button>
      </div>

      <div
        className={`border-2 border-dashed rounded-md p-8 text-center mb-6 ${
          dragOver ? 'border-violet-500 bg-violet-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <FilePlus className="h-8 w-8 text-violet-600 mx-auto mb-2" />
        <p className="text-gray-600">Drag and drop files to upload</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredDocuments.map((doc) => (
          <div
            key={doc.id}
            className="border-b border-gray-200 last:border-none hover:bg-gray-50"
          >
            <div className="p-4 flex items-center justify-between">
              <div onClick={() => handleFileClick(doc)} className="cursor-pointer flex-grow">
                <div className="flex items-center">
                  <File className="mr-2 h-4 w-4 text-gray-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                    <div className="text-xs text-gray-500">
                      {doc.date} | Type: {doc.type}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <button
                  className="text-gray-500 hover:text-violet-600 mr-3"
                  onClick={() => handleShareClick(doc)}
                  title="Share"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  className="text-gray-500 hover:text-red-600"
                  onClick={() => handleDeleteClick(doc)}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentCenter;
