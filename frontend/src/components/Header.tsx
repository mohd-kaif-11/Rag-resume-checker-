import React from "react";
import { Brain, Github, Cpu } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md">
                <Brain size={20} className="text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900 leading-tight">
                Resume<span className="text-blue-600">Screen</span>
                <span className="text-purple-600">AI</span>
              </h1>
              <p className="text-xs text-gray-400 leading-tight">
                RAG-Powered Candidate Analysis
              </p>
            </div>
          </div>

          {/* Tech Stack Badges */}
          <div className="hidden md:flex items-center gap-2">
            <TechBadge label="Node.js 18" color="green" />
            <TechBadge label="React 18" color="blue" />
            <TechBadge label="TypeScript" color="blue" />
            <TechBadge label="RAG Pipeline" color="purple" />
            <TechBadge label="Gemini Free" color="amber" />
          </div>

          {/* GitHub link */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            <Github size={16} />
            <span className="hidden sm:inline">Source</span>
          </a>
        </div>
      </div>

      {/* RAG Pipeline indicator bar */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 h-0.5" />
    </header>
  );
}

function TechBadge({
  label,
  color,
}: {
  label: string;
  color: "green" | "blue" | "purple" | "amber";
}) {
  const colors = {
    green: "bg-green-50 text-green-700 border-green-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${colors[color]}`}
    >
      {label}
    </span>
  );
}
