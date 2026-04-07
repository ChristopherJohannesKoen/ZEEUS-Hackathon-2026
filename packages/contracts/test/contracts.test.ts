import { describe, expect, it } from 'vitest';
import { apiContract } from '../src/index';

describe('apiContract', () => {
  it('uses route paths compatible with the Nest api prefix', () => {
    expect(apiContract.auth.login.path).toBe('/auth/login');
    expect(apiContract.evaluations.get.path).toBe('/evaluations/:id');
  });

  it('keeps strict status codes enabled', () => {
    expect(apiContract.auth.login.strictStatusCodes).toBe(true);
    expect(apiContract.evaluations.list.strictStatusCodes).toBe(true);
  });
});
