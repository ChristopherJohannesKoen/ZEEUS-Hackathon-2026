import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { Prisma, PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');
const bootstrapStateId = 1;
const seedFilePath = fileURLToPath(import.meta.url);
const seedDir = path.dirname(seedFilePath);
const repoRoot = path.resolve(seedDir, '../../..');
const defaultArtifactsDir = path.resolve(repoRoot, '.artifacts');

function readCatalogJson(relativePath) {
  return JSON.parse(readFileSync(path.resolve(seedDir, '..', relativePath), 'utf8'));
}

function readRepoFile(relativePath) {
  return readFileSync(path.resolve(repoRoot, relativePath));
}

function buildSeedStorageKey(buffer, fileName, namespace) {
  const checksumSha256 = createHash('sha256').update(buffer).digest('hex');
  const extension = path.extname(fileName);
  return path.posix.join(namespace, checksumSha256.slice(0, 2), `${checksumSha256}${extension}`);
}

function writeSeededObject(storageKey, buffer) {
  const artifactsRoot = path.resolve(process.env.ARTIFACTS_DIR ?? defaultArtifactsDir);
  const targetPath = path.join(artifactsRoot, storageKey.replaceAll('/', path.sep));
  mkdirSync(path.dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, buffer);
}

const stageCatalog = readCatalogJson('../scoring/catalog/stage-sdgs.json');
const naceCatalog = readCatalogJson('../scoring/catalog/nace-sdgs.json');
const topicCatalog = readCatalogJson('../scoring/catalog/topics.json');
const riskCatalog = readCatalogJson('../scoring/catalog/risks.json');
const opportunityCatalog = readCatalogJson('../scoring/catalog/opportunities.json');

const roleDefaults = [
  {
    email: process.env.SEED_OWNER_EMAIL ?? 'owner@example.com',
    password: process.env.SEED_OWNER_PASSWORD ?? 'ChangeMe123!',
    name: 'ZEEUS Owner',
    role: 'owner'
  },
  {
    email: 'admin@example.com',
    password: 'ChangeMe123!',
    name: 'ZEEUS Admin',
    role: 'admin'
  },
  {
    email: 'member@example.com',
    password: 'ChangeMe123!',
    name: 'ZEEUS Member',
    role: 'member'
  }
];

const financialRecommendationTemplates = [
  {
    code: 'roi',
    recommendationType: 'financial',
    severityBand: 'default',
    title: 'Economic KPIs',
    text: 'Calculate ROI, IRR, NPV, and payback period so investors and judges can see how the venture creates value.'
  },
  {
    code: 'sensitivity',
    recommendationType: 'financial',
    severityBand: 'default',
    title: 'Sensitivity Analysis',
    text: 'Build best, base, and worst-case scenarios to expose the few assumptions that most affect viability.'
  },
  {
    code: 'usp',
    recommendationType: 'financial',
    severityBand: 'default',
    title: 'USP / Strategic Fit',
    text: 'Refine the value proposition until the venture has a clear and defensible differentiation story.'
  },
  {
    code: 'market_growth',
    recommendationType: 'financial',
    severityBand: 'default',
    title: 'Market Growth',
    text: 'Ground growth claims in market evidence so scale assumptions remain credible.'
  }
];

const knowledgeArticles = [
  {
    slug: 'how-it-works',
    title: 'How ZEEUS works',
    summary:
      'The platform mirrors the workbook flow with a faster web experience, saved drafts, revision history, and clearer outputs.',
    body: 'ZEEUS starts with startup context, moves through the Stage I inside-out assessment, then Stage II risks and opportunities, and finishes with impact summary, SDG alignment, dashboard, and report outputs. The workflow is intentionally guidance-oriented, not judgment-oriented. Founders are encouraged to use reasonable qualitative inputs early, then strengthen them with evidence over time.',
    category: 'how_it_works',
    status: 'published',
    locale: 'en',
    heroImageUrl: null,
    sortOrder: 10
  },
  {
    slug: 'manual-walkthrough',
    title: 'Manual walkthrough for founders and programme teams',
    summary:
      'The user manual is reflected in the live web flow: startup context, initial summary, Stage I, Stage II, impact summary, SDG alignment, dashboard, and report.',
    body: 'Use the manual and the live site together. Start with startup context, review the initial summary as a screening view, complete Stage I for inside-out impacts, move to Stage II for risks and opportunities, then read the impact summary, SDG alignment, dashboard, and export outputs. The web product keeps that sequence intact while making it easier to save work, revisit revisions, and coordinate partner-review workflows.',
    category: 'how_it_works',
    status: 'published',
    locale: 'en',
    heroImageUrl: null,
    sortOrder: 15
  },
  {
    slug: 'methodology',
    title: 'Methodology and scoring logic',
    summary:
      'Deterministic workbook-parity scoring remains the canonical engine behind the platform.',
    body: 'Stage I combines financial indicators with environmental, social, and governance impact topics. Stage II applies probability and impact matrices for risks and opportunities. Relevant topics are surfaced from 2.0 upward, while high-priority topics start at 2.5. The platform preserves deterministic scoring and treats AI as an explanatory layer only.',
    category: 'methodology',
    status: 'published',
    locale: 'en',
    heroImageUrl: null,
    sortOrder: 20
  },
  {
    slug: 'score-band-interpretation',
    title: 'How to read relevant and high-priority topics',
    summary:
      'The platform uses the workbook score bands consistently across Stage I, impact summary, dashboard, benchmarks, reports, and reviewer surfaces.',
    body: 'Topics below 2.0 remain low or very low. Topics from 2.0 to below 2.5 are surfaced as relevant and should be watched with intent. Topics from 2.5 upward are surfaced as high priority and should guide deeper evidence collection, action planning, and reviewer attention. These bands are not cosmetic labels; they shape recommendations, benchmark comparisons, and the way programme teams interpret results.',
    category: 'methodology',
    status: 'published',
    locale: 'en',
    heroImageUrl: null,
    sortOrder: 25
  },
  {
    slug: 'sdg-esrs-explainer',
    title: 'SDGs, ESRS, and double materiality',
    summary:
      'The SDGs act as a map, while the assessment logic borrows from double-materiality thinking to keep startup decisions practical.',
    body: 'The platform uses startup stage and business category to suggest likely SDG relevance, then refines that view through assessment logic. This keeps the SDGs useful as a directional map instead of a compliance checklist. The approach also reflects double materiality by looking at inside-out impacts and outside-in risks and opportunities.',
    category: 'sdg_esrs',
    status: 'published',
    locale: 'en',
    heroImageUrl: null,
    sortOrder: 30
  },
  {
    slug: 'tool-introduction-transcript',
    title: 'Tool introduction transcript and onboarding notes',
    summary:
      'The introductory video language is preserved as founder-facing support copy so the public site, help hub, and workflow all speak with one voice.',
    body: 'The introduction emphasizes three principles that remain consistent across the product: start early, use the tool for guidance rather than judgment, and treat sustainability as part of better venture design rather than as a late reporting burden. The transcript is preserved in the download library, while this article carries the same framing into the web help system.',
    category: 'how_it_works',
    status: 'published',
    locale: 'en',
    heroImageUrl: null,
    sortOrder: 35
  },
  {
    slug: 'partner-programs',
    title: 'Partner and program workflows',
    summary:
      'Programs can enroll startups, request submissions, assign reviewers, and track evidence-backed improvement over time.',
    body: 'ZEEUS now supports dual-audience delivery. Founders can run evaluations and evidence workflows, while partners can manage programs, submissions, reviewer assignments, and official outputs. Evaluation lifecycle and program review lifecycle remain separate so canonical scoring is never altered by reviewers.',
    category: 'partner',
    status: 'published',
    locale: 'en',
    heroImageUrl: null,
    sortOrder: 40
  },
  {
    slug: 'contact-support',
    title: 'Support and onboarding',
    summary:
      'Use the knowledge base, FAQ, and partner support channels to onboard new teams without losing methodological consistency.',
    body: 'ZEEUS is designed to be explainable and reproducible. The public site provides plain-language guidance, while the workspace offers tooltips, scenario notes, evidence prompts, and reporting outputs. Partners can use branded program pages and reviewer workflows to coordinate startup support.',
    category: 'contact',
    status: 'published',
    locale: 'en',
    heroImageUrl: null,
    sortOrder: 50
  }
];

const faqEntries = [
  {
    question: 'Is ZEEUS a judgment tool?',
    answer:
      'No. It is a guidance tool designed to help startups identify material issues early and make better design decisions before scaling.',
    category: 'principles',
    status: 'published',
    locale: 'en',
    sortOrder: 10
  },
  {
    question: 'Do the SDGs work like a checklist?',
    answer:
      'No. The SDGs are treated as a map and early compass reading. Final relevance is refined by the full assessment workflow.',
    category: 'methodology',
    status: 'published',
    locale: 'en',
    sortOrder: 20
  },
  {
    question: 'Can early-stage teams use qualitative inputs?',
    answer:
      'Yes. Qualitative judgments are valid early on, as long as teams are explicit about assumptions and improve evidence quality over time.',
    category: 'methodology',
    status: 'published',
    locale: 'en',
    sortOrder: 30
  },
  {
    question: 'What is the difference between relevant and high priority?',
    answer:
      'Scores from 2.0 to below 2.5 are surfaced as relevant. Scores from 2.5 upward are surfaced as high priority.',
    category: 'scores',
    status: 'published',
    locale: 'en',
    sortOrder: 40
  },
  {
    question: 'Does AI change the deterministic score?',
    answer:
      'No. AI is advisory only. It can explain outputs, highlight evidence gaps, and summarize findings, but it never alters canonical scoring.',
    category: 'ai',
    status: 'published',
    locale: 'en',
    sortOrder: 50
  },
  {
    question: 'Can programs review startup submissions without changing the result?',
    answer:
      'Yes. Reviewers work on top of immutable revision snapshots. They can comment, request changes, or approve submissions without mutating the saved scoring outputs.',
    category: 'programs',
    status: 'published',
    locale: 'en',
    sortOrder: 60
  }
];

const caseStudies = [
  {
    slug: 'circular-food-packaging',
    title: 'Circular packaging startup tightens evidence before launch',
    startupName: 'LoopLeaf Foods',
    summary:
      'A pre-launch food startup used ZEEUS to surface water, waste, and supply-chain issues before commercial rollout.',
    story:
      'LoopLeaf started with strong opportunity signals but weak evidence quality. By collecting supplier data, clarifying waste assumptions, and mapping SDG targets, the team improved confidence without changing the deterministic logic.',
    stage: 'pre_launch',
    naceDivision: '10 Manufacture of food products',
    status: 'published',
    locale: 'en',
    heroImageUrl: null,
    sortOrder: 10
  },
  {
    slug: 'climate-smart-logistics-service',
    title: 'Service venture uses scenarios to stress-test growth assumptions',
    startupName: 'RouteKind',
    summary:
      'A logistics software team compared baseline and improved scenarios to understand climate-transition upside and governance risks.',
    story:
      'RouteKind used the scenario lab to compare geography and partner-dependency assumptions. The exercise clarified where evidence was missing and what had to be collected before pitching for scale capital.',
    stage: 'growth_channel_fit',
    naceDivision: '52 Warehousing and support activities for transportation',
    status: 'published',
    locale: 'en',
    heroImageUrl: null,
    sortOrder: 20
  }
];

const resourceAssets = [
  {
    id: 'resource-introduction',
    slug: 'zeeus-introduction',
    title: 'Introduction to ZEEUS',
    description:
      'Overview of the ZEEUS project mission, the sustainability-by-design workflow, and the wider entrepreneurship context.',
    category: 'workflow_asset',
    fileLabel: 'PDF',
    status: 'published',
    locale: 'en',
    externalUrl: null,
    sourceRelativePath: 'references/Hackathon_User Guidlines/1) Introduction_ZEEUS.pdf',
    fileName: '1) Introduction_ZEEUS.pdf',
    mimeType: 'application/pdf',
    sortOrder: 10
  },
  {
    id: 'resource-user-manual',
    slug: 'zeeus-user-manual',
    title: 'User manual',
    description: 'Step-by-step description of the workflow, scoring logic, outputs, and dashboard.',
    category: 'manual',
    fileLabel: 'PDF',
    status: 'published',
    locale: 'en',
    externalUrl: null,
    sourceRelativePath: 'references/Hackathon_User Guidlines/2) Usermanual_ZEEUS.pdf',
    fileName: '2) Usermanual_ZEEUS.pdf',
    mimeType: 'application/pdf',
    sortOrder: 20
  },
  {
    id: 'resource-faq',
    slug: 'zeeus-faq',
    title: 'FAQ',
    description: 'Plain-language answers on methodology, SDGs, and qualitative startup inputs.',
    category: 'faq',
    fileLabel: 'PDF',
    status: 'published',
    locale: 'en',
    externalUrl: null,
    sourceRelativePath: 'references/Hackathon_User Guidlines/3) FAQ_ZEEUS.pdf',
    fileName: '3) FAQ_ZEEUS.pdf',
    mimeType: 'application/pdf',
    sortOrder: 30
  },
  {
    id: 'resource-score-interpretation',
    slug: 'zeeus-score-interpretation',
    title: 'Score interpretation',
    description:
      'Explanation of relevant versus high-priority topics and how founders should read the score outputs.',
    category: 'methodology',
    fileLabel: 'PDF',
    status: 'published',
    locale: 'en',
    externalUrl: null,
    sourceRelativePath: 'references/Hackathon_User Guidlines/4) Score Interpretation_ZEEUS.pdf',
    fileName: '4) Score Interpretation_ZEEUS.pdf',
    mimeType: 'application/pdf',
    sortOrder: 40
  },
  {
    id: 'resource-tool-example',
    slug: 'zeeus-tool-example-pack',
    title: 'Tool and example pack',
    description:
      'Official tool-and-example archive from the ZEEUS reference pack for onboarding and comparison.',
    category: 'workflow_asset',
    fileLabel: 'ZIP',
    status: 'published',
    locale: 'en',
    externalUrl: null,
    sourceRelativePath: 'references/Hackathon_User Guidlines/5) Tool & Example.zip',
    fileName: '5) Tool & Example.zip',
    mimeType: 'application/zip',
    sortOrder: 50
  },
  {
    id: 'resource-guidelines-kit',
    slug: 'zeeus-guidelines-kit',
    title: 'Brand and guidelines kit',
    description: 'Official ZEEUS identity guidance covering voice, framing, and visual treatment.',
    category: 'workflow_asset',
    fileLabel: 'PDF',
    status: 'published',
    locale: 'en',
    externalUrl: null,
    sourceRelativePath: 'references/Hackathon_User Guidlines/6) GUIDELINES KIT- ZEEUS.pdf',
    fileName: '6) GUIDELINES KIT- ZEEUS.pdf',
    mimeType: 'application/pdf',
    sortOrder: 60
  },
  {
    id: 'resource-tool-introduction-transcript',
    slug: 'zeeus-tool-introduction-transcript',
    title: 'Tool introduction transcript',
    description:
      'Transcript of the introductory tool video used for site copy alignment and onboarding support.',
    category: 'workflow_asset',
    fileLabel: 'TXT',
    status: 'published',
    locale: 'en',
    externalUrl: null,
    sourceRelativePath: 'references/Hackathon_User Guidlines/Tool_Introduction_Video.txt',
    fileName: 'Tool_Introduction_Video.txt',
    mimeType: 'text/plain; charset=utf-8',
    sortOrder: 70
  }
];

const siteMediaAssets = [
  {
    slug: 'zeeus-hero-application',
    title: 'ZEEUS landing page hero image',
    altText: 'ZEEUS sustainability and innovation materials displayed on a desk.',
    publicUrl: '/brand/zeeus/imagery/hero-application.png',
    filePath: 'apps/web/public/brand/zeeus/imagery/hero-application.png',
    locale: 'en',
    status: 'published'
  },
  {
    slug: 'zeeus-logo-primary-horizontal',
    title: 'ZEEUS primary horizontal logo',
    altText: 'Primary horizontal ZEEUS logo.',
    publicUrl: '/brand/zeeus/logos/logo-primary-horizontal.png',
    filePath: 'apps/web/public/brand/zeeus/logos/logo-primary-horizontal.png',
    locale: 'en',
    status: 'published'
  },
  {
    slug: 'zeeus-logo-symbol-circle',
    title: 'ZEEUS symbol mark',
    altText: 'Circular ZEEUS symbol logo.',
    publicUrl: '/brand/zeeus/logos/logo-symbol-circle.png',
    filePath: 'apps/web/public/brand/zeeus/logos/logo-symbol-circle.png',
    locale: 'en',
    status: 'published'
  }
];

const siteSettings = [
  {
    key: 'site_announcement',
    locale: 'en',
    title: 'Top announcement',
    description: 'Institutional attribution shown above the main navigation.',
    value: 'Developed by IfaS | Trier University of Applied Sciences under the ZEEUS project.'
  },
  {
    key: 'site_primary_navigation',
    locale: 'en',
    title: 'Primary navigation',
    description: 'Primary navigation items for the public site.',
    value: [
      { label: 'Home', href: '/' },
      { label: 'How it works', href: '/how-it-works' },
      { label: 'What you get', href: '/#what-you-get' },
      { label: 'About ZEEUS', href: '/about-zeeus' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Contact', href: '/contact' }
    ]
  },
  {
    key: 'site_footer_columns',
    locale: 'en',
    title: 'Footer columns',
    description: 'Footer link structure for the public site.',
    value: [
      {
        title: 'Explore',
        links: [
          { label: 'Home', href: '/' },
          { label: 'How it works', href: '/how-it-works' },
          { label: 'Resources', href: '/resources' },
          { label: 'FAQ', href: '/faq' },
          { label: 'Contact', href: '/contact' }
        ]
      },
      {
        title: 'Project',
        links: [
          { label: 'About ZEEUS', href: '/about-zeeus' },
          { label: 'Seed Factories', href: '/seed-factories' },
          { label: 'Methodology', href: '/methodology' },
          { label: 'SDG and ESRS', href: '/sdg-esrs' },
          { label: 'Funding and support', href: '/funding-support' }
        ]
      },
      {
        title: 'Legal',
        links: [
          { label: 'Privacy policy', href: '/privacy' },
          { label: 'Accessibility', href: '/accessibility' },
          { label: 'Cookie notice', href: '/cookies' },
          { label: 'Terms of use', href: '/terms' }
        ]
      }
    ]
  },
  {
    key: 'site_footer_note',
    locale: 'en',
    title: 'Footer note',
    description: 'Institutional note shown in the footer.',
    value:
      'Developed by IfaS, Institute for Applied Material Flow Management, Trier University of Applied Sciences, within the ZEEUS project.'
  },
  {
    key: 'site_funding_note',
    locale: 'en',
    title: 'Funding note',
    description: 'Funding and ecosystem note shown in the footer.',
    value:
      'Supported within a broader European innovation and sustainability context. Use of project logos and co-branding should follow the ZEEUS visual identity guidance.'
  },
  {
    key: 'site_contact_email',
    locale: 'en',
    title: 'Contact email',
    description: 'Primary institutional contact email.',
    value: 'zeeus@ifas.eu'
  },
  {
    key: 'site_contact_links',
    locale: 'en',
    title: 'Utility links',
    description: 'Utility links shown with the institutional announcement bar.',
    value: [
      { label: 'About ZEEUS', href: '/about-zeeus' },
      { label: 'Contact', href: '/contact' },
      { label: 'Privacy', href: '/privacy' }
    ]
  }
];

const sitePages = [
  {
    slug: 'home',
    locale: 'en',
    title: 'ZEEUS Sustainability by Design Tool',
    summary:
      'A founder-friendly guidance tool from IfaS at Trier University of Applied Sciences under the ZEEUS project.',
    pageType: 'landing',
    status: 'published',
    heroEyebrow: 'Startup Sustainability Evaluation Tool',
    heroTitle: 'Build your startup with sustainability in mind from day one',
    heroBody:
      'The Sustainability by Design tool helps founders explore how their idea connects to sustainability, strategy, and future business resilience. It translates the UN Sustainable Development Goals and ESRS double materiality into a practical, startup-friendly workflow so you can identify what matters early, avoid costly blind spots, and grow with greater confidence.',
    heroPrimaryCtaLabel: 'Start evaluation',
    heroPrimaryCtaHref: '/signup',
    heroSecondaryCtaLabel: 'See how it works',
    heroSecondaryCtaHref: '/#how-it-works',
    heroMediaSlug: 'zeeus-hero-application',
    navigationLabel: 'Home',
    navigationGroup: 'explore',
    showInPrimaryNav: true,
    showInFooter: false,
    canonicalUrl: 'https://zeeus.org',
    seoTitle: 'Sustainability by Design for startups',
    seoDescription:
      'Assess your startup idea through sustainability, risk, and opportunity lenses with the ZEEUS Sustainability by Design tool.',
    sections: [
      {
        id: 'what-you-can-explore',
        kind: 'feature_grid',
        eyebrow: 'What you can explore',
        title: 'Relevant outputs from the start',
        items: [
          {
            title: 'Relevant SDGs',
            description:
              'Surface SDGs linked to your startup stage and business context without turning them into a checklist.'
          },
          {
            title: 'Material topics',
            description:
              'Explore environmental, social, governance, and economic topics that may matter to your venture.'
          },
          {
            title: 'Risks and opportunities',
            description:
              'See where sustainability-related developments may create exposure or differentiation.'
          },
          {
            title: 'Priority areas',
            description:
              'Identify where action, monitoring, or stronger evidence may be needed next.'
          },
          {
            title: 'Export-ready outputs',
            description:
              'Generate results you can use in reflection, programme review, and reporting preparation.'
          }
        ]
      },
      {
        id: 'founder-reassurance',
        kind: 'feature_grid',
        eyebrow: 'Built to guide',
        title: 'A guidance tool, not a judgment tool',
        body: 'The workflow is designed to help founders reflect, prioritise, and make better-informed decisions without requiring a mature reporting team.',
        items: [
          {
            title: 'Startup-friendly',
            description: 'Built for early-stage ventures, not only mature reporting teams.'
          },
          {
            title: 'SDG-aligned',
            description:
              'Use globally recognised sustainability language without turning it into a checklist.'
          },
          {
            title: 'ESRS-informed',
            description:
              'Explore inside-out impacts and outside-in risks in a structured, founder-friendly format.'
          },
          {
            title: 'Action-oriented',
            description:
              'Get practical summaries, highlighted priorities, and recommendations to guide next steps.'
          }
        ]
      },
      {
        id: 'why-this-matters',
        kind: 'feature_grid',
        eyebrow: 'Why this matters',
        title: 'Sustainability matters early because startup decisions harden fast',
        body: 'Many sustainability-related issues are easiest to address at the design stage, before processes harden, costs rise, and trade-offs become more expensive.',
        items: [
          {
            title: 'See what could matter before it becomes a problem',
            description:
              'Spot topics related to energy, water, waste, labour, trust, ethics, and future business exposure earlier in your journey.'
          },
          {
            title: 'Turn frameworks into practical founder questions',
            description:
              'The tool translates sustainability frameworks into focused questions that help you reflect in a realistic, stage-appropriate way.'
          },
          {
            title: 'Build a stronger story for growth',
            description:
              'A clearer understanding of impacts, risks, opportunities, and SDG alignment can strengthen planning and positioning.'
          },
          {
            title: 'Avoid unnecessary complexity',
            description:
              'The goal is not to master every disclosure requirement at once, but to focus on what is genuinely relevant now.'
          }
        ]
      },
      {
        id: 'how-it-works',
        kind: 'step_grid',
        eyebrow: 'How it works',
        title: 'Move from startup context to dashboard insights in five steps',
        body: 'Enter your startup context, review relevant SDGs, complete Stage I and Stage II, then use the resulting outputs to guide next decisions.',
        items: [
          {
            title: 'Describe your startup context',
            description:
              'Capture country, business category, offering type, current stage, and innovation approach.',
            microcopy: 'Your context helps shape what the tool highlights first.'
          },
          {
            title: 'Review relevant SDGs',
            description:
              'Use the early SDG screening as a directional map rather than a final verdict.',
            microcopy: 'Think of SDGs as a map, not a checklist.'
          },
          {
            title: 'Complete Stage I',
            description:
              'Assess the startup through financial, environmental, social, governance, and economic lenses.',
            microcopy:
              'Early-stage evaluation can still be structured, even when information is emerging.'
          },
          {
            title: 'Complete Stage II',
            description:
              'Evaluate sustainability-related risks and opportunities that may affect the venture.',
            microcopy: 'Not every topic becomes a threat. Some become differentiators.'
          },
          {
            title: 'Review outputs',
            description:
              'Use the dashboard, recommendations, SDG alignment, and report outputs to guide next steps.',
            microcopy: 'Use the outputs for planning, reflection, and stakeholder conversations.'
          }
        ]
      },
      {
        id: 'what-you-get',
        kind: 'feature_grid',
        eyebrow: 'What you get',
        title: 'Practical outputs you can use immediately',
        body: 'The tool does more than collect inputs. It turns responses into outputs that help founders focus attention and move forward with more clarity.',
        items: [
          {
            title: 'Impact Summary',
            description:
              'A concise overview of the sustainability topics most relevant to your startup.'
          },
          {
            title: 'Results Dashboard',
            description:
              'A clear dashboard view of financial scores, impact topics, risks, opportunities, and priorities.'
          },
          {
            title: 'SDG Alignment',
            description:
              'A combined view of SDGs linked to startup context so you can connect the venture to recognised goals and targets.'
          },
          {
            title: 'Recommendations',
            description:
              'Practical, topic-linked guidance to help you decide what to monitor, refine, or strengthen over time.'
          },
          {
            title: 'Export-ready report',
            description:
              'A printable or downloadable output for reflection, mentoring, programme review, and planning.'
          }
        ]
      },
      {
        id: 'honest-reflection',
        kind: 'quote',
        eyebrow: 'Designed for honest reflection',
        quote: 'Better awareness early leads to stronger choices later.'
      },
      {
        id: 'audiences',
        kind: 'audience_list',
        eyebrow: 'Who this tool is for',
        title: 'Built for founders, researchers, and entrepreneurship ecosystems',
        items: [
          { title: 'Startup founders and early-stage teams' },
          { title: 'Students exploring venture ideas' },
          { title: 'Researchers and innovation-focused project teams' },
          { title: 'Entrepreneurship support programmes' },
          { title: 'Incubators, accelerators, and mentoring environments' },
          { title: 'Higher education innovation ecosystems' }
        ]
      },
      {
        id: 'about-zeeus',
        kind: 'rich_text',
        eyebrow: 'About ZEEUS',
        title: 'A wider mission around innovation, sustainability, and Seed Factories',
        body: `ZEEUS, Zero Emissions Entrepreneurship for Universal Sustainability, is an international initiative focused on strengthening innovation and entrepreneurship capacity within higher education institutions by supporting sustainable, impact-driven venture creation.

The project supports sustainable entrepreneurship through training, mentoring, digital tools, and cross-border collaboration between Europe and Africa. It contributes to more resilient, scalable innovation ecosystems and encourages earlier sustainability awareness in venture creation.

The Sustainability by Design tool is developed by IfaS at Trier University of Applied Sciences as part of that wider mission.`
      },
      {
        id: 'ecosystem',
        kind: 'logo_strip',
        eyebrow: 'Supported by a wider innovation ecosystem',
        title: 'Institutional context behind the platform',
        items: [
          { title: 'ZEEUS' },
          { title: 'IfaS' },
          { title: 'Trier University of Applied Sciences' },
          { title: 'Climate-KIC' },
          { title: 'European innovation support context' }
        ]
      },
      {
        id: 'faq',
        kind: 'faq_list',
        eyebrow: 'FAQ',
        title: 'Straight answers for founders starting early',
        items: [
          {
            title: 'Is this a scoring tool or a judgment tool?',
            description:
              'It is a guidance tool. The purpose is not to label a startup as good or bad, but to help founders understand which topics may matter and how they could shape future decisions.'
          },
          {
            title: 'Do I need exact numbers before I use it?',
            description:
              'No. Early-stage ventures often do not have complete quantitative data. Structured qualitative inputs are supported where hard measurements are not yet available.'
          },
          {
            title: 'Why are SDGs included?',
            description:
              'SDGs provide a broad sustainability map and help founders identify which areas may already be relevant to their model, operations, and future development.'
          },
          {
            title: 'What is double materiality in simple terms?',
            description:
              'It means looking in two directions at once: how the startup may affect people and the environment, and how environmental, social, and governance issues may affect the startup.'
          },
          {
            title: 'What do I receive at the end of the evaluation?',
            description:
              'You receive an impact summary, dashboard results, SDG alignment view, recommendations, and an exportable report-style output.'
          },
          {
            title: 'Why start this early?',
            description:
              'Because early awareness can reduce future rework, strengthen design choices, and make it easier to align growth with resilient and sustainable business development.'
          }
        ]
      },
      {
        id: 'start-evaluation',
        kind: 'cta',
        eyebrow: 'Final step',
        title: 'Start exploring what matters for your startup',
        body: 'Use the Sustainability by Design tool to identify relevant sustainability topics, reflect on risks and opportunities, and build a clearer picture of how your venture can grow with resilience and purpose.',
        ctaLabel: 'Start evaluation',
        ctaHref: '/signup'
      }
    ],
    sortOrder: 0
  },
  {
    slug: 'about-zeeus',
    locale: 'en',
    title: 'About ZEEUS',
    summary:
      'Learn how ZEEUS connects sustainable entrepreneurship, higher education, and innovation ecosystems.',
    pageType: 'institutional',
    status: 'published',
    heroEyebrow: 'About ZEEUS',
    heroTitle: 'An international initiative for sustainable, impact-driven entrepreneurship',
    heroBody:
      'ZEEUS strengthens innovation and entrepreneurship capacity within higher education institutions by supporting sustainable venture creation, transnational collaboration, and Seed Factory development.',
    navigationLabel: 'About ZEEUS',
    navigationGroup: 'project',
    showInPrimaryNav: true,
    showInFooter: true,
    sections: [
      {
        id: 'about-mission',
        kind: 'rich_text',
        title: 'What ZEEUS is building',
        body: 'ZEEUS, Zero Emissions Entrepreneurship for Universal Sustainability, promotes innovation, knowledge transfer, and entrepreneurial education through cooperation between institutions and ecosystems. The project supports scalable, sustainability-oriented venture creation and connects education, mentoring, and practical tools.'
      },
      {
        id: 'about-pillars',
        kind: 'feature_grid',
        title: 'Core focus areas',
        items: [
          {
            title: 'Innovation capacity',
            description:
              'Strengthening entrepreneurial capability inside higher education institutions and their surrounding ecosystems.'
          },
          {
            title: 'Sustainable venture creation',
            description:
              'Supporting founders, students, and researchers in building ventures that are resilient and impact-aware from the outset.'
          },
          {
            title: 'Europe-Africa collaboration',
            description:
              'Building practical cross-border cooperation around entrepreneurship, climate action, and innovation.'
          }
        ]
      }
    ],
    sortOrder: 10
  },
  {
    slug: 'seed-factories',
    locale: 'en',
    title: 'Seed Factories',
    summary:
      'Seed Factories connect training, mentoring, ecosystem navigation, and venture support in one model.',
    pageType: 'institutional',
    status: 'published',
    heroEyebrow: 'Seed Factories',
    heroTitle: 'One-stop support environments for sustainable entrepreneurship',
    heroBody:
      'A central part of the wider ZEEUS vision is the development of Seed Factories as one-stop support environments for students, researchers, staff, and entrepreneurs.',
    navigationLabel: 'Seed Factories',
    navigationGroup: 'project',
    showInFooter: true,
    sections: [
      {
        id: 'seed-overview',
        kind: 'rich_text',
        title: 'Why Seed Factories matter',
        body: 'Seed Factories connect training, mentoring, ecosystem navigation, and access to opportunities that can turn promising ideas into impactful ventures. They are designed to reduce fragmentation and support more credible venture development from idea stage onward.'
      }
    ],
    sortOrder: 20
  },
  {
    slug: 'how-it-works',
    locale: 'en',
    title: 'How the evaluation works',
    summary:
      'Move through the process step by step, starting with startup context and ending with a dashboard of results, aligned SDGs, and practical recommendations.',
    pageType: 'support',
    status: 'published',
    heroEyebrow: 'How it works',
    heroTitle: 'A structured founder workflow from context to recommendations',
    heroBody:
      'The tool begins with startup context, adds SDG screening, then moves through Stage I and Stage II before producing dashboard insights, recommendations, and export-ready outputs.',
    navigationLabel: 'How it works',
    navigationGroup: 'explore',
    showInFooter: true,
    sections: [
      {
        id: 'workflow-steps',
        kind: 'step_grid',
        title: 'Five core steps',
        items: [
          {
            title: 'Describe your startup context',
            description:
              'Capture country, business category, offering type, current stage, and innovation approach.'
          },
          {
            title: 'Review relevant SDGs',
            description: 'Use the early SDG screening as a directional map rather than a checklist.'
          },
          {
            title: 'Complete Stage I',
            description:
              'Assess the startup through financial, environmental, social, governance, and economic lenses.'
          },
          {
            title: 'Complete Stage II',
            description:
              'Evaluate sustainability-related risks and opportunities that may affect the venture.'
          },
          {
            title: 'Review outputs',
            description:
              'Use the dashboard, recommendations, SDG alignment, and report outputs to guide next steps.'
          }
        ]
      }
    ],
    sortOrder: 30
  },
  {
    slug: 'methodology',
    locale: 'en',
    title: 'Methodology',
    summary:
      'Understand how the deterministic scoring logic preserves workbook parity while keeping the tool founder-friendly.',
    pageType: 'methodology',
    status: 'published',
    heroEyebrow: 'Methodology',
    heroTitle: 'Deterministic scoring with startup-friendly guidance',
    heroBody:
      'Stage I combines financial indicators with environmental, social, and governance impact topics. Stage II applies probability and impact matrices for risks and opportunities.',
    navigationLabel: 'Methodology',
    navigationGroup: 'project',
    showInFooter: true,
    sections: [
      {
        id: 'methodology-body',
        kind: 'rich_text',
        body: 'Relevant topics are surfaced from 2.0 upward, while high-priority topics start at 2.5. The platform preserves deterministic scoring and treats AI as an explanatory layer only. Qualitative inputs are acceptable early, as long as assumptions are explicit and improved over time.'
      }
    ],
    sortOrder: 40
  },
  {
    slug: 'sdg-esrs',
    locale: 'en',
    title: 'SDGs, ESRS, and double materiality',
    summary:
      'The tool uses globally recognised sustainability frameworks in a practical, founder-friendly way.',
    pageType: 'methodology',
    status: 'published',
    heroEyebrow: 'Frameworks',
    heroTitle: 'A sustainability map for early-stage ventures',
    heroBody:
      'The SDGs act as a map, while the assessment logic borrows from ESRS double-materiality thinking to keep startup decisions practical and relevant.',
    navigationLabel: 'SDG and ESRS',
    navigationGroup: 'project',
    showInFooter: true,
    sections: [
      {
        id: 'framework-columns',
        kind: 'feature_grid',
        items: [
          {
            title: 'UN Sustainable Development Goals',
            description:
              'SDGs help frame the broader sustainability areas your startup may touch, from water and energy to waste, labour, and innovation.'
          },
          {
            title: 'ESRS double materiality',
            description:
              'The workflow looks in two directions at once: how your startup affects people and the environment, and how sustainability issues may affect your startup.'
          }
        ]
      }
    ],
    sortOrder: 50
  },
  {
    slug: 'partners',
    locale: 'en',
    title: 'Partner and program workflows',
    summary:
      'Programs can enroll startups, request submissions, assign reviewers, and coordinate official outputs without changing canonical scoring.',
    pageType: 'institutional',
    status: 'published',
    heroEyebrow: 'Partner programs',
    heroTitle: 'Built for founders, reviewers, and entrepreneurship ecosystems',
    heroBody:
      'The platform supports public partner pages, invite-only reviewer workflows, and program submissions that always point to immutable evaluation revisions.',
    navigationLabel: 'Partner programmes',
    navigationGroup: 'project',
    showInFooter: true,
    sections: [
      {
        id: 'partner-body',
        kind: 'rich_text',
        body: 'Partners can manage cohort oversight, startup submissions, reviewer workflows, and official outputs while keeping deterministic scoring immutable. The system is designed so programmes can support startups without overwriting the underlying result.'
      }
    ],
    sortOrder: 60
  },
  {
    slug: 'contact',
    locale: 'en',
    title: 'Contact',
    summary:
      'Use the contact and support routes to reach the appropriate ZEEUS or IfaS contact for onboarding, partnerships, and institutional requests.',
    pageType: 'support',
    status: 'published',
    heroEyebrow: 'Contact',
    heroTitle: 'Reach the ZEEUS and IfaS support context',
    heroBody:
      'Use the knowledge base, FAQ, and contact routes to onboard teams, route institutional requests, and coordinate next steps.',
    navigationLabel: 'Contact',
    navigationGroup: 'support',
    showInPrimaryNav: true,
    showInFooter: true,
    sections: [
      {
        id: 'contact-body',
        kind: 'rich_text',
        body: 'For product guidance, institutional coordination, and project questions, use the contact pathways provided on the site. Privacy, accessibility, cookie, and legal requests are routed through dedicated pages and can also be directed to the project contact mailbox.'
      }
    ],
    sortOrder: 70
  },
  {
    slug: 'privacy',
    locale: 'en',
    title: 'Privacy policy',
    summary:
      'Understand how the platform handles account, contact, and evaluation data at a high level.',
    pageType: 'legal',
    status: 'published',
    heroEyebrow: 'Privacy policy',
    heroTitle: 'A clear statement of data handling responsibilities',
    heroBody:
      'This site stores account information, evaluation inputs, and contact requests to operate the platform and support programme workflows.',
    navigationLabel: 'Privacy policy',
    navigationGroup: 'legal',
    showInFooter: true,
    sections: [
      {
        id: 'privacy-body',
        kind: 'rich_text',
        body: 'Account, session, evaluation, evidence, and contact data are processed to operate the service, maintain security, and support authorised programme workflows. Access is role-controlled, audit logged, and aligned with institutional governance. Personal data should be limited to what is needed for account management, evaluation collaboration, programme review, and operational support, with retention and legal review handled through the responsible institutional owners.'
      }
    ],
    sortOrder: 80
  },
  {
    slug: 'accessibility',
    locale: 'en',
    title: 'Accessibility',
    summary:
      'Accessibility is treated as a product requirement across the public site and founder workspace.',
    pageType: 'legal',
    status: 'published',
    heroEyebrow: 'Accessibility',
    heroTitle: 'Designed for broad access and continuous improvement',
    heroBody:
      'The public site and authenticated workflows are intended to remain keyboard-friendly, readable, and compatible with responsive use.',
    navigationLabel: 'Accessibility',
    navigationGroup: 'legal',
    showInFooter: true,
    sections: [
      {
        id: 'accessibility-body',
        kind: 'rich_text',
        body: 'Accessibility improvements should be tracked as ongoing product work. Current priorities include semantic structure, focus visibility, colour contrast, responsive layouts, and clear form feedback. Issues can be reported through the contact route.'
      }
    ],
    sortOrder: 90
  },
  {
    slug: 'cookies',
    locale: 'en',
    title: 'Cookie notice',
    summary:
      'Cookies and similar technologies are limited to the needs of authentication, security, and approved analytics tooling.',
    pageType: 'legal',
    status: 'published',
    heroEyebrow: 'Cookie notice',
    heroTitle: 'Minimal, accountable use of browser storage',
    heroBody:
      'Session handling and security protections require limited browser storage. Additional analytics should be consent-aware and institutionally approved.',
    navigationLabel: 'Cookie notice',
    navigationGroup: 'legal',
    showInFooter: true,
    sections: [
      {
        id: 'cookie-body',
        kind: 'rich_text',
        body: 'Authentication cookies are used to keep signed-in users secure and connected to authorised workflows. Any future analytics or marketing tags should sit behind an explicit consent layer and documented retention policy.'
      }
    ],
    sortOrder: 100
  },
  {
    slug: 'terms',
    locale: 'en',
    title: 'Terms of use',
    summary:
      'Use the platform as a guidance tool for evaluation and programme workflows, not as a legal certification instrument.',
    pageType: 'legal',
    status: 'published',
    heroEyebrow: 'Terms of use',
    heroTitle: 'Guidance-oriented use with institutional governance',
    heroBody:
      'The platform is designed to support reflection, assessment, and programme workflows. It does not constitute legal, regulatory, or financial certification.',
    navigationLabel: 'Terms of use',
    navigationGroup: 'legal',
    showInFooter: true,
    sections: [
      {
        id: 'terms-body',
        kind: 'rich_text',
        body: 'Users should provide honest, supportable inputs and treat outputs as guidance for decision-making, mentoring, and reporting preparation. Institutional partners remain responsible for their own review, approval, and governance processes.'
      }
    ],
    sortOrder: 110
  },
  {
    slug: 'funding-support',
    locale: 'en',
    title: 'Funding and support context',
    summary:
      'ZEEUS sits within a wider innovation ecosystem and should present approved funding and support context clearly.',
    pageType: 'institutional',
    status: 'published',
    heroEyebrow: 'Funding and support',
    heroTitle: 'Part of a broader innovation and sustainability effort',
    heroBody:
      'The site should acknowledge the wider European innovation, entrepreneurship, and sustainability context in which the ZEEUS project operates.',
    navigationLabel: 'Funding and support',
    navigationGroup: 'project',
    showInFooter: true,
    sections: [
      {
        id: 'funding-body',
        kind: 'rich_text',
        body: 'ZEEUS should present its funding and support context in a clear, institutionally approved way that reflects the wider innovation, sustainability, and entrepreneurship ecosystem around the project. Public wording and logo usage should follow the official identity materials, while this page provides the stable public location for that context within the site.'
      }
    ],
    sortOrder: 120
  },
  {
    slug: 'consortium',
    locale: 'en',
    title: 'Consortium and ecosystem',
    summary:
      'The ZEEUS platform belongs to a wider collaboration of institutions and entrepreneurship ecosystems.',
    pageType: 'institutional',
    status: 'published',
    heroEyebrow: 'Consortium',
    heroTitle: 'A wider network behind the platform',
    heroBody:
      'The ZEEUS site should present the project as part of a broader network of institutions, mentors, and innovation actors rather than as an isolated software artifact.',
    navigationLabel: 'Consortium',
    navigationGroup: 'project',
    showInFooter: true,
    sections: [
      {
        id: 'consortium-body',
        kind: 'rich_text',
        body: 'The ZEEUS platform sits within a broader collaboration of higher-education institutions, sustainability experts, entrepreneurship actors, and programme partners. This page is intended to explain roles, collaboration pathways, and ecosystem links in a way that supports trust, not just attribution.'
      }
    ],
    sortOrder: 130
  }
];

const sdgTargetFixtures = [
  {
    goalNumber: 6,
    goalTitle: 'Clean Water and Sanitation',
    goalSummary: 'Protect water resources, sanitation access, and responsible water use.',
    targetCode: '6.3',
    title: 'Improve water quality',
    description:
      'Reduce pollution, minimise hazardous releases, and increase safe treatment and reuse.',
    officialUrl: 'https://sdgs.un.org/goals/goal6'
  },
  {
    goalNumber: 6,
    goalTitle: 'Clean Water and Sanitation',
    goalSummary: 'Protect water resources, sanitation access, and responsible water use.',
    targetCode: '6.4',
    title: 'Increase water-use efficiency',
    description:
      'Improve efficiency across sectors and strengthen resilience against water scarcity.',
    officialUrl: 'https://sdgs.un.org/goals/goal6'
  },
  {
    goalNumber: 7,
    goalTitle: 'Affordable and Clean Energy',
    goalSummary: 'Expand access to clean, reliable, and modern energy systems.',
    targetCode: '7.2',
    title: 'Increase the share of renewable energy',
    description: 'Support energy transitions through cleaner technologies and system design.',
    officialUrl: 'https://sdgs.un.org/goals/goal7'
  },
  {
    goalNumber: 8,
    goalTitle: 'Decent Work and Economic Growth',
    goalSummary: 'Promote resilient jobs, inclusive growth, and productive entrepreneurship.',
    targetCode: '8.2',
    title: 'Achieve higher economic productivity',
    description: 'Promote innovation, technology upgrading, and high-value activities.',
    officialUrl: 'https://sdgs.un.org/goals/goal8'
  },
  {
    goalNumber: 8,
    goalTitle: 'Decent Work and Economic Growth',
    goalSummary: 'Promote resilient jobs, inclusive growth, and productive entrepreneurship.',
    targetCode: '8.4',
    title: 'Improve resource efficiency in consumption and production',
    description: 'Decouple growth from environmental degradation where possible.',
    officialUrl: 'https://sdgs.un.org/goals/goal8'
  },
  {
    goalNumber: 9,
    goalTitle: 'Industry, Innovation and Infrastructure',
    goalSummary: 'Build resilient infrastructure and foster sustainable innovation.',
    targetCode: '9.4',
    title: 'Upgrade infrastructure for sustainability',
    description: 'Increase resource-use efficiency and adopt clean technologies.',
    officialUrl: 'https://sdgs.un.org/goals/goal9'
  },
  {
    goalNumber: 12,
    goalTitle: 'Responsible Consumption and Production',
    goalSummary: 'Shift systems toward circular, efficient, and lower-impact production.',
    targetCode: '12.2',
    title: 'Sustainably manage natural resources',
    description: 'Support more efficient and responsible use of materials, water, and energy.',
    officialUrl: 'https://sdgs.un.org/goals/goal12'
  },
  {
    goalNumber: 12,
    goalTitle: 'Responsible Consumption and Production',
    goalSummary: 'Shift systems toward circular, efficient, and lower-impact production.',
    targetCode: '12.5',
    title: 'Substantially reduce waste generation',
    description:
      'Prioritise prevention, reduction, recycling, and reuse throughout the value chain.',
    officialUrl: 'https://sdgs.un.org/goals/goal12'
  },
  {
    goalNumber: 13,
    goalTitle: 'Climate Action',
    goalSummary: 'Strengthen mitigation, adaptation, and resilience to climate-related risks.',
    targetCode: '13.2',
    title: 'Integrate climate measures into planning',
    description: 'Embed climate considerations into strategy, governance, and operations.',
    officialUrl: 'https://sdgs.un.org/goals/goal13'
  },
  {
    goalNumber: 16,
    goalTitle: 'Peace, Justice and Strong Institutions',
    goalSummary: 'Promote accountable governance and trustworthy institutions.',
    targetCode: '16.6',
    title: 'Develop effective, accountable institutions',
    description: 'Strengthen governance, transparency, and responsible decision-making.',
    officialUrl: 'https://sdgs.un.org/goals/goal16'
  },
  {
    goalNumber: 17,
    goalTitle: 'Partnerships for the Goals',
    goalSummary: 'Mobilise partnerships and coordinated support for sustainability transitions.',
    targetCode: '17.17',
    title: 'Encourage effective partnerships',
    description: 'Support partnerships that combine public, private, and civil-society strengths.',
    officialUrl: 'https://sdgs.un.org/goals/goal17'
  }
];

const evidenceFixtures = [
  {
    kind: 'link',
    title: 'Supplier water-intensity note',
    description:
      'External benchmark note used to estimate water intensity for the baseline process.',
    sourceUrl: 'https://sdgs.un.org/goals/goal6',
    ownerName: 'Operations lead',
    sourceDate: '2026-03-14',
    evidenceBasis: 'estimated',
    confidenceWeight: 0.6,
    linkedTopicCode: 'E1',
    linkedRecommendationId: null
  },
  {
    kind: 'note',
    title: 'Governance readiness assumption log',
    description:
      'Internal note documenting assumptions around board oversight, customer data handling, and early governance controls.',
    sourceUrl: null,
    ownerName: 'Founder team',
    sourceDate: '2026-03-22',
    evidenceBasis: 'assumed',
    confidenceWeight: 0.35,
    linkedTopicCode: 'G1',
    linkedRecommendationId: 'opportunity:governance_trust_opportunity'
  }
];

const scenarioFixtures = [
  {
    name: 'Circular sourcing uplift',
    focusArea: 'Materials and sourcing',
    geography: 'EU supply base',
    dependency: 'Primary packaging supplier',
    timeframe: '12 months',
    hypothesis:
      'If supplier contracts move toward recycled inputs and traceability, resource efficiency and SDG alignment should improve without changing the canonical saved revision.',
    advisorySummary:
      'This scenario assumes stronger sourcing evidence and improved packaging circularity. It is advisory only and should be compared side by side with the baseline revision.'
  },
  {
    name: 'Regional expansion stress test',
    focusArea: 'Go-to-market risk',
    geography: 'Southern Europe',
    dependency: 'Channel partner rollout',
    timeframe: '18 months',
    hypothesis:
      'If expansion depends on a single regional channel partner, climate-transition upside may rise while governance and execution risk become harder to control.',
    advisorySummary:
      'This scenario highlights the trade-off between market growth and partner dependency. It should be used as a discussion tool, not as a replacement for the core assessment.'
  }
];

const evaluationFixture = {
  name: 'ZEEUS Manufacturing Demo',
  country: 'Germany',
  naceDivision: '10 Manufacture of food products',
  offeringType: 'product',
  launched: false,
  currentStage: 'pre_launch',
  innovationApproach: 'sustaining',
  status: 'completed',
  currentStep: 'dashboard',
  financialTotal: 9,
  riskOverall: 2,
  opportunityOverall: 3.5,
  confidenceBand: 'moderate',
  relevantTopicCount: 2,
  highPriorityTopicCount: 0
};

const stage1FinancialFixture = {
  roiLevel: 'above_industry_average',
  sensitivityLevel: 'not_evaluated',
  uspLevel: 'strong_or_unique_usp',
  marketGrowthLevel: 'growing',
  totalScore: 9
};

const stage1TopicFixtures = [
  {
    topicCode: 'E1',
    applicable: true,
    magnitude: 'high',
    scale: 'significant',
    irreversibility: 'moderate',
    likelihood: 'likely',
    evidenceBasis: 'estimated',
    impactScore: 2.25,
    priorityBand: 'relevant'
  },
  {
    topicCode: 'E2',
    applicable: true,
    magnitude: 'moderate',
    scale: 'moderate',
    irreversibility: 'moderate',
    likelihood: 'unlikely',
    evidenceBasis: 'estimated',
    impactScore: 1,
    priorityBand: 'low'
  },
  {
    topicCode: 'E3',
    applicable: false,
    magnitude: 'na',
    scale: 'na',
    irreversibility: 'na',
    likelihood: 'na',
    evidenceBasis: 'assumed',
    impactScore: 0,
    priorityBand: 'not_applicable'
  },
  {
    topicCode: 'E4',
    applicable: true,
    magnitude: 'low',
    scale: 'moderate',
    irreversibility: 'low',
    likelihood: 'unlikely',
    evidenceBasis: 'estimated',
    impactScore: 0.67,
    priorityBand: 'very_low'
  },
  {
    topicCode: 'E5',
    applicable: true,
    magnitude: 'significant',
    scale: 'high',
    irreversibility: 'low',
    likelihood: 'likely',
    evidenceBasis: 'estimated',
    impactScore: 2,
    priorityBand: 'relevant'
  },
  {
    topicCode: 'S1',
    applicable: true,
    magnitude: 'low',
    scale: 'low',
    irreversibility: 'low',
    likelihood: 'likely',
    evidenceBasis: 'measured',
    impactScore: 0.75,
    priorityBand: 'very_low'
  },
  {
    topicCode: 'S2',
    applicable: true,
    magnitude: 'significant',
    scale: 'low',
    irreversibility: 'low',
    likelihood: 'likely',
    evidenceBasis: 'estimated',
    impactScore: 1.25,
    priorityBand: 'low'
  },
  {
    topicCode: 'S3',
    applicable: false,
    magnitude: 'na',
    scale: 'na',
    irreversibility: 'na',
    likelihood: 'na',
    evidenceBasis: 'assumed',
    impactScore: 0,
    priorityBand: 'not_applicable'
  },
  {
    topicCode: 'S4',
    applicable: false,
    magnitude: 'na',
    scale: 'na',
    irreversibility: 'na',
    likelihood: 'na',
    evidenceBasis: 'assumed',
    impactScore: 0,
    priorityBand: 'not_applicable'
  },
  {
    topicCode: 'G1',
    applicable: false,
    magnitude: 'na',
    scale: 'na',
    irreversibility: 'na',
    likelihood: 'na',
    evidenceBasis: 'assumed',
    impactScore: 0,
    priorityBand: 'not_applicable'
  }
];

const stage2RiskFixtures = [
  {
    riskCode: 'climate_policy_risk',
    applicable: true,
    probability: 'could_occur',
    impact: 'moderate',
    evidenceBasis: 'estimated',
    ratingLabel: 'moderate',
    ratingScore: 1
  },
  {
    riskCode: 'water_scarcity_risk',
    applicable: false,
    probability: 'na',
    impact: 'na',
    evidenceBasis: 'assumed',
    ratingLabel: 'neutral',
    ratingScore: 0
  },
  {
    riskCode: 'biodiversity_regulation_risk',
    applicable: false,
    probability: 'na',
    impact: 'na',
    evidenceBasis: 'assumed',
    ratingLabel: 'neutral',
    ratingScore: 0
  },
  {
    riskCode: 'resource_scarcity_risk',
    applicable: true,
    probability: 'likely',
    impact: 'low',
    evidenceBasis: 'estimated',
    ratingLabel: 'severe',
    ratingScore: 0.75
  },
  {
    riskCode: 'community_stability_risk',
    applicable: false,
    probability: 'na',
    impact: 'na',
    evidenceBasis: 'assumed',
    ratingLabel: 'neutral',
    ratingScore: 0
  },
  {
    riskCode: 'consumer_governance_risk',
    applicable: true,
    probability: 'rare',
    impact: 'low',
    evidenceBasis: 'measured',
    ratingLabel: 'sustainable',
    ratingScore: 0.25
  }
];

const stage2OpportunityFixtures = [
  {
    opportunityCode: 'climate_transition_opportunity',
    applicable: true,
    likelihood: 'likely',
    impact: 'significant',
    evidenceBasis: 'estimated',
    ratingLabel: 'great',
    ratingScore: 2.25
  },
  {
    opportunityCode: 'water_reputation_opportunity',
    applicable: false,
    likelihood: 'na',
    impact: 'na',
    evidenceBasis: 'assumed',
    ratingLabel: 'neutral',
    ratingScore: 0
  },
  {
    opportunityCode: 'biodiversity_reputation_opportunity',
    applicable: true,
    likelihood: 'likely',
    impact: 'low',
    evidenceBasis: 'estimated',
    ratingLabel: 'sustainable',
    ratingScore: 0.75
  },
  {
    opportunityCode: 'circular_efficiency_opportunity',
    applicable: true,
    likelihood: 'could_occur',
    impact: 'low',
    evidenceBasis: 'estimated',
    ratingLabel: 'reasonable',
    ratingScore: 0.5
  },
  {
    opportunityCode: 'community_reputation_opportunity',
    applicable: false,
    likelihood: 'na',
    impact: 'na',
    evidenceBasis: 'assumed',
    ratingLabel: 'neutral',
    ratingScore: 0
  },
  {
    opportunityCode: 'governance_trust_opportunity',
    applicable: false,
    likelihood: 'na',
    impact: 'na',
    evidenceBasis: 'assumed',
    ratingLabel: 'neutral',
    ratingScore: 0
  }
];

async function buildHash(password) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: Number(process.env.ARGON2_MEMORY_COST ?? '19456')
  });
}

