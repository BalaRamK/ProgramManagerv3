import matter from 'gray-matter';
import { DocPage } from '../types/documentation';

export async function loadMDXFiles(): Promise<DocPage[]> {
  const pages: DocPage[] = [];
  
  // In a production environment, you would:
  // 1. Use a build step to process all MDX files
  // 2. Generate a manifest of all available documentation
  // 3. Load content dynamically based on the current route
  
  try {
    // For development, we'll load files directly
    // This would be replaced with proper file loading in production
    const context = import.meta.glob('/docs/**/*.mdx', { as: 'raw' });
    
    for (const path in context) {
      const content = await context[path]();
      const { data, content: mdxContent } = matter(content);
      
      pages.push({
        slug: path.replace(/^\/docs\/|\.mdx$/g, ''),
        title: data.title,
        content: mdxContent,
        category: data.category,
        order: data.order,
        description: data.description
      });
    }
    
    return pages.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error loading MDX files:', error);
    return [];
  }
} 