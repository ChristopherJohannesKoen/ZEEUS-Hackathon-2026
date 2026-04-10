'use client';

import { useEffect } from 'react';
import { redirectEmbeddedAuthPageToTopLevel } from '../lib/post-auth-redirect';

export function AuthTopLevelGuard() {
  useEffect(() => {
    redirectEmbeddedAuthPageToTopLevel();
  }, []);

  return null;
}