function isSerializableConflict(error) {
  return Boolean(
    error && typeof error === 'object' && 'code' in error && ['P2002', 'P2034'].includes(error.code)
  );
}

async function runSerializableRetry(label, callback, maxAttempts = 4) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await prisma.$transaction(callback, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      });
    } catch (error) {
      if (isSerializableConflict(error) && attempt < maxAttempts) {
        continue;
      }

      if (isSerializableConflict(error)) {
        throw new Error(`Failed to complete ${label} after ${maxAttempts} serializable attempts.`);
      }

      throw error;
    }
  }

  throw new Error(`Failed to complete ${label}.`);
}

async function ensureBootstrapOwner(ownerSeed) {
  const passwordHash = await buildHash(ownerSeed.password);

  return runSerializableRetry('bootstrap owner provisioning', async (transaction) => {
    const bootstrapState = await transaction.bootstrapState.findUnique({
      where: { id: bootstrapStateId },
      include: {
        bootstrapOwner: true
      }
    });

    if (bootstrapState) {
      if (bootstrapState.bootstrapOwner.email !== ownerSeed.email) {
        throw new Error(
          `Bootstrap owner mismatch. Existing bootstrap owner is ${bootstrapState.bootstrapOwner.email}, but SEED_OWNER_EMAIL is ${ownerSeed.email}.`
        );
      }

      return {
        owner: bootstrapState.bootstrapOwner,
        bootstrapStatus: 'existing'
      };
    }

    let owner = await transaction.user.findUnique({
      where: { email: ownerSeed.email }
    });

    if (!owner) {
      owner = await transaction.user.create({
        data: {
          email: ownerSeed.email,
          name: ownerSeed.name,
          role: ownerSeed.role,
          passwordHash
        }
      });
    } else {
      owner = await transaction.user.update({
        where: { id: owner.id },
        data: {
          name: ownerSeed.name,
          role: 'owner',
          passwordHash
        }
      });
    }

    await transaction.bootstrapState.create({
      data: {
        id: bootstrapStateId,
        bootstrapOwnerId: owner.id
      }
    });

    return {
      owner,
      bootstrapStatus: 'created'
    };
  });
}

