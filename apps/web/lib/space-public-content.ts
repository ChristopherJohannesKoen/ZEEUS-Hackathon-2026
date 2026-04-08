import type { PublicSiteContent, SdgGoalDetail } from '@packages/shared';

const timestamp = '2026-04-08T00:00:00.000Z';

export const spacePublicSiteContent: PublicSiteContent = {
  articles: [
    {
      id: 'article-how-it-works',
      slug: 'how-it-works',
      title: 'How ZEEUS works',
      summary:
        'A guidance-first workflow for startup teams: context, Stage I, Stage II, SDG navigation, evidence, scenarios, and outputs.',
      body: 'ZEEUS translates the Sustainability by Design workbook into a cleaner web workflow. Founders capture startup context, run the deterministic Stage I and Stage II scoring logic, review dashboard outputs, and use evidence and scenario tools to strengthen the reasoning around the saved revision.',
      category: 'how_it_works',
      status: 'published',
      locale: 'en',
      heroImageUrl: null,
      updatedAt: timestamp
    },
    {
      id: 'article-methodology',
      slug: 'methodology',
      title: 'Methodology and scoring logic',
      summary:
        'Deterministic scoring, explicit thresholds, and guidance that explains the result without rewriting it.',
      body: 'ZEEUS keeps the scoring core deterministic. The same inputs produce the same material topic, risk, opportunity, dashboard, and report outputs. The guidance layer helps founders interpret the result, collect evidence, and communicate the tradeoffs, but it never changes the saved score or threshold result.',
      category: 'methodology',
      status: 'published',
      locale: 'en',
      heroImageUrl: null,
      updatedAt: timestamp
    },
    {
      id: 'article-sdg-esrs',
      slug: 'sdg-esrs-explainer',
      title: 'SDG and ESRS explainer',
      summary:
        'Use the SDGs as an orientation map, then connect them to material topics, evidence, and reporting discipline.',
      body: 'The SDGs in ZEEUS are a map, not a checklist. The platform suggests relevant goals and targets based on startup stage, business context, and the saved assessment outputs, then helps teams explain why those links matter and what evidence should support them.',
      category: 'sdg_esrs',
      status: 'published',
      locale: 'en',
      heroImageUrl: null,
      updatedAt: timestamp
    },
    {
      id: 'article-partners',
      slug: 'partner-programs',
      title: 'Partner and program workflows',
      summary:
        'Cohort and reviewer workflows build on immutable founder revisions and co-branded outputs.',
      body: 'Partner programs sit on top of the founder workflow. Startups submit a concrete revision, reviewers annotate against that saved snapshot, and official outputs stay co-branded and revision-safe. The Hugging Face deployment is a public preview of the website surface, while the full partner console remains part of the main stack.',
      category: 'partner',
      status: 'published',
      locale: 'en',
      heroImageUrl: null,
      updatedAt: timestamp
    },
    {
      id: 'article-contact',
      slug: 'contact-support',
      title: 'Support and onboarding',
      summary:
        'Use this public preview to explore the method and public guidance. Founder and reviewer operations belong on the full deployment.',
      body: 'This Hugging Face Space hosts the public ZEEUS website preview. It is designed for education, methodology review, and partner discovery. Authenticated founder workspaces, reviewer operations, and the full async artifact platform remain part of the primary deployment profile.',
      category: 'contact',
      status: 'published',
      locale: 'en',
      heroImageUrl: null,
      updatedAt: timestamp
    }
  ],
  faqEntries: [
    {
      id: 'faq-map-not-checklist',
      question: 'Are the SDGs treated as a checklist?',
      answer:
        'No. ZEEUS uses the SDGs as a map to help early-stage teams orient their sustainability work before a fuller evidence-backed view is built.',
      category: 'sdg',
      status: 'published',
      locale: 'en',
      sortOrder: 1
    },
    {
      id: 'faq-ai-canonical',
      question: 'Does AI change the saved score?',
      answer:
        'No. AI is advisory only. Deterministic scoring, thresholds, SDG mapping, and recommendation eligibility remain part of the frozen assessment core.',
      category: 'product',
      status: 'published',
      locale: 'en',
      sortOrder: 2
    },
    {
      id: 'faq-evidence',
      question: 'Why does ZEEUS care about evidence so early?',
      answer:
        'Early evidence helps teams separate strong sustainability claims from assumptions. The platform uses it to explain confidence, identify gaps, and prepare for partner or reviewer workflows.',
      category: 'workflow',
      status: 'published',
      locale: 'en',
      sortOrder: 3
    },
    {
      id: 'faq-preview',
      question: 'Is this Space the full product?',
      answer:
        'No. This Space hosts the public website preview. The complete founder workspace, partner console, exports, and async services run in the main deployment.',
      category: 'deployment',
      status: 'published',
      locale: 'en',
      sortOrder: 4
    }
  ],
  caseStudies: [
    {
      id: 'case-grid',
      slug: 'ecogrid-pilot',
      title: 'EcoGrid turns early pilot data into a clearer sustainability narrative',
      summary:
        'The team starts with a sparse evidence base, runs the deterministic assessment, and then tightens the result through linked evidence and scenario deltas.',
      story:
        'EcoGrid begins with an early grid-efficiency thesis and a thin evidence base. The team uses ZEEUS to lock the canonical revision, identify where confidence is weak, and then layer evidence and scenarios around the saved result without overwriting the deterministic score.',
      startupName: 'EcoGrid',
      stage: 'validation',
      naceDivision: 'D35 Electricity, gas, steam and air conditioning supply',
      status: 'published',
      locale: 'en',
      heroImageUrl: null,
      updatedAt: timestamp
    },
    {
      id: 'case-circular',
      slug: 'circular-food-loop',
      title: 'Circular Food Loop uses ZEEUS to compare baseline and improved packaging assumptions',
      summary:
        'The startup keeps the canonical saved revision intact while testing advisory scenario changes around waste, sourcing, and confidence.',
      story:
        'Circular Food Loop uses the founder workflow to save a baseline revision, then compares advisory packaging and sourcing assumptions in Scenario Lab. The goal is not to rewrite the historical snapshot, but to understand what a stronger evidence-backed design direction would change.',
      startupName: 'Circular Food Loop',
      stage: 'growth_channel_fit',
      naceDivision: 'C10 Manufacture of food products',
      status: 'published',
      locale: 'en',
      heroImageUrl: null,
      updatedAt: timestamp
    }
  ],
  resources: [
    {
      id: 'resource-manual',
      slug: 'zeeus-user-manual',
      title: 'User manual',
      description: 'A concise walkthrough of the workflow and expected outputs.',
      category: 'manual',
      fileLabel: 'manual',
      href: '/resources/zeeus-user-manual.txt',
      fileName: 'zeeus-user-manual.txt',
      mimeType: 'text/plain',
      byteSize: 1024,
      updatedAt: timestamp
    },
    {
      id: 'resource-faq',
      slug: 'zeeus-faq',
      title: 'FAQ support note',
      description: 'Quick answers to the most common workflow and interpretation questions.',
      category: 'faq',
      fileLabel: 'FAQ',
      href: '/resources/zeeus-faq.txt',
      fileName: 'zeeus-faq.txt',
      mimeType: 'text/plain',
      byteSize: 1024,
      updatedAt: timestamp
    },
    {
      id: 'resource-method',
      slug: 'zeeus-methodology-note',
      title: 'Methodology note',
      description: 'A short note on deterministic scoring, thresholds, and interpretation.',
      category: 'methodology',
      fileLabel: 'methodology note',
      href: '/resources/zeeus-methodology-note.txt',
      fileName: 'zeeus-methodology-note.txt',
      mimeType: 'text/plain',
      byteSize: 1024,
      updatedAt: timestamp
    },
    {
      id: 'resource-sample',
      slug: 'zeeus-sample-report',
      title: 'Sample report data',
      description: 'A lightweight CSV showing the shape of a report export.',
      category: 'sample_report',
      fileLabel: 'sample report',
      href: '/resources/zeeus-sample-report.csv',
      fileName: 'zeeus-sample-report.csv',
      mimeType: 'text/csv',
      byteSize: 1024,
      updatedAt: timestamp
    },
    {
      id: 'resource-checklist',
      slug: 'zeeus-workflow-checklist',
      title: 'Workflow checklist',
      description: 'A reusable checklist for founders or partners reviewing a first run.',
      category: 'workflow_asset',
      fileLabel: 'workflow checklist',
      href: '/resources/zeeus-workflow-checklist.txt',
      fileName: 'zeeus-workflow-checklist.txt',
      mimeType: 'text/plain',
      byteSize: 1024,
      updatedAt: timestamp
    }
  ],
  partnerPrograms: [
    {
      id: 'program-climate-launchpad',
      organizationId: 'org-zeeus',
      slug: 'climate-launchpad',
      name: 'Climate Launchpad',
      summary:
        'A cohort workflow for startups that need shared methodology, reviewer context, and co-branded outputs.',
      cohortLabel: '2026 cohort',
      status: 'active',
      role: null,
      submissionCount: 12,
      reviewerCount: 4,
      branding: {
        primaryLabel: 'ZEEUS',
        partnerLabel: 'Climate Launchpad',
        coBrandingLabel: 'KIC x EU',
        watermarkLabel: null
      },
      createdAt: timestamp
    },
    {
      id: 'program-circular-founders',
      organizationId: 'org-zeeus',
      slug: 'circular-founders-track',
      name: 'Circular Founders Track',
      summary:
        'An example partner track where evidence and scenario discussion sit alongside the saved revision.',
      cohortLabel: 'pilot track',
      status: 'active',
      role: null,
      submissionCount: 8,
      reviewerCount: 3,
      branding: {
        primaryLabel: 'ZEEUS',
        partnerLabel: 'Circular Founders',
        coBrandingLabel: 'Partner program',
        watermarkLabel: null
      },
      createdAt: timestamp
    }
  ]
};

