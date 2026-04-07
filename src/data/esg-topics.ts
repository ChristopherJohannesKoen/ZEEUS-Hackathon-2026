// E/S/G topic definitions with magnitude guidance text

export interface ESGTopicDefinition {
  id: string;
  code: string; // E1, E2, S1, G1, etc.
  category: 'E' | 'S' | 'G';
  title: string;
  question: string;
  magnitudeGuide: Record<1 | 2 | 3 | 4, string>;
  sdgs: number[]; // relevant SDGs for this topic
}

export const ESG_TOPICS: ESGTopicDefinition[] = [
  // ─── Environmental ────────────────────────────────────────────────────────
  {
    id: 'E1',
    code: 'E1',
    category: 'E',
    title: 'Climate Change',
    question: 'How much do our activities contribute to warming?',
    magnitudeGuide: {
      1: 'Minor direct emissions (office/service); low-carbon electricity/logistics available.',
      2: 'Contained footprint (server use; moderate logistics/consumption).',
      3: 'Major energy-intensive activities (manufacturing, transport); scope 3 rising.',
      4: 'Systemic high-carbon model (fossil-heavy processes/supply chain); lock-in risk.'
    },
    sdgs: [7, 13]
  },
  {
    id: 'E2',
    code: 'E2',
    category: 'E',
    title: 'Pollution',
    question: 'Do processes cause significant environmental pollution?',
    magnitudeGuide: {
      1: 'Minimal emissions (digital/office-based); limited packaging/testing.',
      2: 'Localized emissions (small logistics, lab testing with standard handling).',
      3: 'Notable pollutant load (pilot manufacturing, solvent/chemical use).',
      4: 'Cross-border or systemic pollution (hazardous substances; unmanaged networks).'
    },
    sdgs: [3, 6, 14]
  },
  {
    id: 'E3',
    code: 'E3',
    category: 'E',
    title: 'Water & Marine Resources',
    question: 'Do we threaten local ecosystems through water withdrawal?',
    magnitudeGuide: {
      1: 'Minimal water use (small office, digital service) in stable-water areas.',
      2: 'Noticeable onsite use (small kitchen, craft F&B) outside stressed basins.',
      3: 'Activity in water-scarce areas; regional suppliers/customers impacted by stress.',
      4: 'High-withdrawal operations or heavy dependence on scarce sources; basin constraints.'
    },
    sdgs: [6, 14]
  },
  {
    id: 'E4',
    code: 'E4',
    category: 'E',
    title: 'Biodiversity & Ecosystems',
    question: 'Do our activities destroy ecosystems or biodiversity?',
    magnitudeGuide: {
      1: 'Office/digital presence in non-sensitive urban areas; no ecosystem contact.',
      2: 'Limited local habitat effects (small-scale construction/tests in non-sensitive areas).',
      3: 'Noticeable impacts (materials from forestry/agriculture; proximity to sensitive zones).',
      4: 'Broad ecosystem degradation or irreversible change; expansion near high-value ecological areas.'
    },
    sdgs: [14, 15]
  },
  {
    id: 'E5',
    code: 'E5',
    category: 'E',
    title: 'Circular Economy',
    question: 'How intensive is our resource use and waste generation?',
    magnitudeGuide: {
      1: 'Minimal materials/consumables; near-zero waste (digital platforms).',
      2: 'Mixed materials; some waste; limited supply chain dependence.',
      3: 'High material/energy use; notable waste generation across processes.',
      4: 'Linear, take-make-waste model; hard-to-recycle materials; systemic waste at scale.'
    },
    sdgs: [12]
  },

  // ─── Social ────────────────────────────────────────────────────────────────
  {
    id: 'S1',
    code: 'S1',
    category: 'S',
    title: 'Own Workforce',
    question: 'Do our practices violate employee rights?',
    magnitudeGuide: {
      1: 'Isolated/unclear HR issue; single person affected; easy fix.',
      2: 'Repeated or departmental issue; needs process/leadership correction.',
      3: 'Core teams/multiple locations affected; strong HR intervention required.',
      4: 'System-wide harm (e.g., unsafe conditions); irreversible consequences.'
    },
    sdgs: [8]
  },
  {
    id: 'S2',
    code: 'S2',
    category: 'S',
    title: 'Workers in the Value Chain',
    question: 'Are there labor risks in our value chain?',
    magnitudeGuide: {
      1: 'Minor/isolated supplier non-conformance.',
      2: 'Several suppliers/contractors; medium-risk sites; training/monitoring needed.',
      3: 'Common/recurring issues; systemic practices in high-risk countries.',
      4: 'Severe/systemic harm; legal and reputational exposure.'
    },
    sdgs: [8, 10]
  },
  {
    id: 'S3',
    code: 'S3',
    category: 'S',
    title: 'Affected Communities',
    question: 'Do our actions impact local communities negatively?',
    magnitudeGuide: {
      1: 'Minor, temporary inconvenience — occasional noise, minimal neighborhood change.',
      2: 'Noticeable but contained disruption; limited community segment.',
      3: 'Serious negative impact; multiple communities; long-term remediation.',
      4: 'Regional/systemic impacts; displacement or heritage damage.'
    },
    sdgs: [11]
  },
  {
    id: 'S4',
    code: 'S4',
    category: 'S',
    title: 'Consumers & End-users',
    question: 'Do our products/services harm consumer rights?',
    magnitudeGuide: {
      1: 'Minor inconvenience; no real harm.',
      2: 'Misleading/unfair but limited harm; contained cohort.',
      3: 'Clear consumer harm (unsafe product/claims).',
      4: 'Severe/systemic harm (injuries, mass data loss, etc.).'
    },
    sdgs: [3, 12]
  },

  // ─── Governance ────────────────────────────────────────────────────────────
  {
    id: 'G1',
    code: 'G1',
    category: 'G',
    title: 'Corporate Ethics & Governance',
    question: 'Do poor standards cause ethical/regulatory violations?',
    magnitudeGuide: {
      1: 'Minor disclosure/ethics issue; easy correction.',
      2: 'Repeated issues; policy/staff updates required.',
      3: 'Serious breaches/conflicts; management intervention.',
      4: 'Systemic ethical failure (fraud/corruption); trust collapse risk.'
    },
    sdgs: [16]
  }
];

