import pdfParse from "pdf-parse";
import fs from "fs";
import path from "path";

// ============================================================
// PDF / TXT Parser Service
// Handles text extraction from uploaded documents
// ============================================================

/**
 * Extracts raw text from a PDF or TXT file
 */
export async function parseFile(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".pdf") {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    // Clean up extracted text
    return cleanText(data.text);
  } else if (ext === ".txt") {
    const raw = fs.readFileSync(filePath, "utf-8");
    return cleanText(raw);
  }

  throw new Error(`Unsupported file type: ${ext}. Only .pdf and .txt are supported.`);
}

/**
 * Cleans raw extracted text — removes excessive whitespace, null chars, etc.
 */
function cleanText(text: string): string {
  return text
    .replace(/\x00/g, "") // null bytes
    .replace(/\r\n/g, "\n") // normalize line endings
    .replace(/\r/g, "\n")
    .replace(/[ \t]{3,}/g, "  ") // collapse excessive spaces
    .replace(/\n{4,}/g, "\n\n\n") // collapse excessive blank lines
    .trim();
}

/**
 * Intelligently chunks a resume or JD text into meaningful sections.
 *
 * Strategy:
 *  1. First tries to split by known section headers (Experience, Skills, Education…)
 *  2. Falls back to sliding window chunking with overlap if no sections found
 *
 * Overlap ensures context isn't lost at chunk boundaries — critical for RAG quality.
 */
export function chunkText(
  text: string,
  source: "resume" | "jd",
  maxChunkSize: number = 2000,
  overlapSize: number = 0
): Array<{ text: string; section: string }> {
  const sectionHeaders =
    source === "resume"
      ? [
          "summary",
          "objective",
          "experience",
          "work experience",
          "professional experience",
          "employment",
          "education",
          "academic",
          "skills",
          "technical skills",
          "core competencies",
          "projects",
          "certifications",
          "awards",
          "publications",
          "languages",
          "interests",
          "references",
        ]
      : [
          "requirements",
          "responsibilities",
          "qualifications",
          "about",
          "description",
          "role",
          "what you'll do",
          "what we're looking for",
          "nice to have",
          "benefits",
          "compensation",
        ];

  const headerRegex = new RegExp(
    `^(${sectionHeaders.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})[:\\s]*$`,
    "im"
  );

  // Split into lines and identify section boundaries
  const lines = text.split("\n");
  const sections: Array<{ header: string; lines: string[] }> = [];
  let currentSection: { header: string; lines: string[] } = {
    header: "general",
    lines: [],
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && headerRegex.test(trimmed)) {
      if (currentSection.lines.filter((l) => l.trim()).length > 0) {
        sections.push({ ...currentSection });
      }
      currentSection = { header: trimmed.toLowerCase(), lines: [line] };
    } else {
      currentSection.lines.push(line);
    }
  }

  if (currentSection.lines.filter((l) => l.trim()).length > 0) {
    sections.push(currentSection);
  }

  // If no sections found, treat entire text as one section
  if (sections.length === 0 || (sections.length === 1 && sections[0].header === "general")) {
    return slidingWindowChunks(text, "general", maxChunkSize, overlapSize);
  }

  // Convert each section to chunks
  const result: Array<{ text: string; section: string }> = [];

  for (const section of sections) {
    const sectionText = section.lines.join("\n").trim();
    if (sectionText.length < 30) continue; // skip trivially short sections

    if (sectionText.length <= maxChunkSize) {
      result.push({ text: sectionText, section: section.header });
    } else {
      // Large section: use sliding window
      const subChunks = slidingWindowChunks(sectionText, section.header, maxChunkSize, overlapSize);
      result.push(...subChunks);
    }
  }

  return result.filter((c) => c.text.trim().length > 30);
}

/**
 * Sliding window chunking — ensures overlap between consecutive chunks
 * so that contextual information spanning chunk boundaries is not lost
 */
function slidingWindowChunks(
  text: string,
  section: string,
  maxChunkSize: number,
  overlapSize: number
): Array<{ text: string; section: string }> {
  const words = text.split(/\s+/);
  const chunks: Array<{ text: string; section: string }> = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + Math.floor(maxChunkSize / 5), words.length); // ~6 chars per word avg
    const chunk = words.slice(start, end).join(" ").trim();
    if (chunk.length > 30) {
      chunks.push({ text: chunk, section });
    }
    start = end - Math.floor(overlapSize / 6); // overlap
    if (start >= words.length) break;
  }

  return chunks;
}

/**
 * Cleanup temp uploaded file from disk
 */
export function cleanupFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Non-critical — just log
    console.warn(`[cleanup] Could not delete temp file: ${filePath}`);
  }
}
