'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Button, Card, Field, Input, Textarea, buttonClassName } from '@packages/ui';
import { submitPartnerInterest } from '../lib/client-api';
import { isPublicSpaceMode } from '../lib/runtime-mode';

export function PartnerInterestForm() {
  const publicSpaceMode = isPublicSpaceMode;
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formState, setFormState] = useState({
    name: '',
    organizationName: '',
    email: '',
    websiteUrl: '',
    message: ''
  });

  if (publicSpaceMode) {
    return (
      <Card className="border-surface-border">
        <h2 className="text-2xl font-black text-slate-950">Hosted partner intake</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          This Hugging Face deployment runs the public website preview only. Partner-interest
          submissions are disabled here so the Space stays stateless and public-safe.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className={buttonClassName({ className: 'bg-brand hover:bg-brand-dark' })}
            href="/contact"
          >
            Open contact guidance
          </Link>
          <Link className={buttonClassName({ variant: 'secondary' })} href="/resources">
            View resources
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-surface-border">
      <h2 className="text-2xl font-black text-slate-950">Request partner access</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        Use this public intake form for cohort or program interest. Reviewer access remains
        invite-only.
      </p>
      {success ? (
        <div className="mt-6 rounded-[24px] bg-[#f4f9ee] px-5 py-4 text-sm leading-7 text-emerald-800">
          Your request has been received. The ZEEUS team can now follow up with program setup or
          reviewer onboarding.
        </div>
      ) : (
        <form
          className="mt-6 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setErrorMessage(null);
            startTransition(async () => {
              try {
                await submitPartnerInterest({
                  ...formState,
                  websiteUrl: formState.websiteUrl || null
                });
                setSuccess(true);
              } catch (error) {
                setErrorMessage(
                  error instanceof Error ? error.message : 'Unable to submit partner interest.'
                );
              }
            });
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Your name">
              <Input
                required
                value={formState.name}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Field>
            <Field label="Organization">
              <Input
                required
                value={formState.organizationName}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    organizationName: event.target.value
                  }))
                }
              />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Email">
              <Input
                required
                type="email"
                value={formState.email}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, email: event.target.value }))
                }
              />
            </Field>
            <Field label="Website">
              <Input
                placeholder="https://..."
                value={formState.websiteUrl}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, websiteUrl: event.target.value }))
                }
              />
            </Field>
          </div>
          <Field label="How would you use ZEEUS?">
            <Textarea
              required
              value={formState.message}
              onChange={(event) =>
                setFormState((current) => ({ ...current, message: event.target.value }))
              }
            />
          </Field>
          {errorMessage ? (
            <p className="text-sm font-medium text-rose-600">{errorMessage}</p>
          ) : null}
          <div>
            <Button className="bg-brand hover:bg-brand-dark" disabled={isPending} type="submit">
              {isPending ? 'Submitting...' : 'Submit interest'}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
