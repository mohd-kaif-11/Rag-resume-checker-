import { Router, Request, Response } from "express";
import { sessions } from "./upload";
import { answerWithRAG } from "../services/ragService";
import { VectorStore } from "../services/vectorStore";
import { ChatMessage, SessionData } from "../types";

const router = Router();

// ── POST /api/chat ──────────────────────────────────────────────
// Accepts: { sessionId, message }
// Returns: { reply, retrievedChunks, sessionId }
//
// Full RAG Flow per request:
//  1. Load session (contains resume chunks + JD text)
//  2. Embed user's question → 768-dim vector
//  3. Search vector store → top-4 most similar resume sections
//  4. Pass: retrieved context + question + chat history → LLM
//  5. Return grounded, context-aware answer
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { sessionId, message } = req.body;

  if (!sessionId || typeof sessionId !== "string") {
    res.status(400).json({ error: "sessionId is required." });
    return;
  }

  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "message is required and must be non-empty." });
    return;
  }

  const session = sessions.get(sessionId) as
    | (SessionData & { _vectorStore?: VectorStore })
    | undefined;

  if (!session) {
    res.status(404).json({
      error: "Session not found. Please re-upload your documents.",
    });
    return;
  }

  try {
    // Update last activity timestamp
    session.lastActivity = new Date();

    // Reconstruct vector store from session chunks if needed
    // (This handles the case where the in-memory store might have been lost)
    let vectorStore = session._vectorStore;
    if (!vectorStore || vectorStore.size() === 0) {
      console.log(`[chat] Reconstructing vector store for session: ${sessionId}`);
      vectorStore = new VectorStore();
      vectorStore.addChunks(
        session.resumeChunks.map((c) => ({ text: c.text, section: c.metadata.section })),
        session.resumeChunks.map((c) => c.embedding),
        "resume"
      );
      vectorStore.addChunks(
        session.jdChunks.map((c) => ({ text: c.text, section: c.metadata.section })),
        session.jdChunks.map((c) => c.embedding),
        "jd"
      );
      session._vectorStore = vectorStore;
    }

    console.log(
      `[chat] Session ${sessionId.slice(0, 8)}... | Question: "${message.slice(0, 60)}"`
    );

    // ── RAG: Retrieve + Generate ─────────────────────────────
    const { answer, retrievedChunks } = await answerWithRAG(
      message,
      vectorStore,
      session.chatHistory,
      session.resumeText,
      session.jdText
    );

    // ── Update chat history ──────────────────────────────────
    const userMsg: ChatMessage = {
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    const assistantMsg: ChatMessage = {
      role: "assistant",
      content: answer,
      timestamp: new Date(),
    };

    session.chatHistory.push(userMsg, assistantMsg);

    // Keep last 20 messages to manage context window
    if (session.chatHistory.length > 20) {
      session.chatHistory = session.chatHistory.slice(-20);
    }

    res.json({
      reply: answer,
      retrievedChunks,
      sessionId,
    });
  } catch (error) {
    console.error("[chat] Error:", error);
    const errMsg =
      error instanceof Error ? error.message : "Chat processing failed.";
    res.status(500).json({ error: errMsg });
  }
});

// ── DELETE /api/chat/history ─────────────────────────────────────
// Clear chat history for a session
router.delete("/history", (req: Request, res: Response): void => {
  const { sessionId } = req.body;
  const session = sessions.get(sessionId);

  if (!session) {
    res.status(404).json({ error: "Session not found." });
    return;
  }

  session.chatHistory = [];
  res.json({ message: "Chat history cleared.", sessionId });
});

export default router;
