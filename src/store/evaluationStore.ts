"use client";
// ─────────────────────────────────────────────────────────────────────────────
// Zustand store – frontend mock for all evaluation state
// Replace each action with API calls when wiring to the real backend.
// ─────────────────────────────────────────────────────────────────────────────
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Evaluation,
  StartupContext,
  Stage1Data,
  Stage2Data,
  SDGAlignment,
  MockUser,
  ESGTopicAssessment,
  RiskItem,
  OpportunityItem,
} from "@/types/evaluation";
import { SEED_EVALUATIONS, MOCK_USER } from "@/data/seed";
import { generateId } from "@/lib/utils";
import {
  calcRiskRating,
  calcOpportunityRating,
} from "@/lib/scoring";
import { ESG_TOPICS } from "@/data/esg-topics";
import { RISK_DEFINITIONS, OPPORTUNITY_DEFINITIONS } from "@/data/risks-opportunities";
import { NACE_SDG_MAP } from "@/data/nace";
import { STAGE_SDG_MAP } from "@/data/sdgs";

interface EvaluationState {
  currentUser: MockUser;
  evaluations: Evaluation[];
  activeEvaluationId: string | null;

  // Actions
  setActiveEvaluation: (id: string) => void;
  createEvaluation: (context: StartupContext) => string;
  updateContext: (id: string, context: StartupContext) => void;
  updateStage1: (id: string, data: Stage1Data) => void;
  updateStage2: (id: string, data: Stage2Data) => void;
  updateSDGAlignment: (id: string, alignment: SDGAlignment[]) => void;
  updateStatus: (id: string, status: Evaluation["status"]) => void;
  deleteEvaluation: (id: string) => void;
  duplicateEvaluation: (id: string) => string;
  updateESGTopic: (evalId: string, topicId: string, data: Partial<ESGTopicAssessment>) => void;
  updateRiskItem: (evalId: string, itemId: string, probability: number, impact: number) => void;
  updateRiskApplicable: (evalId: string, itemId: string, applicable: boolean) => void;
  updateOpportunityItem: (evalId: string, itemId: string, likelihood: number, impact: number) => void;
  updateOpportunityApplicable: (evalId: string, itemId: string, applicable: boolean) => void;
  getEvaluation: (id: string) => Evaluation | undefined;
  computeSDGAlignment: (id: string) => SDGAlignment[];
  initializeStage1IfNeeded: (id: string) => void;
  initializeStage2IfNeeded: (id: string) => void;
}

// Build initial empty Stage 1
function emptyStage1(): Stage1Data {
  const emptyESG = (id: string): ESGTopicAssessment => ({
    topicId: id,
    applicable: true,
    magnitude: 1,
    scale: 1,
    irreversibility: 1,
    likelihood: 0.5,
    evidenceBasis: "assumed",
  });

  const envTopics = ESG_TOPICS.filter((t) => t.category === "E");
  const socTopics = ESG_TOPICS.filter((t) => t.category === "S" || t.category === "G");

  return {
    financial: { roiIrrNpv: 0, sensitivityAnalysis: 0, uspStrategicFit: 0, marketGrowth: 0 },
    environmental: Object.fromEntries(envTopics.map((t) => [t.id, emptyESG(t.id)])),
    social: Object.fromEntries(socTopics.map((t) => [t.id, emptyESG(t.id)])),
  };
}

// Build initial empty Stage 2
function emptyStage2(): Stage2Data {
  return {
    risks: Object.fromEntries(
      RISK_DEFINITIONS.map((r) => [
        r.id,
        { itemId: r.id, applicable: true, probability: 0, impact: 0, ratingScore: 0, ratingLabel: "Neutral" as const },
      ])
    ),
    opportunities: Object.fromEntries(
      OPPORTUNITY_DEFINITIONS.map((o) => [
        o.id,
        { itemId: o.id, applicable: true, likelihood: 0, impact: 0, ratingScore: 0, ratingLabel: "Neutral" as const },
      ])
    ),
  };
}

