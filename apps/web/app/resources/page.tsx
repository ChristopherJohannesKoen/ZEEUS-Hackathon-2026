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
            <div className="mt-4 grid gap-1 text-xs uppercase tracking-[0.2em] text-slate-500">
              {resource.fileName ? <p>File: {resource.fileName}</p> : null}
              {resource.mimeType ? <p>Type: {resource.mimeType}</p> : null}
              {resource.byteSize !== null ? (
                <p>Size: {(resource.byteSize / 1024).toFixed(1)} KB</p>
              ) : null}
            </div>
            <Link
              className="mt-5 inline-flex text-sm font-semibold text-brand-dark"
              href={resource.href}
              target={resource.href.startsWith('http') ? '_blank' : undefined}
              rel={resource.href.startsWith('http') ? 'noreferrer' : undefined}
            >
              Download {resource.fileLabel}
            </Link>
          </Card>
        ))}
      </div>
    </MarketingShell>
  );
}