const sdgGoals = new Map<number, SdgGoalDetail>([
  [
    8,
    {
      goalNumber: 8,
      goalTitle: 'Decent Work and Economic Growth',
      summary:
        'Startups often influence work quality, productivity, and resilience through their growth model and operating design.',
      officialUrl: 'https://sdgs.un.org/goals/goal8',
      targets: [
        {
          id: 'sdg-8-4',
          goalNumber: 8,
          goalTitle: 'Decent Work and Economic Growth',
          targetCode: '8.4',
          title: 'Improve resource efficiency in consumption and production',
          description:
            'Relevant when a startup can reduce resource intensity or improve value creation per unit of input.',
          officialUrl: 'https://sdgs.un.org/goals/goal8#targets_and_indicators'
        },
        {
          id: 'sdg-8-8',
          goalNumber: 8,
          goalTitle: 'Decent Work and Economic Growth',
          targetCode: '8.8',
          title: 'Protect labour rights and promote safe working environments',
          description:
            'Relevant where scaling operations, sourcing, or field work creates workforce and contractor impacts.',
          officialUrl: 'https://sdgs.un.org/goals/goal8#targets_and_indicators'
        }
      ]
    }
  ],
  [
    9,
    {
      goalNumber: 9,
      goalTitle: 'Industry, Innovation and Infrastructure',
      summary:
        'ZEEUS frequently maps product and infrastructure startups here when innovation design changes system-level sustainability outcomes.',
      officialUrl: 'https://sdgs.un.org/goals/goal9',
      targets: [
        {
          id: 'sdg-9-4',
          goalNumber: 9,
          goalTitle: 'Industry, Innovation and Infrastructure',
          targetCode: '9.4',
          title: 'Upgrade infrastructure and retrofit industries to make them sustainable',
          description:
            'Relevant when the startup contributes to cleaner, more efficient, or more resilient industrial systems.',
          officialUrl: 'https://sdgs.un.org/goals/goal9#targets_and_indicators'
        },
        {
          id: 'sdg-9-5',
          goalNumber: 9,
          goalTitle: 'Industry, Innovation and Infrastructure',
          targetCode: '9.5',
          title: 'Enhance research, innovation, and technology capacity',
          description:
            'Relevant for ventures whose core contribution is a novel sustainability-enabling technology or platform.',
          officialUrl: 'https://sdgs.un.org/goals/goal9#targets_and_indicators'
        }
      ]
    }
  ],
  [
    12,
    {
      goalNumber: 12,
      goalTitle: 'Responsible Consumption and Production',
      summary:
        'Material topics, waste, sourcing, circularity, and evidence for production choices often map strongly to SDG 12.',
      officialUrl: 'https://sdgs.un.org/goals/goal12',
      targets: [
        {
          id: 'sdg-12-2',
          goalNumber: 12,
          goalTitle: 'Responsible Consumption and Production',
          targetCode: '12.2',
          title: 'Achieve sustainable management and efficient use of natural resources',
          description:
            'Relevant when the venture can reduce input intensity or improve material productivity.',
          officialUrl: 'https://sdgs.un.org/goals/goal12#targets_and_indicators'
        },
        {
          id: 'sdg-12-5',
          goalNumber: 12,
          goalTitle: 'Responsible Consumption and Production',
          targetCode: '12.5',
          title:
            'Substantially reduce waste generation through prevention, reduction, recycling, and reuse',
          description:
            'Relevant for circularity, recovery, packaging, and product-life-extension designs.',
          officialUrl: 'https://sdgs.un.org/goals/goal12#targets_and_indicators'
        }
      ]
    }
  ],
  [
    13,
    {
      goalNumber: 13,
      goalTitle: 'Climate Action',
      summary:
        'Climate mitigation and resilience themes often show up across both the risk/opportunity layer and the evidence layer.',
      officialUrl: 'https://sdgs.un.org/goals/goal13',
      targets: [
        {
          id: 'sdg-13-1',
          goalNumber: 13,
          goalTitle: 'Climate Action',
          targetCode: '13.1',
          title: 'Strengthen resilience and adaptive capacity to climate-related hazards',
          description: 'Relevant for adaptation, resilience, and system hardening use cases.',
          officialUrl: 'https://sdgs.un.org/goals/goal13#targets_and_indicators'
        },
        {
          id: 'sdg-13-2',
          goalNumber: 13,
          goalTitle: 'Climate Action',
          targetCode: '13.2',
          title: 'Integrate climate change measures into policies, strategies, and planning',
          description:
            'Relevant when a startup helps organizations operationalize climate action or reduce emissions through better decisions.',
          officialUrl: 'https://sdgs.un.org/goals/goal13#targets_and_indicators'
        }
      ]
    }
  ]
]);

export function getSpaceSdgGoal(goalNumber: number) {
  return sdgGoals.get(goalNumber);
}
