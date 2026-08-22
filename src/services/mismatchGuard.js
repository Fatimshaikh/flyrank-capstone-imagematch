const SIMILARITY_THRESHOLD = 0.58;   // tuned in Phase 4 against the eval set
const CONFIDENCE_THRESHOLD = 0.7;

function extractExpectedSpecies(postTitle, postContent) {
  const text = (postTitle + ' ' + postContent).toLowerCase();
  const SPECIES = ['fox', 'wolf', 'dog', 'bear', 'deer'];
  return SPECIES.find(species => text.includes(species)) || null;
}

export function evaluateGuard(post, candidateImage) {
  const expectedSpecies = extractExpectedSpecies(post.title, post.content);

  // Check 1: category/species mismatch — the hard categorical rule.
  // Checked first because "right species, low confidence" and "wrong species, high similarity"
  // are different failure modes, and a wrong species should never sneak through on a similarity technicality.
  if (expectedSpecies && candidateImage.species !== expectedSpecies) {
    return {
      status: 'REJECTED',
      reason: `Species mismatch: expected ${expectedSpecies}, detected ${candidateImage.species}`,
    };
  }

  // Check 2: is the AI's own classification confident enough to trust at all?
  if (candidateImage.confidence < CONFIDENCE_THRESHOLD) {
    return {
      status: 'REJECTED',
      reason: `Image classification confidence too low: ${candidateImage.confidence.toFixed(2)}`,
    };
  }

  // Check 3: even with the right species and confident tagging, is the semantic match strong enough?
  if (candidateImage.similarity < SIMILARITY_THRESHOLD) {
    return {
      status: 'REJECTED',
      reason: `Similarity too low: ${candidateImage.similarity.toFixed(2)} is below threshold ${SIMILARITY_THRESHOLD}`,
    };
  }

  return {
    status: 'APPROVED',
    reason: `Matched species "${candidateImage.species}" with similarity ${candidateImage.similarity.toFixed(2)}`,
  };
}
