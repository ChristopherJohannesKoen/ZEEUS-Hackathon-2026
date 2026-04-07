"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useEvaluationStore } from "@/store/evaluationStore";
import { SDG_DEFINITIONS } from "@/data/sdgs";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Globe2, ExternalLink, Target, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SDGSource } from "@/types/evaluation";

interface Props { params: Promise<{ id: string }> }

function SDGSourceBadge({ source }: { source: SDGSource }) {
  const config = {
    Stage: "bg-blue-100 text-blue-700",
    Business: "bg-purple-100 text-purple-700",
    Both: "bg-brand/15 text-brand-dark font-bold",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", config[source])}>
      {source}
    </span>
  );
}

function SDGDetailDrawer({
  sdgNumber,
  source,
  onClose,
}: {
  sdgNumber: number;
  source: SDGSource;
  onClose: () => void;
}) {
  const def = SDG_DEFINITIONS.find((s) => s.number === sdgNumber);
  if (!def) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="p-5 pb-4 flex items-start justify-between" style={{ backgroundColor: def.color + "20", borderBottom: `3px solid ${def.color}` }}>
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white font-black text-xl"
              style={{ backgroundColor: def.color }}
            >
              {def.number}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">SDG {def.number}</p>
              <h2 className="font-black text-gray-900 leading-tight">{def.title}</h2>
              <SDGSourceBadge source={source} />
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          {/* Goal summary */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Goal</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{def.summary}</p>
          </div>

          {/* Source explanation */}
          <div className="rounded-xl bg-brand/5 border border-brand/15 p-3 text-xs text-gray-600">
            <strong className="text-brand-dark">Source: </strong>
            {source === "Both"
              ? "This SDG is relevant both because of your current startup stage and your business category (NACE division)."
              : source === "Stage"
              ? "This SDG is suggested based on your current startup stage and the associated sustainability priorities."
              : "This SDG is suggested based on your business category (NACE division) and sectoral impact patterns."}
          </div>

          {/* Targets */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Target size={12} />
              Key Targets
            </h3>
            <div className="space-y-2.5">
              {def.targets.map((target) => (
                <div key={target.id} className="flex gap-2">
                  <span
                    className="text-[10px] font-bold rounded px-1.5 py-0.5 flex-shrink-0 mt-0.5 h-fit"
                    style={{ backgroundColor: def.color + "25", color: def.color }}
                  >
                    {target.id}
                  </span>
                  <p className="text-xs text-gray-600 leading-relaxed">{target.text}</p>
                </div>
              ))}
            </div>
          </div>

          <a
            href={`https://sdgs.un.org/goals/goal${def.number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-brand font-semibold hover:text-brand-dark"
          >
            <ExternalLink size={11} />
            View official SDG {def.number} page
          </a>
        </div>
      </div>
    </div>
  );
}

export default function SDGAlignmentPage({ params }: Props) {
  const { id } = use(params);
  const { getEvaluation, computeSDGAlignment, updateSDGAlignment } = useEvaluationStore();
  const [selectedSDG, setSelectedSDG] = useState<{ number: number; source: SDGSource } | null>(null);
  const [filter, setFilter] = useState<SDGSource | "All">("All");

  const evaluation = getEvaluation(id);

  useEffect(() => {
    if (evaluation && !evaluation.sdgAlignment?.length) {
      const alignment = computeSDGAlignment(id);
      updateSDGAlignment(id, alignment);
    }
  }, [id]);

  if (!evaluation) return null;

  const alignment = evaluation.sdgAlignment ?? computeSDGAlignment(id);
  const filtered = alignment.filter((a) => filter === "All" || a.source === filter);

  const counts = {
    All: alignment.length,
    Stage: alignment.filter((a) => a.source === "Stage" || a.source === "Both").length,
    Business: alignment.filter((a) => a.source === "Business" || a.source === "Both").length,
    Both: alignment.filter((a) => a.source === "Both").length,
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900 mb-1">SDG Alignment</h1>
          <p className="text-sm text-gray-500">
            {alignment.length} SDGs identified for {evaluation.context.name} — combining stage and business category signals.
          </p>
        </div>
        <Link href={`/app/evaluate/${id}/dashboard`}>
          <Button variant="primary" rightIcon={<ArrowRight size={15} />}>
            View Dashboard
          </Button>
        </Link>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-5">
        {(["All", "Stage", "Business", "Both"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all",
              filter === f ? "bg-brand text-white border-brand" : "bg-white text-gray-600 border-surface-border hover:border-brand"
            )}
          >
            {f}
            <span className={cn(
              "rounded-full text-[10px] px-1.5 py-0.5",
              filter === f ? "bg-white/20 text-white" : "bg-surface-muted text-gray-600"
            )}>
              {f === "Stage" ? counts.Stage : f === "Business" ? counts.Business : f === "Both" ? counts.Both : counts.All}
            </span>
          </button>
        ))}
      </div>

      {/* SDG explanation */}
      <Card className="mb-6 bg-brand/5 border-l-4 border-l-brand">
        <div className="flex items-start gap-2">
          <Globe2 size={15} className="text-brand mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-600 leading-relaxed">
            <strong className="text-brand-dark">Stage SDGs</strong> are derived from your current startup stage ({evaluation.context.stage}).
            {" "}<strong className="text-brand-dark">Business SDGs</strong> come from your NACE division ({evaluation.context.naceCode}).
            {" "}<strong className="text-brand-dark">Both</strong> means the SDG is reinforced by both signals — higher priority.
            <br />
            Click any SDG card to view the official goal summary and targets.
          </div>
        </div>
      </Card>

      {/* SDG cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filtered.map(({ sdgNumber, source }) => {
          const def = SDG_DEFINITIONS.find((s) => s.number === sdgNumber);
          if (!def) return null;
          return (
            <button
              key={sdgNumber}
              onClick={() => setSelectedSDG({ number: sdgNumber, source })}
              className="group relative rounded-2xl overflow-hidden text-left transition-all duration-200 hover:scale-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              style={{ backgroundColor: def.color }}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
                    SDG {def.number}
                  </span>
                  <SDGSourceBadge source={source} />
                </div>
                <h3 className="text-white font-bold text-sm leading-tight mb-2">{def.title}</h3>
                <div className="flex items-center gap-1 text-white/70 text-[10px]">
                  <Target size={9} />
                  {def.targets.length} targets
                </div>
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No SDGs match the selected filter.
        </div>
      )}

      {/* Drawer */}
      {selectedSDG && (
        <SDGDetailDrawer
          sdgNumber={selectedSDG.number}
          source={selectedSDG.source}
          onClose={() => setSelectedSDG(null)}
        />
      )}

      <div className="flex justify-between items-center mt-8 pt-6 border-t border-surface-border">
        <Link href={`/app/evaluate/${id}/impact-summary`} className="btn-secondary text-sm">
          ← Back to Impact Summary
        </Link>
        <Link href={`/app/evaluate/${id}/dashboard`}>
          <Button variant="primary" size="lg" rightIcon={<ArrowRight size={16} />}>
            View Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
