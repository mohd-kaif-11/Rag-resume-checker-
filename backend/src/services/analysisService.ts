import { generateCompletion } from "./embeddingService";
import { AnalysisResult } from "../types";

// ============================================================
// Analysis Service
// Performs intelligent resume-to-JD matching using LLM
// ============================================================

/**
 * Main analysis function — given resume text + JD text,
 * returns match score, strengths, gaps, and overall assessment
 */
export async function analyzeResumeVsJD(
  resumeText: string,
  jdText: string
): Promise<AnalysisResult> {
  const systemPrompt = `You are an expert technical recruiter and HR analyst with 15 years of experience.
Your job is to objectively analyze a candidate's resume against a job description.
Be precise, factual, and base all observations strictly on the provided documents.
Always respond in valid JSON only — no markdown, no commentary outside the JSON.`;

  const userPrompt = `Analyze the following resume against the job description and return a JSON object.

=== JOB DESCRIPTION ===
${jdText.slice(0, 3000)}

=== RESUME ===
${resumeText.slice(0, 3000)}

Return ONLY this JSON structure (no markdown, no extra text):
{
  "matchScore": <integer 0-100>,
  "strengths": [<3-6 specific strength strings based on JD requirements met>],
  "gaps": [<2-5 specific gap strings — JD requirements not found in resume>],
  "overallAssessment": "<2-3 sentence honest overall assessment>",
  "extractedSkills": {
    "resumeSkills": [<all technical skills found in resume>],
    "requiredSkills": [<all skills/requirements found in JD>],
    "matchedSkills": [<skills present in both>],
    "missingSkills": [<required skills missing from resume>]
  },
  "experienceSummary": "<1-2 sentences summarizing candidate's experience level>",
  "educationInfo": "<candidate's education details as found in resume>"
}

Scoring guide:
- 80-100: Strong match, meets most requirements
- 60-79: Good match, meets core requirements with some gaps
- 40-59: Partial match, meets some requirements
- 0-39: Weak match, significant gaps`;

  try {
    const rawResponse = await generateCompletion(systemPrompt, userPrompt, 1500);
    const cleaned = extractJSON(rawResponse);
    const parsed = JSON.parse(cleaned) as AnalysisResult;

    // Validate and sanitize
    return {
      matchScore: Math.min(100, Math.max(0, parsed.matchScore || 0)),
      strengths: ensureArray(parsed.strengths).slice(0, 8),
      gaps: ensureArray(parsed.gaps).slice(0, 8),
      overallAssessment: parsed.overallAssessment || "Analysis complete.",
      extractedSkills: {
        resumeSkills: ensureArray(parsed.extractedSkills?.resumeSkills),
        requiredSkills: ensureArray(parsed.extractedSkills?.requiredSkills),
        matchedSkills: ensureArray(parsed.extractedSkills?.matchedSkills),
        missingSkills: ensureArray(parsed.extractedSkills?.missingSkills),
      },
      experienceSummary: parsed.experienceSummary || "",
      educationInfo: parsed.educationInfo || "Not found in resume",
    };
  } catch (error) {
    console.error("[analysisService] Parse error:", error);
    // Return fallback analysis
    return generateFallbackAnalysis(resumeText, jdText);
  }
}

/**
 * Extract JSON from LLM response (handles cases where model adds markdown)
 */
function extractJSON(text: string): string {
  // Remove markdown code blocks if present
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  // Find the outermost JSON object
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("No JSON object found in response");
  }

  return cleaned.slice(start, end + 1);
}

function ensureArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.filter((v) => typeof v === "string");
  if (typeof val === "string") return [val];
  return [];
}

/**
 * Simple keyword-based fallback if LLM fails
 */
function generateFallbackAnalysis(
  resumeText: string,
  jdText: string
): AnalysisResult {
  const resumeLower = resumeText.toLowerCase();
  const commonTech = [
    "javascript", "typescript", "python", "react", "node", "sql",
    "aws", "docker", "kubernetes", "git", "java", "c++", "mongodb",
    "postgresql", "redis", "graphql", "rest", "api", "machine learning",
    "tensorflow", "pytorch", "langchain",
  ];

  const jdLower = jdText.toLowerCase();
  const required = commonTech.filter((t) => jdLower.includes(t));
  const matched = required.filter((t) => resumeLower.includes(t));
  const missing = required.filter((t) => !resumeLower.includes(t));
  const score = required.length > 0 ? Math.round((matched.length / required.length) * 100) : 50;

  return {
    matchScore: score,
    strengths: matched.slice(0, 5).map((s) => `Has ${s} experience`),
    gaps: missing.slice(0, 5).map((s) => `Missing ${s} experience`),
    overallAssessment: `Candidate matches ${score}% of the job requirements based on keyword analysis.`,
    extractedSkills: {
      resumeSkills: commonTech.filter((t) => resumeLower.includes(t)),
      requiredSkills: required,
      matchedSkills: matched,
      missingSkills: missing,
    },
    experienceSummary: "Experience details extracted from resume.",
    educationInfo: "See resume for education details.",
  };
}
