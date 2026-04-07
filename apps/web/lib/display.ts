export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function roleTone(role: string) {
  if (role === 'owner') return 'amber';
  if (role === 'admin') return 'emerald';
  return 'slate';
}

export function projectTone(status: string) {
  if (status === 'completed') return 'emerald';
  if (status === 'paused') return 'amber';
  return 'slate';
}

export function evaluationStatusTone(status: string) {
  if (status === 'completed') return 'emerald';
  if (status === 'in_progress') return 'amber';
  return 'slate';
}

export function priorityTone(priorityBand: string) {
  if (priorityBand === 'high_priority') return 'rose';
  if (priorityBand === 'relevant') return 'amber';
  return 'slate';
}

export function confidenceTone(confidenceBand: string) {
  if (confidenceBand === 'high') return 'emerald';
  if (confidenceBand === 'moderate') return 'amber';
  return 'rose';
}

export function formatEnumLabel(value: string) {
  return value
    .split('_')
    .map((segment) => (segment ? segment[0]!.toUpperCase() + segment.slice(1) : segment))
    .join(' ');
}
