function readBooleanFlag(value: string | undefined) {
  return value?.trim().toLowerCase() === 'true';
}

export function resolveRuntimeMode() {
  const publicSpaceMode =
    readBooleanFlag(process.env.NEXT_PUBLIC_HF_SPACE_PUBLIC_MODE) ||
    readBooleanFlag(process.env.HF_SPACE_PUBLIC_MODE);
  const spaceHostedMode = Boolean(process.env.SPACE_ID || process.env.SPACE_HOST);

  return {
    publicSpaceMode,
    spaceHostedMode,
    isEmbeddedDemo: publicSpaceMode,
    defaultLocale: (process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en').trim().toLowerCase() || 'en'
  };
}

export const runtimeMode = resolveRuntimeMode();
export const isPublicSpaceMode = runtimeMode.publicSpaceMode;

export function resolveSiteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_ORIGIN) {
    return process.env.NEXT_PUBLIC_SITE_ORIGIN;
  }

  if (process.env.SPACE_HOST) {
    return `https://${process.env.SPACE_HOST}`;
  }

  return 'http://localhost:3000';
}
