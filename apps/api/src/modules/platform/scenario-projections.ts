import type {
  ConfidenceBand,
  PriorityBand,
  ReportResponse,
  ScenarioAssumptions,
  ScenarioMetricDelta,
  ScenarioTopicDelta
} from '@packages/shared';

const priorityBandOrder: PriorityBand[] = [
  'not_applicable',
  'very_low',
  'low',
  'relevant',
  'high_priority'
];

const confidenceBandOrder: ConfidenceBand[] = ['low', 'moderate', 'high'];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function shiftPriorityBand(band: PriorityBand, direction: -1 | 0 | 1): PriorityBand {
  if (direction === 0) {
    return band;
  }

  const currentIndex = priorityBandOrder.indexOf(band);
  if (currentIndex < 0) {
    return band;
  }

  return (
    priorityBandOrder[clamp(currentIndex + direction, 0, priorityBandOrder.length - 1)] ?? band
  );
}

function shiftConfidenceBand(
  band: ConfidenceBand,
  direction: 'down' | 'same' | 'up'
): ConfidenceBand {
  const currentIndex = confidenceBandOrder.indexOf(band);
  if (currentIndex < 0 || direction === 'same') {
    return band;
  }

  return (
    confidenceBandOrder[
      clamp(currentIndex + (direction === 'up' ? 1 : -1), 0, confidenceBandOrder.length - 1)
    ] ?? band
  );
}

export function buildScenarioProjection(
  report: ReportResponse,
  assumptions: ScenarioAssumptions
): {
  advisorySummary: string;
  metricDeltas: ScenarioMetricDelta[];
  topicDeltas: ScenarioTopicDelta[];
  projectedConfidenceBand: ConfidenceBand;
  takeaways: string[];
} {
  const financialScenarioValue = clamp(
    report.dashboard.financialTotal + assumptions.financialDelta,
    0,
    12
  );
  const riskScenarioValue = clamp(report.dashboard.riskOverall + assumptions.riskDelta, 0, 4);
  const opportunityScenarioValue = clamp(
    report.dashboard.opportunityOverall + assumptions.opportunityDelta,
    0,
    4
  );

  const metricDeltas: ScenarioMetricDelta[] = [
    {
      key: 'financial_total',
      label: 'Financial total',
      currentValue: report.dashboard.financialTotal,
      scenarioValue: Number(financialScenarioValue.toFixed(2)),
      delta: Number((financialScenarioValue - report.dashboard.financialTotal).toFixed(2))
    },
    {
      key: 'risk_overall',
      label: 'Risk overall',
      currentValue: Number(report.dashboard.riskOverall.toFixed(2)),
      scenarioValue: Number(riskScenarioValue.toFixed(2)),
      delta: Number((riskScenarioValue - report.dashboard.riskOverall).toFixed(2))
    },
    {
      key: 'opportunity_overall',
      label: 'Opportunity overall',
      currentValue: Number(report.dashboard.opportunityOverall.toFixed(2)),
      scenarioValue: Number(opportunityScenarioValue.toFixed(2)),
      delta: Number((opportunityScenarioValue - report.dashboard.opportunityOverall).toFixed(2))
    }
  ];

  const urgencyDirection: -1 | 0 | 1 =
    assumptions.riskDelta > 0 || assumptions.opportunityDelta < 0 || assumptions.financialDelta < 0
      ? 1
      : assumptions.riskDelta < 0 ||
          assumptions.opportunityDelta > 0 ||
          assumptions.financialDelta > 0
        ? -1
        : 0;

  const topicDeltas: ScenarioTopicDelta[] = report.evaluation.stage1Topics
    .filter((topic) => assumptions.impactedTopicCodes.includes(topic.topicCode))
    .map((topic) => {
      const scenarioBand = shiftPriorityBand(topic.priorityBand, urgencyDirection);
      const directionLabel =
        urgencyDirection > 0
          ? 'Scenario assumptions increase urgency for this topic.'
          : urgencyDirection < 0
            ? 'Scenario assumptions improve headroom for this topic.'
            : 'Scenario assumptions keep this topic broadly unchanged.';

      return {
        topicCode: topic.topicCode,
        title: topic.title,
        currentBand: topic.priorityBand,
        scenarioBand,
        note: directionLabel
      };
    });

  const projectedConfidenceBand = shiftConfidenceBand(
    report.dashboard.confidenceBand,
    assumptions.confidenceShift
  );

  const takeaways = [
    assumptions.financialDelta > 0
      ? 'Financial resilience improves under this scenario.'
      : assumptions.financialDelta < 0
        ? 'Financial resilience weakens under this scenario.'
        : 'Financial resilience stays flat in this scenario.',
    assumptions.riskDelta > 0
      ? 'Outside-in risk pressure increases and should be monitored closely.'
      : assumptions.riskDelta < 0
        ? 'Outside-in risk pressure reduces compared with the saved revision.'
        : 'Outside-in risk pressure stays broadly unchanged.',
    assumptions.opportunityDelta > 0
      ? 'Opportunity capture improves if the assumptions hold.'
      : assumptions.opportunityDelta < 0
        ? 'Opportunity capture softens if the assumptions hold.'
        : 'Opportunity capture remains stable under this scenario.',
    assumptions.impactedTopicCodes.length > 0
      ? `Focus on ${assumptions.impactedTopicCodes.join(', ')} when validating this scenario with evidence.`
      : 'No additional material topics were selected for focused scenario review.'
  ];

  const [financialDeltaSummary, riskDeltaSummary, opportunityDeltaSummary] = metricDeltas;

  const advisorySummary = [
    `This advisory scenario compares against revision ${report.evaluation.currentRevisionNumber || 1}.`,
    `Financial total shifts by ${financialDeltaSummary!.delta >= 0 ? '+' : ''}${financialDeltaSummary!.delta.toFixed(2)}.`,
    `Risk overall shifts by ${riskDeltaSummary!.delta >= 0 ? '+' : ''}${riskDeltaSummary!.delta.toFixed(2)}.`,
    `Opportunity overall shifts by ${opportunityDeltaSummary!.delta >= 0 ? '+' : ''}${opportunityDeltaSummary!.delta.toFixed(2)}.`,
    `Confidence is projected to move from ${report.dashboard.confidenceBand} to ${projectedConfidenceBand}.`,
    'This output is advisory only and does not replace the canonical saved revision.'
  ].join(' ');

  return {
    advisorySummary,
    metricDeltas,
    topicDeltas,
    projectedConfidenceBand,
    takeaways
  };
}
