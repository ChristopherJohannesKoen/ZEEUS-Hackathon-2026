const Module = require('node:module');
const path = require('node:path');

const runtimeRoot = path.join(__dirname, '..', '.docker-runtime');

const aliases = new Map([
  ['@packages/shared', path.join(runtimeRoot, 'shared', 'index.js')],
  ['@packages/contracts', path.join(runtimeRoot, 'contracts', 'index.js')],
  ['@packages/scoring', path.join(runtimeRoot, 'scoring', 'src', 'index.js')]
]);

const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveWithWorkspaceAliases(request, parent, isMain, options) {
  const aliased = aliases.get(request);

  if (aliased) {
    return aliased;
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};
