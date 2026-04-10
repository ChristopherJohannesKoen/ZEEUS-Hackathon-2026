import type {
  ConfidenceBand,
  DashboardResponse,
  EvaluationContextPayload,
  FinancialIndicatorResult,
  ImpactSummaryResponse,
  ImpactDimensionLevel,
  ImpactLikelihoodLevel,
  MatrixLegend,
  MatrixLegendEntry,
  MaterialTopicSummary,
  OpportunityCode,
  OpportunityRatingLabel,
  PriorityBand,
  Recommendation,
  ReportResponse,
  RiskCode,
  RiskProbabilityLevel,
  RiskRatingLabel,
  SdgReference,
  ScoreInterpretationBand,
  ScoreInterpretationGuide,
  SdgSourceType,
  Stage1FinancialAnswer,
  Stage1FinancialAnswersPayload,
  Stage1TopicAnswer,
  Stage1TopicAnswerInput,
  Stage2OpportunityAnswer,
  Stage2OpportunityAnswerInput,
  Stage2RiskAnswer,
  Stage2RiskAnswerInput,
  StageSdgSummary,
  StartupStage,
  TopicCode
} from '@packages/shared';
import stageCatalog from '../catalog/stage-sdgs.json';
import naceCatalog from '../catalog/nace-sdgs.json';
import matrices from '../catalog/matrices.json';
import topicCatalog from '../catalog/topics.json';
import riskCatalog from '../catalog/risks.json';
import opportunityCatalog from '../catalog/opportunities.json';
import benchmarkBaselines from '../catalog/benchmark-baselines.json';
import businessCategories from '../catalog/business-categories.json';
import extendedNaceCatalog from '../catalog/extended-nace.json';
import workbookGuidance from '../catalog/workbook-guidance.json';
import workbookSnapshot from '../catalog/workbook-snapshot.json';

type StageCatalogEntry = (typeof stageCatalog)[number];
type TopicCatalogEntry = (typeof topicCatalog)[number];
type RiskCatalogEntry = (typeof riskCatalog)[number];
type OpportunityCatalogEntry = (typeof opportunityCatalog)[number];
type BusinessCategoryCatalogEntry = (typeof businessCategories)[number];
type ExtendedNaceCatalogEntry = (typeof extendedNaceCatalog)[number];
type BenchmarkBaselines = typeof benchmarkBaselines;

const workbookFileName =
  workbookSnapshot.workbookPath.split(/[/\\]/).filter(Boolean).pop() ?? 'workbook-catalog';

export const SCORING_VERSION = '2026.04.ready-software.2';
export const CATALOG_VERSION = workbookFileName;

export function getScoringVersionInfo() {
  return {
    scoringVersion: SCORING_VERSION,
    catalogVersion: CATALOG_VERSION
  };
}

export function getReferenceMetadata() {
  return {
    scoringVersion: SCORING_VERSION,
    catalogVersion: CATALOG_VERSION,
    workbookPath: workbookSnapshot.workbookPath,
    workbookSha256: workbookSnapshot.workbookSha256,
    extractedAt: workbookSnapshot.generatedAt,
    sheetCount: Array.isArray(workbookSnapshot.sheetNames) ? workbookSnapshot.sheetNames.length : 0
  };
}

const stageCatalogByKey = new Map<StartupStage, StageCatalogEntry>(
  stageCatalog.map((entry) => [entry.stage as StartupStage, entry])
);
const topicCatalogByCode = new Map<TopicCode, TopicCatalogEntry>(
  topicCatalog.map((entry) => [entry.topicCode as TopicCode, entry])
);
const riskCatalogByCode = new Map<RiskCode, RiskCatalogEntry>(
  riskCatalog.map((entry) => [entry.riskCode as RiskCode, entry])
);
const opportunityCatalogByCode = new Map<OpportunityCode, OpportunityCatalogEntry>(
  opportunityCatalog.map((entry) => [entry.opportunityCode as OpportunityCode, entry])
);
const businessCategoryCatalogByLabel = new Map<string, BusinessCategoryCatalogEntry>(
  businessCategories.map((entry) => [entry.label.trim().toLowerCase(), entry])
);
const extendedNaceCatalogByCode = new Map<string, ExtendedNaceCatalogEntry>(
  extendedNaceCatalog.map((entry) => [entry.code, entry])
);

const workbookTextReplacements = new Map<string, string>([
  ['â€“', '–'],
  ['â€”', '—'],
  ['â‰¥', '≥'],
  ['â‰¤', '≤'],
  ['Ã—', '×'],
  ['â—', '●'],
  ['â€™', '’'],
  ['â€œ', '“'],
  ['â€', '”'],
  ['â€˜', '‘'],
  ['â€¦', '…'],
  ['â‚‚', '₂'],
  ['â€', '‐'],
  ['Â©', '©'],
  ['â€œno opportunityâ€', '“no opportunity”']
]);

function cleanWorkbookCopy(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  let cleaned = value;
  for (const [source, target] of workbookTextReplacements) {
    cleaned = cleaned.replaceAll(source, target);
  }

  return cleaned;
}

const benchmarkPriorityOrder: Record<PriorityBand, number> = {
  not_applicable: 0,
  very_low: 1,
  low: 2,
  relevant: 3,
  high_priority: 4
};

const riskScoreOrder: Record<RiskRatingLabel, number> = {
  neutral: 0,
  sustainable: 1,
  moderate: 2,
  severe: 3,
  critical: 4
};

const opportunityScoreOrder: Record<OpportunityRatingLabel, number> = {
  neutral: 0,
  small: 1,
  reasonable: 2,
  sustainable: 3,
  great: 4
};

