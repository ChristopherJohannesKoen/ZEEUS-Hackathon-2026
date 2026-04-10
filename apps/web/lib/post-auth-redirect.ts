export function isEmbeddedHuggingFaceSpace(hostname: string, embedded: boolean) {
  return embedded && hostname.endsWith('.hf.space');
}

function isEmbeddedWindow() {
  return typeof window !== 'undefined' && window.top !== window.self;
}

function toAbsoluteUrl(pathname: string) {
  return new URL(pathname, window.location.origin).toString();
}

function navigateTopLevel(url: string) {
  if (!isEmbeddedHuggingFaceSpace(window.location.hostname, isEmbeddedWindow())) {
    return false;
  }

  try {
    if (window.top) {
      window.top.location.href = url;
      return true;
    }
  } catch {
    return false;
  }

  return false;
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

  return navigateTopLevel(currentUrl);
}

export function navigateToAuthenticatedApp() {
  const appUrl = toAbsoluteUrl('/app');

  if (navigateTopLevel(appUrl)) {
    return;
  }

  window.location.assign(appUrl);
}
