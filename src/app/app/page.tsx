"use client";
import Link from "next/link";
import { useEvaluationStore } from "@/store/evaluationStore";
import { computeDashboardSummary } from "@/lib/scoring";
import { formatDateRelative } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Plus,
  ArrowRight,
  ClipboardCheck,
  TrendingUp,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

export default function AppOverviewPage() {
  const { evaluations, currentUser } = useEvaluationStore();
  const recentEvals = evaluations.slice(0, 3);
  const completedCount = evaluations.filter((e) => e.status === "completed").length;
  const inProgressCount = evaluations.filter((e) => e.status === "in_progress").length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            Welcome back, {currentUser.name.split(" ")[0]}
          </h1>
          <p className="text-gray-500 mt-1">
            Your sustainability evaluation workspace.
          </p>
        </div>
        <Link href="/app/evaluate/start">
          <Button variant="primary" leftIcon={<Plus size={15} />}>
            New Evaluation
          </Button>
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total evaluations", value: evaluations.length, icon: <ClipboardCheck size={18} />, color: "brand" },
          { label: "Completed", value: completedCount, icon: <TrendingUp size={18} />, color: "green" },
          { label: "In progress", value: inProgressCount, icon: <AlertTriangle size={18} />, color: "amber" },
          { label: "Drafts", value: evaluations.length - completedCount - inProgressCount, icon: <Sparkles size={18} />, color: "gray" },
        ].map((stat) => (
          <Card key={stat.label} padding="md">
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl mb-3 ${
              stat.color === "brand" ? "bg-brand/10 text-brand" :
              stat.color === "green" ? "bg-green-100 text-green-600" :
              stat.color === "amber" ? "bg-amber-100 text-amber-600" :
              "bg-gray-100 text-gray-500"
            }`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-black text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Recent evaluations */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Recent Evaluations</h2>
          <Link href="/app/evaluations" className="text-sm font-semibold text-brand hover:text-brand-dark flex items-center gap-1">
            View all <ArrowRight size={13} />
          </Link>
        </div>

        {recentEvals.length === 0 ? (
          <Card className="text-center py-12">
            <Sparkles size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No evaluations yet. Start your first one.</p>
            <Link href="/app/evaluate/start">
              <Button variant="primary" leftIcon={<Plus size={15} />}>Start evaluation</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentEvals.map((ev) => {
              const summary = ev.stage1 && ev.stage2 ? computeDashboardSummary(ev) : null;
              return (
                <Card key={ev.id} hover className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-gray-900 truncate">{ev.context.name}</span>
                      <StatusChip status={ev.status} />
                    </div>
                    <div className="text-xs text-gray-500">
                      {ev.context.stage} · Updated {formatDateRelative(ev.updatedAt)}
                    </div>
                  </div>

                  {summary && (
                    <div className="hidden md:flex items-center gap-6 text-xs">
                      <div className="text-center">
                        <div className="font-bold text-brand-dark">{summary.financialNormalized}%</div>
                        <div className="text-gray-400">Financial</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-bold ${summary.riskOverallLabel === "Critical" ? "text-red-600" : summary.riskOverallLabel === "Severe" ? "text-orange-600" : "text-amber-600"}`}>
                          {summary.riskOverallLabel}
                        </div>
                        <div className="text-gray-400">Risk</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-green-700">{summary.opportunityOverallLabel}</div>
                        <div className="text-gray-400">Opportunity</div>
                      </div>
                    </div>
                  )}

                  <Link
                    href={ev.status === "completed" ? `/app/evaluate/${ev.id}/dashboard` : `/app/evaluate/${ev.id}/summary`}
                    className="btn-secondary text-xs whitespace-nowrap"
                  >
                    {ev.status === "completed" ? "View results" : "Resume"}
                    <ArrowRight size={12} />
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Getting started tips */}
      <Card accent className="bg-brand/5 border-l-brand">
        <h3 className="font-bold text-brand-dark mb-2">Guidance, not judgment</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          This tool helps you design sustainability into your startup from the start.
          Complete Stage I to identify material topics, then Stage II to map your risk
          and opportunity landscape. Your SDG Alignment and Dashboard will follow automatically.
        </p>
      </Card>
    </div>
  );
}
