type PublicResourceFile = {
  content: string;
  fileName: string;
  mimeType: string;
};

const resourceFiles = new Map<string, PublicResourceFile>([
  [
    'zeeus-user-manual.txt',
    {
      fileName: 'zeeus-user-manual.txt',
      mimeType: 'text/plain; charset=utf-8',
      content: `ZEEUS User Manual

1. Start with startup context.
Capture the company stage, sector, and operating assumptions before entering scoring inputs.

2. Complete Stage I and Stage II.
Keep the deterministic core as the source of truth. The same inputs always produce the same result.

3. Review dashboard and SDG alignment.
Use the dashboard, recommendations, and SDG explorer to understand what matters most and why.

4. Add evidence and scenarios.
Evidence improves confidence. Scenarios are advisory comparisons and never rewrite the saved revision.

5. Export and communicate.
Use the report and artifacts to explain the current revision clearly to founders, reviewers, and partners.
`
    }
  ],
  [
    'zeeus-faq.txt',
    {
      fileName: 'zeeus-faq.txt',
      mimeType: 'text/plain; charset=utf-8',
      content: `ZEEUS FAQ

Q: Are the SDGs a checklist?
A: No. ZEEUS uses the SDGs as an orientation map for founder teams.

Q: Does AI change the score?
A: No. AI is advisory only and never mutates deterministic scoring outputs.

Q: Why collect evidence this early?
A: Evidence helps explain confidence, prepare partner review, and separate strong claims from assumptions.

Q: Is the Hugging Face Space the full product?
A: No. The Space hosts the public website preview. Founder and reviewer operations stay on the main deployment.
`
    }
  ],
  [
    'zeeus-methodology-note.txt',
    {
      fileName: 'zeeus-methodology-note.txt',
      mimeType: 'text/plain; charset=utf-8',
      content: `ZEEUS Methodology Note

ZEEUS is built around a deterministic assessment core derived from the Sustainability by Design workflow.

- Stage I and Stage II scoring remain canonical.
- Threshold logic stays explicit and revision-safe.
- Recommendation actions, narratives, exports, and benchmarks all resolve from saved revisions.
- AI supports explanation, not scoring.
- Evidence and scenarios improve interpretation, confidence, and communication.
`
    }
  ],
  [
    'zeeus-sample-report.csv',
    {
      fileName: 'zeeus-sample-report.csv',
      mimeType: 'text/csv; charset=utf-8',
      content: `section,key,value
summary,startup_name,Sample Startup
summary,revision_number,3
summary,stage,validation
topics,climate_mitigation,high_priority
topics,resource_efficiency,relevant
confidence,evaluation_confidence,medium
recommendation,next_step,Collect stronger supplier and lifecycle evidence
`
    }
  ],
  [
    'zeeus-workflow-checklist.txt',
    {
      fileName: 'zeeus-workflow-checklist.txt',
      mimeType: 'text/plain; charset=utf-8',
      content: `ZEEUS Workflow Checklist

[ ] Confirm startup context and NACE mapping
[ ] Complete Stage I inputs
[ ] Complete Stage II inputs
[ ] Review material topics, risks, and opportunities
[ ] Review SDG goals and targets
[ ] Link at least one evidence item to key claims
[ ] Run one advisory scenario comparison
[ ] Review recommendations and next-step actions
[ ] Generate and share the report/artifacts
`
    }
  ]
]);

export function getPublicResourceFile(slug: string) {
  return resourceFiles.get(slug);
}
