# ResumeScreenAI — RAG-Powered Resume Screening Tool



\## 📺 Demo Video

👉 https://youtu.be/9muTNAeu4YA



\## 🚀 GitHub Repository

https://github.com/mohd-kaif-11/Rag-resume-checker-





> \\\*\\\*Tech Stack:\\\*\\\* Node.js 18 · Express.js · React 18 · TypeScript · RAG Pipeline · Google Gemini (Free)

An AI-powered Resume Screening Tool where recruiters can upload a resume and job description, receive an instant match score with strengths/gap analysis, and ask questions about the candidate via a RAG-powered chat interface — all answers grounded in the actual resume document.

\---

## 📺 Demo Workflow

```
1. Upload resume (PDF/TXT) + job description (PDF/TXT)
2. System shows:  Match Score (e.g. 82%)
3. Displays:      ✅ Strengths  ❌ Gaps  🔍 Skills Matrix  📊 Assessment
4. Chat:          "Does this candidate have a degree from a state university?"
5. Chat:          "Do you think they can handle backend architecture?"
   └── Each answer is grounded in actual resume sections via RAG
```

\---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 18)                       │
│  FileUpload → MatchScore → InsightsPanel → ChatInterface         │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP (REST API)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js + Express)                  │
│                                                                   │
│  POST /api/upload                POST /api/chat                   │
│  ┌──────────────────────┐        ┌─────────────────────────┐     │
│  │ 1. pdf-parse          │        │ 1. Embed question        │     │
│  │ 2. Chunk text         │        │ 2. Cosine search (RAG)   │     │
│  │ 3. Generate embeddings│        │ 3. Retrieve top-4 chunks │     │
│  │ 4. Store in VectorDB  │        │ 4. Augmented LLM prompt  │     │
│  │ 5. LLM Analysis       │        │ 5. Return grounded answer│     │
│  └──────────────────────┘        └─────────────────────────┘     │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │            IN-MEMORY VECTOR STORE                        │     │
│  │  DocumentChunk { text, embedding\\\[768], section, source } │     │
│  │  Cosine Similarity: dot(a,b) / (|a| × |b|)              │     │
│  └─────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   GOOGLE GEMINI API (Free Tier)                   │
│  text-embedding-004  →  768-dim vectors   (1,500 RPM free)       │
│  gemini-1.5-flash    →  LLM completions   (15 RPM / 1M tokens/day)│
└─────────────────────────────────────────────────────────────────┘
```

\---

## ⚡ RAG Pipeline — How It Works

### Phase 1: Document Ingestion (Upload)

```
PDF / TXT File
      │
      ▼
pdf-parse (text extraction)
      │
      ▼
Intelligent Chunker
  ├── Detects section headers (Experience, Skills, Education…)
  ├── Chunks at 600 chars with 80-char overlap
  └── Preserves context at chunk boundaries
      │
      ▼
text-embedding-004 (Gemini)
  └── Each chunk → 768-dimensional float vector
      │
      ▼
In-Memory Vector Store
  └── DocumentChunk { text, embedding\\\[768], section, source }
```

### Phase 2: RAG Query (Per Chat Message)

```
User Question: "Does this candidate have React experience?"
      │
      ▼ Step 1: Embed the question
text-embedding-004 → question\\\_vector\\\[768]
      │
      ▼ Step 2: Cosine Similarity Search
Vector Store.search(question\\\_vector, topK=4)
  └── Computes cos(θ) = dot(q,c) / (|q|×|c|) for every chunk
  └── Returns top-4 chunks by semantic similarity
      │
      ▼ Step 3: Retrieved Context
\\\[Chunk 1 — Section: SKILLS | 94.2% match]
"Skills: React.js (3 years), Redux, TypeScript…"
\\\[Chunk 2 — Section: EXPERIENCE | 87.1% match]
"Senior Engineer at TechCorp: React microservices…"
      │
      ▼ Step 4: Augmented Prompt
System: "Answer ONLY based on the retrieved resume sections…"
Context: \\\[retrieved chunks]
Question: "Does this candidate have React experience?"
      │
      ▼ Step 5: LLM Generation (Gemini 1.5 Flash)
