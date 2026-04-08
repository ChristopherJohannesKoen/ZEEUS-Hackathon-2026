import Link from 'next/link';
import { Card, buttonClassName } from '@packages/ui';
import { MarketingShell } from '../../components/marketing-shell';
import { getCurrentUser, getPublicSiteContent } from '../../lib/server-api';

export default async function ContactPage() {
  const [currentUser, content] = await Promise.all([getCurrentUser(), getPublicSiteContent()]);
  const article = content.articles.find((item) => item.slug === 'contact-support');

  return (
    <MarketingShell
      currentUser={currentUser}
      eyebrow="Contact and support"
      title={article?.title ?? 'Support and onboarding'}
      intro={
        article?.summary ??
        'Help founders and partners onboard without losing methodological consistency.'
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card className="border-surface-border">
          <p className="text-sm leading-8 text-slate-700">{article?.body}</p>
        </Card>
        <Card className="border-surface-border bg-[#f4f9ee]">
          <h2 className="text-2xl font-black text-slate-950">Next best step</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Founders should start with the evaluation workflow. Partners should open the program
            console and review submission and evidence workflows.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className={buttonClassName({ className: 'bg-brand hover:bg-brand-dark' })}
              href={currentUser ? '/app/evaluate/start' : '/signup'}
            >
              Founder workspace
            </Link>
            <Link className={buttonClassName({ variant: 'secondary' })} href="/partners">
              Partner overview
            </Link>
          </div>
        </Card>
      </div>
    </MarketingShell>
  );
}
