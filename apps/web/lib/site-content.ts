import type {
  PublicSiteContent,
  SiteNavigationItem,
  SitePage,
  SitePageSection,
  SiteSettings
} from '@packages/shared';

const fallbackPrimaryNavigation: SiteNavigationItem[] = [
  { label: 'Home', href: '/', group: null },
  { label: 'How it works', href: '/how-it-works', group: 'explore' },
  { label: 'What you get', href: '/#what-you-get', group: 'explore' },
  { label: 'About ZEEUS', href: '/about-zeeus', group: 'project' },
  { label: 'FAQ', href: '/faq', group: 'support' },
  { label: 'Contact', href: '/contact', group: 'support' }
];

const fallbackFooterColumns: SiteSettings['footerColumns'] = [
  {
    title: 'Explore',
    links: [
      { label: 'Home', href: '/', group: null },
      { label: 'How it works', href: '/how-it-works', group: 'explore' },
      { label: 'Resources', href: '/resources', group: 'support' },
      { label: 'FAQ', href: '/faq', group: 'support' },
      { label: 'Contact', href: '/contact', group: 'support' }
    ]
  },
  {
    title: 'Project',
    links: [
      { label: 'About ZEEUS', href: '/about-zeeus', group: 'project' },
      { label: 'Seed Factories', href: '/seed-factories', group: 'project' },
      { label: 'Methodology', href: '/methodology', group: 'project' },
      { label: 'SDG and ESRS', href: '/sdg-esrs', group: 'project' }
    ]
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy policy', href: '/privacy', group: 'legal' },
      { label: 'Accessibility', href: '/accessibility', group: 'legal' },
      { label: 'Cookie notice', href: '/cookies', group: 'legal' },
      { label: 'Terms of use', href: '/terms', group: 'legal' }
    ]
  }
];

export function getSitePage(content: PublicSiteContent, slug: string) {
  return content.sitePages.find((page) => page.slug === slug);
}

export function getSiteSettings(content: PublicSiteContent): SiteSettings {
  return {
    ...content.settings,
    primaryNavigation:
      content.settings.primaryNavigation.length > 0
        ? content.settings.primaryNavigation
        : fallbackPrimaryNavigation,
    footerColumns:
      content.settings.footerColumns.length > 0
        ? content.settings.footerColumns
        : fallbackFooterColumns
  };
}

export function getSection(page: SitePage | undefined, sectionId: string) {
  return page?.sections.find((section) => section.id === sectionId);
}

export function getParagraphs(value: string | null | undefined) {
  return (value ?? '')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function asSectionItems(section: SitePageSection | undefined) {
  return section?.items ?? [];
}