function sanitizeSdgReference(reference: SdgReference): SdgReference {
  return {
    ...reference,
    title: cleanWorkbookCopy(reference.title) ?? reference.title
  };
}

function getScoreInterpretationGuide(): ScoreInterpretationGuide {
  return {
    title:
      cleanWorkbookCopy(workbookGuidance.scoreInterpretation.title) ??
      'Workbook score interpretation',
    subtitle: cleanWorkbookCopy(workbookGuidance.scoreInterpretation.subtitle),
    bands: workbookGuidance.scoreInterpretation.bands.map((band) => ({
      key: band.key as ScoreInterpretationBand['key'],
      scoreRangeLabel: cleanWorkbookCopy(band.scoreRangeLabel) ?? band.scoreRangeLabel,
      title: cleanWorkbookCopy(band.title) ?? band.title,
      interpretation: cleanWorkbookCopy(band.interpretation) ?? band.interpretation
    }))
  };
}

function getMatrixLegend(
  rawLegend:
    | (typeof workbookGuidance)['riskMatrixLegend']
    | (typeof workbookGuidance)['opportunityMatrixLegend']
): MatrixLegend {
  return {
    title: cleanWorkbookCopy(rawLegend.title) ?? rawLegend.title,
    subtitle: cleanWorkbookCopy(rawLegend.subtitle),
    entries: rawLegend.entries.map((entry) => ({
      label: cleanWorkbookCopy(entry.label) ?? entry.label,
      score: entry.score,
      whatItMeans: cleanWorkbookCopy(entry.whatItMeans) ?? entry.whatItMeans,
      esrsAngle: cleanWorkbookCopy(entry.esrsAngle) ?? entry.esrsAngle,
      businessSignal: cleanWorkbookCopy(entry.businessSignal) ?? entry.businessSignal,
      actionWindow: cleanWorkbookCopy(entry.actionWindow) ?? entry.actionWindow
    }))
  };
}

function getPriorityInterpretation(priorityBand: PriorityBand) {
  return (
    getScoreInterpretationGuide().bands.find((band) => band.key === priorityBand)?.interpretation ??
    null
  );
}

function getRiskLegendEntry(label: RiskRatingLabel): MatrixLegendEntry | null {
  return (
    getMatrixLegend(workbookGuidance.riskMatrixLegend).entries.find(
      (entry) => entry.score === riskScoreOrder[label]
    ) ?? null
  );
}

function getOpportunityLegendEntry(label: OpportunityRatingLabel): MatrixLegendEntry | null {
  return (
    getMatrixLegend(workbookGuidance.opportunityMatrixLegend).entries.find(
      (entry) => entry.score === opportunityScoreOrder[label]
    ) ?? null
  );
}

function deriveDivisionEntryFromContext(context: EvaluationContextPayload) {
  const candidates = [
    context.naceDivision,
    context.businessCategorySubcategory,
    context.extendedNaceCode
      ? extendedNaceCatalogByCode.get(context.extendedNaceCode)?.divisionLabel
      : null,
    context.extendedNaceCode ? context.extendedNaceCode.slice(0, 2) : null
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const found = findNaceEntry(candidate);
    if (found) {
      return found;
    }
  }

  return null;
}

const financialIndicatorCatalog = {
  roi: {
    label: 'Economic KPIs: ROI, IRR, NPV & Payback Period',
    levels: {
      not_evaluated: {
        label: 'Not Evaluated',
        score: 0,
        recommendation:
          'Capital budgeting methods are the foundation of a solid business plan. Calculate ROI, IRR, NPV, and payback period to assess return and value creation.'
      },
      below_industry_average: {
        label: 'Below Industry Average',
        score: 1,
        recommendation:
          'Return and value creation are below industry average. Review CAPEX, OPEX, pricing, and capacity assumptions against competitors.'
      },
      average_or_no_benchmark: {
        label: 'Average / No Benchmark',
        score: 2,
        recommendation:
          'Return is average or lacks a benchmark. Add a lightweight competitive benchmark before scaling the business model.'
      },
      above_industry_average: {
        label: 'Above Industry Average',
        score: 3,
        recommendation: null
      }
    }
  },
  sensitivity: {
    label: 'Sensitivity Analysis (Robustness)',
    levels: {
      not_evaluated: {
        label: 'Not Evaluated',
        score: 0,
        recommendation:
          'Build best, base, and worst-case scenarios and identify the few variables that most affect planning stability.'
      },
      high_volatility: {
        label: 'High Volatility / Large Sensitivity',
        score: 1,
        recommendation:
          'High volatility suggests meaningful downside risk. Identify the key variables and reduce dependence through contracts, diversification, or scenario planning.'
      },
      moderate_volatility: {
        label: 'Moderate Volatility',
        score: 2,
        recommendation: null
      },
      low_volatility: {
        label: 'Low Volatility / Stable',
        score: 3,
        recommendation: null
      }
    }
  },
  usp: {
    label: 'USP / Strategic Fit (Positioning)',
    levels: {
      not_evaluated: {
        label: 'Not Evaluated',
        score: 0,
        recommendation:
          'Strategic differentiation is not clear yet. Define the USP and validate it against real customer value.'
      },
      no_usp: {
        label: 'No USP',
        score: 1,
        recommendation:
          'Low differentiation makes the venture fragile. Refine the target segment and value proposition and consider sustainability as a real differentiator, not only as messaging.'
      },
      weak_or_moderate_usp: {
        label: 'Weak / Moderate USP',
        score: 2,
        recommendation:
          'You have some differentiation but it is not yet durable. Reassess the value proposition, channels, and customer needs to sharpen the edge.'
      },
      strong_or_unique_usp: {
        label: 'Strong / Unique USP',
        score: 3,
        recommendation: null
      }
    }
  },
  marketGrowth: {
    label: 'Market Growth',
    levels: {
      not_evaluated: {
        label: 'Not Evaluated',
        score: 0,
        recommendation:
          'Market potential is not yet evidenced. Add growth, trend, and competitive analysis before making scale assumptions.'
      },
      shrinking: {
        label: 'Shrinking',
        score: 1,
        recommendation:
          'A shrinking market needs a niche or diversification strategy. Tighten the segment focus and explore adjacent opportunities.'
      },
      mature: {
        label: 'Mature',
        score: 2,
        recommendation: null
      },
      growing: {
        label: 'Growing',
        score: 3,
        recommendation: null
      }
    }
  }
} as const;

