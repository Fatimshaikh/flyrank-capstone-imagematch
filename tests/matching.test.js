import { describe, it, expect } from 'vitest';
import { rankImagesForPost } from '../src/services/matching.js';

describe('Similarity ranking', () => {
  it('ranks identical vectors with similarity 1.0', () => {
    const postEmbedding = [1, 0, 0];
    const images = [{ filename: 'a.jpg', embedding: [1, 0, 0] }];
    const [result] = rankImagesForPost(postEmbedding, images);
    expect(result.similarity).toBeCloseTo(1.0, 5);
  });

  it('ranks orthogonal (unrelated) vectors with similarity 0', () => {
    const postEmbedding = [1, 0, 0];
    const images = [{ filename: 'a.jpg', embedding: [0, 1, 0] }];
    const [result] = rankImagesForPost(postEmbedding, images);
    expect(result.similarity).toBeCloseTo(0, 5);
  });

  it('sorts multiple candidates best-match-first', () => {
    const postEmbedding = [1, 0, 0];
    const images = [
      { filename: 'low.jpg', embedding: [0, 1, 0] },
      { filename: 'high.jpg', embedding: [1, 0.1, 0] },
      { filename: 'mid.jpg', embedding: [1, 1, 0] },
    ];
    const ranked = rankImagesForPost(postEmbedding, images);
    expect(ranked[0].filename).toBe('high.jpg');
    expect(ranked[ranked.length - 1].filename).toBe('low.jpg');
  });
});
