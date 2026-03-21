import axios from "axios";
import { UploadResponse, ChatMessage } from "../types";

// Use CRA proxy in dev, or set REACT_APP_API_URL in production
const API_BASE = process.env.REACT_APP_API_URL || "";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 300000, // 2 min — LLM calls can take a moment
});

/**
 * Upload resume + job description PDFs/TXTs
 * Returns session ID and full analysis result
 */
export async function uploadDocuments(
  resumeFile: File,
  jdFile: File
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("resume", resumeFile);
  formData.append("jobDescription", jdFile);

  const response = await api.post<UploadResponse>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
}

/**
 * Send a chat message and get a RAG-powered answer
 */
export async function sendChatMessage(
  sessionId: string,
  message: string
): Promise<{
  reply: string;
  retrievedChunks: Array<{ text: string; section: string; similarity: number }>;
}> {
  const response = await api.post("/chat", { sessionId, message });
  return response.data;
}

/**
 * Clear chat history for the current session
 */
export async function clearChatHistory(sessionId: string): Promise<void> {
  await api.delete("/chat/history", { data: { sessionId } });
}

/**
 * Health check
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await api.get("/health");
    return true;
  } catch {
    return false;
  }
}

export type { ChatMessage };