const sdgMetadata: Record<number, { title: string }> = {
  1: { title: 'No Poverty' },
  2: { title: 'Zero Hunger' },
  3: { title: 'Good Health and Well-being' },
  4: { title: 'Quality Education' },
  5: { title: 'Gender Equality' },
  6: { title: 'Clean Water and Sanitation' },
  7: { title: 'Affordable and Clean Energy' },
  8: { title: 'Decent Work and Economic Growth' },
  9: { title: 'Industry, Innovation and Infrastructure' },
  10: { title: 'Reduced Inequalities' },
  11: { title: 'Sustainable Cities and Communities' },
  12: { title: 'Responsible Consumption and Production' },
  13: { title: 'Climate Action' },
  14: { title: 'Life Below Water' },
  15: { title: 'Life on Land' },
  16: { title: 'Peace, Justice and Strong Institutions' },
  17: { title: 'Partnership for the Goals' }
};

const dimensionScores: Record<ImpactDimensionLevel, number> = {
  low: 1,
  moderate: 2,
  significant: 3,
  high: 4,
  na: 0
};

const stageOneLikelihoodScores: Record<ImpactLikelihoodLevel, number> = {
  very_unlikely: 0.25,
  unlikely: 0.5,
  likely: 0.75,
  very_likely: 1,
  na: 0
};

const stageTwoLikelihoodScores: Record<RiskProbabilityLevel, number> = {
  rare: 0.25,
  could_occur: 0.5,
  likely: 0.75,
  very_likely: 1,
  na: 0
};

const riskMatrix = matrices.riskMatrix as Record<
  ImpactDimensionLevel,
  Record<RiskProbabilityLevel, RiskRatingLabel>
>;

const opportunityMatrix = matrices.opportunityMatrix as Record<
  ImpactDimensionLevel,
  Record<RiskProbabilityLevel, OpportunityRatingLabel>
>;

function createSdgReference(number: number, sourceType: SdgSourceType): SdgReference {
  return {
    number,
    title: sdgMetadata[number]?.title ?? `SDG ${number}`,
    sourceType,
    url: `https://sdgs.un.org/goals/goal${number}`
  };
}

function buildMergedSdgReferences(stageSdgs: number[], businessSdgs: number[]) {
  const merged = new Map<number, SdgSourceType>();

  for (const number of stageSdgs) {
    merged.set(number, 'stage');
  }

  for (const number of businessSdgs) {
    merged.set(number, merged.has(number) ? 'both' : 'business');
  }

  return [...merged.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([number, sourceType]) => createSdgReference(number, sourceType));
}

function normalizeNaceInput(value: string) {
  return value.trim().toLowerCase();
}

function findNaceEntry(naceDivision: string) {
  const normalized = normalizeNaceInput(naceDivision);

  return naceCatalog.find((entry) => {
    const divisionValue = `${entry.code} ${entry.division}`.toLowerCase();
    return (
      divisionValue === normalized ||
      entry.division.toLowerCase() === normalized ||
      entry.code.toLowerCase() === normalized
    );
  });
}

function toPriorityBand(score: number, applicable: boolean): PriorityBand {
  if (!applicable) {
    return 'not_applicable';
  }

  if (score <= 0) {
    return 'very_low';
  }

  if (score < 1) {
    return 'very_low';
  }

  if (score < 2) {
    return 'low';
  }

  if (score < 2.5) {
    return 'relevant';
  }

  return 'high_priority';
}

function mapFinancialIndicatorResult(
  id: FinancialIndicatorResult['id'],
  level:
    | Stage1FinancialAnswersPayload['roiLevel']
    | Stage1FinancialAnswersPayload['sensitivityLevel']
    | Stage1FinancialAnswersPayload['uspLevel']
    | Stage1FinancialAnswersPayload['marketGrowthLevel']
): FinancialIndicatorResult {
  if (id === 'roi') {
    const item =
      financialIndicatorCatalog.roi.levels[
        level as keyof typeof financialIndicatorCatalog.roi.levels
      ];
    return {
      id,
      label: financialIndicatorCatalog.roi.label,
      level: item.label,
      score: item.score,
      recommendation: item.recommendation
    };
  }

  if (id === 'sensitivity') {
    const item =
      financialIndicatorCatalog.sensitivity.levels[
        level as keyof typeof financialIndicatorCatalog.sensitivity.levels
      ];
    return {
      id,
      label: financialIndicatorCatalog.sensitivity.label,
      level: item.label,
      score: item.score,
      recommendation: item.recommendation
    };
  }

  if (id === 'usp') {
    const item =
      financialIndicatorCatalog.usp.levels[
        level as keyof typeof financialIndicatorCatalog.usp.levels
      ];
    return {
      id,
      label: financialIndicatorCatalog.usp.label,
      level: item.label,
      score: item.score,
      recommendation: item.recommendation
    };
  }

  const item =
    financialIndicatorCatalog.marketGrowth.levels[
      level as keyof typeof financialIndicatorCatalog.marketGrowth.levels
    ];
  return {
    id,
    label: financialIndicatorCatalog.marketGrowth.label,
    level: item.label,
    score: item.score,
    recommendation: item.recommendation
  };
}

