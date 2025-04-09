import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Search, Menu as MenuIcon, ExternalLink, ArrowLeft, Edit2, Save, X, Plus, Trash } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ReactQuill, { ReactQuillProps } from 'react-quill';
import 'quill/dist/quill.snow.css';
import styles from '../styles/quill.module.css';
import logo from '../assets/ProgramMatrix_logo.png';
import NavNotificationBar from '../components/NavNotificationBar';
import { Navbar } from '../components/Navbar';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator

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

const QuillEditor = React.forwardRef<ReactQuill, ReactQuillProps>((props, ref) => {
  return <ReactQuill ref={ref} {...props} />;
});

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true);
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
      } catch (error) {
        console.error('Error:', error);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
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
      // Update the section in the database
      const { error } = await supabase
        .from('documentation')
        .update({
          title: editedTitle,
          content: editedContent // Remove the content wrapper logic as it's not needed
        })
        .eq('id', currentSection.id);

      if (error) throw error;

      // Update local state
      const updatedSection = {
        ...currentSection,
        title: editedTitle,
        content: editedContent
      };
      setCurrentSection(updatedSection);
      
      // Update the section in the sections array
      const updateSectionsRecursively = (items: DocSection[]): DocSection[] => {
        return items.map(item => {
          if (item.id === currentSection.id) {
            return updatedSection;
          }
          if (item.children) {
            return {
              ...item,
              children: updateSectionsRecursively(item.children)
            };
          }
          return item;
        });
      };

      setSections(updateSectionsRecursively(sections));
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving documentation:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSection = async () => {
    if (!isAdmin) return;

    const sections = [
      {
        id: uuidv4(),
        title: "Getting Started with ProgramMatrix",
        content: `
          <h1>Welcome to ProgramMatrix</h1>
          <p>ProgramMatrix is your unified platform for comprehensive program management. This guide will help you get started and make the most of our powerful features.</p>
          
          <h2>Quick Start Guide</h2>
          <ol>
            <li>
              <strong>Account Setup</strong>
              <ul>
                <li>Sign up for a ProgramMatrix account</li>
                <li>Complete your profile information</li>
                <li>Set up your organization details (for admin users)</li>
              </ul>
            </li>
            <li>
              <strong>Creating Your First Program</strong>
              <ul>
                <li>Navigate to the Roadmap section</li>
                <li>Click on "Add Program"</li>
                <li>Enter program details (name, description, dates)</li>
                <li>Set up initial goals and milestones</li>
              </ul>
            </li>
            <li>
              <strong>Dashboard Overview</strong>
              <ul>
                <li>Familiarize yourself with the unified dashboard</li>
                <li>Understand key metrics and KPIs</li>
                <li>Customize your view preferences</li>
              </ul>
            </li>
          </ol>

          <h2>Core Concepts</h2>
          <ul>
            <li><strong>Programs:</strong> High-level initiatives that contain multiple goals and milestones</li>
            <li><strong>Goals:</strong> Specific objectives within a program</li>
            <li><strong>Milestones:</strong> Key checkpoints and deliverables</li>
            <li><strong>KPIs:</strong> Key Performance Indicators for tracking progress</li>
          </ul>
        `,
        order_number: 1
      },
      {
        id: uuidv4(),
        title: "Program Management",
        content: `
          <h1>Program Management in ProgramMatrix</h1>
          <p>Learn how to effectively manage your programs using our comprehensive suite of tools.</p>

          <h2>Program Structure</h2>
          <ul>
            <li><strong>Program Hierarchy:</strong> Programs → Goals → Milestones → Tasks</li>
            <li><strong>Timeline Management:</strong> Set up program durations, dependencies, and critical paths</li>
            <li><strong>Resource Allocation:</strong> Assign team members and track resource utilization</li>
          </ul>

          <h2>Key Features</h2>
          <ul>
            <li>
              <strong>Dynamic Roadmapping</strong>
              <ul>
                <li>Create and manage program timelines</li>
                <li>Set up dependencies between milestones</li>
                <li>Track progress in real-time</li>
                <li>View both list and Gantt chart views</li>
              </ul>
            </li>
            <li>
              <strong>Financial Tracking</strong>
              <ul>
                <li>Monitor budget allocation and utilization</li>
                <li>Track expenses by department</li>
                <li>Generate financial reports</li>
              </ul>
            </li>
            <li>
              <strong>Risk Management</strong>
              <ul>
                <li>Identify and assess potential risks</li>
                <li>Create mitigation strategies</li>
                <li>Monitor risk status and impact</li>
              </ul>
            </li>
          </ul>
        `,
        order_number: 2
      },
      {
        id: uuidv4(),
        title: "Dashboard & Analytics",
        content: `
          <h1>Understanding Your Dashboard</h1>
          <p>The dashboard is your command center for program management. Learn how to leverage its features for maximum efficiency.</p>

          <h2>Dashboard Components</h2>
          <ul>
            <li>
              <strong>Program Overview</strong>
              <ul>
                <li>Program health indicators</li>
                <li>Progress metrics</li>
                <li>Key milestones status</li>
              </ul>
            </li>
            <li>
              <strong>KPI Tracking</strong>
              <ul>
                <li>Budget utilization</li>
                <li>Timeline progress</li>
                <li>Task completion rates</li>
                <li>Risk mitigation effectiveness</li>
              </ul>
            </li>
            <li>
              <strong>Analytics & Reports</strong>
              <ul>
                <li>Custom report generation</li>
                <li>Trend analysis</li>
                <li>Performance comparisons</li>
              </ul>
            </li>
          </ul>

          <h2>Customization Options</h2>
          <ul>
            <li>Arrange dashboard widgets</li>
            <li>Set up custom KPIs</li>
            <li>Configure notification preferences</li>
            <li>Create saved views</li>
          </ul>
        `,
        order_number: 3
      },
      {
        id: uuidv4(),
        title: "Risk Management",
        content: `
          <h1>Risk Management & Analysis</h1>
          <p>Learn how to effectively identify, assess, and mitigate risks in your programs using ProgramMatrix's risk management features.</p>

          <h2>Risk Assessment Process</h2>
          <ol>
            <li>
              <strong>Risk Identification</strong>
              <ul>
                <li>Create new risk entries</li>
                <li>Categorize risks by type</li>
                <li>Link risks to specific program elements</li>
              </ul>
            </li>
            <li>
              <strong>Risk Analysis</strong>
              <ul>
                <li>Assess probability and impact</li>
                <li>Calculate risk scores</li>
                <li>Determine risk priority levels</li>
              </ul>
            </li>
            <li>
              <strong>Mitigation Planning</strong>
              <ul>
                <li>Define mitigation strategies</li>
                <li>Assign responsibility</li>
                <li>Set up monitoring schedules</li>
              </ul>
            </li>
          </ol>

          <h2>Risk Monitoring</h2>
          <ul>
            <li>Track risk status changes</li>
            <li>Monitor mitigation progress</li>
            <li>Generate risk reports</li>
            <li>Set up risk alerts</li>
          </ul>
        `,
        order_number: 4
      },
      {
        id: uuidv4(),
        title: "Document Center",
        content: `
          <h1>Document Center Guide</h1>
          <p>Learn how to use the Document Center to organize and manage all your program-related documents efficiently.</p>

          <h2>Document Organization</h2>
          <ul>
            <li>
              <strong>Folder Structure</strong>
              <ul>
                <li>Create program-specific folders</li>
                <li>Set up category-based organization</li>
                <li>Use tags for easy filtering</li>
              </ul>
            </li>
            <li>
              <strong>Document Types</strong>
              <ul>
                <li>Program plans and charters</li>
                <li>Status reports</li>
                <li>Technical documentation</li>
                <li>Meeting minutes and action items</li>
              </ul>
            </li>
          </ul>

          <h2>Document Management Features</h2>
          <ul>
            <li>Version control and history tracking</li>
            <li>Document sharing and permissions</li>
            <li>Quick search and filtering</li>
            <li>Document linking to program elements</li>
          </ul>
        `,
        order_number: 5
      },
      {
        id: uuidv4(),
        title: "AI Assistant & Analytics",
        content: `
          <h1>AI-Powered Features</h1>
          <p>Discover how to leverage ProgramMatrix's AI capabilities to gain insights and automate tasks.</p>

          <h2>AI Chat Assistant</h2>
          <ul>
            <li>
              <strong>Key Capabilities</strong>
              <ul>
                <li>Ask questions about your program data</li>
                <li>Get insights and recommendations</li>
                <li>Generate custom reports</li>
                <li>Analyze trends and patterns</li>
              </ul>
            </li>
            <li>
              <strong>Common Use Cases</strong>
              <ul>
                <li>Program performance analysis</li>
                <li>Risk assessment and recommendations</li>
                <li>Resource optimization suggestions</li>
                <li>Timeline impact analysis</li>
              </ul>
            </li>
          </ul>

          <h2>Advanced Analytics</h2>
          <ul>
            <li>
              <strong>Data Visualization</strong>
              <ul>
                <li>Custom dashboard creation</li>
                <li>Interactive charts and graphs</li>
                <li>Real-time data updates</li>
              </ul>
            </li>
            <li>
              <strong>Predictive Analytics</strong>
              <ul>
                <li>Timeline predictions</li>
                <li>Budget forecasting</li>
                <li>Risk probability assessment</li>
              </ul>
            </li>
          </ul>
        `,
        order_number: 6
      },
      {
        id: uuidv4(),
        title: "Best Practices & Tips",
        content: `
          <h1>Best Practices for Program Management</h1>
          <p>Learn proven strategies and tips to maximize the effectiveness of your program management using ProgramMatrix.</p>

          <h2>Program Setup Best Practices</h2>
          <ul>
            <li>
              <strong>Planning Phase</strong>
              <ul>
                <li>Define clear program objectives</li>
                <li>Set up meaningful KPIs</li>
                <li>Create detailed milestone plans</li>
                <li>Establish communication protocols</li>
              </ul>
            </li>
            <li>
              <strong>Execution Phase</strong>
              <ul>
                <li>Regular progress tracking</li>
                <li>Proactive risk management</li>
                <li>Stakeholder communication</li>
                <li>Resource optimization</li>
              </ul>
            </li>
          </ul>

          <h2>Tips for Success</h2>
          <ul>
            <li>Keep documentation up-to-date</li>
            <li>Use templates for consistency</li>
            <li>Regular stakeholder updates</li>
            <li>Monitor and adjust KPIs as needed</li>
            <li>Leverage automation features</li>
          </ul>

          <h2>Common Pitfalls to Avoid</h2>
          <ul>
            <li>Insufficient risk monitoring</li>
            <li>Poor stakeholder communication</li>
            <li>Inadequate resource planning</li>
            <li>Neglecting documentation</li>
          </ul>
        `,
        order_number: 7
      }
    ];

    try {
      const { error } = await supabase
        .from('documentation')
        .insert(sections);

      if (error) throw error;

      // Refresh the sections
      const { data } = await supabase
        .from('documentation')
        .select('*')
        .order('order_number');

      if (data) {
        const organized = organizeHierarchy(data);
        setSections(organized);
        setCurrentSection(organized[0]);
      }
    } catch (error) {
      console.error('Error adding sections:', error);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('documentation')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;

      // Refresh the sections
      const { data } = await supabase
        .from('documentation')
        .select('*')
        .order('order_number');

      if (data) {
        const organized = organizeHierarchy(data);
        setSections(organized);
        if (currentSection?.id === sectionId) {
          setCurrentSection(null);
        }
      }
    } catch (error) {
      console.error('Error deleting section:', error);
    }
  };

  const handleAddChildSection = async (parentId: string) => {
    if (!isAdmin) return;

    const newSection: DocSection = {
      id: uuidv4(),
      title: 'New Subsection',
      content: '',
      order_number: sections.length + 1,
      parent_id: parentId // Set parent ID for hierarchy
    };

    try {
      const { error } = await supabase
        .from('documentation')
        .insert([newSection]);

      if (error) throw error;

      // Refresh the sections
      const { data } = await supabase
        .from('documentation')
        .select('*')
        .order('order_number');

      if (data) {
        const organized = organizeHierarchy(data);
        setSections(organized);
        setCurrentSection(newSection);
      }
    } catch (error) {
      console.error('Error adding child section:', error);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading documentation...</p>
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
    ],
    clipboard: {
      matchVisual: false
    },
    keyboard: {
      bindings: {
        tab: false
      }
    }
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link', 'image', 'code-block'
  ];

  return (
    <div className="flex h-screen bg-white">
      <Navbar />
      {/* Left Sidebar */}
      <div 
        className={`${
          isMenuOpen ? 'w-80' : 'w-0 overflow-hidden'
        } border-r border-gray-200 flex flex-col bg-gray-50 transition-all duration-300 fixed left-0 h-full z-10`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-center mb-4">
          </div>
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
              user={user}
              onAddChild={handleAddChildSection}
              onDelete={handleDeleteSection}
            />
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              
              <span className="text-sm text-gray-600">v1.0.0</span>
            </div>
            {isAdmin && (
              <a
                href="https://github.com/yourusername/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
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
          </div>
          <div className="ml-4 flex-1 flex items-center justify-between">
            <div className="flex items-center gap-3">

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
            </div>
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
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddSection}
                  className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus size={16} />
                  Add Section
                </button>
                {currentSection && (
                  <button
                    onClick={() => handleDeleteSection(currentSection.id)}
                    className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <Trash size={16} />
                    Delete Section
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto py-8 px-6">
            {currentSection ? (
              <div className={`prose prose-blue max-w-none ${styles.contentDisplay}`}>
                {isEditing ? (
                  <div className={styles.quillWrapper}>
                    <QuillEditor
                      value={editedContent}
                      onChange={setEditedContent}
                      modules={quillModules}
                      formats={quillFormats}
                      theme="snow"
                      className="bg-white min-h-[500px]"
                    />
                  </div>
                ) : (
                  <div 
                    className={styles.contentDisplay}
                    dangerouslySetInnerHTML={{ __html: currentSection.content }} 
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Welcome to ProgramMatrix Documentation</h2>
                <p className="text-gray-600">Select a section from the sidebar to get started.</p>
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
  user: User | null;
  onAddChild: (parentId: string) => Promise<void>;
  onDelete: (sectionId: string) => Promise<void>;
}

function DocNavigationItem({ 
  section, 
  currentSection, 
  onSelect, 
  user,
  onAddChild,
  onDelete
}: DocNavigationItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = section.children && section.children.length > 0;
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <div className="mb-2">
      <div className="flex items-center gap-2">
        <div
          className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
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
        
        {isAdmin && (
          <div className="flex items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddChild(section.id);
              }}
              title="Add subsection"
              className="p-1 text-gray-500 hover:text-blue-600"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(section.id);
              }}
              title="Delete section"
              className="p-1 text-gray-500 hover:text-red-600"
            >
              <Trash size={14} />
            </button>
          </div>
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <div className="ml-4 mt-1 border-l-2 border-gray-200 pl-2">
          {section.children?.map((child) => (
            <DocNavigationItem
              key={child.id}
              section={child}
              currentSection={currentSection}
              onSelect={onSelect}
              user={user}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
} 