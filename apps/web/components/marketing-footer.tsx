import Link from 'next/link';
import { marketingFooterColumns } from '../lib/landing-page-content';
import { ZeeusLogo } from './zeeus-logo';

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#063e30] text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-14 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
        <div className="space-y-5">
          <ZeeusLogo className="rounded-[24px] bg-white px-4 py-3 shadow-card" />
          <div className="max-w-md space-y-3 text-sm leading-7 text-white/78">
            <p className="font-semibold text-white">Sustainability by Design Tool</p>
            <p>
              A founder-friendly guidance tool for exploring sustainability-relevant topics,
              material issues, SDG alignment, risks, opportunities, and next steps.
            </p>
            <p>
              Developed by IfaS, Institute for Applied Material Flow Management, Trier University of
              Applied Sciences, within the ZEEUS project.
            </p>
          </div>
        </div>

        {marketingFooterColumns.map((column) => (
          <div className="space-y-4" key={column.title}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b9e021]">
              {column.title}
            </p>
            <div className="grid gap-3 text-sm text-white/78">
              {column.links.map((link) => (
                <Link className="transition hover:text-white" href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="space-y-4 lg:col-span-3">
          <div className="h-px w-full bg-white/12" />
          <div className="grid gap-4 text-sm leading-7 text-white/70 lg:grid-cols-[1.1fr_1fr]">
            <p>
              Supported within a broader European innovation and sustainability context. Use of
              project logos and co-branding should follow the ZEEUS visual identity guidance.
            </p>
            <p>
              For privacy, accessibility, cookie, and institutional contact requests, use the
              contact route so the project team can direct you to the appropriate owner.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.22em] text-white/55">
            <span>© ZEEUS / IfaS / Trier University of Applied Sciences</span>
            <span>Zero Emissions Entrepreneurship for Universal Sustainability</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
