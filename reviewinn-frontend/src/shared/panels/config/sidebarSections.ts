import { type SidebarSection } from '../../organisms/Sidebar';

/**
 * Common sidebar sections used across left panel variants
 * Centralized to avoid duplication and ensure consistency
 */
export const COMMON_SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    type: 'trending-review',
    id: 'top-reviews',
    title: 'Top Reviews'
  },
  {
    type: 'top-categories',
    id: 'top-categories',
    title: 'Top Categories'
  },
  {
    type: 'top-reviewer',
    id: 'top-reviewers',
    title: 'Top Reviewers'
  },
  {
    type: 'reviewsite-info',
    id: 'reviewsite-info',
    title: 'ReviewInn'
  },
  {
    type: 'support-info',
    id: 'support-info',
    title: 'Support Center'
  }
];