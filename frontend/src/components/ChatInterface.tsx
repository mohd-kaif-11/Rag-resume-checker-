import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Trash2,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  Zap,
  Info,
} from "lucide-react";
import { ChatMessage } from "../types";

interface ChatInterfaceProps {
  onSendMessage: (message: string) => void;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onClearHistory: () => void;
  sessionId: string;
}

const SUGGESTED_QUESTIONS = [
  "Does this candidate have a degree from a state university?",
  "Do you think they can handle backend architecture?",
  "What's their experience with databases?",
  "Is this candidate eligible to lead a team?",
  "What are their strongest technical skills?",
  "How many years of experience do they have?",
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 justify-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-sm">
        <Bot size={14} className="text-white" />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

function RetrievedChunksAccordion({
  chunks,
}: {
  chunks: NonNullable<ChatMessage["retrievedChunks"]>;
}) {
  const [open, setOpen] = useState(false);

  if (!chunks || chunks.length === 0) return null;

  return (
    <div className="mt-2 border border-blue-100 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition"
      >
        <div className="flex items-center gap-1.5">
          <Zap size={11} />
          <span>RAG: {chunks.length} resume section{chunks.length > 1 ? "s" : ""} retrieved</span>
        </div>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="bg-white divide-y divide-gray-50">
          {chunks.map((chunk, i) => (
            <div key={i} className="px-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                  {chunk.section}
                </span>
                <span className="text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded-full">
                  {(chunk.similarity * 100).toFixed(1)}% match
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{chunk.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isUser) {
    return (
      <div className="flex items-end gap-2 justify-end">
        <div className="flex flex-col items-end gap-1 max-w-[75%]">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
          <span className="text-xs text-gray-400 px-1">{time}</span>
        </div>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-sm">
          <User size={14} className="text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 justify-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-sm">
        <Bot size={14} className="text-white" />
      </div>
      <div className="flex flex-col gap-1 max-w-[78%]">
        <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
        {message.retrievedChunks && message.retrievedChunks.length > 0 && (
          <RetrievedChunksAccordion chunks={message.retrievedChunks} />
        )}
        <span className="text-xs text-gray-400 px-1">{time}</span>
      </div>
    </div>
  );
}

export default function ChatInterface({
  onSendMessage,
  messages,
  isLoading,
  error,
  onClearHistory,
  sessionId,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    setShowSuggestions(false);
    onSendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedQuestion = (q: string) => {
    setInput(q);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="card flex flex-col h-[600px]">
      {/* Header */}
      <div className="card-header flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="icon-wrapper bg-purple-100">
              <MessageSquare size={20} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Ask About This Candidate</h2>
              <p className="text-sm text-gray-500">
                RAG-powered · answers grounded in the resume
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-700 font-medium">RAG Active</span>
            </div>
            {messages.length > 0 && (
              <button
                onClick={onClearHistory}
                title="Clear chat history"
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RAG Info Banner */}
      <div className="mx-4 mb-2 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        <Info size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          Each question is embedded → matched against resume vectors → only relevant sections are sent to the AI. Expand "RAG:" under any answer to see retrieved chunks.
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 scrollbar-thin">
        {/* Welcome state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <Bot size={28} className="text-purple-500" />
            </div>
            <div className="text-center">
              <p className="text-gray-700 font-semibold text-sm">
                Ready to answer questions
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Ask anything about the candidate's resume
              </p>
            </div>

            {/* Suggested questions */}
            {showSuggestions && (
              <div className="w-full max-w-md space-y-2">
                <p className="text-xs text-gray-400 text-center font-medium uppercase tracking-wide">
                  Suggested Questions
                </p>
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedQuestion(q)}
                    className="w-full text-left text-xs text-gray-600 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-100 hover:border-blue-200 rounded-lg px-3 py-2 transition flex items-center gap-2"
                  >
                    <MessageSquare size={11} className="flex-shrink-0 opacity-60" />
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {/* Loading indicator */}
        {isLoading && <TypingIndicator />}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm">
            <span className="text-red-500">⚠</span> {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-gray-100 p-4">
        <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-blue-400 focus-within:bg-white transition">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Ask a question, e.g. "Does he have a state university degree?"'
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-800 placeholder-gray-400 max-h-[120px] py-1"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`flex-shrink-0 p-2 rounded-lg transition ${
              input.trim() && !isLoading
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-md"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            title="Send message (Enter)"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1 text-center">
          Enter to send · Shift+Enter for new line ·{" "}
          <span className="text-purple-500 font-medium">Gemini 1.5 Flash + RAG</span>
        </p>
      </div>
    </div>
  );
}
