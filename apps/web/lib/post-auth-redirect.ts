export function isEmbeddedHuggingFaceSpace(hostname: string, embedded: boolean) {
  return embedded && hostname.endsWith('.hf.space');
}

function isEmbeddedWindow() {
  return typeof window !== 'undefined' && window.top !== window.self;
}

function toAbsoluteUrl(pathname: string) {
  return new URL(pathname, window.location.origin).toString();
}

export function redirectEmbeddedAuthPageToTopLevel() {
  if (
    typeof window === 'undefined' ||
    !isEmbeddedHuggingFaceSpace(window.location.hostname, isEmbeddedWindow())
  ) {
    return false;
  }

  const currentUrl = new URL(
    `${window.location.pathname}${window.location.search}${window.location.hash}`,
    window.location.origin
  ).toString();

  try {
    window.top?.location.replace(currentUrl);
  } catch {
    window.location.replace(currentUrl);
  }

  return true;
}

export function navigateToAuthenticatedApp() {
  const appUrl = toAbsoluteUrl('/app');

  if (isEmbeddedHuggingFaceSpace(window.location.hostname, isEmbeddedWindow())) {
    try {
      window.top?.location.assign(appUrl);
      return;
    } catch {
      window.location.assign(appUrl);
      return;
    }
  }

  window.location.assign(appUrl);
}
