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
  retrievedChunks?: Array<{
    text: string;
    section: string;
    similarity: number;
  }>;
}

export interface UploadResponse {
  sessionId: string;
  analysis: AnalysisResult;
  message: string;
  stats: {
    resumeChunks: number;
    jdChunks: number;
    vectorCount: number;
  };
}

export interface AppState {
  sessionId: string | null;
  analysis: AnalysisResult | null;
  chatMessages: ChatMessage[];
  isUploading: boolean;
  isChatLoading: boolean;
  uploadError: string | null;
  chatError: string | null;
  uploadStats: UploadResponse["stats"] | null;
}
