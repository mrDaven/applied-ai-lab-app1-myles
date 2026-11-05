import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Sparkles, CheckCircle2, HelpCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onLoadSample: () => void;
  isProcessing: boolean;
  parseErrors: string[];
  parseWarnings: string[];
  onDismissModal?: () => void;
  isModal?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onLoadSample,
  isProcessing,
  parseErrors,
  parseWarnings,
  onDismissModal,
  isModal = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv') || file.type.includes('csv') || file.name.endsWith('.txt')) {
        onFileSelect(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const requiredColumns = [
    { name: 'quarter', desc: 'e.g. Q1, Q2, Q3, Q4' },
    { name: 'region', desc: 'e.g. North America, Europe' },
    { name: 'channel', desc: 'e.g. Enterprise, Direct Online' },
    { name: 'product', desc: 'e.g. Cloud Pro, Hardware' },
    { name: 'units', desc: 'e.g. 500, 1200' },
    { name: 'discount_pct', desc: 'e.g. 10.5, 0.12' },
    { name: 'revenue', desc: 'e.g. 450000, $120,000' },
  ];

  return (
    <div className={`w-full ${isModal ? 'p-2' : 'max-w-4xl mx-auto py-8 px-4'}`}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer group ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-indigo-400 dark:hover:border-indigo-500/80 shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt,text/csv"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition duration-200 mb-4 shadow-sm">
            <Upload className="w-8 h-8" />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1">
            Upload Sales Orders CSV
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Drag and drop your file here, or{' '}
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold underline underline-offset-2">
              browse files
            </span>{' '}
            from your computer.
          </p>

          <div className="flex items-center gap-3 w-full justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Select CSV File</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLoadSample();
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium border border-slate-200 dark:border-slate-700 transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Use Sample Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Required Columns Schema Guide */}
      <div className="mt-6 bg-slate-50 dark:bg-slate-900/40 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Required CSV Columns (7)</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Case-insensitive headers supported
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {requiredColumns.map((col) => (
            <div
              key={col.name}
              className="bg-white dark:bg-slate-800/80 rounded-lg p-2.5 border border-slate-200/70 dark:border-slate-700/60"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <code className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                  {col.name}
                </code>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate" title={col.desc}>
                {col.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Errors / Warnings */}
      {parseErrors.length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold mb-1">Unable to process CSV file</h4>
              <ul className="text-xs space-y-1 list-disc list-inside">
                {parseErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {parseWarnings.length > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs">
          <span className="font-semibold">Notice:</span> {parseWarnings.length} row(s) contained minor warnings and were skipped or adjusted.
        </div>
      )}

      {isModal && onDismissModal && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={onDismissModal}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