Answer: "Yes, the candidate has 7+ years of React experience,
         including React 18, Redux Toolkit, and Next.js…"
```

**Why RAG instead of direct LLM?**

* ✅ Grounded answers — no hallucination
* ✅ Context-efficient — only relevant chunks sent to LLM
* ✅ Cheaper — not sending full resume every message
* ✅ Transparent — users can see which sections were retrieved

\---

## 🚀 Setup Instructions

### Prerequisites

* Node.js 18+
* npm 9+
* Google Gemini API Key (FREE) → https://aistudio.google.com/app/apikey

### Step 1 — Clone the Repository

```bash
git clone https://github.com/yourusername/resume-screening-tool.git
cd resume-screening-tool
```

### Step 2 — Backend Setup

```bash
cd backend
npm install

# Copy env template and add your API key
cp .env.example .env
# Edit .env and set GEMINI\\\_API\\\_KEY=your\\\_key\\\_here

# Run in development mode
npm run dev
# Server starts at: http://localhost:5000
```

### Step 3 — Frontend Setup

```bash
cd frontend
npm install
npm start
# App opens at: http://localhost:3000
```

### Step 4 — Test the App

1. Open http://localhost:3000
2. Upload `samples/resume\\\_1\\\_senior\\\_fullstack.txt` as Resume
3. Upload `samples/jd\\\_1\\\_senior\\\_fullstack.txt` as Job Description
4. Click **Analyze Resume Match**
5. Wait \~15-30 seconds for analysis
6. Ask questions like:

   * *"Does he have a state university degree?"*
   * *"Can he lead a backend team?"*
   * *"What's his experience with PostgreSQL?"*

\---

## 📁 Project Structure

```
resume-screening-tool/
├── backend/
│   ├── src/
│   │   ├── index.ts                  # Express server entry point
│   │   ├── types/index.ts            # TypeScript interfaces
│   │   ├── routes/
│   │   │   ├── upload.ts             # POST /api/upload
│   │   │   └── chat.ts               # POST /api/chat
│   │   └── services/
│   │       ├── pdfParser.ts          # PDF/TXT parsing + chunking
│   │       ├── embeddingService.ts   # Gemini embeddings + completions
│   │       ├── vectorStore.ts        # In-memory vector DB (cosine sim)
│   │       ├── analysisService.ts    # LLM-based resume analysis
│   │       └── ragService.ts         # Core RAG pipeline
│   ├── uploads/                      # Temp file storage (auto-cleaned)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                   # Root component + state management
│   │   ├── index.tsx                 # React entry point
│   │   ├── index.css                 # Tailwind + custom styles
│   │   ├── types/index.ts            # Frontend TypeScript types
│   │   ├── services/api.ts           # Axios API client
│   │   └── components/
│   │       ├── Header.tsx            # App header with tech stack badges
│   │       ├── FileUpload.tsx        # Drag-and-drop file upload
│   │       ├── MatchScore.tsx        # Circular score + skills matrix
│   │       ├── InsightsPanel.tsx     # Strengths + gaps accordion
│   │       ├── ChatInterface.tsx     # RAG chat with chunk viewer
│   │       └── RagDiagram.tsx        # Interactive RAG architecture viz
│   ├── public/index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.js
│
├── samples/
│   ├── resume\\\_1\\\_senior\\\_fullstack.txt   # Senior Full Stack (strong match)
│   ├── jd\\\_1\\\_senior\\\_fullstack.txt       # Matching JD
│   ├── resume\\\_2\\\_ml\\\_engineer.txt        # ML Engineer (strong match)
│   ├── jd\\\_2\\\_ml\\\_engineer.txt            # Matching JD
│   ├── resume\\\_3\\\_frontend\\\_dev.txt       # Frontend Dev (weak match demo)
│   └── jd\\\_3\\\_backend\\\_engineer.txt       # Backend JD (gap demo)
│
└── README.md
```

\---

## 📡 API Documentation

### POST `/api/upload`

Upload resume + job description for analysis.

**Request:** `multipart/form-data`

|Field|Type|Required|Description|
|-|-|-|-|
|`resume`|File (PDF/TXT)|✅|Candidate resume|
|`jobDescription`|File (PDF/TXT)|✅|Job description|

**Response:** `200 OK`

```json
{
  "sessionId": "uuid-v4-string",
  "message": "Documents processed successfully.",
  "analysis": {
    "matchScore": 82,
    "strengths": \\\["7+ years full stack experience", "Strong AWS background"],
    "gaps": \\\["No Kubernetes experience mentioned"],
    "overallAssessment": "Strong candidate meeting most requirements...",
    "extractedSkills": {
      "resumeSkills": \\\["React", "Node.js", "PostgreSQL", "Docker"],
      "requiredSkills": \\\["Node.js", "TypeScript", "React", "PostgreSQL"],
      "matchedSkills": \\\["React", "Node.js", "PostgreSQL"],
      "missingSkills": \\\["Kubernetes"]
    },
    "experienceSummary": "7+ years full-stack with leadership experience",
    "educationInfo": "BS Computer Science, SUNY Buffalo (2017)"
  },
  "stats": {
    "resumeChunks": 12,
    "jdChunks": 8,
    "vectorCount": 20
  }
}
```

**Error Responses:**

* `400` — Missing file(s)
* `422` — Cannot extract text from file
* `500` — Processing error

\---

### POST `/api/chat`

Ask a question about the candidate using RAG.

**Request Body:**

```json
{
  "sessionId": "uuid-v4-string",
  "message": "Does this candidate have a degree from a state university?"
}
```

**Response:** `200 OK`

```json
{
  "reply": "Yes, the candidate graduated from SUNY Buffalo (State University of New York) with a BS in Computer Science in 2017.",
  "retrievedChunks": \\\[
    {
      "text": "Bachelor of Science in Computer Science, State University of New York (SUNY Buffalo)...",
      "section": "education",
      "similarity": 0.921
    }
  ],
  "sessionId": "uuid-v4-string"
}
```

**Error Responses:**

* `400` — Missing sessionId or message
* `404` — Session not found/expired
* `500` — RAG processing error

\---

### GET `/api/health`

Check server status.

**Response:**

```json
{
  "status": "healthy",
  "service": "Resume Screening API with RAG",
  "version": "1.0.0",
  "model": "gemini-1.5-flash (free tier)",
  "embeddings": "text-embedding-004 (free tier)"
}
```

\---

## 🔑 API Keys \& Free Tiers

|Service|Model|Free Limit|Get Key|
|-|-|-|-|
|Google Gemini|`gemini-1.5-flash`|15 RPM, 1M tokens/day|[aistudio.google.com](https://aistudio.google.com/app/apikey)|
|Google Gemini|`text-embedding-004`|1,500 RPM|Same key|

**No credit card required.** Both models are in the free tier.

\---

## 🧪 Sample Files for Testing

|Scenario|Resume|Job Description|Expected Score|
|-|-|-|-|
|Strong Match|`resume\\\_1\\\_senior\\\_fullstack.txt`|`jd\\\_1\\\_senior\\\_fullstack.txt`|75-90%|
|Strong Match|`resume\\\_2\\\_ml\\\_engineer.txt`|`jd\\\_2\\\_ml\\\_engineer.txt`|80-92%|
|Weak Match (Gap Demo)|`resume\\\_3\\\_frontend\\\_dev.txt`|`jd\\\_3\\\_backend\\\_engineer.txt`|25-45%|

\---

## 🛠️ Technology Decisions

|Concern|Choice|Reasoning|
|-|-|-|
|Embeddings|`text-embedding-004`|Free, 768-dim, outperforms older models|
|LLM|`gemini-1.5-flash`|Free tier, fast, strong instruction following|
|Vector DB|In-memory (cosine sim)|No external service needed for demo|
|PDF parsing|`pdf-parse`|Reliable, no external API needed|
|Chunking|Section-aware + sliding window|Preserves semantic coherence|

**Production Upgrades:**

* Vector DB → Pinecone, Qdrant, or pgvector
* Session store → Redis
* File storage → AWS S3
* Add authentication → JWT middleware

\---

## 📝 License

MIT License — free to use, modify, and distribute.

