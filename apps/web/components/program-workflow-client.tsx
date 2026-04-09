'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ProgramDetail, ProgramSubmissionStatus } from '@packages/shared';
import { Badge, Button, Card, Field, Input, Select, Textarea } from '@packages/ui';
import {
  createProgramSubmission,
  createReviewAssignment,
  createReviewComment,
  updateProgramSubmissionStatus
} from '../lib/client-api';
import { confidenceTone, priorityTone } from '../lib/display';

const reviewStatuses: ProgramSubmissionStatus[] = [
  'submitted',
  'in_review',
  'changes_requested',
  'approved',
  'archived'
];

function formatStage(value: string) {
  return value.replaceAll('_', ' ');
}

export function ProgramWorkflowClient({ program }: { program: ProgramDetail }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState(
    program.availableEvaluations[0]?.evaluationId ?? ''
  );
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [rationaleDrafts, setRationaleDrafts] = useState<Record<string, string>>({});
  const [assignmentState, setAssignmentState] = useState<
    Record<string, { reviewerUserId: string; dueAt: string }>
  >({});

  const selectedEvaluation = useMemo(
    () =>
      program.availableEvaluations.find((item) => item.evaluationId === selectedEvaluationId) ??
      null,
    [program.availableEvaluations, selectedEvaluationId]
  );
  const reviewerOptions = program.members.filter(
    (member) => member.role === 'reviewer' || member.role === 'manager'
  );

  const submitProgramEvaluation = () => {
    if (!selectedEvaluation) {
      return;
    }

    startTransition(async () => {
      setErrorMessage(null);
      try {
        await createProgramSubmission(program.id, {
          evaluationId: selectedEvaluation.evaluationId,
          revisionNumber: selectedEvaluation.currentRevisionNumber || null
        });
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to submit the evaluation to the program.'
        );
      }
    });
  };

  const updateStatus = (submissionId: string, status: ProgramSubmissionStatus) => {
    startTransition(async () => {
      setErrorMessage(null);
      try {
        await updateProgramSubmissionStatus(program.id, submissionId, {
          status,
          rationale: rationaleDrafts[submissionId]?.trim() || null
        });
        setRationaleDrafts((current) => ({ ...current, [submissionId]: '' }));
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to update the submission status.'
        );
      }
    });
  };

  const assignReviewer = (submissionId: string) => {
    const next = assignmentState[submissionId];
    if (!next?.reviewerUserId) {
      setErrorMessage('Choose a reviewer before creating an assignment.');
      return;
    }

    startTransition(async () => {
      setErrorMessage(null);
      try {
        await createReviewAssignment(program.id, submissionId, {
          reviewerUserId: next.reviewerUserId,
          dueAt: next.dueAt || null
        });
        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to assign the reviewer.');
      }
    });
  };

  const postComment = (submissionId: string) => {
    const body = commentDrafts[submissionId]?.trim();
    if (!body) {
      setErrorMessage('Write a comment before posting it.');
      return;
    }

    startTransition(async () => {
      setErrorMessage(null);
      try {
        await createReviewComment(program.id, submissionId, { body });
        setCommentDrafts((current) => ({ ...current, [submissionId]: '' }));
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to post the review comment.'
        );
      }
    });
  };

  return (
    <div className="grid gap-6">
      <Card className="border-surface-border">
        <h2 className="text-xl font-black text-slate-950">Submit a saved revision</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Program submissions stay separate from canonical evaluation status, so review workflows
          can ask for changes without mutating the underlying assessment.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <Field label="Evaluation revision">
            <Select
              value={selectedEvaluationId}
              onChange={(event) => setSelectedEvaluationId(event.target.value)}
            >
              <option value="">Choose an evaluation</option>
              {program.availableEvaluations.map((evaluation) => (
                <option key={evaluation.evaluationId} value={evaluation.evaluationId}>
                  {evaluation.name} / {formatStage(evaluation.context.currentStage)} /{' '}
                  {evaluation.context.businessCategoryMain ?? evaluation.context.naceDivision} /{' '}
                  revision {evaluation.currentRevisionNumber}
                </option>
              ))}
            </Select>
          </Field>
          <Button
            className="bg-brand hover:bg-brand-dark"
            disabled={
              isPending || !selectedEvaluation || selectedEvaluation.currentRevisionNumber < 1
            }
            onClick={submitProgramEvaluation}
            type="button"
          >
            {isPending ? 'Submitting...' : 'Submit revision'}
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-surface-border bg-[#fbfdf8]">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Cohort benchmark</p>
          <h3 className="mt-2 text-xl font-black text-slate-950">
            Portfolio-level signals from immutable submissions
          </h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-[20px] bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Avg financial</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {program.cohortSummary.averageFinancialTotal ?? 'n/a'}
              </p>
            </div>
            <div className="rounded-[20px] bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Avg risk</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {program.cohortSummary.averageRiskOverall?.toFixed(2) ?? 'n/a'}
              </p>
            </div>
            <div className="rounded-[20px] bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Avg opportunity
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {program.cohortSummary.averageOpportunityOverall?.toFixed(2) ?? 'n/a'}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[24px] bg-white p-4">
              <p className="text-sm font-bold text-slate-950">Submission funnel</p>
              <div className="mt-3 grid gap-2">
                {program.cohortSummary.submissionFunnel.map((item) => (
                  <div className="flex items-center justify-between gap-3" key={item.status}>
                    <span className="text-sm text-slate-600">{item.status.replaceAll('_', ' ')}</span>
                    <Badge tone="slate">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[24px] bg-white p-4">
              <p className="text-sm font-bold text-slate-950">Confidence distribution</p>
              <div className="mt-3 grid gap-2">
                {program.cohortSummary.confidenceDistribution.map((item) => (
                  <div className="flex items-center justify-between gap-3" key={item.band}>
                    <span className="text-sm text-slate-600">{item.band}</span>
                    <Badge tone={confidenceTone(item.band)}>{item.count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[24px] bg-white p-4">
              <p className="text-sm font-bold text-slate-950">Recurring material topics</p>
              <div className="mt-3 grid gap-3">
                {program.cohortSummary.recurringTopics.length === 0 ? (
                  <p className="text-sm leading-7 text-slate-600">
                    Recurring topic patterns appear once more submissions are stored.
                  </p>
                ) : (
                  program.cohortSummary.recurringTopics.map((topic) => (
                    <div key={topic.topicCode}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-950">{topic.title}</p>
                        <Badge tone="slate">{topic.appearances}</Badge>
                      </div>
                      <p className="mt-1 text-xs leading-6 text-slate-500">
                        Avg {topic.averageScore.toFixed(2)} / High priority {topic.highPriorityCount} /
                        Relevant {topic.relevantCount}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-[24px] bg-white p-4">
              <p className="text-sm font-bold text-slate-950">Recommendation patterns</p>
              <div className="mt-3 grid gap-3">
                {program.cohortSummary.recommendationPatterns.length === 0 ? (
                  <p className="text-sm leading-7 text-slate-600">
                    Recommendation patterning appears after multiple saved report snapshots.
                  </p>
                ) : (
                  program.cohortSummary.recommendationPatterns.map((pattern) => (
                    <div key={`${pattern.title}-${pattern.source}-${pattern.severityBand}`}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-950">{pattern.title}</p>
                        <Badge tone="amber">{pattern.appearances}</Badge>
                      </div>
                      <p className="mt-1 text-xs leading-6 text-slate-500">
                        {pattern.source} / {pattern.severityBand}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-surface-border bg-[#f4f9ee]">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Reviewer workload</p>
          <h3 className="mt-2 text-xl font-black text-slate-950">
            Assignment pressure and overdue states
          </h3>
          <div className="mt-4 grid gap-3">
            {program.reviewerWorkloads.length === 0 ? (
              <p className="text-sm leading-7 text-slate-600">
                Reviewer workloads appear after assignments are created.
              </p>
            ) : (
              program.reviewerWorkloads.map((reviewer) => (
                <div className="rounded-[20px] bg-white p-4" key={reviewer.reviewerUserId}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{reviewer.reviewerName}</p>
                    {reviewer.overdueCount > 0 ? (
                      <Badge tone="rose">{reviewer.overdueCount} overdue</Badge>
                    ) : (
                      <Badge tone="emerald">On track</Badge>
                    )}
                  </div>
                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    Pending {reviewer.pendingCount} / In review {reviewer.inReviewCount} / Changes
                    requested {reviewer.changesRequestedCount} / Approved {reviewer.approvedCount}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4">
        {program.submissions.map((submission) => (
          <Card className="border-surface-border" key={submission.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="emerald">{submission.submissionStatus}</Badge>
                  <Badge tone="slate">{submission.evaluationStatus}</Badge>
                  {submission.deterministicSummary.confidenceBand ? (
                    <Badge tone={confidenceTone(submission.deterministicSummary.confidenceBand)}>
                      {submission.deterministicSummary.confidenceBand} confidence
                    </Badge>
                  ) : null}
                </div>
                <h3 className="mt-3 text-xl font-black text-slate-950">{submission.startupName}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Revision {submission.revisionNumber} / Submitted{' '}
                  {submission.submittedAt ?? 'not yet'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <span>{formatStage(submission.context.currentStage)}</span>
                  <span>
                    {submission.context.businessCategoryMain ?? submission.context.naceDivision}
                  </span>
                  {submission.context.extendedNaceCode ? (
                    <span>{submission.context.extendedNaceCode}</span>
                  ) : null}
                  {submission.context.country ? <span>{submission.context.country}</span> : null}
                </div>
              </div>
              <div className="grid gap-2">
                <Field label="Review state">
                  <Select
                    data-testid={`program-submission-status-${submission.id}`}
                    disabled={isPending}
                    onChange={(event) =>
                      updateStatus(submission.id, event.target.value as ProgramSubmissionStatus)
                    }
                    value={submission.submissionStatus}
                  >
                    {reviewStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status.replaceAll('_', ' ')}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Decision rationale">
                  <Textarea
                    data-testid={`program-submission-rationale-${submission.id}`}
                    placeholder="Capture the reasoning behind status changes, approval, or requests for revision..."
                    value={rationaleDrafts[submission.id] ?? ''}
                    onChange={(event) =>
                      setRationaleDrafts((current) => ({
                        ...current,
                        [submission.id]: event.target.value
                      }))
                    }
                  />
                </Field>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] bg-[#f4f9ee] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Financial</p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {submission.deterministicSummary.financialTotal ?? 'n/a'}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#fbfdf8] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Risk overall</p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {submission.deterministicSummary.riskOverall?.toFixed(1) ?? 'n/a'}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#fbfdf8] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Opportunity overall
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {submission.deterministicSummary.opportunityOverall?.toFixed(1) ?? 'n/a'}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
              <span>{submission.openAssignmentCount} open assignments</span>
              <span>{submission.overdueAssignmentCount} overdue assignments</span>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="grid gap-4">
                <div
                  className="rounded-[24px] bg-[#fbfdf8] p-4"
                  data-testid={`program-submission-parity-${submission.id}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Deterministic workbook summary
                    </p>
                    <Link
                      className="text-sm font-semibold text-brand-dark"
                      href={`/app/evaluate/${submission.evaluationId}/revisions/${submission.revisionNumber}`}
                    >
                      Open immutable report snapshot
                    </Link>
                  </div>
                  <div className="mt-3 grid gap-3">
                    {submission.topMaterialTopics.length === 0 ? (
                      <p className="text-sm leading-7 text-slate-600">
                        No material topic highlights were stored for this revision yet.
                      </p>
                    ) : (
                      submission.topMaterialTopics.map((topic) => (
                        <div className="rounded-[20px] bg-white p-4" key={topic.topicCode}>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-950">{topic.title}</p>
                            <Badge tone={priorityTone(topic.priorityBand)}>{topic.score}</Badge>
                          </div>
                          {topic.recommendation ? (
                            <p className="mt-2 text-sm leading-7 text-slate-600">
                              {topic.recommendation}
                            </p>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                  {submission.scoreInterpretation ? (
                    <div className="mt-4 rounded-[20px] border border-[#dfead6] bg-[#f6fbef] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#58724d]">
                        Score interpretation
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {submission.scoreInterpretation.subtitle ??
                          'Reviewers should read the saved result through the same deterministic band guidance used in the founder workflow.'}
                      </p>
                    </div>
                  ) : null}
                  {submission.latestDecisionRationale ? (
                    <div className="mt-4 rounded-[20px] border border-[#e6dcc1] bg-[#fff9e8] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#8a6b1f]">
                        Latest decision rationale
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-700">
                        {submission.latestDecisionRationale}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[24px] bg-[#f4f9ee] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Recommendation preview
                  </p>
                  <div className="mt-3 grid gap-3">
                    {submission.recommendationsPreview.length === 0 ? (
                      <p className="text-sm leading-7 text-slate-600">
                        Recommendations appear here once the revision snapshot has been generated.
                      </p>
                    ) : (
                      submission.recommendationsPreview.map((recommendation) => (
                        <div className="rounded-[20px] bg-white p-4" key={recommendation.id}>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            {recommendation.source} / {recommendation.severityBand}
                          </p>
                          <h4 className="mt-2 font-bold text-slate-950">{recommendation.title}</h4>
                          <p className="mt-2 text-sm leading-7 text-slate-600">
                            {recommendation.text}
                          </p>
                          {recommendation.rationale ? (
                            <p className="mt-2 text-xs leading-6 text-slate-500">
                              {recommendation.rationale}
                            </p>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[24px] bg-[#fbfdf8] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Review checklist
                    </p>
                    <Link
                      className="text-sm font-semibold text-brand-dark"
                      href={submission.reportSnapshotHref ?? '#'}
                    >
                      Open report snapshot
                    </Link>
                  </div>
                  <div className="mt-3 grid gap-3">
                    {submission.reviewChecklist.map((item) => (
                      <div className="rounded-[20px] bg-white p-4" key={item.key}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                          <Badge tone={item.completed ? 'emerald' : 'amber'}>
                            {item.completed ? 'Ready' : 'Pending'}
                          </Badge>
                        </div>
                        {item.detail ? (
                          <p className="mt-2 text-xs leading-6 text-slate-500">{item.detail}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] bg-[#f4f9ee] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Assignments</p>
                  <div className="mt-3 grid gap-2">
                    {program.reviewAssignments
                      .filter((assignment) => assignment.submissionId === submission.id)
                      .map((assignment) => (
                        <div
                          className="flex items-center justify-between gap-3"
                          key={assignment.id}
                        >
                          <p className="text-sm font-semibold text-slate-950">
                            {assignment.reviewerName}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge tone={assignment.isOverdue ? 'rose' : 'amber'}>
                              {assignment.status}
                            </Badge>
                            {assignment.isOverdue ? <Badge tone="rose">overdue</Badge> : null}
                          </div>
                        </div>
                      ))}
                  </div>
                  {program.role === 'manager' ? (
                    <div className="mt-4 grid gap-3">
                      <Select
                        data-testid={`program-submission-assignee-${submission.id}`}
                        value={assignmentState[submission.id]?.reviewerUserId ?? ''}
                        onChange={(event) =>
                          setAssignmentState((current) => ({
                            ...current,
                            [submission.id]: {
                              reviewerUserId: event.target.value,
                              dueAt: current[submission.id]?.dueAt ?? ''
                            }
                          }))
                        }
                      >
                        <option value="">Choose reviewer</option>
                        {reviewerOptions.map((member) => (
                          <option key={member.userId} value={member.userId}>
                            {member.name} / {member.role}
                          </option>
                        ))}
                      </Select>
                      <Input
                        data-testid={`program-submission-due-${submission.id}`}
                        type="date"
                        value={assignmentState[submission.id]?.dueAt ?? ''}
                        onChange={(event) =>
                          setAssignmentState((current) => ({
                            ...current,
                            [submission.id]: {
                              reviewerUserId: current[submission.id]?.reviewerUserId ?? '',
                              dueAt: event.target.value
                            }
                          }))
                        }
                      />
                      <Button
                        data-testid={`program-submission-assign-${submission.id}`}
                        disabled={isPending}
                        onClick={() => assignReviewer(submission.id)}
                        type="button"
                      >
                        Assign reviewer
                      </Button>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[24px] bg-[#fbfdf8] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Threaded comments
                  </p>
                  <div className="mt-3 grid gap-3">
                    {program.reviewComments
                      .filter((comment) => comment.submissionId === submission.id)
                      .map((comment) => (
                        <div key={comment.id}>
                          <p className="text-sm font-semibold text-slate-950">
                            {comment.authorName}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{comment.body}</p>
                        </div>
                      ))}
                  </div>
                  <Textarea
                    data-testid={`program-submission-comment-${submission.id}`}
                    className="mt-4"
                    placeholder="Add a review note or request for clarification..."
                    value={commentDrafts[submission.id] ?? ''}
                    onChange={(event) =>
                      setCommentDrafts((current) => ({
                        ...current,
                        [submission.id]: event.target.value
                      }))
                    }
                  />
                  <div className="mt-3">
                    <Button
                      data-testid={`program-submission-comment-submit-${submission.id}`}
                      disabled={isPending}
                      onClick={() => postComment(submission.id)}
                      type="button"
                    >
                      Post comment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {errorMessage ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
