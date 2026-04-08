function readBooleanFlag(value: string | undefined) {
  return value?.trim().toLowerCase() === 'true';
}

export const isPublicSpaceMode = readBooleanFlag(process.env.NEXT_PUBLIC_HF_SPACE_PUBLIC_MODE);

export function resolveSiteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_ORIGIN) {
    return process.env.NEXT_PUBLIC_SITE_ORIGIN;
  }

  if (process.env.SPACE_HOST) {
    return `https://${process.env.SPACE_HOST}`;
  }

  return 'http://localhost:3000';
}
