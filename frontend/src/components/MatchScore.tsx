import React from "react";
import { AnalysisResult } from "../types";
import { TrendingUp, Award, Layers } from "lucide-react";

interface MatchScoreProps {
  analysis: AnalysisResult;
  stats?: { resumeChunks: number; jdChunks: number; vectorCount: number } | null;
}

function CircularScore({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 75) return { stroke: "#22c55e", text: "text-green-600", label: "Strong Match" };
    if (s >= 55) return { stroke: "#3b82f6", text: "text-blue-600", label: "Good Match" };
    if (s >= 35) return { stroke: "#f59e0b", text: "text-amber-600", label: "Partial Match" };
    return { stroke: "#ef4444", text: "text-red-600", label: "Weak Match" };
  };

  const { stroke, text, label } = getColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg className="transform -rotate-90 w-36 h-36" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-black ${text}`}>{score}%</span>
          <span className="text-xs text-gray-500 font-medium">match</span>
        </div>
      </div>
      <span
        className={`text-sm font-bold px-3 py-1 rounded-full ${
          score >= 75
            ? "bg-green-100 text-green-700"
            : score >= 55
            ? "bg-blue-100 text-blue-700"
            : score >= 35
            ? "bg-amber-100 text-amber-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function SkillTag({ label, matched }: { label: string; matched: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
        matched
          ? "bg-green-100 text-green-700 border border-green-200"
          : "bg-red-50 text-red-600 border border-red-200"
      }`}
    >
      {matched ? "✓" : "✗"} {label}
    </span>
  );
}

export default function MatchScore({ analysis, stats }: MatchScoreProps) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <div className="icon-wrapper bg-green-100">
            <TrendingUp size={20} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Match Analysis</h2>
            <p className="text-sm text-gray-500">
              Resume vs Job Description compatibility
            </p>
          </div>
        </div>
      </div>

      <div className="card-body">
        {/* Score + Overview */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-6">
          <CircularScore score={analysis.matchScore} />

          <div className="flex-1 space-y-3">
            {analysis.experienceSummary && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  Experience Summary
                </p>
                <p className="text-sm text-gray-700">{analysis.experienceSummary}</p>
              </div>
            )}
            {analysis.educationInfo && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  Education
                </p>
                <p className="text-sm text-gray-700">{analysis.educationInfo}</p>
              </div>
            )}
            {analysis.overallAssessment && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-600 uppercase mb-1">
                  Overall Assessment
                </p>
                <p className="text-sm text-gray-700">{analysis.overallAssessment}</p>
              </div>
            )}
          </div>
        </div>

        {/* Skills Matrix */}
        {(analysis.extractedSkills.matchedSkills.length > 0 ||
          analysis.extractedSkills.missingSkills.length > 0) && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Layers size={16} className="text-gray-500" />
              <h3 className="text-sm font-bold text-gray-700">Skills Matrix</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.extractedSkills.matchedSkills.map((skill, i) => (
                <SkillTag key={`matched-${i}`} label={skill} matched={true} />
              ))}
              {analysis.extractedSkills.missingSkills.map((skill, i) => (
                <SkillTag key={`missing-${i}`} label={skill} matched={false} />
              ))}
            </div>
          </div>
        )}

        {/* RAG Stats */}
        {stats && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Award size={14} className="text-gray-400" />
              <p className="text-xs font-semibold text-gray-400 uppercase">
                RAG Pipeline Stats
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{stats.vectorCount}</div>
                <div className="text-xs text-gray-500">Total Vectors</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{stats.resumeChunks}</div>
                <div className="text-xs text-gray-500">Resume Chunks</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{stats.jdChunks}</div>
                <div className="text-xs text-gray-500">JD Chunks</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
