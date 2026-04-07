'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEvaluationStore } from '@/store/evaluationStore';
import { computeDashboardSummary } from '@/lib/scoring';
import { formatDate, formatDateRelative } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusChip, ConfidenceChip } from '@/components/ui/Badge';
import {
  Plus,
  Search,
  ArrowRight,
  Copy,
  Trash2,
  FileText,
  Filter,
  SortAsc,
  BarChart3
} from 'lucide-react';
import type { EvaluationStatus } from '@/types/evaluation';

export default function EvaluationsPage() {
  const router = useRouter();
  const { evaluations, deleteEvaluation, duplicateEvaluation } = useEvaluationStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EvaluationStatus | 'all'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = evaluations.filter((e) => {
    const matchSearch = e.context.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function handleDelete(id: string) {
    deleteEvaluation(id);
    setDeleteConfirm(null);
  }

  function handleDuplicate(id: string) {
    const newId = duplicateEvaluation(id);
    router.push(`/app/evaluate/${newId}/summary`);
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Evaluations</h1>
          <p className="text-gray-500 mt-1">
            {evaluations.length} evaluation{evaluations.length !== 1 ? 's' : ''} in your workspace.
          </p>
        </div>
        <Link href="/app/evaluate/start">
          <Button variant="primary" leftIcon={<Plus size={15} />}>
            New Evaluation
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search evaluations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-surface-border bg-white pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          {(['all', 'draft', 'in_progress', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                statusFilter === s
                  ? 'bg-brand text-white'
                  : 'bg-white border border-surface-border text-gray-600 hover:bg-surface-muted'
              }`}
            >
              {s === 'all'
                ? 'All'
                : s === 'in_progress'
                  ? 'In Progress'
                  : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table / card list */}
      {filtered.length === 0 ? (
        <Card className="text-center py-16">
          <BarChart3 size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">
            {search || statusFilter !== 'all'
              ? 'No evaluations match your filters.'
              : 'No evaluations yet.'}
          </p>
          {!search && statusFilter === 'all' && (
            <Link href="/app/evaluate/start">
              <Button variant="primary" leftIcon={<Plus size={15} />}>
                Start your first evaluation
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((ev) => {
            const summary = ev.stage1 && ev.stage2 ? computeDashboardSummary(ev) : null;
            return (
              <Card key={ev.id} className="group">
                <div className="flex items-start gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 text-base">{ev.context.name}</h3>
                      <StatusChip status={ev.status} />
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span>
                        {ev.context.naceCode} – {ev.context.naceLabel.slice(0, 35)}...
                      </span>
                      <span>·</span>
                      <span>{ev.context.stage}</span>
                      <span>·</span>
                      <span>{ev.context.offeringType}</span>
                      <span>·</span>
                      <span>Updated {formatDateRelative(ev.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Score summary */}
                  {summary && (
                    <div className="hidden lg:flex items-center gap-5 text-xs border-l border-surface-border pl-5 flex-shrink-0">
                      <div className="text-center">
                        <div className="text-xl font-black text-brand-dark">
                          {summary.financialNormalized}%
                        </div>
                        <div className="text-gray-400">Financial</div>
                      </div>
                      <div className="text-center">
                        <div
                          className={`text-lg font-black ${
                            summary.riskOverallLabel === 'Critical'
                              ? 'text-red-700'
                              : summary.riskOverallLabel === 'Severe'
                                ? 'text-orange-600'
                                : 'text-amber-600'
                          }`}
                        >
                          {summary.riskOverallLabel}
                        </div>
                        <div className="text-gray-400">Risk</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-black text-green-700">
                          {summary.opportunityOverallLabel}
                        </div>
                        <div className="text-gray-400">Opportunity</div>
                      </div>
                      <ConfidenceChip level={summary.confidenceBand} />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {ev.status === 'completed' ? (
                      <>
                        <Link
                          href={`/app/evaluate/${ev.id}/dashboard`}
                          className="btn-primary text-xs"
                        >
                          Dashboard <ArrowRight size={12} />
                        </Link>
                        <Link href={`/app/report/${ev.id}`} className="btn-secondary text-xs">
                          <FileText size={13} />
                          Report
                        </Link>
                      </>
                    ) : (
                      <Link
                        href={`/app/evaluate/${ev.id}/${ev.stage1 ? (ev.stage2 ? 'impact-summary' : 'stage-2') : 'stage-1'}`}
                        className="btn-primary text-xs"
                      >
                        Resume <ArrowRight size={12} />
                      </Link>
                    )}
                    <button
                      onClick={() => handleDuplicate(ev.id)}
                      title="Duplicate"
                      className="p-2 rounded-xl border border-surface-border bg-white text-gray-500 hover:text-brand hover:border-brand transition-all"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(ev.id)}
                      title="Delete"
                      className="p-2 rounded-xl border border-surface-border bg-white text-gray-500 hover:text-red-600 hover:border-red-200 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Delete confirmation inline */}
                {deleteConfirm === ev.id && (
                  <div className="mt-4 pt-4 border-t border-surface-border flex items-center justify-between bg-red-50 -mx-5 -mb-5 px-5 py-3 rounded-b-2xl">
                    <p className="text-sm text-red-700 font-medium">
                      Delete &quot;{ev.context.name}&quot;? This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(null)}>
                        Cancel
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(ev.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
