import type { SidebarSection } from '../organisms/Sidebar';

// Pre-configured sidebar layouts for common use cases
export const SidebarLayouts = {
  // Default layout - clean and focused
  default: (): SidebarSection[] => [
    {
      type: 'discover-header',
      id: 'header',
      title: 'Discover'
    },
    {
      type: 'trending-review',
      id: 'trending-review'
    },
    {
      type: 'top-entity',
      id: 'top-entity'
    },
    {
      type: 'top-reviewer',
      id: 'top-reviewer'
    },
    {
      type: 'most-discussed',
      id: 'most-discussed'
    },
    {
      type: 'top-categories',
      id: 'top-categories'
    },
    {
      type: 'reviewsite-info',
      id: 'reviewsite-info'
    },
    {
      type: 'support-info',
      id: 'support-info'
    }
  ],

  // Minimal layout - just header and trending review
  minimal: (): SidebarSection[] => [
    {
      type: 'discover-header',
      id: 'header',
      title: 'Discover'
    },
    {
      type: 'trending-review',
      id: 'trending-review'
    }
  ],

  // Full layout - includes all available sections (except removed ones)
  full: (): SidebarSection[] => [
    {
      type: 'discover-header',
      id: 'header',
      title: 'Discover'
    },
    {
      type: 'trending-review',
      id: 'trending-review'
    },
    {
      type: 'top-entity',
      id: 'top-entity'
    },
    {
      type: 'top-reviewer',
      id: 'top-reviewer'
    },
    {
      type: 'most-discussed',
      id: 'most-discussed'
    },
    {
      type: 'top-categories',
      id: 'top-categories'
    },
    {
      type: 'trending-topics',
      id: 'trending-topics'
    },
    {
      type: 'most-active-category',
      id: 'most-active-category'
    }
  ],

  // Analytics focused layout
  analytics: (): SidebarSection[] => [
    {
      type: 'discover-header',
      id: 'header',
      title: 'Analytics'
    },
    {
      type: 'top-entity',
      id: 'top-entity'
    },
    {
      type: 'top-reviewer',
      id: 'top-reviewer'
    },
    {
      type: 'trending-topics',
      id: 'trending-topics'
    },
    {
      type: 'most-active-category',
      id: 'most-active-category'
    }
  ],

  // Browse focused layout
  browse: (): SidebarSection[] => [
    {
      type: 'discover-header',
      id: 'header',
      title: 'Browse'
    },
    {
      type: 'top-categories',
      id: 'top-categories'
    },
    {
      type: 'trending-review',
      id: 'trending-review'
    },
    {
      type: 'trending-topics',
      id: 'trending-topics'
    },
    {
      type: 'reviewsite-info',
      id: 'reviewsite-info'
    },
    {
      type: 'support-info',
      id: 'support-info'
    }
  ],

  // Discussion focused layout
  discussion: (): SidebarSection[] => [
    {
      type: 'discover-header',
      id: 'header',
      title: 'Discussions'
    },
    {
      type: 'most-discussed',
      id: 'most-discussed'
    },
    {
      type: 'top-categories',
      id: 'top-categories'
    },
    {
      type: 'top-reviewer',
      id: 'top-reviewer'
    }
  ]
};

// Helper function to create custom layouts
export const createCustomSidebarLayout = (sections: Partial<SidebarSection>[]): SidebarSection[] => {
  return sections.map((section, index) => ({
    type: 'custom',
    id: `custom-${index}`,
    ...section
  })) as SidebarSection[];
};

// Helper function to extend existing layouts
export const extendSidebarLayout = (
  baseLayout: keyof typeof SidebarLayouts,
  additionalSections: Partial<SidebarSection>[]
): SidebarSection[] => {
  const base = SidebarLayouts[baseLayout]();
  const additional = createCustomSidebarLayout(additionalSections);
  return [...base, ...additional];
};

// Layout presets for specific pages
export const PageSidebarLayouts = {
  dashboard: (): SidebarSection[] => SidebarLayouts.analytics(),
  home: (): SidebarSection[] => SidebarLayouts.default(),
  explore: (): SidebarSection[] => SidebarLayouts.browse(),
  profile: (): SidebarSection[] => SidebarLayouts.minimal(),
};