export function getStartupStageOptions() {
  return stageCatalog.map((entry) => ({
    value: entry.stage as StartupStage,
    label: cleanWorkbookCopy(entry.label) ?? entry.label
  }));
}

export function getBusinessCategoryOptions() {
  return businessCategories.map((entry) => ({
    value: entry.label,
    label: cleanWorkbookCopy(entry.label) ?? entry.label,
    sectionCode: entry.sectionCode,
    sdgs: entry.sdgs
  }));
}

export function getBusinessSubcategoryOptions(mainCategory?: string | null) {
  const selectedCategory = mainCategory
    ? businessCategoryCatalogByLabel.get(mainCategory.trim().toLowerCase())
    : null;
  const sectionCode = selectedCategory?.sectionCode ?? null;
  const seen = new Set<string>();

  return extendedNaceCatalog
    .filter((entry) => !sectionCode || entry.sectionCode === sectionCode)
    .filter((entry) => {
      if (seen.has(entry.divisionCode)) {
        return false;
      }

      seen.add(entry.divisionCode);
      return true;
    })
    .map((entry) => ({
      value: entry.divisionLabel,
      label: cleanWorkbookCopy(entry.divisionLabel) ?? entry.divisionLabel,
      code: entry.divisionCode,
      sectionCode: entry.sectionCode
    }));
}

export function getExtendedNaceOptions(filters?: {
  businessCategoryMain?: string | null;
  divisionCode?: string | null;
}) {
  const selectedCategory = filters?.businessCategoryMain
    ? businessCategoryCatalogByLabel.get(filters.businessCategoryMain.trim().toLowerCase())
    : null;
  const selectedSectionCode = selectedCategory?.sectionCode ?? null;

  return extendedNaceCatalog
    .filter((entry) => !selectedSectionCode || entry.sectionCode === selectedSectionCode)
    .filter((entry) => !filters?.divisionCode || entry.divisionCode === filters.divisionCode)
    .map((entry) => ({
      value: entry.code,
      label: cleanWorkbookCopy(entry.label) ?? entry.label,
      code: entry.code,
      divisionCode: entry.divisionCode,
      divisionLabel: cleanWorkbookCopy(entry.divisionLabel) ?? entry.divisionLabel,
      sectionCode: entry.sectionCode,
      sectionLabel: cleanWorkbookCopy(entry.sectionLabel) ?? entry.sectionLabel
    }));
}

export function getWorkbookGuidance() {
  return {
    scoreInterpretation: getScoreInterpretationGuide(),
    riskMatrixLegend: getMatrixLegend(workbookGuidance.riskMatrixLegend),
    opportunityMatrixLegend: getMatrixLegend(workbookGuidance.opportunityMatrixLegend),
    initialSummaryExplanationBlocks: workbookGuidance.initialSummaryExplanationBlocks.map(
      (block) => ({
        title: cleanWorkbookCopy(block.title) ?? block.title,
        body: cleanWorkbookCopy(block.body) ?? block.body
      })
    )
  };
}

export function getNaceDivisionOptions() {
  return naceCatalog.map((entry) => ({
    value: `${entry.code} ${entry.division}`,
    label:
      cleanWorkbookCopy(`${entry.code} ${entry.division}`) ?? `${entry.code} ${entry.division}`,
    sdgs: entry.sdgs
  }));
}

export function getFinancialIndicatorOptions() {
  return {
    roi: {
      label: financialIndicatorCatalog.roi.label,
      options: Object.entries(financialIndicatorCatalog.roi.levels).map(([value, item]) => ({
        value,
        label: item.label,
        score: item.score
      }))
    },
    sensitivity: {
      label: financialIndicatorCatalog.sensitivity.label,
      options: Object.entries(financialIndicatorCatalog.sensitivity.levels).map(
        ([value, item]) => ({
          value,
          label: item.label,
          score: item.score
        })
      )
    },
    usp: {
      label: financialIndicatorCatalog.usp.label,
      options: Object.entries(financialIndicatorCatalog.usp.levels).map(([value, item]) => ({
        value,
        label: item.label,
        score: item.score
      }))
    },
    marketGrowth: {
      label: financialIndicatorCatalog.marketGrowth.label,
      options: Object.entries(financialIndicatorCatalog.marketGrowth.levels).map(
        ([value, item]) => ({
          value,
          label: item.label,
          score: item.score
        })
      )
    }
  };
}

export function getStageOneTopicCatalog() {
  return topicCatalog.map((entry) => ({
    topicCode: entry.topicCode as TopicCode,
    group: entry.group,
    title: cleanWorkbookCopy(entry.title) ?? entry.title,
    question: cleanWorkbookCopy(entry.question) ?? entry.question,
    guidance: cleanWorkbookCopy(entry.guidance) ?? entry.guidance
  }));
}

export function getRiskCatalog() {
  return riskCatalog.map((entry) => ({
    riskCode: entry.riskCode as RiskCode,
    group: cleanWorkbookCopy(entry.group) ?? entry.group,
    title: cleanWorkbookCopy(entry.title) ?? entry.title,
    question: cleanWorkbookCopy(entry.question) ?? entry.question,
    guidance: cleanWorkbookCopy(entry.guidance) ?? entry.guidance
  }));
}

