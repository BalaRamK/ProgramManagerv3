export interface DocPage {
  slug: string;
  title: string;
  content: string;
  category: string;
  order: number;
  description?: string;
}

export interface SidebarItem {
  title: string;
  slug: string;
  items?: SidebarItem[];
} 