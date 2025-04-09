import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Search, Menu as MenuIcon, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface DocPage {
  slug: string;
  title: string;
  content: string;
  category: string;
  order: number;
  description?: string;
}

interface SidebarItem {
  title: string;
  slug: string;
  items?: SidebarItem[];
}

interface FrontMatter {
  title?: string;
  description?: string;
  category?: string;
  order?: string;
}

// Structure of the documentation
const DOCUMENTATION_STRUCTURE = [
  {
    title: 'Getting Started',
    slug: 'getting-started',
    items: [
      {
        title: 'Introduction to ProgramMatrix',
        slug: 'getting-started/introduction',
        file: 'getting-started/introduction.md'
      }
    ]
  },
  {
    title: 'Features',
    slug: 'features',
    items: [
      {
        title: 'Dashboard Overview',
        slug: 'features/dashboard',
        file: 'features/dashboard.md'
      },
      {
        title: 'Roadmap Management',
        slug: 'features/roadmap',
        file: 'features/roadmap.md'
      },
      {
        title: 'Resource Management',
        slug: 'features/resource-management',
        file: 'features/resource-management.md'
      },
      {
        title: 'Risk Management',
        slug: 'features/risk-management',
        file: 'features/risk-management.md'
      },
      {
        title: 'Document Center',
        slug: 'features/document-center',
        file: 'features/document-center.md'
      },
      {
        title: 'Team Management',
        slug: 'features/team-management',
        file: 'features/team-management.md'
      },
      {
        title: 'Financial Management',
        slug: 'features/financial-management',
        file: 'features/financial-management.md'
      },
      {
        title: 'Integrations & APIs',
        slug: 'features/integrations-and-apis',
        file: 'features/integrations-and-apis.md'
      },
      {
        title: 'AI Assistant & Analytics',
        slug: 'features/ai-assistant',
        file: 'features/ai-assistant.md'
      }
    ]
  }
];

// Define the markdown components
const components = {
  h1: (props: any) => <h1 className="text-4xl font-bold mb-6" {...props} />,
  h2: (props: any) => <h2 className="text-3xl font-semibold mb-4 mt-8" {...props} />,
  h3: (props: any) => <h3 className="text-2xl font-semibold mb-3 mt-6" {...props} />,
  p: (props: any) => <p className="text-gray-600 mb-4 leading-relaxed" {...props} />,
  ul: (props: any) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
  ol: (props: any) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
  li: (props: any) => <li className="text-gray-600" {...props} />,
  code: (props: any) => (
    <code className="bg-gray-100 rounded px-2 py-1 text-sm font-mono" {...props} />
  ),
  pre: (props: any) => (
    <pre className="bg-gray-900 text-white rounded-lg p-4 mb-4 overflow-x-auto">
      {props.children}
    </pre>
  ),
  a: (props: any) => (
    <a className="text-blue-600 hover:text-blue-800 underline" {...props} />
  ),
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-violet-500 bg-violet-50 pl-4 py-3 pr-4 my-6 rounded-r-lg">
      <div className="flex items-start gap-3">
        <span className="text-xl">💡</span>
        <div className="text-violet-800">{props.children}</div>
      </div>
    </blockquote>
  ),
  table: (props: any) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full divide-y divide-gray-200" {...props} />
    </div>
  ),
  th: (props: any) => (
    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props} />
  ),
  td: (props: any) => (
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" {...props} />
  ),
  img: (props: any) => (
    <img 
      className="rounded-lg shadow-lg my-4 max-w-full" 
      {...props}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = '/placeholder-image.png';
      }}
    />
  ),
};

