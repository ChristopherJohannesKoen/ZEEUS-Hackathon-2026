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
        ...evaluationFixture
      }
    }));

  await prisma.evaluation.update({
    where: { id: evaluation.id },
    data: {
      ...evaluationFixture
    }
  });

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
