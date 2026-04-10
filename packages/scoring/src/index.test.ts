import { describe, expect, it } from 'vitest';
import {
  buildDashboard,
  buildImpactSummary,
  buildInitialSummary,
  getBusinessCategoryOptions,
  getBusinessSubcategoryOptions,
  getExtendedNaceOptions,
  getWorkbookGuidance,
  scoreFinancialAnswers,
  scoreStage1TopicAnswer,
  scoreStage2OpportunityAnswer,
  scoreStage2RiskAnswer
} from './index';
import goldenFixtures from './golden-fixtures.json';

describe('scoring package', () => {
  it('matches committed golden fixtures derived from the workbook logic', () => {
    for (const fixture of goldenFixtures.financial) {
      expect(
        scoreFinancialAnswers(fixture.input as Parameters<typeof scoreFinancialAnswers>[0])
          .totalScore,
        fixture.name
      ).toBe(fixture.expected.totalScore);
    }

    for (const fixture of goldenFixtures.stage1Topics) {
      const result = scoreStage1TopicAnswer(
        fixture.input as Parameters<typeof scoreStage1TopicAnswer>[0]
      );
      expect(result.impactScore, fixture.name).toBe(fixture.expected.impactScore);
      expect(result.priorityBand, fixture.name).toBe(fixture.expected.priorityBand);
    }

    for (const fixture of goldenFixtures.stage2Risks) {
      const result = scoreStage2RiskAnswer(
        fixture.input as Parameters<typeof scoreStage2RiskAnswer>[0]
      );
      expect(result.ratingScore, fixture.name).toBe(fixture.expected.ratingScore);
      expect(result.ratingLabel, fixture.name).toBe(fixture.expected.ratingLabel);
    }

    for (const fixture of goldenFixtures.stage2Opportunities) {
      const result = scoreStage2OpportunityAnswer(
        fixture.input as Parameters<typeof scoreStage2OpportunityAnswer>[0]
      );
      expect(result.ratingScore, fixture.name).toBe(fixture.expected.ratingScore);
      expect(result.ratingLabel, fixture.name).toBe(fixture.expected.ratingLabel);
    }
  });

  it('builds the initial SDG summary with merged stage and business tags', () => {
    const summary = buildInitialSummary({
      name: 'Example Startup',
      country: 'Germany',
      businessCategoryMain: 'Information and Communication',
      businessCategorySubcategory: '62 Computer programming, consultancy and related activities',
      extendedNaceCode: '62.01',
      extendedNaceLabel: '62.01 Computer programming activities',
      naceDivision: '62 Computer programming, consultancy and related activities',
      offeringType: 'product',
      launched: false,
      currentStage: 'pre_launch',
      innovationApproach: 'sustaining'
    });

    expect(summary.stageSdgs.map((item: { number: number }) => item.number)).toContain(8);
    expect(summary.businessSdgs.map((item: { number: number }) => item.number)).toContain(8);
    expect(
      summary.mergedSdgs.find((item: { number: number; sourceType: string }) => item.number === 8)
        ?.sourceType
    ).toBe('both');
    expect(summary.screeningContextLabel).toContain('62.01');
    expect(summary.explanationBlocks.length).toBeGreaterThan(0);
  });

  it('exposes workbook taxonomy and guidance accessors', () => {
    const categories = getBusinessCategoryOptions();
    const subcategories = getBusinessSubcategoryOptions('Information and Communication');
    const extendedNace = getExtendedNaceOptions({
      businessCategoryMain: 'Information and Communication'
    });
    const guidance = getWorkbookGuidance();

    expect(categories.some((item) => item.label === 'Information and Communication')).toBe(true);
    expect(subcategories.length).toBeGreaterThan(0);
    expect(extendedNace.length).toBeGreaterThan(0);
    expect(
      guidance.scoreInterpretation.bands.find((item) => item.key === 'high_priority')
        ?.scoreRangeLabel
    ).toContain('2.5');
    expect(guidance.riskMatrixLegend.entries.length).toBeGreaterThan(0);
  });

  it('matches the example workbook financial total', () => {
    const result = scoreFinancialAnswers({
      roiLevel: 'average_or_no_benchmark',
      sensitivityLevel: 'high_volatility',
      uspLevel: 'strong_or_unique_usp',
      marketGrowthLevel: 'growing'
    });

    expect(result.totalScore).toBe(9);
  });

  it('scores stage one topics with the relevant and high-priority split', () => {
    const relevantTopic = scoreStage1TopicAnswer({
      topicCode: 'E1',
      applicable: true,
      magnitude: 'significant',
      scale: 'significant',
      irreversibility: 'significant',
      likelihood: 'likely',
      evidenceBasis: 'estimated'
    });
    const highPriorityTopic = scoreStage1TopicAnswer({
      topicCode: 'E3',
      applicable: true,
      magnitude: 'high',
      scale: 'high',
      irreversibility: 'high',
      likelihood: 'likely',
      evidenceBasis: 'measured'
    });

    expect(relevantTopic.impactScore).toBe(2.25);
    expect(relevantTopic.priorityBand).toBe('relevant');
    expect(highPriorityTopic.priorityBand).toBe('high_priority');
  });

  it('promotes topics at 2.5 or higher into the high-priority band', () => {
    const thresholdTopic = scoreStage1TopicAnswer({
      topicCode: 'E2',
      applicable: true,
      magnitude: 'significant',
      scale: 'significant',
      irreversibility: 'high',
      likelihood: 'likely',
      evidenceBasis: 'measured'
    });

    expect(thresholdTopic.impactScore).toBe(2.5);
    expect(thresholdTopic.priorityBand).toBe('high_priority');
  });

  it('scores stage two risk and opportunity matrices deterministically', () => {
    const risk = scoreStage2RiskAnswer({
      riskCode: 'climate_policy_risk',
      applicable: true,
      probability: 'could_occur',
      impact: 'moderate',
      evidenceBasis: 'estimated'
    });
    const opportunity = scoreStage2OpportunityAnswer({
      opportunityCode: 'climate_transition_opportunity',
      applicable: true,
      likelihood: 'likely',
      impact: 'significant',
      evidenceBasis: 'estimated'
    });

    expect(risk.ratingScore).toBe(1);
    expect(risk.ratingLabel).toBe('moderate');
    expect(opportunity.ratingScore).toBe(2.25);
    expect(opportunity.ratingLabel).toBe('great');
  });

  it('builds impact summary and dashboard outputs from scored answers', () => {
    const initialSummary = buildInitialSummary({
      name: 'Example Startup',
      country: 'Germany',
      businessCategoryMain: 'Information and Communication',
      businessCategorySubcategory: '62 Computer programming, consultancy and related activities',
      extendedNaceCode: '62.01',
      extendedNaceLabel: '62.01 Computer programming activities',
      naceDivision: '62 Computer programming, consultancy and related activities',
      offeringType: 'product',
      launched: false,
      currentStage: 'pre_launch',
      innovationApproach: 'sustaining'
    });
    const financial = scoreFinancialAnswers({
      roiLevel: 'average_or_no_benchmark',
      sensitivityLevel: 'high_volatility',
      uspLevel: 'strong_or_unique_usp',
      marketGrowthLevel: 'growing'
    });
    const stage1Topics = [
      scoreStage1TopicAnswer({
        topicCode: 'E1',
        applicable: true,
        magnitude: 'significant',
        scale: 'significant',
        irreversibility: 'significant',
        likelihood: 'likely',
        evidenceBasis: 'estimated'
      }),
      scoreStage1TopicAnswer({
        topicCode: 'E5',
        applicable: true,
        magnitude: 'moderate',
        scale: 'moderate',
        irreversibility: 'high',
        likelihood: 'likely',
        evidenceBasis: 'assumed'
      }),
      scoreStage1TopicAnswer({
        topicCode: 'G1',
        applicable: false,
        magnitude: 'na',
        scale: 'na',
        irreversibility: 'na',
        likelihood: 'na',
        evidenceBasis: 'assumed'
      })
    ];
    const stage2Risks = [
      scoreStage2RiskAnswer({
        riskCode: 'climate_policy_risk',
        applicable: true,
        probability: 'could_occur',
        impact: 'moderate',
        evidenceBasis: 'estimated'
      })
    ];
    const stage2Opportunities = [
      scoreStage2OpportunityAnswer({
        opportunityCode: 'climate_transition_opportunity',
        applicable: true,
        likelihood: 'likely',
        impact: 'significant',
        evidenceBasis: 'measured'
      })
    ];

    const impactSummary = buildImpactSummary(
      initialSummary,
      stage1Topics,
      stage2Risks,
      stage2Opportunities
    );
    const dashboard = buildDashboard(
      'evaluation-1',
      initialSummary,
      financial,
      stage1Topics,
      stage2Risks,
      stage2Opportunities
    );

    expect(impactSummary.relevantTopics).toHaveLength(2);
    expect(dashboard.financialTotal).toBe(9);
    expect(dashboard.riskOverall).toBe(1);
    expect(dashboard.opportunityOverall).toBe(2.25);
    expect(dashboard.confidenceBand).toBe('moderate');
    expect(dashboard.recommendations.length).toBeGreaterThan(0);
  });
});
