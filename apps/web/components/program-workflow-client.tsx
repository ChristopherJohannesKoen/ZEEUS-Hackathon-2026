'use client';

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

const reviewStatuses: ProgramSubmissionStatus[] = [
  'submitted',
  'in_review',
  'changes_requested',
  'approved',
  'archived'
];

export function ProgramWorkflowClient({ program }: { program: ProgramDetail }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState(
    program.availableEvaluations[0]?.evaluationId ?? ''
  );
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
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
        await updateProgramSubmissionStatus(program.id, submissionId, { status });
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
                  {evaluation.name} / revision {evaluation.currentRevisionNumber}
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

      <div className="grid gap-4">
        {program.submissions.map((submission) => (
          <Card className="border-surface-border" key={submission.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="emerald">{submission.submissionStatus}</Badge>
                  <Badge tone="slate">{submission.evaluationStatus}</Badge>
                </div>
                <h3 className="mt-3 text-xl font-black text-slate-950">{submission.startupName}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Revision {submission.revisionNumber} / Submitted{' '}
                  {submission.submittedAt ?? 'not yet'}
                </p>
              </div>
              <div className="grid gap-2">
                <Field label="Review state">
                  <Select
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
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[24px] bg-[#f4f9ee] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Assignments</p>
                <div className="mt-3 grid gap-2">
                  {program.reviewAssignments
                    .filter((assignment) => assignment.submissionId === submission.id)
                    .map((assignment) => (
                      <div className="flex items-center justify-between gap-3" key={assignment.id}>
                        <p className="text-sm font-semibold text-slate-950">
                          {assignment.reviewerName}
                        </p>
                        <Badge tone="amber">{assignment.status}</Badge>
                      </div>
                    ))}
                </div>
                {program.role === 'manager' ? (
                  <div className="mt-4 grid gap-3">
                    <Select
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
                        <p className="text-sm font-semibold text-slate-950">{comment.authorName}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{comment.body}</p>
                      </div>
                    ))}
                </div>
                <Textarea
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
                    disabled={isPending}
                    onClick={() => postComment(submission.id)}
                    type="button"
                  >
                    Post comment
                  </Button>
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