export function getOpportunityCatalog() {
  return opportunityCatalog.map((entry) => ({
    opportunityCode: entry.opportunityCode as OpportunityCode,
    group: cleanWorkbookCopy(entry.group) ?? entry.group,
    title: cleanWorkbookCopy(entry.title) ?? entry.title,
    question: cleanWorkbookCopy(entry.question) ?? entry.question,
    guidance: cleanWorkbookCopy(entry.guidance) ?? entry.guidance
  }));
}

function extractNaceCode(naceDivision: string) {
  const match = naceDivision.trim().match(/^(\d{2})\b/);
  return match?.[1] ?? 'default';
}

export function getBenchmarkReferenceProfile(context: EvaluationContextPayload) {
  const stageBaseline =
    benchmarkBaselines.stageBaselines[
      context.currentStage as keyof BenchmarkBaselines['stageBaselines']
    ];
  const naceCode = extractNaceCode(
    deriveDivisionEntryFromContext(context)?.code ?? context.naceDivision ?? 'default'
  );
  const naceAdjustment =
    benchmarkBaselines.naceAdjustments[naceCode as keyof BenchmarkBaselines['naceAdjustments']] ??
    benchmarkBaselines.naceAdjustments.default;

  const topicBands = Object.fromEntries(
    Object.entries(stageBaseline.topicBands).map(([topicCode, priorityBand]) => [
      topicCode,
      priorityBand
    ])
  ) as Record<TopicCode, PriorityBand>;

  for (const [topicCode, band] of Object.entries(naceAdjustment.topicBands)) {
    const currentBand = topicBands[topicCode as TopicCode];

    if (
      !currentBand ||
      benchmarkPriorityOrder[band as PriorityBand] > benchmarkPriorityOrder[currentBand]
    ) {
      topicBands[topicCode as TopicCode] = band as PriorityBand;
    }
  }

  return {
    label: `${stageBaseline.label} / ${naceAdjustment.label}`,
    financialTotal: Math.max(
      0,
      Math.min(12, stageBaseline.financialTotal + naceAdjustment.financialDelta)
    ),
    riskOverall: Number((stageBaseline.riskOverall + naceAdjustment.riskDelta).toFixed(2)),
    opportunityOverall: Number(
      (stageBaseline.opportunityOverall + naceAdjustment.opportunityDelta).toFixed(2)
    ),
    topicBands
  };
}

export function buildInitialSummary(context: EvaluationContextPayload): StageSdgSummary {
  const stageEntry = stageCatalogByKey.get(context.currentStage);

  if (!stageEntry) {
    throw new Error(`Unknown startup stage: ${context.currentStage}`);
  }

  const guidance = getWorkbookGuidance();
  const businessCategoryEntry = context.businessCategoryMain
    ? (businessCategoryCatalogByLabel.get(context.businessCategoryMain.trim().toLowerCase()) ??
      null)
    : null;
  const naceEntry = deriveDivisionEntryFromContext(context);
  const stageSdgs = stageEntry.sdgs.map((number) =>
    sanitizeSdgReference(createSdgReference(number, 'stage'))
  );
  const businessSdgNumbers = naceEntry?.sdgs ?? businessCategoryEntry?.sdgs ?? [];
  const businessSdgs = businessSdgNumbers.map((number) =>
    sanitizeSdgReference(createSdgReference(number, 'business'))
  );
  const screeningContextLabel =
    cleanWorkbookCopy(
      context.extendedNaceLabel ??
        context.businessCategorySubcategory ??
        (naceEntry ? `${naceEntry.code} ${naceEntry.division}` : null) ??
        context.businessCategoryMain ??
        context.naceDivision ??
        'Business category not yet specified'
    ) ?? 'Business category not yet specified';

  return {
    currentStage: context.currentStage,
    stageLabel: cleanWorkbookCopy(stageEntry.label) ?? stageEntry.label,
    businessCategoryMain: cleanWorkbookCopy(context.businessCategoryMain),
    businessCategorySubcategory: cleanWorkbookCopy(context.businessCategorySubcategory),
    extendedNaceCode: cleanWorkbookCopy(context.extendedNaceCode),
    extendedNaceLabel: cleanWorkbookCopy(context.extendedNaceLabel),
    naceDivision: cleanWorkbookCopy(
      context.naceDivision ?? (naceEntry ? `${naceEntry.code} ${naceEntry.division}` : null)
    ),
    screeningContextLabel,
    phaseGoal: cleanWorkbookCopy(stageEntry.phaseGoal) ?? stageEntry.phaseGoal,
    phaseConsideration: cleanWorkbookCopy(stageEntry.phaseConsideration),
    whatToConsider:
      context.offeringType === 'product'
        ? (cleanWorkbookCopy(stageEntry.productWhatToConsider) ?? stageEntry.productWhatToConsider)
        : (cleanWorkbookCopy(stageEntry.serviceWhatToConsider) ?? stageEntry.serviceWhatToConsider),
    stageSdgs,
    businessSdgs,
    mergedSdgs: buildMergedSdgReferences(stageEntry.sdgs, businessSdgNumbers).map(
      sanitizeSdgReference
    ),
    explanationBlocks: guidance.initialSummaryExplanationBlocks
  };
}

