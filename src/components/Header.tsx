import React from 'react';
import { BarChart3, Download, FileSpreadsheet, Sparkles, Upload, RefreshCw } from 'lucide-react';

interface HeaderProps {
  fileName: string | null;
  totalOrders: number;
  onLoadSample: () => void;
  onDownloadSample: () => void;
  onOpenUpload: () => void;
  isAiLoading: boolean;
  onRegenerateAi: () => void;
  hasQ2Q3: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  fileName,
  totalOrders,
  onLoadSample,
  onDownloadSample,
  onOpenUpload,
  isAiLoading,
  onRegenerateAi,
  hasQ2Q3,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Sales Revenue Intelligence
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-3 h-3" /> Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Quarterly regional revenue matrix & verified Q2-Q3 shift analytics
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {fileName && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs text-slate-300">
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
              <span className="max-w-[130px] truncate font-medium text-slate-200">{fileName}</span>
              <span className="text-slate-500">({totalOrders} rows)</span>
            </div>
          )}

          {hasQ2Q3 && (
            <button
              onClick={onRegenerateAi}
              disabled={isAiLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition disabled:opacity-50"
              title="Re-run AI 3-sentence summary"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh AI</span>
            </button>
          )}

          <button
            onClick={onDownloadSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Download CSV sample file"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sample CSV</span>
          </button>

          <button
            onClick={onLoadSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition"
            title="Load demo data"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Load Demo</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
};