export const useEvaluationStore = create<EvaluationState>()(
  persist(
    (set, get) => ({
      currentUser: MOCK_USER,
      evaluations: SEED_EVALUATIONS,
      activeEvaluationId: null,

      setActiveEvaluation: (id) => set({ activeEvaluationId: id }),

      getEvaluation: (id) => get().evaluations.find((e) => e.id === id),

      createEvaluation: (context) => {
        const id = generateId();
        const now = new Date().toISOString();
        const newEval: Evaluation = {
          id,
          userId: get().currentUser.id,
          status: "draft",
          createdAt: now,
          updatedAt: now,
          context,
        };
        set((state) => ({
          evaluations: [newEval, ...state.evaluations],
          activeEvaluationId: id,
        }));
        return id;
      },

      updateContext: (id, context) =>
        set((state) => ({
          evaluations: state.evaluations.map((e) =>
            e.id === id ? { ...e, context, updatedAt: new Date().toISOString() } : e
          ),
        })),

      updateStatus: (id, status) =>
        set((state) => ({
          evaluations: state.evaluations.map((e) =>
            e.id === id ? { ...e, status, updatedAt: new Date().toISOString() } : e
          ),
        })),

      updateStage1: (id, data) =>
        set((state) => ({
          evaluations: state.evaluations.map((e) =>
            e.id === id
              ? { ...e, stage1: data, status: "in_progress", updatedAt: new Date().toISOString() }
              : e
          ),
        })),

      updateStage2: (id, data) =>
        set((state) => ({
          evaluations: state.evaluations.map((e) =>
            e.id === id
              ? { ...e, stage2: data, updatedAt: new Date().toISOString() }
              : e
          ),
        })),

      updateSDGAlignment: (id, alignment) =>
        set((state) => ({
          evaluations: state.evaluations.map((e) =>
            e.id === id
              ? { ...e, sdgAlignment: alignment, updatedAt: new Date().toISOString() }
              : e
          ),
        })),

      deleteEvaluation: (id) =>
        set((state) => ({
          evaluations: state.evaluations.filter((e) => e.id !== id),
          activeEvaluationId: state.activeEvaluationId === id ? null : state.activeEvaluationId,
        })),

      duplicateEvaluation: (id) => {
        const original = get().getEvaluation(id);
        if (!original) return id;
        const newId = generateId();
        const now = new Date().toISOString();
        const copy: Evaluation = {
          ...JSON.parse(JSON.stringify(original)),
          id: newId,
          status: "draft",
          createdAt: now,
          updatedAt: now,
          context: {
            ...original.context,
            name: `${original.context.name} (Copy)`,
          },
        };
        set((state) => ({ evaluations: [copy, ...state.evaluations] }));
        return newId;
      },

      // Granular ESG topic update
      updateESGTopic: (evalId, topicId, data) =>
        set((state) => ({
          evaluations: state.evaluations.map((e) => {
            if (e.id !== evalId || !e.stage1) return e;
            const category = ESG_TOPICS.find((t) => t.id === topicId)?.category;
            const section = category === "E" ? "environmental" : "social";
            return {
              ...e,
              updatedAt: new Date().toISOString(),
              stage1: {
                ...e.stage1,
                [section]: {
                  ...e.stage1[section as "environmental" | "social"],
                  [topicId]: {
                    ...e.stage1[section as "environmental" | "social"][topicId],
                    ...data,
                  },
                },
              },
            };
          }),
        })),

      updateRiskItem: (evalId, itemId, probability, impact) => {
        const prob = probability as import('@/types/evaluation').ProbabilityLevel;
        const imp = impact as import('@/types/evaluation').RiskImpactLevel;
        const { score: ratingScore, label: ratingLabel } = calcRiskRating(prob, imp);
        set((state) => ({
          evaluations: state.evaluations.map((e) => {
            if (e.id !== evalId || !e.stage2) return e;
            const updated: import('@/types/evaluation').RiskItem = { ...e.stage2.risks[itemId], probability: prob, impact: imp, ratingScore, ratingLabel };
            return {
              ...e,
              updatedAt: new Date().toISOString(),
              stage2: {
                ...e.stage2,
                risks: { ...e.stage2.risks, [itemId]: updated },
              },
            } as import('@/types/evaluation').Evaluation;
          }),
        }));
      },

      updateRiskApplicable: (evalId, itemId, applicable) =>
        set((state) => ({
          evaluations: state.evaluations.map((e) => {
            if (e.id !== evalId || !e.stage2) return e;
            return {
              ...e,
              updatedAt: new Date().toISOString(),
              stage2: {
                ...e.stage2,
                risks: {
                  ...e.stage2.risks,
                  [itemId]: {
                    ...e.stage2.risks[itemId],
                    applicable,
                    ...(applicable ? {} : { probability: 0, impact: 0, ratingScore: 0, ratingLabel: "Neutral" as const }),
                  },
                },
              },
            };
          }),
        })),

      updateOpportunityItem: (evalId, itemId, likelihood, impact) => {
        const lik = likelihood as import('@/types/evaluation').ProbabilityLevel;
        const imp = impact as import('@/types/evaluation').RiskImpactLevel;
        const { score: ratingScore, label: ratingLabel } = calcOpportunityRating(lik, imp);
        set((state) => ({
          evaluations: state.evaluations.map((e) => {
            if (e.id !== evalId || !e.stage2) return e;
            const updated: import('@/types/evaluation').OpportunityItem = { ...e.stage2.opportunities[itemId], likelihood: lik, impact: imp, ratingScore, ratingLabel };
            return {
              ...e,
              updatedAt: new Date().toISOString(),
              stage2: {
                ...e.stage2,
                opportunities: { ...e.stage2.opportunities, [itemId]: updated },
              },
            } as import('@/types/evaluation').Evaluation;
          }),
        }));
      },

      updateOpportunityApplicable: (evalId, itemId, applicable) =>
        set((state) => ({
          evaluations: state.evaluations.map((e) => {
            if (e.id !== evalId || !e.stage2) return e;
            return {
              ...e,
              updatedAt: new Date().toISOString(),
              stage2: {
                ...e.stage2,
                opportunities: {
                  ...e.stage2.opportunities,
                  [itemId]: {
                    ...e.stage2.opportunities[itemId],
                    applicable,
                    ...(applicable ? {} : { likelihood: 0, impact: 0, ratingScore: 0, ratingLabel: "Neutral" as const }),
                  },
                },
              },
            };
          }),
        })),

      initializeStage1IfNeeded: (id) => {
        const eval_ = get().getEvaluation(id);
        if (eval_ && !eval_.stage1) {
          set((state) => ({
            evaluations: state.evaluations.map((e) =>
              e.id === id ? { ...e, stage1: emptyStage1() } : e
            ),
          }));
        }
      },

      initializeStage2IfNeeded: (id) => {
        const eval_ = get().getEvaluation(id);
        if (eval_ && !eval_.stage2) {
          set((state) => ({
            evaluations: state.evaluations.map((e) =>
              e.id === id ? { ...e, stage2: emptyStage2() } : e
            ),
          }));
        }
      },

      computeSDGAlignment: (id) => {
        const eval_ = get().getEvaluation(id);
        if (!eval_) return [];

        const stageSDGs = new Set<number>(STAGE_SDG_MAP[eval_.context.stage] ?? []);
        const naceSDGs = new Set<number>(NACE_SDG_MAP[eval_.context.naceCode] ?? []);

        const all = new Set([...stageSDGs, ...naceSDGs]);
        return Array.from(all).map((num) => {
          let source: "Stage" | "Business" | "Both" = "Business";
          if (stageSDGs.has(num) && naceSDGs.has(num)) source = "Both";
          else if (stageSDGs.has(num)) source = "Stage";
          return { sdgNumber: num, source };
        }).sort((a, b) => a.sdgNumber - b.sdgNumber);
      },
    }),
    {
      name: "zeeus-evaluations",
      version: 1,
    }
  )
);
