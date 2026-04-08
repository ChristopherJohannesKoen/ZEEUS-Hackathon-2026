import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { Prisma, PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');
const bootstrapStateId = 1;
const seedFilePath = fileURLToPath(import.meta.url);
const seedDir = path.dirname(seedFilePath);

function readCatalogJson(relativePath) {
  return JSON.parse(readFileSync(path.resolve(seedDir, '..', relativePath), 'utf8'));
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
    body:
      'ZEEUS starts with startup context, moves through the Stage I inside-out assessment, then Stage II risks and opportunities, and finishes with impact summary, SDG alignment, dashboard, and report outputs. The workflow is intentionally guidance-oriented, not judgment-oriented. Founders are encouraged to use reasonable qualitative inputs early, then strengthen them with evidence over time.',
    category: 'how_it_works',
    sortOrder: 10
  },
  {
    slug: 'methodology',
    title: 'Methodology and scoring logic',
    summary:
      'Deterministic workbook-parity scoring remains the canonical engine behind the platform.',
    body:
      'Stage I combines financial indicators with environmental, social, and governance impact topics. Stage II applies probability and impact matrices for risks and opportunities. Relevant topics are surfaced from 2.0 upward, while high-priority topics start at 2.5. The platform preserves deterministic scoring and treats AI as an explanatory layer only.',
    category: 'methodology',
    sortOrder: 20
  },
  {
    slug: 'sdg-esrs-explainer',
    title: 'SDGs, ESRS, and double materiality',
    summary:
      'The SDGs act as a map, while the assessment logic borrows from double-materiality thinking to keep startup decisions practical.',
    body:
      'The platform uses startup stage and business category to suggest likely SDG relevance, then refines that view through assessment logic. This keeps the SDGs useful as a directional map instead of a compliance checklist. The approach also reflects double materiality by looking at inside-out impacts and outside-in risks and opportunities.',
    category: 'sdg_esrs',
    sortOrder: 30
  },
  {
    slug: 'partner-programs',
    title: 'Partner and program workflows',
    summary:
      'Programs can enroll startups, request submissions, assign reviewers, and track evidence-backed improvement over time.',
    body:
      'ZEEUS now supports dual-audience delivery. Founders can run evaluations and evidence workflows, while partners can manage programs, submissions, reviewer assignments, and official outputs. Evaluation lifecycle and program review lifecycle remain separate so canonical scoring is never altered by reviewers.',
    category: 'partner',
    sortOrder: 40
  },
  {
    slug: 'contact-support',
    title: 'Support and onboarding',
    summary:
      'Use the knowledge base, FAQ, and partner support channels to onboard new teams without losing methodological consistency.',
    body:
      'ZEEUS is designed to be explainable and reproducible. The public site provides plain-language guidance, while the workspace offers tooltips, scenario notes, evidence prompts, and reporting outputs. Partners can use branded program pages and reviewer workflows to coordinate startup support.',
    category: 'contact',
    sortOrder: 50
  }
];

const faqEntries = [
  {
    question: 'Is ZEEUS a judgment tool?',
    answer:
      'No. It is a guidance tool designed to help startups identify material issues early and make better design decisions before scaling.',
    category: 'principles',
    sortOrder: 10
  },
  {
    question: 'Do the SDGs work like a checklist?',
    answer:
      'No. The SDGs are treated as a map and early compass reading. Final relevance is refined by the full assessment workflow.',
    category: 'methodology',
    sortOrder: 20
  },
  {
    question: 'Can early-stage teams use qualitative inputs?',
    answer:
      'Yes. Qualitative judgments are valid early on, as long as teams are explicit about assumptions and improve evidence quality over time.',
    category: 'methodology',
    sortOrder: 30
  },
  {
    question: 'What is the difference between relevant and high priority?',
    answer:
      'Scores from 2.0 to below 2.5 are surfaced as relevant. Scores from 2.5 upward are surfaced as high priority.',
    category: 'scores',
    sortOrder: 40
  },
  {
    question: 'Does AI change the deterministic score?',
    answer:
      'No. AI is advisory only. It can explain outputs, highlight evidence gaps, and summarize findings, but it never alters canonical scoring.',
    category: 'ai',
    sortOrder: 50
  },
  {
    question: 'Can programs review startup submissions without changing the result?',
    answer:
      'Yes. Reviewers work on top of immutable revision snapshots. They can comment, request changes, or approve submissions without mutating the saved scoring outputs.',
    category: 'programs',
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
    sortOrder: 20
  }
];

const resourceAssets = [
  {
    id: 'resource-user-manual',
    title: 'User manual',
    description: 'Step-by-step description of the workflow, scoring logic, outputs, and dashboard.',
    category: 'manual',
    href: '/resources#user-manual',
    fileLabel: 'PDF guide'
  },
  {
    id: 'resource-faq',
    title: 'FAQ',
    description: 'Plain-language answers on methodology, SDGs, and qualitative startup inputs.',
    category: 'faq',
    href: '/faq',
    fileLabel: 'FAQ page'
  },
  {
    id: 'resource-methodology',
    title: 'Methodology note',
    description: 'Short explanation of deterministic scoring and the relevant vs high-priority split.',
    category: 'methodology',
    href: '/methodology',
    fileLabel: 'Method note'
  },
  {
    id: 'resource-sample-report',
    title: 'Sample report walkthrough',
    description: 'Overview of how dashboard and report outputs should be read and presented.',
    category: 'sample_report',
    href: '/how-it-works',
    fileLabel: 'Walkthrough'
  },
  {
    id: 'resource-workflow-assets',
    title: 'Workflow assets',
    description: 'Reference materials, explainer content, and onboarding prompts for programs.',
    category: 'workflow_asset',
    href: '/partners',
    fileLabel: 'Partner pack'
  }
];

