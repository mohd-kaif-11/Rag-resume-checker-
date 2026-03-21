import { DocumentChunk, VectorSearchResult } from "../types";
import { v4 as uuidv4 } from "uuid";

// ============================================================
// In-Memory Vector Store
//
// Implements cosine similarity search over 768-dim embeddings.
// No external database required — perfect for local/demo usage.
//
// For production: swap with Pinecone, Qdrant, or pgvector.
// The interface stays the same — just replace addChunks() and search().
// ============================================================

export class VectorStore {
  private chunks: DocumentChunk[] = [];

  /**
   * Add document chunks with their embeddings to the store
   */
  addChunks(
    textChunks: Array<{ text: string; section: string }>,
    embeddings: number[][],
    source: "resume" | "jd"
  ): void {
    for (let i = 0; i < textChunks.length; i++) {
      const chunk: DocumentChunk = {
        id: uuidv4(),
        text: textChunks[i].text,
        embedding: embeddings[i],
        metadata: {
          source,
          section: textChunks[i].section,
          chunkIndex: i,
        },
      };
      this.chunks.push(chunk);
    }
  }

  /**
   * Search for top-k most similar chunks to a query embedding
   *
   * Uses cosine similarity: dot(a, b) / (|a| * |b|)
   * Range: -1 (opposite) to 1 (identical), higher = more relevant
   *
   * @param queryEmbedding  - Embedding of the user's question
   * @param topK            - Number of results to return
   * @param sourceFilter    - Optionally filter by 'resume' or 'jd'
   */
  search(
    queryEmbedding: number[],
    topK: number = 5,
    sourceFilter?: "resume" | "jd"
  ): VectorSearchResult[] {
    let candidates = this.chunks;

    if (sourceFilter) {
      candidates = candidates.filter(
        (c) => c.metadata.source === sourceFilter
      );
    }

    if (candidates.length === 0) return [];

    const results: VectorSearchResult[] = candidates.map((chunk) => ({
      chunk,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
    }));

    // Sort descending by similarity
    results.sort((a, b) => b.similarity - a.similarity);

    return results.slice(0, topK);
  }

  /**
   * Get all chunks for a given source
   */
  getChunksBySource(source: "resume" | "jd"): DocumentChunk[] {
    return this.chunks.filter((c) => c.metadata.source === source);
  }

  /**
   * Return total number of stored chunks
   */
  size(): number {
    return this.chunks.length;
  }

  /**
   * Clear all chunks (useful for resetting a session)
   */
  clear(): void {
    this.chunks = [];
  }
}

// ============================================================
// Cosine Similarity — Core RAG math
//
// cos(θ) = (A · B) / (|A| × |B|)
//
// Two embeddings that represent semantically similar text
// will have a high cosine similarity (close to 1.0).
// This is why embedding-based search is so powerful —
// it captures MEANING, not just keyword overlap.
// ============================================================
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(
      `Embedding dimension mismatch: ${a.length} vs ${b.length}`
    );
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;

  return dot / (normA * normB);
}
