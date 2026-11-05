import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, Compass, BarChart } from 'lucide-react';
import { AnalysisResult } from '../types/sales';
import { formatCurrency, formatPct } from '../utils/salesAnalytics';

interface MetricCardsProps {
  analysis: AnalysisResult;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ analysis }) => {
  const mostChanged = analysis.mostChangedByDollar;
  const isMostChangedPositive = mostChanged ? mostChanged.netChange >= 0 : true;
  const isCompanyGrowthPositive = analysis.overallQ2Q3Delta >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Grand Total Revenue */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Revenue
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {formatCurrency(analysis.grandTotalRevenue)}
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <span>Across {analysis.quarters.length} Quarters</span>
          <span>•</span>
          <span>{analysis.regions.length} Regions</span>
        </div>
      </div>

      {/* Total Units & Order Count */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Units Delivered
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {analysis.orders.reduce((sum, o) => sum + o.units, 0).toLocaleString()}
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <span>{analysis.orders.length} Total Line Orders</span>
          <span>•</span>
          <span>{analysis.products.length} Products</span>
        </div>
      </div>

      {/* Most Changed Region (Q2 to Q3) */}
      <div className="bg-gradient-to-br from-indigo-900/10 via-white dark:via-slate-900 to-indigo-50 dark:to-slate-900 rounded-2xl p-5 border border-indigo-200 dark:border-indigo-800/60 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Most Changed Q2→Q3
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
        </div>
        {mostChanged ? (
          <>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
              {mostChanged.region}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                  isMostChangedPositive
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                }`}
              >
                {isMostChangedPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {formatPct(mostChanged.pctChange)}
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {mostChanged.netChange >= 0 ? '+' : '-'}
                {formatCurrency(Math.abs(mostChanged.netChange), true)}
              </span>
            </div>
          </>
        ) : (
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Requires both Q2 and Q3 data
          </div>
        )}
      </div>

      {/* Overall Q2 to Q3 Company Trend */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Company Q2→Q3 Delta
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <BarChart className="w-4 h-4" />
          </div>
        </div>
        {analysis.hasQ2AndQ3 ? (
          <>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {analysis.overallQ2Q3Delta >= 0 ? '+' : '-'}
              {formatCurrency(Math.abs(analysis.overallQ2Q3Delta))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                  isCompanyGrowthPositive
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                }`}
              >
                {isCompanyGrowthPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {formatPct(analysis.overallQ2Q3Pct)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Q2: {formatCurrency(analysis.overallQ2Revenue, true)} → Q3: {formatCurrency(analysis.overallQ3Revenue, true)}
              </span>
            </div>
          </>
        ) : (
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Quarter comparison not available
          </div>
        )}
      </div>
    </div>
  );
};
