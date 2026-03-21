import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import uploadRouter from "./routes/upload";
import chatRouter from "./routes/chat";

// Load environment variables
dotenv.config();

// ── Validate required env vars ─────────────────────────────────
if (!process.env.GEMINI_API_KEY) {
  console.error(
    "\n[ERROR] GEMINI_API_KEY is not set in .env file!\n" +
    "Get your FREE key at: https://aistudio.google.com/app/apikey\n" +
    "Then copy .env.example to .env and fill in your key.\n"
  );
  process.exit(1);
}

// ── App Setup ──────────────────────────────────────────────────
const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);

// ── Middleware ─────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Ensure uploads directory exists ───────────────────────────
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ── Routes ─────────────────────────────────────────────────────
app.use("/api/upload", uploadRouter);
app.use("/api/chat", chatRouter);

// ── Health Check ───────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "Resume Screening API with RAG",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    model: "gemini-1.5-flash (free tier)",
    embeddings: "text-embedding-004 (free tier)",
  });
});

// ── Global Error Handler ───────────────────────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[global error]", err);
    res.status(500).json({
      error: err.message || "Internal server error",
    });
  }
);

// ── 404 Handler ────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Start Server ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║   Resume Screening Tool — Backend Server             ║
║   RAG Pipeline: Gemini 1.5 Flash + text-embedding-004 ║
╠══════════════════════════════════════════════════════╣
║   Server:     http://localhost:${PORT}                    ║
║   Health:     http://localhost:${PORT}/api/health         ║
║   Upload:     POST /api/upload                       ║
║   Chat:       POST /api/chat                         ║
╚══════════════════════════════════════════════════════╝
  `);
});

export default app;