export function scoreFinancialAnswers(
  payload: Stage1FinancialAnswersPayload
): Stage1FinancialAnswer {
  const items = [
    mapFinancialIndicatorResult('roi', payload.roiLevel),
    mapFinancialIndicatorResult('sensitivity', payload.sensitivityLevel),
    mapFinancialIndicatorResult('usp', payload.uspLevel),
    mapFinancialIndicatorResult('market_growth', payload.marketGrowthLevel)
  ];

  return {
    ...payload,
    totalScore: items.reduce((sum, item) => sum + item.score, 0),
    items
  };
}

export function scoreStage1TopicAnswer(input: Stage1TopicAnswerInput): Stage1TopicAnswer {
  const topic = topicCatalogByCode.get(input.topicCode);

  if (!topic) {
    throw new Error(`Unknown topic code: ${input.topicCode}`);
  }

  const impactScore = input.applicable
    ? Number(
        (
          (((dimensionScores[input.magnitude] ?? 0) +
            (dimensionScores[input.scale] ?? 0) +
            (dimensionScores[input.irreversibility] ?? 0)) /
            3) *
          (stageOneLikelihoodScores[input.likelihood] ?? 0)
        ).toFixed(2)
      )
    : 0;

  return {
    ...input,
    title: cleanWorkbookCopy(topic.title) ?? topic.title,
    question: cleanWorkbookCopy(topic.question) ?? topic.question,
    impactScore,
    priorityBand: toPriorityBand(impactScore, input.applicable),
    sdgNumbers: topic.sdgs,
    guidance: cleanWorkbookCopy(topic.guidance) ?? topic.guidance,
    interpretation: getPriorityInterpretation(toPriorityBand(impactScore, input.applicable))
  };
}

function getRiskMatrixLabel(
  impact: Stage2RiskAnswerInput['impact'],
  probability: Stage2RiskAnswerInput['probability']
) {
  return riskMatrix[impact]?.[probability] ?? 'neutral';
}

function getOpportunityMatrixLabel(
  impact: Stage2OpportunityAnswerInput['impact'],
  likelihood: Stage2OpportunityAnswerInput['likelihood']
) {
  return opportunityMatrix[impact]?.[likelihood] ?? 'neutral';
}

export function scoreStage2RiskAnswer(input: Stage2RiskAnswerInput): Stage2RiskAnswer {
  const risk = riskCatalogByCode.get(input.riskCode);

  if (!risk) {
    throw new Error(`Unknown risk code: ${input.riskCode}`);
  }

  const ratingScore = input.applicable
    ? Number(
        (
          (stageTwoLikelihoodScores[input.probability] ?? 0) * (dimensionScores[input.impact] ?? 0)
        ).toFixed(2)
      )
    : 0;

  const ratingLabel = input.applicable
    ? getRiskMatrixLabel(input.impact, input.probability)
    : 'neutral';
  const legendEntry = getRiskLegendEntry(ratingLabel);

  return {
    ...input,
    group: cleanWorkbookCopy(risk.group) ?? risk.group,
    title: cleanWorkbookCopy(risk.title) ?? risk.title,
    question: cleanWorkbookCopy(risk.question) ?? risk.question,
    ratingLabel,
    ratingScore,
    sdgNumbers: risk.sdgs,
    guidance: cleanWorkbookCopy(risk.guidance) ?? risk.guidance,
    interpretation: legendEntry?.whatItMeans ?? null
  };
}

export function scoreStage2OpportunityAnswer(
  input: Stage2OpportunityAnswerInput
): Stage2OpportunityAnswer {
  const opportunity = opportunityCatalogByCode.get(input.opportunityCode);

  if (!opportunity) {
    throw new Error(`Unknown opportunity code: ${input.opportunityCode}`);
  }

  const ratingScore = input.applicable
    ? Number(
        (
          (stageTwoLikelihoodScores[input.likelihood] ?? 0) * (dimensionScores[input.impact] ?? 0)
        ).toFixed(2)
      )
    : 0;

  const ratingLabel = input.applicable
    ? getOpportunityMatrixLabel(input.impact, input.likelihood)
    : 'neutral';
  const legendEntry = getOpportunityLegendEntry(ratingLabel);

  return {
    ...input,
    group: cleanWorkbookCopy(opportunity.group) ?? opportunity.group,
    title: cleanWorkbookCopy(opportunity.title) ?? opportunity.title,
    question: cleanWorkbookCopy(opportunity.question) ?? opportunity.question,
    ratingLabel,
    ratingScore,
    sdgNumbers: opportunity.sdgs,
    guidance: cleanWorkbookCopy(opportunity.guidance) ?? opportunity.guidance,
    interpretation: legendEntry?.whatItMeans ?? null
  };
}

function createTopicSummary(topic: Stage1TopicAnswer): MaterialTopicSummary {
  const catalogEntry = topicCatalogByCode.get(topic.topicCode);
  return {
    topicCode: topic.topicCode,
    title: topic.title,
    score: topic.impactScore,
    priorityBand: topic.priorityBand,
    recommendation: cleanWorkbookCopy(catalogEntry?.guidance ?? null),
    sdgNumbers: topic.sdgNumbers,
    interpretation: topic.interpretation ?? getPriorityInterpretation(topic.priorityBand)
  };
}

function calculateConfidenceBand(
  stage1Topics: Stage1TopicAnswer[],
  stage2Risks: Stage2RiskAnswer[],
  stage2Opportunities: Stage2OpportunityAnswer[]
): ConfidenceBand {
  const evidenceValues = [...stage1Topics, ...stage2Risks, ...stage2Opportunities]
    .filter((item) => item.applicable)
    .map((item) => {
      if (item.evidenceBasis === 'measured') {
        return 3;
      }

      if (item.evidenceBasis === 'estimated') {
        return 2;
      }

      return 1;
    });

  if (evidenceValues.length === 0) {
    return 'low';
  }

  const average = evidenceValues.reduce((sum, value) => sum + value, 0) / evidenceValues.length;

  if (average >= 2.5) {
    return 'high';
  }

  if (average >= 1.75) {
    return 'moderate';
  }

  return 'low';
}

