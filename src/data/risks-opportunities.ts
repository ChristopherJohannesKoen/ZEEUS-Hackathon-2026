// Risk and Opportunity item definitions for Stage II

export interface RiskDef {
  id: string;
  title: string;
  category: string;
  description: string;
  probHint: string;
  impactHint: string;
}

export interface OpportunityDef {
  id: string;
  title: string;
  category: string;
  description: string;
  likelihoodHint: string;
  impactHint: string;
}

// ─── RISK MATRIX ─────────────────────────────────────────────────────────────
// Rating = matrix[probability][impact] → 0-4
// Rows: probability (1=Rare, 2=Could occur, 3=Likely, 4=Very likely)
// Cols: impact (1=Low, 2=Moderate, 3=Significant, 4=High)
export const RISK_MATRIX: Record<number, Record<number, number>> = {
  0: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }, // N/A
  1: { 0: 0, 1: 0, 2: 1, 3: 1, 4: 2 }, // Rare
  2: { 0: 0, 1: 1, 2: 1, 3: 2, 4: 3 }, // Could occur
  3: { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4 }, // Likely
  4: { 0: 0, 1: 2, 2: 3, 3: 4, 4: 4 }, // Very likely
};

export const RISK_RATING_LABELS: Record<number, string> = {
  0: "Neutral",
  1: "Sustainable",
  2: "Moderate",
  3: "Severe",
  4: "Critical",
};

// ─── OPPORTUNITY MATRIX ───────────────────────────────────────────────────────
export const OPPORTUNITY_MATRIX: Record<number, Record<number, number>> = {
  0: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }, // N/A
  1: { 0: 0, 1: 0, 2: 1, 3: 1, 4: 2 }, // Rare
  2: { 0: 0, 1: 1, 2: 1, 3: 2, 4: 3 }, // Could occur
  3: { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4 }, // Likely
  4: { 0: 0, 1: 2, 2: 3, 3: 4, 4: 4 }, // Very likely
};

export const OPPORTUNITY_RATING_LABELS: Record<number, string> = {
  0: "Neutral",
  1: "Small",
  2: "Reasonable",
  3: "Sustainable",
  4: "Great",
};

// ─── Risk definitions ─────────────────────────────────────────────────────────
export const RISK_DEFINITIONS: RiskDef[] = [
  {
    id: "R1",
    title: "Climate Policy & Regulatory Risk",
    category: "Environmental",
    description: "Exposure to carbon taxes, emission limits, or sustainability reporting mandates that increase costs or constrain operations.",
    probHint: "Consider current and planned climate legislation in your key markets.",
    impactHint: "Assess cost exposure, compliance burden, and operational constraints.",
  },
  {
    id: "R2",
    title: "Physical Climate Risk",
    category: "Environmental",
    description: "Direct operational disruption from extreme weather, flooding, drought, or rising temperatures.",
    probHint: "Consider geography, supply chain locations, and climate projections.",
    impactHint: "Asset damage, supply disruptions, increased insurance costs.",
  },
  {
    id: "R3",
    title: "Water Scarcity Risk",
    category: "Environmental",
    description: "Insufficient water availability or quality threatening operations, suppliers, or customers.",
    probHint: "Evaluate water dependency and basin stress in operating regions.",
    impactHint: "Production halts, higher water costs, regulatory withdrawal limits.",
  },
  {
    id: "R4",
    title: "Biodiversity & Land Use Risk",
    category: "Environmental",
    description: "Business activities near or dependent on sensitive ecosystems face regulatory or reputational exposure.",
    probHint: "Assess proximity to protected areas and nature-dependent inputs.",
    impactHint: "Permitting delays, reputational damage, supply disruptions.",
  },
  {
    id: "R5",
    title: "Resource & Supply Chain Risk",
    category: "Environmental",
    description: "Dependence on scarce, volatile, or single-source materials threatening continuity.",
    probHint: "Consider critical materials, supplier concentration, and circular gaps.",
    impactHint: "Cost spikes, production gaps, reputational issues.",
  },
  {
    id: "R6",
    title: "Workforce & Labor Rights Risk",
    category: "Social",
    description: "Employee wellbeing, rights violations, or talent retention failures that harm performance.",
    probHint: "HR practices, workforce size, labour market conditions.",
    impactHint: "Talent loss, legal liability, brand damage.",
  },
  {
    id: "R7",
    title: "Supply Chain Labor Risk",
    category: "Social",
    description: "Labor rights abuses, forced labor, or unsafe conditions in the supply chain triggering legal or reputational harm.",
    probHint: "Supplier geography, audit practices, high-risk sectors.",
    impactHint: "Legal penalties, buyer requirements, press exposure.",
  },
  {
    id: "R8",
    title: "Community & Social License Risk",
    category: "Social",
    description: "Loss of trust or opposition from affected communities disrupting operations or growth.",
    probHint: "Community engagement practices and project footprint.",
    impactHint: "Operational delays, protests, permit refusals.",
  },
  {
    id: "R9",
    title: "Consumer & Product Safety Risk",
    category: "Social",
    description: "Products or services causing harm, litigation, or regulatory action that damages revenue and reputation.",
    probHint: "Product type, safety testing maturity, user exposure.",
    impactHint: "Recalls, fines, loss of customers.",
  },
  {
    id: "R10",
    title: "Governance & Ethics Risk",
    category: "Governance",
    description: "Weak governance, corruption, or compliance failures that trigger legal, financial, or reputational consequences.",
    probHint: "Board structure, compliance systems, geographic corruption risk.",
    impactHint: "Fines, debarment, investor withdrawal.",
  },
];

