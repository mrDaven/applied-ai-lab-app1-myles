import React, { useState } from 'react';
import { X, ShieldCheck, Check, Code, FileText, CheckCircle2 } from 'lucide-react';
import { RegionQ2Q3Analysis, SalesAnalyticsPayload } from '../types/sales';
import { formatCurrency, formatPct } from '../utils/salesAnalytics';

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  mostChangedRegion: RegionQ2Q3Analysis | null;
  payload: SalesAnalyticsPayload | null;
  aiSummary: string | null;
}

export const AuditModal: React.FC<AuditModalProps> = ({
  isOpen,
  onClose,
  mostChangedRegion,
  payload,
  aiSummary,
}) => {
  const [activeTab, setActiveTab] = useState<'comparison' | 'payload'>('comparison');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !mostChangedRegion) return null;

  const handleCopyJson = () => {
    if (!payload) return;
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const auditItems = [
    {
      metric: 'Most Changed Region',
      calculatedValue: mostChangedRegion.region,
      notes: 'Determined by highest absolute dollar change (|Q3 - Q2|)',
    },
    {
      metric: 'Q2 Revenue',
      calculatedValue: formatCurrency(mostChangedRegion.q2Revenue),
      notes: `Sum of all Q2 orders in ${mostChangedRegion.region}`,
    },
    {
      metric: 'Q3 Revenue',
      calculatedValue: formatCurrency(mostChangedRegion.q3Revenue),
      notes: `Sum of all Q3 orders in ${mostChangedRegion.region}`,
    },
    {
      metric: 'Q2 to Q3 Dollar Variance',
      calculatedValue: `${mostChangedRegion.netChange >= 0 ? '+' : ''}${formatCurrency(mostChangedRegion.netChange)}`,
      notes: 'Exact dollar shift between quarters',
    },
    {
      metric: 'Percentage Growth Rate',
      calculatedValue: formatPct(mostChangedRegion.pctChange),
      notes: '((Q3 - Q2) / Q2) * 100',
    },
    {
      metric: 'Q2 Units Sold',
      calculatedValue: mostChangedRegion.q2Units.toLocaleString(),
      notes: 'Total physical/license units delivered in Q2',
    },
    {
      metric: 'Q3 Units Sold',
      calculatedValue: mostChangedRegion.q3Units.toLocaleString(),
      notes: 'Total physical/license units delivered in Q3',
    },
    {
      metric: 'Unit Volume Variance',
      calculatedValue: `${mostChangedRegion.netUnitsChange >= 0 ? '+' : ''}${mostChangedRegion.netUnitsChange.toLocaleString()} units (${formatPct(mostChangedRegion.unitsPctChange)})`,
      notes: 'Core volume change metric',
    },
    {
      metric: 'Average Discount Shift',
      calculatedValue: `${mostChangedRegion.q2AvgDiscount.toFixed(1)}% → ${mostChangedRegion.q3AvgDiscount.toFixed(1)}% (${mostChangedRegion.discountPointsChange >= 0 ? '+' : ''}${mostChangedRegion.discountPointsChange.toFixed(1)} pts)`,
      notes: 'Average order-level discount applied',
    },
    {
      metric: 'Top Product Driver',
      calculatedValue: mostChangedRegion.topProductGain
        ? `${mostChangedRegion.topProductGain.product} (+${formatCurrency(mostChangedRegion.topProductGain.deltaRevenue)})`
        : 'N/A',
      notes: 'Primary product driving growth/decline',
    },
    {
      metric: 'Top Channel Driver',
      calculatedValue: mostChangedRegion.topChannelGain
        ? `${mostChangedRegion.topChannelGain.channel} (+${formatCurrency(mostChangedRegion.topChannelGain.deltaRevenue)})`
        : 'N/A',
      notes: 'Highest performing sales channel',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Calculated Numbers Audit Inspector</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  Strict Grounding
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verify that the AI summary strictly uses only values computed by the application
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'comparison'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Calculated Metrics Audit</span>
            </button>
            <button
              onClick={() => setActiveTab('payload')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'payload'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Raw JSON Sent to Gemini</span>
            </button>
          </div>

          {activeTab === 'payload' && (
            <button
              onClick={handleCopyJson}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : null}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'comparison' ? (
            <>
              {/* AI Statement Preview */}
              {aiSummary && (
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                    AI Generated 3-Sentence Summary:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    "{aiSummary}"
                  </p>
                </div>
              )}

              {/* Metrics Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-4 text-left">App Calculated Metric</th>
                      <th className="py-2.5 px-4 text-left font-mono">Verified Value</th>
                      <th className="py-2.5 px-4 text-left text-slate-400">Calculation Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {auditItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{item.metric}</span>
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {item.calculatedValue}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">
                          {item.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="bg-slate-950 rounded-2xl p-4 text-slate-200 font-mono text-xs overflow-x-auto max-h-[450px]">
              <pre>{JSON.stringify(payload, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-bold text-slate-800 dark:text-white transition"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