function buildSensitivityHints(stage1Topics: Stage1TopicAnswer[]) {
  const hints: DashboardResponse['sensitivityHints'] = [];

  for (const topic of stage1Topics) {
    if (!topic.applicable) {
      continue;
    }

    const likelihoodOrder: ImpactLikelihoodLevel[] = [
      'very_unlikely',
      'unlikely',
      'likely',
      'very_likely'
    ];
    const currentIndex = likelihoodOrder.indexOf(topic.likelihood);

    if (currentIndex < 0 || currentIndex === likelihoodOrder.length - 1) {
      continue;
    }

    const nextLikelihood = likelihoodOrder[currentIndex + 1];

    if (!nextLikelihood) {
      continue;
    }

    const projected = scoreStage1TopicAnswer({
      ...topic,
      likelihood: nextLikelihood
    });

    if (projected.priorityBand === topic.priorityBand) {
      continue;
    }

    hints.push({
      topicCode: topic.topicCode,
      title: topic.title,
      currentBand: topic.priorityBand,
      projectedBand: projected.priorityBand,
      message: `If likelihood increased by one band, ${topic.title} would move from ${topic.priorityBand.replace('_', ' ')} to ${projected.priorityBand.replace('_', ' ')}.`
    });
  }

  return hints.slice(0, 4);
}