// ─── Opportunity definitions ──────────────────────────────────────────────────
export const OPPORTUNITY_DEFINITIONS: OpportunityDef[] = [
  {
    id: "O1",
    title: "Clean Energy Transition",
    category: "Environmental",
    description: "Revenue or cost savings from clean energy products, services, or operations.",
    likelihoodHint: "Market growth in renewables, policy incentives, and energy costs.",
    impactHint: "Cost reduction, new revenue streams, competitive advantage.",
  },
  {
    id: "O2",
    title: "Resource Efficiency Gains",
    category: "Environmental",
    description: "Competitive advantage from reduced material, water, or energy use.",
    likelihoodHint: "Current resource costs and operational efficiency gap.",
    impactHint: "Operating cost reductions and improved margins.",
  },
  {
    id: "O3",
    title: "Sustainable Products & Services",
    category: "Environmental",
    description: "Growing market demand for green, circular, or low-impact products.",
    likelihoodHint: "Consumer trends, B2B procurement standards, regulatory push.",
    impactHint: "Revenue growth, premium pricing, brand differentiation.",
  },
  {
    id: "O4",
    title: "Circular Economy Business Model",
    category: "Environmental",
    description: "New revenue streams from reuse, repair, leasing, or material recovery.",
    likelihoodHint: "Industry adoption rates and customer appetite for circular models.",
    impactHint: "New revenue, reduced material costs, customer lock-in.",
  },
  {
    id: "O5",
    title: "Carbon Markets & Green Finance",
    category: "Environmental",
    description: "Access to green bonds, sustainability-linked finance, or carbon credits.",
    likelihoodHint: "Capital market access, ESG investor interest, carbon pricing.",
    impactHint: "Lower cost of capital, grant income, investor attraction.",
  },
  {
    id: "O6",
    title: "Social Impact & Inclusive Markets",
    category: "Social",
    description: "Expanding into underserved markets or delivering measurable social value creates strategic differentiation.",
    likelihoodHint: "Market accessibility, impact investor interest, government incentives.",
    impactHint: "New customer segments, public funding, brand equity.",
  },
  {
    id: "O7",
    title: "Talent & Employer Brand",
    category: "Social",
    description: "Strong sustainability credentials attract and retain purpose-driven talent.",
    likelihoodHint: "Talent market conditions and employee sustainability priorities.",
    impactHint: "Lower recruitment costs, higher retention, productivity gains.",
  },
  {
    id: "O8",
    title: "Community Partnerships & Licensing",
    category: "Social",
    description: "Strong community relationships unlock accelerated growth and social license.",
    likelihoodHint: "Engagement quality and project footprint in communities.",
    impactHint: "Faster permitting, co-development opportunities.",
  },
  {
    id: "O9",
    title: "Digital & Data Innovation",
    category: "Governance",
    description: "Using technology to enhance transparency, compliance, or sustainability monitoring.",
    likelihoodHint: "Digital maturity and sustainability data demand from customers/regulators.",
    impactHint: "Operational efficiency, regulatory compliance, data monetization.",
  },
  {
    id: "O10",
    title: "ESG Reporting & Stakeholder Trust",
    category: "Governance",
    description: "Credible sustainability reporting builds investor, customer, and partner confidence.",
    likelihoodHint: "Regulatory reporting requirements and customer ESG diligence.",
    impactHint: "Investor access, customer retention, partnership unlocked.",
  },
];

// Probability/Impact level labels
export const PROB_LABELS: Record<number, string> = {
  0: "N/A",
  1: "Rare",
  2: "Could occur",
  3: "Likely",
  4: "Very likely",
};

export const IMPACT_LABELS: Record<number, string> = {
  0: "N/A",
  1: "Low",
  2: "Moderate",
  3: "Significant",
  4: "High",
};