const sdgTargetFixtures = [
  {
    goalNumber: 6,
    goalTitle: 'Clean Water and Sanitation',
    goalSummary: 'Protect water resources, sanitation access, and responsible water use.',
    targetCode: '6.3',
    title: 'Improve water quality',
    description: 'Reduce pollution, minimise hazardous releases, and increase safe treatment and reuse.',
    officialUrl: 'https://sdgs.un.org/goals/goal6'
  },
  {
    goalNumber: 6,
    goalTitle: 'Clean Water and Sanitation',
    goalSummary: 'Protect water resources, sanitation access, and responsible water use.',
    targetCode: '6.4',
    title: 'Increase water-use efficiency',
    description: 'Improve efficiency across sectors and strengthen resilience against water scarcity.',
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
    description: 'Prioritise prevention, reduction, recycling, and reuse throughout the value chain.',
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
    where: { slug: 'zeeus-demo-studio' },
    create: {
      slug: 'zeeus-demo-studio',
      name: 'ZEEUS Demo Studio',
      description:
        'Demo organization for the dual-audience ZEEUS platform, covering founder workflow and partner review flows.',
      websiteUrl: 'https://zeeus.example.com'
    },
    update: {
      name: 'ZEEUS Demo Studio',
      description:
        'Demo organization for the dual-audience ZEEUS platform, covering founder workflow and partner review flows.',
      websiteUrl: 'https://zeeus.example.com'
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
        slug: 'zeeus-partner-cohort-2026'
      }
    },
    create: {
      organizationId: organization.id,
      slug: 'zeeus-partner-cohort-2026',
      name: 'ZEEUS Partner Cohort 2026',
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
      partnerLabel: 'KIC Demo Partner',
      coBrandingLabel: 'EU Co-branding placeholder',
      watermarkLabel: 'Partner review watermark'
    },
    update: {
      name: 'ZEEUS Partner Cohort 2026',
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
      partnerLabel: 'KIC Demo Partner',
      coBrandingLabel: 'EU Co-branding placeholder',
      watermarkLabel: 'Partner review watermark'
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

  for (const article of knowledgeArticles) {
    await prisma.knowledgeArticle.upsert({
      where: { slug: article.slug },
      create: article,
      update: {
        title: article.title,
        summary: article.summary,
        body: article.body,
        category: article.category,
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
        sortOrder: (index + 1) * 10
      },
      update: {
        goalTitle: target.goalTitle,
        goalSummary: target.goalSummary,
        title: target.title,
        description: target.description,
        officialUrl: target.officialUrl,
        sortOrder: (index + 1) * 10
      }
    });
  }

  const resourceList = resourceAssets.map((asset) => ({
    ...asset,
    updatedAt: new Date().toISOString()
  }));

  await prisma.knowledgeArticle.upsert({
    where: { slug: 'resources-downloads' },
    create: {
      slug: 'resources-downloads',
      title: 'Resources and downloads',
      summary: 'Download-center metadata for manuals, FAQs, methodology notes, and sample assets.',
      body: JSON.stringify(resourceList),
      category: 'how_it_works',
      sortOrder: 60
    },
    update: {
      title: 'Resources and downloads',
      summary: 'Download-center metadata for manuals, FAQs, methodology notes, and sample assets.',
      body: JSON.stringify(resourceList),
      category: 'how_it_works',
      sortOrder: 60
    }
  });

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
        name: scenario.name,
        status: 'draft',
        focusArea: scenario.focusArea,
        geography: scenario.geography,
        dependency: scenario.dependency,
        timeframe: scenario.timeframe,
        hypothesis: scenario.hypothesis,
        advisorySummary: scenario.advisorySummary,
        assumptions: {
          comparisonMode: 'advisory_only',
          confidenceBand: evaluationFixture.confidenceBand
        },
        createdByUserId: owner.id
      },
      update: {
        baseRevisionId: seededEvaluation.currentRevisionId,
        name: scenario.name,
        status: 'draft',
        focusArea: scenario.focusArea,
        geography: scenario.geography,
        dependency: scenario.dependency,
        timeframe: scenario.timeframe,
        hypothesis: scenario.hypothesis,
        advisorySummary: scenario.advisorySummary,
        assumptions: {
          comparisonMode: 'advisory_only',
          confidenceBand: evaluationFixture.confidenceBand
        },
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
      body:
        'The deterministic result is sound. Please strengthen evidence for supplier assumptions and clarify the governance controls before formal approval.'
    },
    update: {
      authorUserId: adminUser.id,
      body:
        'The deterministic result is sound. Please strengthen evidence for supplier assumptions and clarify the governance controls before formal approval.'
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
