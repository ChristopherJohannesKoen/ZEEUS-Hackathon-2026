import Link from 'next/link';
import { Card } from '@packages/ui';
import { MarketingShell } from '../../components/marketing-shell';
import { getCurrentUser, getPublicSiteContent } from '../../lib/server-api';

export default async function ResourcesPage() {
  const [currentUser, content] = await Promise.all([getCurrentUser(), getPublicSiteContent()]);

  return (
    <MarketingShell
      currentUser={currentUser}
      eyebrow="Resources"
      title="Guides, walkthroughs, and workflow assets"
      intro="The download center is designed to mirror the source pack: concise guidance, methodology notes, FAQ support, and reusable partner material."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {content.resources.map((resource) => (
          <Card className="border-surface-border" id={resource.id} key={resource.id}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
              {resource.category}
            </p>
            <h2 className="mt-3 text-xl font-bold text-slate-950">{resource.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{resource.description}</p>
            <Link
              className="mt-5 inline-flex text-sm font-semibold text-brand-dark"
              href={resource.href}
            >
              Open {resource.fileLabel}
            </Link>
          </Card>
        ))}
      </div>
    </MarketingShell>
  );
}
