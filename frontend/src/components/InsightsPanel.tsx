import React, { useState } from "react";
import { CheckCircle, XCircle, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { AnalysisResult } from "../types";

interface InsightsPanelProps {
  analysis: AnalysisResult;
}

function InsightItem({
  text,
  type,
}: {
  text: string;
  type: "strength" | "gap";
}) {
  return (
    <li className="flex items-start gap-2.5 py-2 border-b border-gray-50 last:border-0">
      <div className="flex-shrink-0 mt-0.5">
        {type === "strength" ? (
          <CheckCircle size={16} className="text-green-500" />
        ) : (
          <XCircle size={16} className="text-red-400" />
        )}
      </div>
      <span className="text-sm text-gray-700 leading-relaxed">{text}</span>
    </li>
  );
}

function CollapsibleSection({
  title,
  icon,
  headerClass,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  headerClass: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl overflow-hidden border border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 ${headerClass} text-left transition`}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-sm">{title}</span>
        </div>
        {open ? (
          <ChevronUp size={16} className="opacity-60" />
        ) : (
          <ChevronDown size={16} className="opacity-60" />
        )}
      </button>
      {open && <div className="bg-white px-4 py-2">{children}</div>}
    </div>
  );
}

export default function InsightsPanel({ analysis }: InsightsPanelProps) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <div className="icon-wrapper bg-amber-100">
            <Lightbulb size={20} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Key Insights</h2>
            <p className="text-sm text-gray-500">
              Strengths, gaps, and candidate assessment
            </p>
          </div>
        </div>
      </div>

      <div className="card-body space-y-3">
        {/* Strengths */}
        <CollapsibleSection
          title={`Strengths (${analysis.strengths.length})`}
          icon={<CheckCircle size={16} className="text-green-600" />}
          headerClass="bg-green-50 text-green-800 hover:bg-green-100"
          defaultOpen={true}
        >
          {analysis.strengths.length > 0 ? (
            <ul>
              {analysis.strengths.map((s, i) => (
                <InsightItem key={i} text={s} type="strength" />
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm py-2 text-center italic">
              No specific strengths identified
            </p>
          )}
        </CollapsibleSection>

        {/* Gaps */}
        <CollapsibleSection
          title={`Gaps / Missing Skills (${analysis.gaps.length})`}
          icon={<XCircle size={16} className="text-red-500" />}
          headerClass="bg-red-50 text-red-800 hover:bg-red-100"
          defaultOpen={true}
        >
          {analysis.gaps.length > 0 ? (
            <ul>
              {analysis.gaps.map((g, i) => (
                <InsightItem key={i} text={g} type="gap" />
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm py-2 text-center italic">
              No significant gaps identified
            </p>
          )}
        </CollapsibleSection>

        {/* Candidate Skills from Resume */}
        {analysis.extractedSkills.resumeSkills.length > 0 && (
          <CollapsibleSection
            title={`Candidate's Skills (${analysis.extractedSkills.resumeSkills.length})`}
            icon={<Lightbulb size={16} className="text-blue-500" />}
            headerClass="bg-blue-50 text-blue-800 hover:bg-blue-100"
            defaultOpen={false}
          >
            <div className="py-2 flex flex-wrap gap-2">
              {analysis.extractedSkills.resumeSkills.map((skill, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}
