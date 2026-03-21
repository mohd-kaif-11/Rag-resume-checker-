import React, { useState } from "react";
import { GitBranch, ChevronDown, ChevronUp } from "lucide-react";

export default function RagDiagram() {
  const [open, setOpen] = useState(false);

  return (
    <div className="card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full card-header flex items-center justify-between hover:bg-gray-50 transition rounded-t-xl"
      >
        <div className="flex items-center gap-2">
          <div className="icon-wrapper bg-indigo-100">
            <GitBranch size={20} className="text-indigo-600" />
          </div>
          <div className="text-left">
            <h2 className="text-base font-bold text-gray-900">
              RAG Architecture
            </h2>
            <p className="text-xs text-gray-500">
              How the pipeline works under the hood
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp size={18} className="text-gray-400" />
        ) : (
          <ChevronDown size={18} className="text-gray-400" />
        )}
      </button>

      {open && (
        <div className="card-body">
          {/* Upload Phase */}
          <div className="mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Phase 1 — Document Ingestion
            </h3>
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {[
                { label: "PDF / TXT", icon: "📄", bg: "bg-gray-100 text-gray-700" },
                { label: "pdf-parse", icon: "🔍", bg: "bg-blue-100 text-blue-700" },
                { label: "Chunk (600 chars + overlap)", icon: "✂️", bg: "bg-purple-100 text-purple-700" },
                { label: "text-embedding-004", icon: "🧠", bg: "bg-indigo-100 text-indigo-700" },
                { label: "Vector Store (768-dim)", icon: "🗄️", bg: "bg-green-100 text-green-700" },
              ].map((step, i, arr) => (
                <React.Fragment key={i}>
                  <div
                    className={`flex-shrink-0 flex flex-col items-center text-center px-2 py-1.5 rounded-lg ${step.bg}`}
                  >
                    <span className="text-base">{step.icon}</span>
                    <span className="text-xs font-medium mt-0.5 whitespace-nowrap">
                      {step.label}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <span className="text-gray-300 font-bold flex-shrink-0 text-lg">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Chat Phase */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Phase 2 — RAG Query (per message)
            </h3>
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {[
                { label: "User Question", icon: "💬", bg: "bg-gray-100 text-gray-700" },
                { label: "Embed Question", icon: "🧠", bg: "bg-blue-100 text-blue-700" },
                { label: "Cosine Search", icon: "🔎", bg: "bg-purple-100 text-purple-700" },
                { label: "Top-4 Chunks", icon: "📌", bg: "bg-amber-100 text-amber-700" },
                { label: "LLM + Context", icon: "⚡", bg: "bg-red-100 text-red-700" },
                { label: "Grounded Answer", icon: "✅", bg: "bg-green-100 text-green-700" },
              ].map((step, i, arr) => (
                <React.Fragment key={i}>
                  <div
                    className={`flex-shrink-0 flex flex-col items-center text-center px-2 py-1.5 rounded-lg ${step.bg}`}
                  >
                    <span className="text-base">{step.icon}</span>
                    <span className="text-xs font-medium mt-0.5 whitespace-nowrap">
                      {step.label}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <span className="text-gray-300 font-bold flex-shrink-0 text-lg">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-xs text-amber-700">
              <strong>⚡ Why RAG?</strong> Instead of sending the entire resume to the LLM (costly + unreliable), we embed and search only the most semantically relevant sections. This makes answers more accurate, faster, and grounded in the actual document.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
