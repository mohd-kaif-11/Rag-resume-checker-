import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// ============================================================
// Embedding Service — Google Gemini text-embedding-004
//
// FREE tier:  No cost, 1500 RPM (requests per minute)
// Output dim: 768-dimensional float vectors
// Max input:  2048 tokens per call
// ============================================================

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Rate limit: add small delay between embedding calls when batching
const BATCH_DELAY_MS = 300;

/**
 * Generate a single embedding vector for a text string
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const { pipeline } = await import("@xenova/transformers");
  const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  const output = await extractor(text.slice(0, 512), { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

/**
 * Generate embeddings for a batch of texts
 * Includes rate-limit-friendly delays between requests
 */
export async function generateBatchEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const embeddings: number[][] = [];

  // Process ONE at a time — avoids holding all embeddings in memory simultaneously
  for (let i = 0; i < texts.length; i++) {
    console.log(`[embed] ${i + 1}/${texts.length}`);
    const embedding = await generateEmbedding(texts[i]);
    embeddings.push(embedding);
    await sleep(150); // slightly longer delay to be safe
  }

  return embeddings;
}

/**
 * Generate a completion using Gemini 1.5 Flash (FREE model)
 *
 * Used for:
 *  - Resume analysis (match scoring, strengths/gaps extraction)
 *  - RAG answer generation (chat with context)
 */
export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 1024
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.3, // lower = more factual/consistent
    },
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(userPrompt);
  return result.response.text();
}

/**
 * Generate a completion with multi-turn chat context
 * Used for maintaining conversation history in the chat interface
 */
export async function generateChatCompletion(
  systemPrompt: string,
  conversationHistory: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>,
  newUserMessage: string,
  maxTokens: number = 1024
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.4,
    },
    systemInstruction: systemPrompt,
  });

  const chat = model.startChat({
    history: conversationHistory,
  });

  const result = await chat.sendMessage(newUserMessage);
  return result.response.text();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
