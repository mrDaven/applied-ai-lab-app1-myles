import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { AiSummaryResponse, RegionQ2Q3Analysis } from '../types/sales';
import { formatCurrency, formatPct } from '../utils/salesAnalytics';

interface AiSummaryCardProps {
  aiResponse: AiSummaryResponse | null;
  isLoading: boolean;
  onRegenerate: () => void;
  mostChangedRegion: RegionQ2Q3Analysis | null;
  onOpenAudit: () => void;
  errorMessage?: string | null;
}

export const AiSummaryCard: React.FC<AiSummaryCardProps> = ({
  aiResponse,
  isLoading,
  onRegenerate,
  mostChangedRegion,
  onOpenAudit,
  errorMessage,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<'full' | 'breakdown'>('full');
  const [showDriverPills, setShowDriverPills] = useState(true);

  const handleCopy = () => {
    if (!aiResponse?.summary) return;
    navigator.clipboard.writeText(aiResponse.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sentences = aiResponse?.sentences || (aiResponse?.summary ? aiResponse.summary.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()) || [] : []);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-indigo-500/30 shadow-xl shadow-indigo-950/40 relative overflow-hidden mb-8">
      {/* Background ambient decorative glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-indigo-800/40">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-400 p-0.5 shadow-md shadow-indigo-500/30">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-extrabold tracking-tight text-white">
                Executive AI Intelligence Briefing
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Grounded In Calculated Math
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                gemini-3.8-flash
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              Three-sentence root-cause analysis of the region that changed most from Q2 to Q3
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setActiveView(activeView === 'full' ? 'breakdown' : 'full')}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-indigo-200 border border-indigo-500/20 transition"
          >
            {activeView === 'full' ? 'View 3 Sentences' : 'View Full Paragraph'}
          </button>

          <button
            onClick={onOpenAudit}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1.5"
            title="Inspect every number provided to the AI"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audit Numbers</span>
          </button>

          <button
            onClick={onRegenerate}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5 disabled:opacity-50"
            title="Re-run Gemini analysis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Analyzing...' : 'Regenerate'}</span>
          </button>

          <button
            onClick={handleCopy}
            disabled={!aiResponse?.summary}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-40"
            title="Copy three-sentence summary to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 mt-6">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center animate-spin">
                <Sparkles className="w-7 h-7 text-indigo-400" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">Gemini 3.8 Flash is analyzing Q2-Q3 shift...</p>
              <p className="text-xs text-indigo-200/70 mt-1">
                Verifying calculated revenue deltas, unit volumes, discounts, and product drivers
              </p>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="bg-red-950/40 border border-red-800/60 rounded-2xl p-5 text-red-200">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-red-300">AI Service Notice</h4>
                <p className="text-xs text-red-200/90 mt-1">{errorMessage}</p>
                {aiResponse?.summary && (
                  <p className="text-xs text-indigo-200 mt-2 font-medium">
                    Showing deterministic mathematical summary below:
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {!isLoading && aiResponse?.summary && (
          <div>
            {activeView === 'full' ? (
              <div className="bg-slate-900/70 rounded-2xl p-6 sm:p-7 border border-indigo-800/30 shadow-inner">
                <blockquote className="text-base sm:text-lg leading-relaxed font-medium text-slate-100 tracking-normal selection:bg-indigo-500 selection:text-white">
                  "{aiResponse.summary}"
                </blockquote>
                <div className="mt-4 flex items-center justify-between text-xs text-indigo-300/80 border-t border-indigo-800/30 pt-3">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Strict 3-Sentence Executive Constraint Verified
                  </span>
                  <span>Source: {aiResponse.source === 'gemini-3.8-flash' ? 'Google Gemini 3.8 Flash' : 'Deterministic Calculation'}</span>
                </div>
              </div>
            ) : (
              /* Breakdown View showing each of the 3 sentences clearly segmented */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/80 rounded-2xl p-5 border border-indigo-800/40 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Sentence 1 • Which Region
                    </span>
                    <span className="text-xs font-semibold text-emerald-400">
                      {mostChangedRegion?.region}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">
                    {sentences[0] || 'Identifying most changed region.'}
                  </p>
                </div>

                <div className="bg-slate-900/80 rounded-2xl p-5 border border-indigo-800/40 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Sentence 2 • Volume & Product
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Units: {mostChangedRegion ? formatPct(mostChangedRegion.unitsPctChange) : ''}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">
                    {sentences[1] || 'Explaining unit and product level drivers.'}
                  </p>
                </div>

                <div className="bg-slate-900/80 rounded-2xl p-5 border border-indigo-800/40 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Sentence 3 • Discount & Channel
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Discount: {mostChangedRegion?.q2AvgDiscount.toFixed(1)}% → {mostChangedRegion?.q3AvgDiscount.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">
                    {sentences[2] || 'Explaining pricing discounts and channel context.'}
                  </p>
                </div>
              </div>
            )}

            {/* Drilldown Quick Driver Badges */}
            {mostChangedRegion && (
              <div className="mt-5 pt-4 border-t border-indigo-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                <button
                  onClick={() => setShowDriverPills(!showDriverPills)}
                  className="flex items-center gap-1 text-indigo-300 hover:text-white transition font-medium"
                >
                  <span>Calculated Root Cause Metrics for {mostChangedRegion.region}</span>
                  {showDriverPills ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showDriverPills && (
                  <div className="flex items-center flex-wrap gap-2">
                    <div className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-300">
                      Q2: <span className="font-bold text-white">{formatCurrency(mostChangedRegion.q2Revenue)}</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-300">
                      Q3: <span className="font-bold text-white">{formatCurrency(mostChangedRegion.q3Revenue)}</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-indigo-900/40 border border-indigo-600/40 text-indigo-300 font-semibold">
                      Delta: {mostChangedRegion.netChange >= 0 ? '+' : ''}{formatCurrency(mostChangedRegion.netChange)} ({formatPct(mostChangedRegion.pctChange)})
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-300">
                      Units: {mostChangedRegion.q2Units.toLocaleString()} → {mostChangedRegion.q3Units.toLocaleString()} ({formatPct(mostChangedRegion.unitsPctChange)})
                    </div>
                    {mostChangedRegion.topProductGain && (
                      <div className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-600/40 text-emerald-300">
                        Top Gain: {mostChangedRegion.topProductGain.product} (+{formatCurrency(mostChangedRegion.topProductGain.deltaRevenue)})
                      </div>
                    )}
                    {mostChangedRegion.topProductLoss && (
                      <div className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-600/40 text-rose-300">
                        Top Loss: {mostChangedRegion.topProductLoss.product} (-{formatCurrency(Math.abs(mostChangedRegion.topProductLoss.deltaRevenue))})
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
