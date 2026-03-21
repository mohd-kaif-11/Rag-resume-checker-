import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { parseFile, chunkText, cleanupFile } from "../services/pdfParser";
import { generateBatchEmbeddings } from "../services/embeddingService";
import { VectorStore } from "../services/vectorStore";
import { analyzeResumeVsJD } from "../services/analysisService";
import { SessionData } from "../types";

const router = Router();

// ── Multer Configuration ───────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ["application/pdf", "text/plain"];
  const allowedExts = [".pdf", ".txt"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and TXT files are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// In-memory session store
// In production, replace with Redis or a database
export const sessions = new Map<string, SessionData>();

// Session TTL: 2 hours
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

// Cleanup expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastActivity.getTime() > SESSION_TTL_MS) {
      sessions.delete(id);
      console.log(`[session] Expired session removed: ${id}`);
    }
  }
}, 30 * 60 * 1000); // every 30 min

// ── POST /api/upload ────────────────────────────────────────────
// Accepts: resume (file) + jobDescription (file)
// Returns: sessionId + full analysis result
router.post(
  "/",
  upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "jobDescription", maxCount: 1 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const resumeFile = files?.resume?.[0];
    const jdFile = files?.jobDescription?.[0];

    if (!resumeFile || !jdFile) {
      res.status(400).json({
        error: "Both resume and job description files are required.",
      });
      return;
    }

    try {
      console.log("[upload] Parsing documents...");

      // ── Step 1: Parse files to text ────────────────────────
      const [resumeText, jdText] = await Promise.all([
        parseFile(resumeFile.path),
        parseFile(jdFile.path),
      ]);

      if (!resumeText.trim() || !jdText.trim()) {
        res.status(422).json({ error: "Could not extract text from one or both files." });
        return;
      }

      console.log(
        `[upload] Resume: ${resumeText.length} chars | JD: ${jdText.length} chars`
      );

      // ── Step 2: Chunk documents into sections ──────────────
      const resumeChunkData = chunkText(resumeText, `resume`).slice(0, 6);
      const jdChunkData = chunkText(jdText, `jd`).slice(0, 4);

      console.log(
        `[upload] Chunks — Resume: ${resumeChunkData.length} | JD: ${jdChunkData.length}`
      );

      // ── Step 3: Generate embeddings for all chunks ─────────
      // (RAG: each chunk gets a 768-dim vector for semantic search)
      console.log("[upload] Generating embeddings...");

      const [resumeEmbeddings, jdEmbeddings] = await Promise.all([
        generateBatchEmbeddings(resumeChunkData.map((c) => c.text)),
        generateBatchEmbeddings(jdChunkData.map((c) => c.text)),
      ]);

      // ── Step 4: Store embeddings in vector store ───────────
      const vectorStore = new VectorStore();
      vectorStore.addChunks(resumeChunkData, resumeEmbeddings, "resume");
      vectorStore.addChunks(jdChunkData, jdEmbeddings, "jd");

      console.log(
        `[upload] Vector store populated: ${vectorStore.size()} vectors`
      );

      // ── Step 5: Analyze resume vs JD ──────────────────────
      console.log("[upload] Running analysis...");
      const analysisResult = await analyzeResumeVsJD(resumeText, jdText);

      // ── Step 6: Create session ─────────────────────────────
      const sessionId = uuidv4();
      const sessionData: SessionData = {
        sessionId,
        resumeText,
        jdText,
        resumeChunks: vectorStore.getChunksBySource("resume"),
        jdChunks: vectorStore.getChunksBySource("jd"),
        analysisResult,
        chatHistory: [],
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      // Attach vector store reference to session
      // We store chunks in session but recreate the store for chat
      // (In production, use a proper vector DB to avoid this)
      (sessionData as SessionData & { _vectorStore: VectorStore })._vectorStore =
        vectorStore;

      sessions.set(sessionId, sessionData);
      console.log(`[upload] Session created: ${sessionId}`);

      // Cleanup uploaded temp files
      cleanupFile(resumeFile.path);
      cleanupFile(jdFile.path);

      res.json({
        sessionId,
        analysis: analysisResult,
        message: "Documents processed successfully.",
        stats: {
          resumeChunks: resumeChunkData.length,
          jdChunks: jdChunkData.length,
          vectorCount: vectorStore.size(),
        },
      });
    } catch (error) {
      console.error("[upload] Error:", error);
      cleanupFile(resumeFile?.path);
      cleanupFile(jdFile?.path);

      const errMsg =
        error instanceof Error ? error.message : "An unexpected error occurred.";
      res.status(500).json({ error: errMsg });
    }
  }
);

// ── GET /api/upload/session/:id ─────────────────────────────────
// Retrieve session analysis data
router.get("/session/:id", (req: Request, res: Response): void => {
  const session = sessions.get(req.params.id);
  if (!session) {
    res.status(404).json({ error: "Session not found or expired." });
    return;
  }

  session.lastActivity = new Date();
  res.json({
    sessionId: session.sessionId,
    analysis: session.analysisResult,
    chatHistory: session.chatHistory,
  });
});

export default router;