export default function NewDocumentation() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState<DocPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredItems, setFilteredItems] = useState(DOCUMENTATION_STRUCTURE);
  const [docPages, setDocPages] = useState<Record<string, DocPage>>({});

  useEffect(() => {
    const checkSession = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setIsLoading(false);
    };

    checkSession();
  }, [navigate]);

  // Load all documentation pages content
  useEffect(() => {
    const loadAllPages = async () => {
      const pages: Record<string, DocPage> = {};
      
      for (const category of DOCUMENTATION_STRUCTURE) {
        if (category.items) {
          for (const item of category.items) {
            try {
              const response = await fetch(`/docs/${item.file}`);
              if (response.ok) {
                const content = await response.text();
                const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
                let parsedContent = content;
                let metadata: FrontMatter = {};
                
                if (frontmatterMatch) {
                  const [, frontmatter, markdownContent] = frontmatterMatch;
                  parsedContent = markdownContent;
                  
                  const frontmatterLines = frontmatter.split('\n');
                  metadata = frontmatterLines.reduce<FrontMatter>((acc, line) => {
                    const [key, ...valueParts] = line.split(':');
                    if (key && valueParts.length > 0) {
                      acc[key.trim() as keyof FrontMatter] = valueParts.join(':').trim();
                    }
                    return acc;
                  }, {});
                }
                
                pages[item.slug] = {
                  slug: item.slug,
                  title: metadata.title || item.title,
                  content: parsedContent,
                  category: metadata.category || category.title,
                  order: metadata.order ? parseInt(metadata.order) : 0,
                  description: metadata.description
                };
              }
            } catch (error) {
              console.error(`Error loading page ${item.file}:`, error);
            }
          }
        }
      }
      setDocPages(pages);
    };

    loadAllPages();
  }, []);

  // Enhanced search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(DOCUMENTATION_STRUCTURE);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = DOCUMENTATION_STRUCTURE.map(category => {
      const filteredItems = category.items?.filter(item => {
        const page = docPages[item.slug];
        if (!page) return false;

        // Search in title
        if (page.title.toLowerCase().includes(query)) return true;
        
        // Search in description
        if (page.description?.toLowerCase().includes(query)) return true;
        
        // Search in content
        if (page.content.toLowerCase().includes(query)) return true;

        return false;
      });

      return {
        ...category,
        items: filteredItems
      };
    }).filter(category => category.items && category.items.length > 0);

    setFilteredItems(filtered);
  }, [searchQuery, docPages]);

  const handlePageChange = async (slug: string) => {
    setIsLoading(true);
    try {
      const category = DOCUMENTATION_STRUCTURE.find(cat => 
        cat.items?.some(item => item.slug === slug)
      );
      const item = category?.items?.find(item => item.slug === slug);
      
      if (item) {
        // Fetch the markdown content
        const response = await fetch(`/docs/${item.file}`);
        if (!response.ok) {
          throw new Error(`Failed to load documentation: ${response.statusText}`);
        }
        const content = await response.text();
        
        // Extract frontmatter if present
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        let parsedContent = content;
        let metadata: FrontMatter = {};
        
        if (frontmatterMatch) {
          const [, frontmatter, markdownContent] = frontmatterMatch;
          parsedContent = markdownContent;
          
          // Parse frontmatter
          const frontmatterLines = frontmatter.split('\n');
          metadata = frontmatterLines.reduce<FrontMatter>((acc, line) => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
              acc[key.trim() as keyof FrontMatter] = valueParts.join(':').trim();
            }
            return acc;
          }, {});
        }
        
        setCurrentPage({
          slug: item.slug,
          title: metadata.title || item.title,
          content: parsedContent,
          category: metadata.category || category?.title || '',
          order: metadata.order ? parseInt(metadata.order) : 0,
          description: metadata.description
        });
      }
    } catch (error) {
      console.error('Error loading page:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Navbar />
      
      {/* Beta Version Banner */}
      <div className="fixed top-16 left-0 right-0 bg-orange-500 text-white py-2 px-4 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">🚀 This is the Beta version of the platform. For queries or connect, reach out to us on</span>
          <a href="#" className="text-white font-medium underline hover:text-orange-100">Contact</a>
        </div>
      </div>

      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="fixed left-4 top-28 z-20 p-2 rounded-lg bg-white shadow-lg border border-gray-200 lg:hidden"
        aria-label="Toggle sidebar"
      >
        <MenuIcon size={20} className="text-gray-600" />
      </button>

      {/* Sidebar */}
      <div
        className={`${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed left-0 h-full bg-gray-50 border-r border-gray-200 transition-all duration-300 w-80 overflow-y-auto z-10 lg:translate-x-0`}
        style={{ top: '104px', height: 'calc(100vh - 104px)' }}
      >
        <div className="p-4">
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            {Object.keys(docPages).length === 0 && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-600"></div>
              </div>
            )}
          </div>
          
          <nav className="space-y-4">
            {filteredItems.map((category) => (
              <div key={category.slug} className="border-b border-gray-200 pb-4 last:border-b-0">
                <h3 className="font-semibold text-gray-900 mb-2">{category.title}</h3>
                <ul className="space-y-2 pl-4">
                  {category.items?.map((item) => (
                    <li key={item.slug}>
                      <button
                        onClick={() => handlePageChange(item.slug)}
                        className={`text-gray-600 hover:text-violet-600 flex items-center gap-2 w-full text-left py-1 px-2 rounded-lg transition-colors ${
                          currentPage?.slug === item.slug
                            ? 'text-violet-600 font-medium bg-violet-50'
                            : ''
                        }`}
                      >
                        {item.title}
                        {currentPage?.slug === item.slug && (
                          <ChevronRight size={16} className="ml-auto" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 overflow-auto bg-white`}
        style={{ marginTop: '104px', marginLeft: isMenuOpen ? '320px' : '0' }}
      >
        {currentPage ? (
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Breadcrumbs */}
            <nav className="flex items-center text-sm mb-8">
              <a href="#" className="text-gray-600 hover:text-violet-600">{currentPage.category}</a>
              <ChevronRight size={16} className="mx-2 text-gray-400" />
              <span className="text-gray-900 font-medium">{currentPage.title}</span>
            </nav>

            {/* Content */}
            <article className="prose prose-violet max-w-none">
              {currentPage.description && (
                <p className="text-xl text-gray-600 mb-8">{currentPage.description}</p>
              )}
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={components}
              >
                {currentPage.content}
              </ReactMarkdown>
            </article>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a page from the sidebar to view documentation</p>
          </div>
        )}
      </main>
    </div>
  );
} 