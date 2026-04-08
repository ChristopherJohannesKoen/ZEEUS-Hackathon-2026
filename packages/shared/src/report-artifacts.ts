import type { ReportResponse } from './evaluations';

function escapeCsvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function serializeReportAsCsv(report: ReportResponse) {
  const rows: string[][] = [];

  const pushSection = (section: string, field: string, value: string | number | boolean | null) => {
    rows.push([section, field, value === null ? '' : String(value)]);
  };

  pushSection('evaluation', 'id', report.evaluation.id);
  pushSection('evaluation', 'name', report.evaluation.name);
  pushSection('evaluation', 'country', report.evaluation.country);
  pushSection('evaluation', 'naceDivision', report.evaluation.naceDivision);
  pushSection('evaluation', 'offeringType', report.evaluation.offeringType);
  pushSection('evaluation', 'launched', report.evaluation.launched);
  pushSection('evaluation', 'currentStage', report.evaluation.currentStage);
  pushSection('evaluation', 'innovationApproach', report.evaluation.innovationApproach);
  pushSection('evaluation', 'status', report.evaluation.status);
  pushSection('evaluation', 'currentStep', report.evaluation.currentStep);
  pushSection('evaluation', 'confidenceBand', report.dashboard.confidenceBand);
  pushSection('evaluation', 'financialTotal', report.dashboard.financialTotal);
  pushSection('evaluation', 'riskOverall', report.dashboard.riskOverall);
  pushSection('evaluation', 'opportunityOverall', report.dashboard.opportunityOverall);
  pushSection('evaluation', 'revisionNumber', report.evaluation.currentRevisionNumber);
  pushSection('evaluation', 'scoringVersion', report.evaluation.scoringVersionInfo.scoringVersion);
  pushSection('evaluation', 'catalogVersion', report.evaluation.scoringVersionInfo.catalogVersion);

  if (report.evaluation.stage1Financial) {
    for (const item of report.evaluation.stage1Financial.items) {
      pushSection('stage1_financial', `${item.id}.level`, item.level);
      pushSection('stage1_financial', `${item.id}.score`, item.score);
    }
  }

  for (const topic of report.evaluation.stage1Topics) {
    pushSection('stage1_topic', `${topic.topicCode}.applicable`, topic.applicable);
    pushSection('stage1_topic', `${topic.topicCode}.magnitude`, topic.magnitude);
    pushSection('stage1_topic', `${topic.topicCode}.scale`, topic.scale);
    pushSection('stage1_topic', `${topic.topicCode}.irreversibility`, topic.irreversibility);
    pushSection('stage1_topic', `${topic.topicCode}.likelihood`, topic.likelihood);
    pushSection('stage1_topic', `${topic.topicCode}.impactScore`, topic.impactScore);
    pushSection('stage1_topic', `${topic.topicCode}.priorityBand`, topic.priorityBand);
    pushSection('stage1_topic', `${topic.topicCode}.evidenceBasis`, topic.evidenceBasis);
    pushSection('stage1_topic', `${topic.topicCode}.evidenceNote`, topic.evidenceNote ?? null);
  }

  for (const risk of report.evaluation.stage2Risks) {
    pushSection('stage2_risk', `${risk.riskCode}.applicable`, risk.applicable);
    pushSection('stage2_risk', `${risk.riskCode}.probability`, risk.probability);
    pushSection('stage2_risk', `${risk.riskCode}.impact`, risk.impact);
    pushSection('stage2_risk', `${risk.riskCode}.ratingScore`, risk.ratingScore);
    pushSection('stage2_risk', `${risk.riskCode}.ratingLabel`, risk.ratingLabel);
    pushSection('stage2_risk', `${risk.riskCode}.evidenceBasis`, risk.evidenceBasis);
    pushSection('stage2_risk', `${risk.riskCode}.evidenceNote`, risk.evidenceNote ?? null);
  }

  for (const opportunity of report.evaluation.stage2Opportunities) {
    pushSection(
      'stage2_opportunity',
      `${opportunity.opportunityCode}.applicable`,
      opportunity.applicable
    );
    pushSection(
      'stage2_opportunity',
      `${opportunity.opportunityCode}.likelihood`,
      opportunity.likelihood
    );
    pushSection('stage2_opportunity', `${opportunity.opportunityCode}.impact`, opportunity.impact);
    pushSection(
      'stage2_opportunity',
      `${opportunity.opportunityCode}.ratingScore`,
      opportunity.ratingScore
    );
    pushSection(
      'stage2_opportunity',
      `${opportunity.opportunityCode}.ratingLabel`,
      opportunity.ratingLabel
    );
    pushSection(
      'stage2_opportunity',
      `${opportunity.opportunityCode}.evidenceBasis`,
      opportunity.evidenceBasis
    );
    pushSection(
      'stage2_opportunity',
      `${opportunity.opportunityCode}.evidenceNote`,
      opportunity.evidenceNote ?? null
    );
  }

  for (const sdg of report.sdgAlignment.items) {
    pushSection('sdg_alignment', `${sdg.number}`, `${sdg.title} (${sdg.sourceType})`);
  }

  for (const recommendation of report.dashboard.recommendations) {
    pushSection('recommendation', `${recommendation.id}.title`, recommendation.title);
    pushSection('recommendation', `${recommendation.id}.source`, recommendation.source);
    pushSection('recommendation', `${recommendation.id}.severity`, recommendation.severityBand);
    pushSection('recommendation', `${recommendation.id}.text`, recommendation.text);
    pushSection(
      'recommendation',
      `${recommendation.id}.actionStatus`,
      recommendation.action?.status ?? null
    );
    pushSection(
      'recommendation',
      `${recommendation.id}.ownerNote`,
      recommendation.action?.ownerNote ?? null
    );
  }

  return [['section', 'field', 'value'], ...rows]
    .map((row) => row.map((value) => escapeCsvCell(value)).join(','))
    .join('\n');
}