async function upsertSeedUser(seedUser) {
  if (seedUser.role === 'owner') {
    throw new Error('upsertSeedUser should not be used for owner bootstrap.');
  }

  const passwordHash = await buildHash(seedUser.password);

  return prisma.user.upsert({
    where: { email: seedUser.email },
    create: {
      email: seedUser.email,
      name: seedUser.name,
      role: seedUser.role,
      passwordHash
    },
    update: {
      name: seedUser.name,
      role: seedUser.role,
      passwordHash
    }
  });
}

async function main() {
  if (dryRun) {
    await buildHash('dry-run-check-password');
    console.log('Seed dry run completed.');
    return;
  }

  const [ownerSeed, ...otherSeedUsers] = roleDefaults;
  const { owner, bootstrapStatus } = await ensureBootstrapOwner(ownerSeed);

  for (const seedUser of otherSeedUsers) {
    await upsertSeedUser(seedUser);
  }

  const [adminUser, memberUser] = await Promise.all([
    prisma.user.findUnique({ where: { email: 'admin@example.com' } }),
    prisma.user.findUnique({ where: { email: 'member@example.com' } })
  ]);

  if (!adminUser || !memberUser) {
    throw new Error('Seed users were not created correctly.');
  }

  const organization = await prisma.organization.upsert({
    where: { slug: 'zeeus-ifas-platform' },
    create: {
      slug: 'zeeus-ifas-platform',
      name: 'ZEEUS IfaS Platform',
      description:
        'Institutional home for the ZEEUS sustainability-by-design platform, covering founder workflow and partner review flows.',
      websiteUrl: 'https://zeeus.org'
    },
    update: {
      name: 'ZEEUS IfaS Platform',
      description:
        'Institutional home for the ZEEUS sustainability-by-design platform, covering founder workflow and partner review flows.',
      websiteUrl: 'https://zeeus.org'
    }
  });

  for (const [user, role] of [
    [owner, 'owner'],
    [adminUser, 'reviewer'],
    [memberUser, 'member']
  ]) {
    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: user.id
        }
      },
      create: {
        organizationId: organization.id,
        userId: user.id,
        role
      },
      update: {
        role
      }
    });
  }

  await prisma.organizationInvitation.upsert({
    where: {
      id: `invite:${organization.id}:reviewer`
    },
    create: {
      id: `invite:${organization.id}:reviewer`,
      organizationId: organization.id,
      email: 'reviewer@example.com',
      role: 'reviewer',
      status: 'pending'
    },
    update: {
      email: 'reviewer@example.com',
      role: 'reviewer',
      status: 'pending'
    }
  });

  const program = await prisma.program.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: 'zeeus-sustainability-cohort-2026'
      }
    },
    create: {
      organizationId: organization.id,
      slug: 'zeeus-sustainability-cohort-2026',
      name: 'ZEEUS Sustainability Cohort 2026',
      summary:
        'Program workspace for startup enrollment, reviewer assignment, and official co-branded outputs.',
      description:
        'This seeded program shows how the partner console can manage cohort oversight, startup submissions, reviewer workflows, and official outputs while keeping deterministic scoring immutable.',
      publicBlurb:
        'Enroll startups, review saved revisions, and coordinate evidence-backed sustainability improvement.',
      cohortLabel: 'Spring 2026',
      status: 'active',
      isPublic: true,
      primaryLabel: 'ZEEUS',
      partnerLabel: 'IfaS / Trier University of Applied Sciences',
      coBrandingLabel: 'Supported within the wider ZEEUS innovation and sustainability ecosystem',
      watermarkLabel: 'Programme review watermark'
    },
    update: {
      name: 'ZEEUS Sustainability Cohort 2026',
      summary:
        'Program workspace for startup enrollment, reviewer assignment, and official co-branded outputs.',
      description:
        'This seeded program shows how the partner console can manage cohort oversight, startup submissions, reviewer workflows, and official outputs while keeping deterministic scoring immutable.',
      publicBlurb:
        'Enroll startups, review saved revisions, and coordinate evidence-backed sustainability improvement.',
      cohortLabel: 'Spring 2026',
      status: 'active',
      isPublic: true,
      primaryLabel: 'ZEEUS',
      partnerLabel: 'IfaS / Trier University of Applied Sciences',
      coBrandingLabel: 'Supported within the wider ZEEUS innovation and sustainability ecosystem',
      watermarkLabel: 'Programme review watermark'
    }
  });

  for (const [user, role] of [
    [owner, 'manager'],
    [adminUser, 'reviewer'],
    [memberUser, 'member']
  ]) {
    await prisma.programMember.upsert({
      where: {
        programId_userId: {
          programId: program.id,
          userId: user.id
        }
      },
      create: {
        programId: program.id,
        userId: user.id,
        role
      },
      update: {
        role
      }
    });
  }

  for (const stage of stageCatalog) {
    for (const sdgNumber of stage.sdgs) {
      await prisma.sdgMapping.upsert({
        where: {
          id: `stage:${stage.stage}:${sdgNumber}`
        },
        create: {
          id: `stage:${stage.stage}:${sdgNumber}`,
          sourceType: 'stage',
          startupStage: stage.stage,
          sdgNumber,
          sdgName: `SDG ${sdgNumber}`
        },
        update: {
          startupStage: stage.stage,
          sdgNumber,
          sdgName: `SDG ${sdgNumber}`
        }
      });
    }
  }

  for (const nace of naceCatalog) {
    for (const sdgNumber of nace.sdgs) {
      await prisma.sdgMapping.upsert({
        where: {
          id: `business:${nace.code}:${sdgNumber}`
        },
        create: {
          id: `business:${nace.code}:${sdgNumber}`,
          sourceType: 'business',
          naceDivisionCode: nace.code,
          naceDivisionLabel: `${nace.code} ${nace.division}`,
          sdgNumber,
          sdgName: `SDG ${sdgNumber}`
        },
        update: {
          naceDivisionCode: nace.code,
          naceDivisionLabel: `${nace.code} ${nace.division}`,
          sdgNumber,
          sdgName: `SDG ${sdgNumber}`
        }
      });
    }
  }

  for (const topic of topicCatalog) {
    for (const severityBand of ['relevant', 'high_priority']) {
      await prisma.recommendationTemplate.upsert({
        where: {
          code_recommendationType_severityBand: {
            code: topic.topicCode,
            recommendationType: 'stage1',
            severityBand
          }
        },
        create: {
          code: topic.topicCode,
          recommendationType: 'stage1',
          severityBand,
          title: topic.title,
          text: topic.guidance
        },
        update: {
          title: topic.title,
          text: topic.guidance
        }
      });
    }
  }

  for (const risk of riskCatalog) {
    await prisma.recommendationTemplate.upsert({
      where: {
        code_recommendationType_severityBand: {
          code: risk.riskCode,
          recommendationType: 'risk',
          severityBand: 'default'
        }
      },
      create: {
        code: risk.riskCode,
        recommendationType: 'risk',
        severityBand: 'default',
        title: risk.title,
        text: risk.guidance
      },
      update: {
        title: risk.title,
        text: risk.guidance
      }
    });
  }

  for (const opportunity of opportunityCatalog) {
    await prisma.recommendationTemplate.upsert({
      where: {
        code_recommendationType_severityBand: {
          code: opportunity.opportunityCode,
          recommendationType: 'opportunity',
          severityBand: 'default'
        }
      },
      create: {
        code: opportunity.opportunityCode,
        recommendationType: 'opportunity',
        severityBand: 'default',
        title: opportunity.title,
        text: opportunity.guidance
      },
      update: {
        title: opportunity.title,
        text: opportunity.guidance
      }
    });
  }

  for (const template of financialRecommendationTemplates) {
    await prisma.recommendationTemplate.upsert({
      where: {
        code_recommendationType_severityBand: {
          code: template.code,
          recommendationType: template.recommendationType,
          severityBand: template.severityBand
        }
      },
      create: template,
      update: {
        title: template.title,
        text: template.text
      }
    });
  }

  const existingEvaluation = await prisma.evaluation.findFirst({
    where: {
      userId: owner.id,
      name: evaluationFixture.name
    }
  });

  const evaluation =
    existingEvaluation ??
    (await prisma.evaluation.create({
      data: {
        userId: owner.id,
        organizationId: organization.id,
        ...evaluationFixture
      }
    }));

  await prisma.evaluation.update({
    where: { id: evaluation.id },
    data: {
      organizationId: organization.id,
      ...evaluationFixture
    }
  });

  const seededEvaluation = await prisma.evaluation.findUnique({
    where: { id: evaluation.id }
  });

  if (!seededEvaluation) {
    throw new Error('Seed evaluation could not be reloaded.');
  }

  await prisma.stage1FinancialAnswer.upsert({
    where: { evaluationId: evaluation.id },
    create: {
      evaluationId: evaluation.id,
      ...stage1FinancialFixture
    },
    update: stage1FinancialFixture
  });

  for (const topic of stage1TopicFixtures) {
    await prisma.stage1TopicAnswer.upsert({
      where: {
        evaluationId_topicCode: {
          evaluationId: evaluation.id,
          topicCode: topic.topicCode
        }
      },
      create: {
        evaluationId: evaluation.id,
        ...topic
      },
      update: topic
    });
  }

  for (const risk of stage2RiskFixtures) {
    await prisma.stage2RiskAnswer.upsert({
      where: {
        evaluationId_riskCode: {
          evaluationId: evaluation.id,
          riskCode: risk.riskCode
        }
      },
      create: {
        evaluationId: evaluation.id,
        ...risk
      },
      update: risk
    });
  }

  for (const opportunity of stage2OpportunityFixtures) {
    await prisma.stage2OpportunityAnswer.upsert({
      where: {
        evaluationId_opportunityCode: {
          evaluationId: evaluation.id,
          opportunityCode: opportunity.opportunityCode
        }
      },
      create: {
        evaluationId: evaluation.id,
        ...opportunity
      },
      update: opportunity
    });
  }

  const mediaAssetIdsBySlug = new Map();

  for (const asset of siteMediaAssets) {
    const fileBuffer = readRepoFile(asset.filePath);
    const mediaAsset = await prisma.mediaAsset.upsert({
      where: { slug: asset.slug },
      create: {
        slug: asset.slug,
        title: asset.title,
        altText: asset.altText,
        caption: null,
        attribution: null,
        rights: 'Use according to approved ZEEUS identity guidance.',
        mimeType:
          path.extname(asset.filePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg',
        fileName: path.basename(asset.filePath),
        byteSize: fileBuffer.byteLength,
        publicUrl: asset.publicUrl,
        locale: asset.locale,
        status: asset.status
      },
      update: {
        title: asset.title,
        altText: asset.altText,
        rights: 'Use according to approved ZEEUS identity guidance.',
        fileName: path.basename(asset.filePath),
        byteSize: fileBuffer.byteLength,
        publicUrl: asset.publicUrl,
        locale: asset.locale,
        status: asset.status
      }
    });

    mediaAssetIdsBySlug.set(asset.slug, mediaAsset.id);
  }

  for (const setting of siteSettings) {
    await prisma.siteSetting.upsert({
      where: {
        key_locale: {
          key: setting.key,
          locale: setting.locale
        }
      },
      create: setting,
      update: {
        title: setting.title,
        description: setting.description,
        value: setting.value
      }
    });
  }

  for (const page of sitePages) {
    const heroMediaAssetId = page.heroMediaSlug
      ? (mediaAssetIdsBySlug.get(page.heroMediaSlug) ?? null)
      : null;

    await prisma.sitePage.upsert({
      where: {
        slug_locale: {
          slug: page.slug,
          locale: page.locale
        }
      },
      create: {
        slug: page.slug,
        locale: page.locale,
        title: page.title,
        summary: page.summary,
        pageType: page.pageType,
        status: page.status,
        heroEyebrow: page.heroEyebrow ?? null,
        heroTitle: page.heroTitle ?? null,
        heroBody: page.heroBody ?? null,
        heroPrimaryCtaLabel: page.heroPrimaryCtaLabel ?? null,
        heroPrimaryCtaHref: page.heroPrimaryCtaHref ?? null,
        heroSecondaryCtaLabel: page.heroSecondaryCtaLabel ?? null,
        heroSecondaryCtaHref: page.heroSecondaryCtaHref ?? null,
        heroMediaAssetId,
        navigationLabel: page.navigationLabel ?? null,
        navigationGroup: page.navigationGroup ?? null,
        showInPrimaryNav: Boolean(page.showInPrimaryNav),
        showInFooter: Boolean(page.showInFooter),
        canonicalUrl: page.canonicalUrl ?? null,
        seoTitle: page.seoTitle ?? null,
        seoDescription: page.seoDescription ?? null,
        sections: page.sections,
        sortOrder: page.sortOrder
      },
      update: {
        title: page.title,
        summary: page.summary,
        pageType: page.pageType,
        status: page.status,
        heroEyebrow: page.heroEyebrow,
        heroTitle: page.heroTitle,
        heroBody: page.heroBody,
        heroPrimaryCtaLabel: page.heroPrimaryCtaLabel ?? null,
        heroPrimaryCtaHref: page.heroPrimaryCtaHref ?? null,
        heroSecondaryCtaLabel: page.heroSecondaryCtaLabel ?? null,
        heroSecondaryCtaHref: page.heroSecondaryCtaHref ?? null,
        heroMediaAssetId,
        navigationLabel: page.navigationLabel ?? null,
        navigationGroup: page.navigationGroup ?? null,
        showInPrimaryNav: Boolean(page.showInPrimaryNav),
        showInFooter: Boolean(page.showInFooter),
        canonicalUrl: page.canonicalUrl ?? null,
        seoTitle: page.seoTitle ?? null,
        seoDescription: page.seoDescription ?? null,
        sections: page.sections,
        sortOrder: page.sortOrder
      }
    });
  }

  for (const article of knowledgeArticles) {
    await prisma.knowledgeArticle.upsert({
      where: { slug: article.slug },
      create: article,
      update: {
        title: article.title,
        summary: article.summary,
        body: article.body,
        category: article.category,
        status: article.status,
        locale: article.locale,
        heroImageUrl: article.heroImageUrl,
        sortOrder: article.sortOrder
      }
    });
  }

  for (const entry of faqEntries) {
    await prisma.faqEntry.upsert({
      where: {
        id: `${entry.category}:${entry.sortOrder}`
      },
      create: {
        id: `${entry.category}:${entry.sortOrder}`,
        ...entry
      },
      update: {
        question: entry.question,
        answer: entry.answer,
        category: entry.category,
        status: entry.status,
        locale: entry.locale,
        sortOrder: entry.sortOrder
      }
    });
  }

  for (const study of caseStudies) {
    await prisma.caseStudy.upsert({
      where: { slug: study.slug },
      create: study,
      update: {
        title: study.title,
        startupName: study.startupName,
        summary: study.summary,
        story: study.story,
        stage: study.stage,
        naceDivision: study.naceDivision,
        status: study.status,
        locale: study.locale,
        heroImageUrl: study.heroImageUrl,
        sortOrder: study.sortOrder
      }
    });
  }

  for (const [index, target] of sdgTargetFixtures.entries()) {
    await prisma.sdgTarget.upsert({
      where: {
        id: `${target.goalNumber}:${target.targetCode}`
      },
      create: {
        id: `${target.goalNumber}:${target.targetCode}`,
        ...target,
        status: 'published',
        locale: 'en',
        sortOrder: (index + 1) * 10
      },
      update: {
        goalTitle: target.goalTitle,
        goalSummary: target.goalSummary,
        title: target.title,
        description: target.description,
        officialUrl: target.officialUrl,
        status: 'published',
        locale: 'en',
        sortOrder: (index + 1) * 10
      }
    });
  }

  await prisma.knowledgeArticle.deleteMany({
    where: {
      slug: 'resources-downloads'
    }
  });

  for (const asset of resourceAssets) {
    const buffer = readRepoFile(asset.sourceRelativePath);
    const storageKey = buildSeedStorageKey(buffer, asset.fileName, 'content-resources');
    writeSeededObject(storageKey, buffer);

    await prisma.resourceAsset.upsert({
      where: { slug: asset.slug },
      create: {
        id: asset.id,
        slug: asset.slug,
        title: asset.title,
        description: asset.description,
        category: asset.category,
        fileLabel: asset.fileLabel,
        status: asset.status,
        locale: asset.locale,
        externalUrl: asset.externalUrl,
        storageKey,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        byteSize: buffer.byteLength,
        sortOrder: asset.sortOrder
      },
      update: {
        title: asset.title,
        description: asset.description,
        category: asset.category,
        fileLabel: asset.fileLabel,
        status: asset.status,
        locale: asset.locale,
        externalUrl: asset.externalUrl,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        storageKey,
        byteSize: buffer.byteLength,
        sortOrder: asset.sortOrder
      }
    });
  }

  for (const evidence of evidenceFixtures) {
    await prisma.evidenceAsset.upsert({
      where: {
        id: `${evaluation.id}:${evidence.title}`
      },
      create: {
        id: `${evaluation.id}:${evidence.title}`,
        evaluationId: seededEvaluation.id,
        revisionId: seededEvaluation.currentRevisionId,
        kind: evidence.kind,
        title: evidence.title,
        description: evidence.description,
        sourceUrl: evidence.sourceUrl,
        ownerName: evidence.ownerName,
        sourceDate: evidence.sourceDate ? new Date(evidence.sourceDate) : null,
        evidenceBasis: evidence.evidenceBasis,
        confidenceWeight: evidence.confidenceWeight,
        linkedTopicCode: evidence.linkedTopicCode,
        linkedRecommendationId: evidence.linkedRecommendationId,
        createdByUserId: owner.id
      },
      update: {
        revisionId: seededEvaluation.currentRevisionId,
        kind: evidence.kind,
        title: evidence.title,
        description: evidence.description,
        sourceUrl: evidence.sourceUrl,
        ownerName: evidence.ownerName,
        sourceDate: evidence.sourceDate ? new Date(evidence.sourceDate) : null,
        evidenceBasis: evidence.evidenceBasis,
        confidenceWeight: evidence.confidenceWeight,
        linkedTopicCode: evidence.linkedTopicCode,
        linkedRecommendationId: evidence.linkedRecommendationId,
        createdByUserId: owner.id
      }
    });
  }

  for (const scenario of scenarioFixtures) {
    await prisma.scenarioRun.upsert({
      where: {
        id: `${evaluation.id}:${scenario.name}`
      },
      create: {
        id: `${evaluation.id}:${scenario.name}`,
        evaluationId: seededEvaluation.id,
        baseRevisionId: seededEvaluation.currentRevisionId,
        baseRevisionNumber: seededEvaluation.currentRevisionNumber,
        name: scenario.name,
        status: 'draft',
        focusArea: scenario.focusArea,
        geography: scenario.geography,
        dependency: scenario.dependency,
        timeframe: scenario.timeframe,
        hypothesis: scenario.hypothesis,
        advisorySummary: scenario.advisorySummary,
        assumptions: {
          financialDelta: 0.5,
          riskDelta: 0.25,
          opportunityDelta: 0.5,
          confidenceShift: 'same',
          impactedTopicCodes: ['E1', 'E5']
        },
        metricDeltas: [],
        topicDeltas: [],
        projectedConfidenceBand: evaluationFixture.confidenceBand,
        takeaways: ['Seeded scenario for founder-side advisory comparison.'],
        createdByUserId: owner.id
      },
      update: {
        baseRevisionId: seededEvaluation.currentRevisionId,
        baseRevisionNumber: seededEvaluation.currentRevisionNumber,
        name: scenario.name,
        status: 'draft',
        focusArea: scenario.focusArea,
        geography: scenario.geography,
        dependency: scenario.dependency,
        timeframe: scenario.timeframe,
        hypothesis: scenario.hypothesis,
        advisorySummary: scenario.advisorySummary,
        assumptions: {
          financialDelta: 0.5,
          riskDelta: 0.25,
          opportunityDelta: 0.5,
          confidenceShift: 'same',
          impactedTopicCodes: ['E1', 'E5']
        },
        metricDeltas: [],
        topicDeltas: [],
        projectedConfidenceBand: evaluationFixture.confidenceBand,
        takeaways: ['Seeded scenario for founder-side advisory comparison.'],
        createdByUserId: owner.id
      }
    });
  }

  const seededSubmission = await prisma.programSubmission.upsert({
    where: {
      id: `${program.id}:${evaluation.id}`
    },
    create: {
      id: `${program.id}:${evaluation.id}`,
      programId: program.id,
      organizationId: organization.id,
      evaluationId: seededEvaluation.id,
      revisionId: seededEvaluation.currentRevisionId ?? seededEvaluation.id,
      revisionNumber: Math.max(seededEvaluation.currentRevisionNumber, 1),
      status: 'in_review',
      submittedAt: new Date('2026-03-25T09:00:00.000Z'),
      lastReviewedAt: new Date('2026-03-28T14:00:00.000Z')
    },
    update: {
      revisionId: seededEvaluation.currentRevisionId ?? seededEvaluation.id,
      revisionNumber: Math.max(seededEvaluation.currentRevisionNumber, 1),
      status: 'in_review',
      submittedAt: new Date('2026-03-25T09:00:00.000Z'),
      lastReviewedAt: new Date('2026-03-28T14:00:00.000Z')
    }
  });

  await prisma.reviewAssignment.upsert({
    where: {
      id: `assignment:${seededSubmission.id}:${adminUser.id}`
    },
    create: {
      id: `assignment:${seededSubmission.id}:${adminUser.id}`,
      submissionId: seededSubmission.id,
      reviewerUserId: adminUser.id,
      status: 'in_review',
      dueAt: new Date('2026-04-18T12:00:00.000Z')
    },
    update: {
      reviewerUserId: adminUser.id,
      status: 'in_review',
      dueAt: new Date('2026-04-18T12:00:00.000Z')
    }
  });

  await prisma.reviewComment.upsert({
    where: {
      id: `comment:${seededSubmission.id}:1`
    },
    create: {
      id: `comment:${seededSubmission.id}:1`,
      submissionId: seededSubmission.id,
      authorUserId: adminUser.id,
      body: 'The deterministic result is sound. Please strengthen evidence for supplier assumptions and clarify the governance controls before formal approval.'
    },
    update: {
      authorUserId: adminUser.id,
      body: 'The deterministic result is sound. Please strengthen evidence for supplier assumptions and clarify the governance controls before formal approval.'
    }
  });

  console.log(`Seed complete. Owner email: ${owner.email}. Bootstrap state: ${bootstrapStatus}.`);
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
