import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Search, Menu as MenuIcon, ExternalLink, ArrowLeft, Edit2, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface DocSection {
  id: string;
  title: string;
  content: string;
  order_number: number;
  parent_id?: string;
  children?: DocSection[];
}

interface User {
  id: string;
  email: string;
}

const ADMIN_EMAIL = 'balaramakrishnasaikarumanchi0@gmail.com';

export default function Documentation() {
  const navigate = useNavigate();
  const [sections, setSections] = useState<DocSection[]>([]);
  const [currentSection, setCurrentSection] = useState<DocSection | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setSaving] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      // Set user with email
      setUser({
        id: session.user.id,
        email: session.user.email || ''
      });

      // Fetch documentation sections
      const { data, error } = await supabase
        .from('documentation')
        .select('*')
        .order('order_number');

      if (error) {
        console.error('Error fetching documentation:', error);
        setError('Failed to load documentation');
        return;
      }

      // Organize sections into a tree structure
      const organized = organizeHierarchy(data);
      setSections(organized);
      if (organized.length > 0) {
        setCurrentSection(organized[0]);
      }
    };

    checkSession();
  }, [navigate]);

  useEffect(() => {
    if (currentSection) {
      setEditedContent(currentSection.content);
      setEditedTitle(currentSection.title);
    }
  }, [currentSection]);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const handleSave = async () => {
    if (!currentSection || !isAdmin) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('documentation')
        .update({
          title: editedTitle,
          content: editedContent,
        })
        .eq('id', currentSection.id);

      if (error) throw error;

      // Update local state
      setCurrentSection({
        ...currentSection,
        title: editedTitle,
        content: editedContent
      });
      
      // Refresh the sections
      const { data } = await supabase
        .from('documentation')
        .select('*')
        .order('order_number');

      if (data) {
        const organized = organizeHierarchy(data);
        setSections(organized);
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving documentation:', error);
    } finally {
      setSaving(false);
    }
  };

  const organizeHierarchy = (flatSections: DocSection[]): DocSection[] => {
    const sectionsMap = new Map<string, DocSection>();
    const rootSections: DocSection[] = [];

    // First pass: create map of all sections
    flatSections.forEach(section => {
      sectionsMap.set(section.id, { ...section, children: [] });
    });

    // Second pass: organize into hierarchy
    flatSections.forEach(section => {
      const currentSection = sectionsMap.get(section.id)!;
      if (section.parent_id) {
        const parentSection = sectionsMap.get(section.parent_id);
        if (parentSection) {
          parentSection.children?.push(currentSection);
        }
      } else {
        rootSections.push(currentSection);
      }
    });

    return rootSections;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image', 'code-block'],
      ['clean']
    ]
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Left Sidebar */}
      <div 
        className={`${
          isMenuOpen ? 'w-80' : 'w-0 overflow-hidden'
        } border-r border-gray-200 flex flex-col bg-gray-50 transition-all duration-300 fixed left-0 h-full z-10`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          {sections.map((section) => (
            <DocNavigationItem
              key={section.id}
              section={section}
              currentSection={currentSection}
              onSelect={setCurrentSection}
            />
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Documentation v1.0.0</span>
            {isAdmin && (
              <a
                href="https://github.com/yourusername/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-blue-600"
              >
                Edit on GitHub
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${isMenuOpen ? 'ml-80' : 'ml-0'} transition-all duration-300`}>
        {/* Top Navigation */}
        <div className="h-16 border-b border-gray-200 flex items-center px-4 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Toggle navigation menu"
            >
              <MenuIcon size={20} />
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
          </div>
          <div className="ml-4 flex-1 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">
              {isEditing ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="border-b border-gray-300 focus:border-blue-500 focus:outline-none px-2 py-1 w-full"
                  aria-label="Edit documentation title"
                  title="Edit documentation title"
                />
              ) : (
                currentSection?.title || 'Documentation'
              )}
            </h1>
            {isAdmin && currentSection && (
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Save size={16} />
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedContent(currentSection.content);
                        setEditedTitle(currentSection.title);
                      }}
                      className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto py-8 px-6">
            {currentSection && (
              <div className="prose prose-blue max-w-none">
                {isEditing ? (
                  <ReactQuill
                    value={editedContent}
                    onChange={setEditedContent}
                    modules={quillModules}
                    className="bg-white min-h-[500px]"
                  />
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: currentSection.content }} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface DocNavigationItemProps {
  section: DocSection;
  currentSection: DocSection | null;
  onSelect: (section: DocSection) => void;
}

function DocNavigationItem({ section, currentSection, onSelect }: DocNavigationItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const hasChildren = section.children && section.children.length > 0;

  return (
    <div className="mb-2">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
          currentSection?.id === section.id
            ? 'bg-blue-50 text-blue-700'
            : 'hover:bg-gray-100 text-gray-700'
        }`}
        onClick={() => {
          onSelect(section);
          if (hasChildren) {
            setIsExpanded(!isExpanded);
          }
        }}
      >
        {hasChildren && (
          <ChevronRight
            size={16}
            className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
        )}
        <span className="flex-1">{section.title}</span>
      </div>
      {hasChildren && isExpanded && (
        <div className="ml-4 mt-1">
          {section.children?.map((child) => (
            <DocNavigationItem
              key={child.id}
              section={child}
              currentSection={currentSection}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
} 