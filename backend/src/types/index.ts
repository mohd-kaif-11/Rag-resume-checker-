// ============================================================
// Shared TypeScript types for the Resume Screening Tool
// ============================================================

export interface DocumentChunk {
  id: string;
  text: string;
  embedding: number[];
  metadata: {
    source: "resume" | "jd";
    section: string;
    chunkIndex: number;
  };
}

export interface VectorSearchResult {
  chunk: DocumentChunk;
  similarity: number;
}

export interface AnalysisResult {
  matchScore: number;
  strengths: string[];
  gaps: string[];
  overallAssessment: string;
  extractedSkills: {
    resumeSkills: string[];
    requiredSkills: string[];
    matchedSkills: string[];
    missingSkills: string[];
  };
  experienceSummary: string;
  educationInfo: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface SessionData {
  sessionId: string;
  resumeText: string;
  jdText: string;
  resumeChunks: DocumentChunk[];
  jdChunks: DocumentChunk[];
  analysisResult: AnalysisResult;
  chatHistory: ChatMessage[];
  createdAt: Date;
  lastActivity: Date;
}

export interface UploadResponse {
  sessionId: string;
  analysis: AnalysisResult;
  message: string;
}

export interface ChatRequest {
  sessionId: string;
  message: string;
}

export interface ChatResponse {
  reply: string;
  retrievedChunks: Array<{
    text: string;
    section: string;
    similarity: number;
  }>;
  sessionId: string;
}