function buildRecommendations(
  financial: Stage1FinancialAnswer | null,
  stage1Topics: Stage1TopicAnswer[],
  stage2Risks: Stage2RiskAnswer[],
  stage2Opportunities: Stage2OpportunityAnswer[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const evidenceHintForSource = (source: Recommendation['source']) => {
    if (source === 'financial') {
      return 'Collect business-case assumptions, benchmark references, and scenario notes that support the selected financial level.';
    }

    if (source === 'stage1') {
      return 'Capture the evidence basis behind magnitude, scale, irreversibility, and likelihood so the impact score can be defended later.';
    }

    if (source === 'risk') {
      return 'Document the triggering conditions, exposure assumptions, and any early warning indicators tied to this risk.';
    }

    return 'Record the market signal, adoption assumptions, and proof points that justify the upside rating for this opportunity.';
  };

  for (const item of financial?.items ?? []) {
    if (item.recommendation) {
      recommendations.push({
        id: `financial:${item.id}`,
        title: cleanWorkbookCopy(item.label) ?? item.label,
        text: cleanWorkbookCopy(item.recommendation) ?? item.recommendation,
        evidenceToCollect: evidenceHintForSource('financial'),
        rationale: `Triggered because the workbook financial lookup returned ${cleanWorkbookCopy(item.level) ?? item.level}.`,
        source: 'financial',
        severityBand: cleanWorkbookCopy(item.level) ?? item.level,
        action: null
      });
    }
  }

  for (const topic of stage1Topics.filter(
    (item) => item.priorityBand === 'relevant' || item.priorityBand === 'high_priority'
  )) {
    const catalogEntry = topicCatalogByCode.get(topic.topicCode);
    if (!catalogEntry) {
      continue;
    }

    recommendations.push({
      id: `topic:${topic.topicCode}`,
      title: topic.title,
      text: cleanWorkbookCopy(catalogEntry.guidance) ?? catalogEntry.guidance,
      evidenceToCollect: evidenceHintForSource('stage1'),
      rationale: `Triggered because ${topic.title} scored ${topic.impactScore.toFixed(2)} and falls into the ${topic.priorityBand.replaceAll('_', ' ')} workbook band.`,
      source: 'stage1',
      severityBand: topic.priorityBand,
      action: null
    });
  }

  for (const risk of [...stage2Risks]
    .sort((left, right) => right.ratingScore - left.ratingScore)
    .slice(0, 2)) {
    const catalogEntry = riskCatalogByCode.get(risk.riskCode);
    if (!catalogEntry || risk.ratingScore <= 0) {
      continue;
    }

    recommendations.push({
      id: `risk:${risk.riskCode}`,
      title: risk.title,
      text: cleanWorkbookCopy(catalogEntry.guidance) ?? catalogEntry.guidance,
      evidenceToCollect: evidenceHintForSource('risk'),
      rationale: `Triggered because ${risk.title} is currently rated ${risk.ratingLabel} in the workbook risk matrix.`,
      source: 'risk',
      severityBand: risk.ratingLabel,
      action: null
    });
  }

  for (const opportunity of [...stage2Opportunities]
    .sort((left, right) => right.ratingScore - left.ratingScore)
    .slice(0, 2)) {
    const catalogEntry = opportunityCatalogByCode.get(opportunity.opportunityCode);
    if (!catalogEntry || opportunity.ratingScore <= 0) {
      continue;
    }

    recommendations.push({
      id: `opportunity:${opportunity.opportunityCode}`,
      title: opportunity.title,
      text: cleanWorkbookCopy(catalogEntry.guidance) ?? catalogEntry.guidance,
      evidenceToCollect: evidenceHintForSource('opportunity'),
      rationale: `Triggered because ${opportunity.title} is currently rated ${opportunity.ratingLabel} in the workbook opportunity matrix.`,
      source: 'opportunity',
      severityBand: opportunity.ratingLabel,
      action: null
    });
  }

  return recommendations.slice(0, 8);
}

export function buildImpactSummary(
  initialSummary: StageSdgSummary,
  stage1Topics: Stage1TopicAnswer[],
  stage2Risks: Stage2RiskAnswer[],
  stage2Opportunities: Stage2OpportunityAnswer[]
): ImpactSummaryResponse {
  const relevantTopics = stage1Topics
    .filter((topic) => topic.priorityBand === 'relevant')
    .map(createTopicSummary)
    .sort((left, right) => right.score - left.score);
  const highPriorityTopics = stage1Topics
    .filter((topic) => topic.priorityBand === 'high_priority')
    .map(createTopicSummary)
    .sort((left, right) => right.score - left.score);
  const topRisk = [...stage2Risks].sort((left, right) => right.ratingScore - left.ratingScore)[0];
  const topOpportunity = [...stage2Opportunities].sort(
    (left, right) => right.ratingScore - left.ratingScore
  )[0];

  const whatToConsiderNext = [
    initialSummary.whatToConsider,
    ...(highPriorityTopics[0]
      ? [
          `Prioritise ${highPriorityTopics[0].title.toLowerCase()} first because it is already above the high-priority threshold.`
        ]
      : []),
    ...(topRisk && topRisk.ratingScore > 0
      ? [
          `Track ${topRisk.title.toLowerCase()} early because it is the strongest outside-in risk signal right now.`
        ]
      : []),
    ...(topOpportunity && topOpportunity.ratingScore > 0
      ? [
          `Explore ${topOpportunity.title.toLowerCase()} as the most visible sustainability upside in the current profile.`
        ]
      : [])
  ];

  return {
    relevantTopics,
    highPriorityTopics,
    whatToConsiderNext: whatToConsiderNext.map((item) => cleanWorkbookCopy(item) ?? item),
    relevantSdgs: initialSummary.mergedSdgs,
    scoreInterpretation: getScoreInterpretationGuide()
  };
}

export function buildDashboard(
  evaluationId: string,
  initialSummary: StageSdgSummary,
  financial: Stage1FinancialAnswer | null,
  stage1Topics: Stage1TopicAnswer[],
  stage2Risks: Stage2RiskAnswer[],
  stage2Opportunities: Stage2OpportunityAnswer[]
): DashboardResponse {
  const environmentalTopics = stage1Topics
    .filter((topic) => topic.topicCode.startsWith('E'))
    .map(createTopicSummary)
    .sort((left, right) => right.score - left.score);
  const socialTopics = stage1Topics
    .filter((topic) => topic.topicCode.startsWith('S') || topic.topicCode.startsWith('G'))
    .map(createTopicSummary)
    .sort((left, right) => right.score - left.score);
  const materialAlerts = stage1Topics
    .filter((topic) => topic.priorityBand === 'relevant' || topic.priorityBand === 'high_priority')
    .map(createTopicSummary)
    .sort((left, right) => right.score - left.score);
  const riskOverall = Number(
    stage2Risks.reduce((sum, item) => sum + item.ratingScore, 0).toFixed(2)
  );
  const opportunityOverall = Number(
    stage2Opportunities.reduce((sum, item) => sum + item.ratingScore, 0).toFixed(2)
  );
  const confidenceBand = calculateConfidenceBand(stage1Topics, stage2Risks, stage2Opportunities);
  const riskLegend = getMatrixLegend(workbookGuidance.riskMatrixLegend);
  const opportunityLegend = getMatrixLegend(workbookGuidance.opportunityMatrixLegend);

  return {
    evaluationId,
    financialTotal: financial?.totalScore ?? 0,
    environmentalTopics,
    socialTopics,
    materialAlerts,
    riskOverall,
    opportunityOverall,
    topRisks: [...stage2Risks]
      .sort((left, right) => right.ratingScore - left.ratingScore)
      .filter((item) => item.ratingScore > 0)
      .slice(0, 3)
      .map((item) => ({
        code: item.riskCode,
        title: item.title,
        ratingLabel: item.ratingLabel,
        score: item.ratingScore,
        actionWindow:
          getRiskLegendEntry(item.ratingLabel)?.actionWindow ??
          getRiskLegendEntry(item.ratingLabel)?.whatItMeans ??
          ''
      })),
    topOpportunities: [...stage2Opportunities]
      .sort((left, right) => right.ratingScore - left.ratingScore)
      .filter((item) => item.ratingScore > 0)
      .slice(0, 3)
      .map((item) => ({
        code: item.opportunityCode,
        title: item.title,
        ratingLabel: item.ratingLabel,
        score: item.ratingScore,
        actionWindow:
          getOpportunityLegendEntry(item.ratingLabel)?.actionWindow ??
          getOpportunityLegendEntry(item.ratingLabel)?.whatItMeans ??
          ''
      })),
    recommendations: buildRecommendations(
      financial,
      stage1Topics,
      stage2Risks,
      stage2Opportunities
    ),
    confidenceBand,
    sensitivityHints: buildSensitivityHints(stage1Topics),
    scoreInterpretation: getScoreInterpretationGuide(),
    riskMatrixLegend: riskLegend,
    opportunityMatrixLegend: opportunityLegend
  };
}

export function buildReportResponse(input: {
  evaluation: ReportResponse['evaluation'];
  impactSummary: ImpactSummaryResponse;
  dashboard: DashboardResponse;
}): ReportResponse {
  return {
    evaluation: input.evaluation,
    impactSummary: input.impactSummary,
    sdgAlignment: {
      items: input.evaluation.initialSummary.mergedSdgs
    },
    dashboard: input.dashboard,
    evidenceSummary: {
      totalCount: 0,
      items: []
    },
    programBranding: null,
    submissionReviewState: null
  };
}
