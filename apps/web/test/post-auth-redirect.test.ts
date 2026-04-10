import { describe, expect, it } from 'vitest';
import { isEmbeddedHuggingFaceSpace } from '../lib/post-auth-redirect';

describe('post auth redirect helpers', () => {
  it('detects an embedded Hugging Face Space host', () => {
    expect(isEmbeddedHuggingFaceSpace('christopherjkoen-zeeus-ultimate-site.hf.space', true)).toBe(
      true
    );
  });

  it('does not treat a top-level Space as embedded auth', () => {
    expect(isEmbeddedHuggingFaceSpace('christopherjkoen-zeeus-ultimate-site.hf.space', false)).toBe(
      false
    );
  });

  it('does not treat non-Space domains as embedded Hugging Face auth hosts', () => {
    expect(isEmbeddedHuggingFaceSpace('localhost', true)).toBe(false);
    expect(isEmbeddedHuggingFaceSpace('zeeus.example.com', true)).toBe(false);
  });
});
