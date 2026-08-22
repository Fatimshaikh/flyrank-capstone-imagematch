import { describe, it, expect } from 'vitest';
import { validateImageTag } from '../src/schemas/imageTag.schema.js';

describe('Image tag schema validation', () => {
  it('accepts a valid, complete tag', () => {
    const result = validateImageTag({
      subject: 'red fox',
      category: 'animal',
      attributes: ['orange fur', 'forest'],
      caption: 'A red fox in a forest',
      confidence: 0.94,
    });
    expect(result.valid).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = validateImageTag({ subject: 'red fox' });
    expect(result.valid).toBe(false);
  });

  it('rejects confidence above 1', () => {
    const result = validateImageTag({
      subject: 'fox', category: 'animal', attributes: ['orange'],
      caption: 'a fox', confidence: 1.5,
    });
    expect(result.valid).toBe(false);
  });

  it('rejects confidence below 0', () => {
    const result = validateImageTag({
      subject: 'fox', category: 'animal', attributes: ['orange'],
      caption: 'a fox', confidence: -0.1,
    });
    expect(result.valid).toBe(false);
  });

  it('rejects empty attributes array', () => {
    const result = validateImageTag({
      subject: 'fox', category: 'animal', attributes: [],
      caption: 'a fox', confidence: 0.9,
    });
    expect(result.valid).toBe(false);
  });

  it('rejects non-string subject', () => {
    const result = validateImageTag({
      subject: 123, category: 'animal', attributes: ['orange'],
      caption: 'a fox', confidence: 0.9,
    });
    expect(result.valid).toBe(false);
  });
});
