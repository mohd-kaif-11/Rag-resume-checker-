import React, { useState, useRef, useCallback } from "react";
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";

interface FileUploadProps {
  onUpload: (resumeFile: File, jdFile: File) => void;
  isLoading: boolean;
  error: string | null;
}

interface FileState {
  file: File | null;
  dragActive: boolean;
  error: string | null;
}

const ACCEPTED_TYPES = ["application/pdf", "text/plain"];
const ACCEPTED_EXT = [".pdf", ".txt"];
const MAX_SIZE_MB = 10;

function FileDropZone({
  label,
  icon,
  fileState,
  onFile,
  inputId,
  accentColor,
}: {
  label: string;
  icon: React.ReactNode;
  fileState: FileState;
  onFile: (file: File) => void;
  inputId: string;
  accentColor: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXT.includes(ext)) {
      return "Only PDF and TXT files are supported.";
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File must be under ${MAX_SIZE_MB}MB.`;
    }
    return null;
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        const err = validateFile(file);
        if (!err) onFile(file);
      }
    },
    [onFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const err = validateFile(file);
      if (!err) onFile(file);
    }
  };

  const bgColor = fileState.file
    ? `bg-green-50 border-green-400`
    : fileState.dragActive
    ? `bg-blue-50 border-${accentColor}-400`
    : `bg-gray-50 border-gray-300 hover:border-${accentColor}-400 hover:bg-${accentColor}-50`;

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 cursor-pointer ${bgColor}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept=".pdf,.txt"
        className="hidden"
        onChange={handleChange}
      />
      <div className="flex flex-col items-center text-center gap-2">
        <div
          className={`p-3 rounded-full ${
            fileState.file ? "bg-green-100" : "bg-gray-100"
          }`}
        >
          {fileState.file ? (
            <CheckCircle size={28} className="text-green-600" />
          ) : (
            icon
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm">{label}</p>
          {fileState.file ? (
            <p className="text-green-600 text-xs mt-1 font-medium">
              ✓ {fileState.file.name} ({(fileState.file.size / 1024).toFixed(1)} KB)
            </p>
          ) : (
            <p className="text-gray-500 text-xs mt-1">
              Drag & drop or click · PDF / TXT · max {MAX_SIZE_MB}MB
            </p>
          )}
        </div>
        {fileState.error && (
          <p className="text-red-500 text-xs flex items-center gap-1">
            <AlertCircle size={12} /> {fileState.error}
          </p>
        )}
      </div>
    </div>
  );
}

export default function FileUpload({
  onUpload,
  isLoading,
  error,
}: FileUploadProps) {
  const [resume, setResume] = useState<FileState>({
    file: null,
    dragActive: false,
    error: null,
  });
  const [jd, setJd] = useState<FileState>({
    file: null,
    dragActive: false,
    error: null,
  });

  const handleSubmit = () => {
    if (resume.file && jd.file) {
      onUpload(resume.file, jd.file);
    }
  };

  const resetResume = (e: React.MouseEvent) => {
    e.stopPropagation();
    setResume({ file: null, dragActive: false, error: null });
  };

  const resetJd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setJd({ file: null, dragActive: false, error: null });
  };

  const canSubmit = resume.file && jd.file && !isLoading;

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <div className="icon-wrapper bg-blue-100">
            <Upload size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Upload Documents</h2>
            <p className="text-sm text-gray-500">
              Upload a resume and job description to begin analysis
            </p>
          </div>
        </div>
      </div>

      <div className="card-body space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <FileDropZone
              label="Candidate Resume"
              icon={<FileText size={28} className="text-blue-500" />}
              fileState={resume}
              onFile={(f) => setResume({ file: f, dragActive: false, error: null })}
              inputId="resume-upload"
              accentColor="blue"
            />
            {resume.file && (
              <button
                onClick={resetResume}
                className="absolute top-2 right-2 p-1 rounded-full bg-white shadow hover:bg-red-50 transition"
                title="Remove file"
              >
                <X size={14} className="text-gray-500" />
              </button>
            )}
          </div>

          <div className="relative">
            <FileDropZone
              label="Job Description"
              icon={<FileText size={28} className="text-purple-500" />}
              fileState={jd}
              onFile={(f) => setJd({ file: f, dragActive: false, error: null })}
              inputId="jd-upload"
              accentColor="purple"
            />
            {jd.file && (
              <button
                onClick={resetJd}
                className="absolute top-2 right-2 p-1 rounded-full bg-white shadow hover:bg-red-50 transition"
                title="Remove file"
              >
                <X size={14} className="text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
            canSubmit
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isLoading ? (
            <>
              <div className="spinner" />
              Analyzing Documents with AI...
            </>
          ) : (
            <>
              <Upload size={16} />
              Analyze Resume Match
            </>
          )}
        </button>

        {isLoading && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p className="text-blue-700 text-xs text-center font-medium">
              🔄 Parsing documents → Generating embeddings → Running RAG analysis...
              <br />
              <span className="text-blue-500">This may take 15–30 seconds</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
