import { Card } from '@packages/ui';
import { MarketingShell } from '../../components/marketing-shell';
import { getOptionalCurrentUser, getPublicSiteContent } from '../../lib/server-api';
import { getSiteSettings } from '../../lib/site-content';

export default async function FaqPage() {
  const [currentUser, content] = await Promise.all([
    getOptionalCurrentUser(),
    getPublicSiteContent()
  ]);

  return (
    <MarketingShell
      currentUser={currentUser}
      settings={getSiteSettings(content)}
      eyebrow="FAQ"
      title="Frequently asked questions"
      intro="The FAQ keeps the tone aligned with the ZEEUS source pack: practical, startup-friendly, and methodologically clear."
    >
      <div className="grid gap-4">
        {content.faqEntries.map((entry) => (
          <Card className="border-surface-border" key={entry.id}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
              {entry.category}
            </p>
            <h2 className="mt-3 text-xl font-bold text-slate-950">{entry.question}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{entry.answer}</p>
          </Card>
        ))}
      </div>
    </MarketingShell>
  );
}
