import React, { useState, useCallback } from "react";
import Header from "./components/Header";
import FileUpload from "./components/FileUpload";
import MatchScore from "./components/MatchScore";
import InsightsPanel from "./components/InsightsPanel";
import ChatInterface from "./components/ChatInterface";
import RagDiagram from "./components/RagDiagram";
import { uploadDocuments, sendChatMessage, clearChatHistory } from "./services/api";
import { AppState, ChatMessage } from "./types";
import { RefreshCw, ArrowDown } from "lucide-react";

const initialState: AppState = {
  sessionId: null,
  analysis: null,
  chatMessages: [],
  isUploading: false,
  isChatLoading: false,
  uploadError: null,
  chatError: null,
  uploadStats: null,
};

export default function App() {
  const [state, setState] = useState<AppState>(initialState);

  // ── Upload handler ────────────────────────────────────────────
  const handleUpload = useCallback(async (resumeFile: File, jdFile: File) => {
    setState((prev) => ({
      ...prev,
      isUploading: true,
      uploadError: null,
      analysis: null,
      sessionId: null,
      chatMessages: [],
      uploadStats: null,
    }));

    try {
      const result = await uploadDocuments(resumeFile, jdFile);
      setState((prev) => ({
        ...prev,
        isUploading: false,
        sessionId: result.sessionId,
        analysis: result.analysis,
        uploadStats: result.stats,
        uploadError: null,
      }));

      // Smooth scroll to results
      setTimeout(() => {
        document
          .getElementById("analysis-results")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { error?: string } } })?.response?.data
              ?.error ?? "Upload failed. Please check your API key and try again.";

      setState((prev) => ({
        ...prev,
        isUploading: false,
        uploadError: errMsg,
      }));
    }
  }, []);

  // ── Chat handler ──────────────────────────────────────────────
  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!state.sessionId) return;

      const userMsg: ChatMessage = {
        role: "user",
        content: message,
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        chatMessages: [...prev.chatMessages, userMsg],
        isChatLoading: true,
        chatError: null,
      }));

      try {
        const result = await sendChatMessage(state.sessionId, message);

        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: result.reply,
          timestamp: new Date(),
          retrievedChunks: result.retrievedChunks,
        };

        setState((prev) => ({
          ...prev,
          chatMessages: [...prev.chatMessages, assistantMsg],
          isChatLoading: false,
        }));
      } catch (error: unknown) {
        const errMsg =
          error instanceof Error
            ? error.message
            : (error as { response?: { data?: { error?: string } } })?.response
                ?.data?.error ?? "Chat failed. Please try again.";

        setState((prev) => ({
          ...prev,
          isChatLoading: false,
          chatError: errMsg,
        }));
      }
    },
    [state.sessionId]
  );

  // ── Clear chat handler ────────────────────────────────────────
  const handleClearChat = useCallback(async () => {
    if (!state.sessionId) return;

    try {
      await clearChatHistory(state.sessionId);
    } catch {
      // Non-critical — just clear frontend state
    }

    setState((prev) => ({ ...prev, chatMessages: [], chatError: null }));
  }, [state.sessionId]);

  // ── Reset everything ──────────────────────────────────────────
  const handleReset = () => {
    setState(initialState);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showResults = !!state.analysis;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Hero Section */}
        {!showResults && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Powered by Gemini 1.5 Flash · text-embedding-004 · RAG Pipeline
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
              AI Resume Screening
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                with RAG Technology
              </span>
            </h2>
            <p className="text-gray-500 text-base max-w-2xl mx-auto leading-relaxed">
              Upload a resume and job description to get an instant AI-powered match score,
              strengths & gaps analysis, and ask questions via our RAG-powered chat —
              all grounded in the actual document content.
            </p>
          </div>
        )}

        {/* Upload Section */}
        <FileUpload
          onUpload={handleUpload}
          isLoading={state.isUploading}
          error={state.uploadError}
        />

        {/* RAG Architecture (always visible, collapsed by default) */}
        <RagDiagram />

        {/* Results Section */}
        {showResults && state.analysis && (
          <div id="analysis-results" className="space-y-6">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ArrowDown size={16} className="text-green-500 animate-bounce" />
                <h2 className="text-xl font-bold text-gray-900">Analysis Results</h2>
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  Ready
                </span>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 bg-white border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-1.5 transition shadow-sm"
              >
                <RefreshCw size={14} />
                New Analysis
              </button>
            </div>

            {/* Match Score + Insights — 2 column on large screens */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MatchScore
                analysis={state.analysis}
                stats={state.uploadStats}
              />
              <InsightsPanel analysis={state.analysis} />
            </div>

            {/* Chat Interface — full width */}
            {state.sessionId && (
              <ChatInterface
                onSendMessage={handleSendMessage}
                messages={state.chatMessages}
                isLoading={state.isChatLoading}
                error={state.chatError}
                onClearHistory={handleClearChat}
                sessionId={state.sessionId}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-sm text-gray-400">
              Resume Screening Tool · RAG Implementation with Gemini · Free API Tier
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>Node.js 18 + Express</span>
              <span>·</span>
              <span>React 18 + TypeScript</span>
              <span>·</span>
              <span>text-embedding-004 (768-dim)</span>
              <span>·</span>
              <span>In-Memory Vector Store</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
