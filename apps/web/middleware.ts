import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { buildContentSecurityPolicy, generateNonce, readBooleanEnv } from './lib/csp';

const apiOrigin = process.env.API_ORIGIN ?? 'http://localhost:4000';
const cspReportUri = process.env.CSP_REPORT_URI?.trim();
const publicSpaceMode =
  readBooleanEnv(process.env.NEXT_PUBLIC_HF_SPACE_PUBLIC_MODE) ||
  readBooleanEnv(process.env.HF_SPACE_PUBLIC_MODE);
const spaceHostedMode = Boolean(process.env.SPACE_ID || process.env.SPACE_HOST);
const allowEmbedding = publicSpaceMode || spaceHostedMode;

export function middleware(request: NextRequest) {
  if (publicSpaceMode) {
    const pathname = request.nextUrl.pathname;
    const publicOnlyPrefixes = [
      '/app',
      '/internal',
      '/login',
      '/signup',
      '/forgot-password',
      '/reset-password'
    ];

    if (
      publicOnlyPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    ) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = pathname.startsWith('/app/programs') ? '/partners' : '/';
      redirectUrl.search = '';
      return NextResponse.redirect(redirectUrl);
    }
  }

  const nonce = generateNonce();
  const requestHeaders = new Headers(request.headers);
  const contentSecurityPolicy = buildContentSecurityPolicy({
    apiOrigin,
    environment: process.env.NODE_ENV,
    nonce,
    allowEmbedding
  });
  const reportOnlyPolicy = readBooleanEnv(process.env.CSP_REPORT_ONLY)
    ? buildContentSecurityPolicy({
        apiOrigin,
        environment: process.env.NODE_ENV,
        nonce,
        allowEmbedding,
        reportOnly: true,
        reportUri: cspReportUri
      })
    : undefined;

  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicy);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });

  response.headers.set('Content-Security-Policy', contentSecurityPolicy);
  if (reportOnlyPolicy) {
    response.headers.set('Content-Security-Policy-Report-Only', reportOnlyPolicy);
  }
  if (!allowEmbedding) {
    response.headers.set('X-Frame-Options', 'DENY');
  }
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'accelerometer=(), autoplay=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), microphone=(), midi=(), payment=(), usb=(), browsing-topics=()'
  );
  response.headers.set(
    'Cross-Origin-Opener-Policy',
    allowEmbedding ? 'unsafe-none' : 'same-origin'
  );
  response.headers.set(
    'Cross-Origin-Resource-Policy',
    allowEmbedding ? 'cross-origin' : 'same-origin'
  );

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' }
      ]
    }
  ]
};