// ─── Financial KPI definitions ────────────────────────────────────────────────
export interface FinancialKPIDef {
  id: string;
  title: string;
  description: string;
  levels: Record<number, string>;
}

export const FINANCIAL_KPIS: FinancialKPIDef[] = [
  {
    id: 'roiIrrNpv',
    title: 'ROI / IRR / NPV & Payback Period',
    description: 'Expected return on investment and time to recover initial costs.',
    levels: {
      0: 'Not evaluated — return/valuation not yet calculated.',
      1: 'Below industry average — expected returns trail sector norms.',
      2: 'Average / No benchmark — roughly at market pace or no verified benchmark.',
      3: 'Above industry average — returns expected to outperform.'
    }
  },
  {
    id: 'sensitivityAnalysis',
    title: 'Sensitivity Analysis (Robustness)',
    description: 'How stable are your outcomes when key assumptions change?',
    levels: {
      0: 'Not evaluated — no scenarios or cost drivers tested.',
      1: 'High volatility — outcomes swing widely with small input changes.',
      2: 'Moderate volatility — noticeable variability, manageable with controls.',
      3: 'Low volatility / Stable — resilient outcomes across tested ranges.'
    }
  },
  {
    id: 'uspStrategicFit',
    title: 'USP / Strategic Fit',
    description: 'How clearly differentiated is your offering in the market?',
    levels: {
      0: 'Not evaluated — USP not articulated or tested with customers yet.',
      1: 'No USP — indistinguishable from competitors; no clear advantage.',
      2: 'Weak / Moderate USP — some differentiation but easy to copy or narrow.',
      3: 'Strong / Unique USP — clear, defensible advantage aligned to strategy.'
    }
  },
  {
    id: 'marketGrowth',
    title: 'Market Growth',
    description: 'Is the market you serve growing, stable, or shrinking?',
    levels: {
      0: 'Not evaluated — no credible market size/growth evidence yet.',
      1: 'Shrinking — category contracting or being displaced.',
      2: 'Mature — stable/slow growth; efficiency/positioning matter most.',
      3: 'Growing — expanding category; demand tailwinds exist.'
    }
  }
];
