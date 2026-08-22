import { describe, it, expect } from 'vitest';
import { evaluateGuard } from '../src/services/mismatchGuard.js';

const foxPost = { title: 'The Secret Life of Red Foxes', content: 'Red foxes are cunning hunters.' };
const gardenPost = { title: 'Backyard Vegetable Garden', content: 'Growing tomatoes and peppers at home.' };

describe('Mismatch guard', () => {
  it('APPROVES a correct species match with good similarity and confidence', () => {
    const result = evaluateGuard(foxPost, { species: 'fox', similarity: 0.74, confidence: 0.98 });
    expect(result.status).toBe('APPROVED');
  });

  it('REJECTS a wolf image for a fox post — species mismatch takes priority', () => {
    const result = evaluateGuard(foxPost, { species: 'wolf', similarity: 0.9, confidence: 0.98 });
    expect(result.status).toBe('REJECTED');
    expect(result.reason).toContain('Species mismatch');
    expect(result.reason).toContain('expected fox');
    expect(result.reason).toContain('detected wolf');
  });

  it('REJECTS on low confidence even with correct species and high similarity', () => {
    const result = evaluateGuard(foxPost, { species: 'fox', similarity: 0.9, confidence: 0.4 });
    expect(result.status).toBe('REJECTED');
    expect(result.reason).toContain('confidence too low');
  });

  it('REJECTS on low similarity even with correct species and high confidence', () => {
    const result = evaluateGuard(foxPost, { species: 'fox', similarity: 0.3, confidence: 0.98 });
    expect(result.status).toBe('REJECTED');
    expect(result.reason).toContain('Similarity too low');
  });

  it('REJECTS any candidate for an unrelated post (no expected species detected)', () => {
    const result = evaluateGuard(gardenPost, { species: 'dog', similarity: 0.53, confidence: 0.98 });
    expect(result.status).toBe('REJECTED');
    expect(result.reason).toContain('Similarity too low');
  });
});
