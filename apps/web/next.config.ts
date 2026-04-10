import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const apiOrigin = process.env.API_ORIGIN ?? 'http://localhost:4000';
const appDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(appDirectory, '..', '..');

function resolveWorkspacePackageEntry(packageDirectory: string) {
  const packageJsonPath = path.join(packageDirectory, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
    main?: string;
    module?: string;
    exports?: { '.': string | { import?: string; default?: string } };
  };
  const exportsRoot = packageJson.exports?.['.'];
  const relativeEntry =
    packageJson.module ??
    (typeof exportsRoot === 'string'
      ? exportsRoot
      : (exportsRoot?.import ?? exportsRoot?.default)) ??
    packageJson.main;

  if (!relativeEntry) {
    throw new Error(`Unable to resolve workspace package entry for ${packageDirectory}`);
  }

  return path.join(packageDirectory, relativeEntry.replace(/^\.\//, ''));
}

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  experimental: {
    authInterrupts: true,
    externalDir: true
  },
  transpilePackages: [
    '@packages/contracts',
    '@packages/scoring',
    '@packages/shared',
    '@packages/ui'
  ],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`
      }
    ];
  },
  webpack(config) {
    config.resolve ??= {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@packages/shared': resolveWorkspacePackageEntry(path.join(repoRoot, 'packages', 'shared')),
      '@packages/contracts': resolveWorkspacePackageEntry(
        path.join(repoRoot, 'packages', 'contracts')
      ),
      '@packages/scoring': resolveWorkspacePackageEntry(path.join(repoRoot, 'packages', 'scoring')),
      '@packages/ui': resolveWorkspacePackageEntry(path.join(repoRoot, 'packages', 'ui'))
    };

    return config;
  }
};

export default nextConfig;
