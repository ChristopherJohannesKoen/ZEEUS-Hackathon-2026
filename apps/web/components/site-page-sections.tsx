import Link from 'next/link';
import { Card, buttonClassName } from '@packages/ui';
import type { SitePage } from '@packages/shared';
import { getParagraphs } from '../lib/site-content';

export function SitePageSections({ page }: { page?: SitePage }) {
  return (
    <div className="grid gap-6">
      {page?.sections.map((section) => {
        if (section.kind === 'rich_text') {
          return (
            <Card className="border-surface-border" id={section.id} key={section.id}>
              {section.eyebrow ? (
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
                  {section.eyebrow}
                </p>
              ) : null}
              {section.title ? (
                <h2 className="text-2xl font-black text-slate-950">{section.title}</h2>
              ) : null}
              <div className="mt-4 grid gap-4 text-sm leading-8 text-slate-700">
                {getParagraphs(section.body).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </Card>
          );
        }

        if (section.kind === 'feature_grid' || section.kind === 'step_grid') {
          return (
            <section className="grid gap-4" id={section.id} key={section.id}>
              {section.eyebrow ? (
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
                  {section.eyebrow}
                </p>
              ) : null}
              {section.title ? (
                <h2 className="text-2xl font-black text-slate-950">{section.title}</h2>
              ) : null}
              {section.body ? (
                <p className="text-sm leading-8 text-slate-600">{section.body}</p>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2">
                {section.items.map((item, index) => (
                  <Card
                    className="border-surface-border bg-[#f7fbf2]"
                    key={`${section.id}-${item.title}`}
                  >
                    {section.kind === 'step_grid' ? (
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
                        Step {index + 1}
                      </p>
                    ) : null}
                    <h3 className="mt-2 text-lg font-bold text-slate-950">{item.title}</h3>
                    {item.description ? (
                      <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                    ) : null}
                    {item.label && item.href ? (
                      <div className="mt-4">
                        <Link
                          className={buttonClassName({
                            variant: 'ghost',
                            className: 'px-0 text-brand-dark hover:bg-transparent'
                          })}
                          href={item.href}
                        >
                          {item.label}
                        </Link>
                      </div>
                    ) : null}
                    {item.microcopy ? (
                      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#58724d]">
                        {item.microcopy}
                      </p>
                    ) : null}
                  </Card>
                ))}
              </div>
            </section>
          );
        }

        if (section.kind === 'faq_list') {
          return (
            <section className="grid gap-4" id={section.id} key={section.id}>
              {section.eyebrow ? (
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
                  {section.eyebrow}
                </p>
              ) : null}
              {section.title ? (
                <h2 className="text-2xl font-black text-slate-950">{section.title}</h2>
              ) : null}
              {section.items.map((item) => (
                <Card className="border-surface-border" key={`${section.id}-${item.title}`}>
                  <h3 className="text-xl font-bold text-slate-950">{item.title}</h3>
                  {item.description ? (
                    <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
                  ) : null}
                </Card>
              ))}
            </section>
          );
        }

        if (section.kind === 'audience_list' || section.kind === 'logo_strip') {
          return (
            <section className="grid gap-4" id={section.id} key={section.id}>
              {section.eyebrow ? (
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
                  {section.eyebrow}
                </p>
              ) : null}
              {section.title ? (
                <h2 className="text-2xl font-black text-slate-950">{section.title}</h2>
              ) : null}
              <div className="flex flex-wrap gap-3">
                {section.items.map((item) => (
                  <span
                    className="inline-flex rounded-full border border-[#d7e7c7] bg-[#f4f9ee] px-4 py-2 text-sm font-medium text-slate-700"
                    key={`${section.id}-${item.title}`}
                  >
                    {item.title}
                  </span>
                ))}
              </div>
            </section>
          );
        }

        if (section.kind === 'cta') {
          return (
            <Card className="border-surface-border bg-[#f4faee]" id={section.id} key={section.id}>
              {section.eyebrow ? (
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
                  {section.eyebrow}
                </p>
              ) : null}
              {section.title ? (
                <h2 className="text-2xl font-black text-slate-950">{section.title}</h2>
              ) : null}
              {section.body ? (
                <p className="mt-4 text-sm leading-8 text-slate-600">{section.body}</p>
              ) : null}
              {section.ctaLabel && section.ctaHref ? (
                <div className="mt-6">
                  <Link
                    className={buttonClassName({ className: 'bg-brand hover:bg-brand-dark' })}
                    href={section.ctaHref}
                  >
                    {section.ctaLabel}
                  </Link>
                </div>
              ) : null}
            </Card>
          );
        }

        if (section.kind === 'quote' && section.quote) {
          return (
            <Card className="border-surface-border bg-[#fffdfa]" id={section.id} key={section.id}>
              {section.eyebrow ? (
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
                  {section.eyebrow}
                </p>
              ) : null}
              <blockquote className="text-2xl font-black leading-tight text-slate-950">
                {section.quote}
              </blockquote>
            </Card>
          );
        }

        return null;
      })}
    </div>
  );
}
