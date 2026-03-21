import { VectorStore } from "./vectorStore";
import { generateEmbedding, generateChatCompletion } from "./embeddingService";
import { ChatMessage, VectorSearchResult } from "../types";

// ============================================================
// RAG Service — Retrieval Augmented Generation Pipeline
//
// This is the CORE of the application.
//
// RAG Flow:
//  1. User asks a question
//  2. Convert question → 768-dim embedding vector
//  3. Search in-memory vector store for top-K similar chunks
//  4. Retrieve those chunks (relevant resume sections)
//  5. Construct prompt: [system] + [retrieved context] + [question]
//  6. Send to Gemini 1.5 Flash → get grounded, context-aware answer
//
// This ensures answers are ALWAYS grounded in the actual resume,
// not hallucinated by the LLM.
// ============================================================

const TOP_K_CHUNKS = 4; // Number of relevant chunks to retrieve
const MIN_SIMILARITY_THRESHOLD = 0.3; // Minimum cosine similarity to include a chunk

/**
 * Answer a user question about the resume using RAG
 *
 * @param question       - User's question
 * @param vectorStore    - In-memory store containing resume + JD chunks
 * @param chatHistory    - Previous conversation turns for context
 * @param resumeText     - Full resume text (for fallback / additional context)
 * @param jdText         - Full JD text
 */
export async function answerWithRAG(
  question: string,
  vectorStore: VectorStore,
  chatHistory: ChatMessage[],
  resumeText: string,
  jdText: string
): Promise<{
  answer: string;
  retrievedChunks: Array<{ text: string; section: string; similarity: number }>;
}> {
  // ── Step 1: Convert question to embedding ──────────────────
  console.log(`[RAG] Embedding question: "${question.slice(0, 60)}..."`);
  const questionEmbedding = await generateEmbedding(question);

  // ── Step 2: Retrieve top-K relevant resume chunks ──────────
  const searchResults: VectorSearchResult[] = vectorStore.search(
    questionEmbedding,
    TOP_K_CHUNKS,
    "resume" // Always search in resume for candidate-specific questions
  );

  // Also search JD if the question seems to reference requirements
  const jdKeywords = ["require", "need", "expect", "must", "should", "looking for"];
  const isAboutJD = jdKeywords.some((kw) => question.toLowerCase().includes(kw));
  if (isAboutJD) {
    const jdResults = vectorStore.search(questionEmbedding, 2, "jd");
    searchResults.push(...jdResults);
    searchResults.sort((a, b) => b.similarity - a.similarity);
  }

  // Filter by minimum similarity threshold
  const relevantChunks = searchResults.filter(
    (r) => r.similarity >= MIN_SIMILARITY_THRESHOLD
  );

  console.log(
    `[RAG] Retrieved ${relevantChunks.length} relevant chunks (top similarity: ${
      relevantChunks[0]?.similarity.toFixed(3) ?? "N/A"
    })`
  );

  // ── Step 3: Build context string from retrieved chunks ─────
  const contextText =
    relevantChunks.length > 0
      ? relevantChunks
          .map(
            (r, i) =>
              `[Chunk ${i + 1} — Section: ${r.chunk.metadata.section.toUpperCase()} | Relevance: ${(r.similarity * 100).toFixed(1)}%]\n${r.chunk.text}`
          )
          .join("\n\n---\n\n")
      : "No highly relevant resume sections found for this question.";

  // ── Step 4: Build system prompt ────────────────────────────
  const systemPrompt = `You are an AI assistant helping a recruiter evaluate a candidate.
You have access to the candidate's resume sections (retrieved via semantic search).
Answer questions ONLY based on the provided resume context — do NOT speculate or invent details.
If information is not in the context, clearly say "This information is not mentioned in the resume."
Be concise, factual, and professional.`;

  // ── Step 5: Build the user message with retrieved context ──
  const augmentedMessage = `
=== RETRIEVED RESUME SECTIONS (Semantic Search Results) ===
${contextText}

=== JOB DESCRIPTION (Summary) ===
${jdText.slice(0, 800)}

=== CANDIDATE'S QUESTION ===
${question}

Please answer based strictly on the retrieved resume sections above.`;

  // ── Step 6: Convert chat history to Gemini format ──────────
  const geminiHistory = chatHistory.slice(-8).map((msg) => ({
    // last 8 messages for context window management
    role: msg.role === "user" ? ("user" as const) : ("model" as const),
    parts: [{ text: msg.content }],
  }));

  // ── Step 7: Generate answer with LLM + context ─────────────
  const answer = await generateChatCompletion(
    systemPrompt,
    geminiHistory,
    augmentedMessage,
    512
  );

  return {
    answer,
    retrievedChunks: relevantChunks.map((r) => ({
      text: r.chunk.text.slice(0, 200) + (r.chunk.text.length > 200 ? "..." : ""),
      section: r.chunk.metadata.section,
      similarity: r.similarity,
    })),
  };
}
