import React, { useState } from 'react';
import {
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Compass,
  Package,
  Layers,
} from 'lucide-react';
import { AnalysisResult } from '../types/sales';
import { formatCurrency, formatPct } from '../utils/salesAnalytics';

interface RevenueTableProps {
  analysis: AnalysisResult;
}

type SortColumn = 'region' | 'total' | 'q2q3Delta' | 'q2q3Pct' | string;

export const RevenueTable: React.FC<RevenueTableProps> = ({ analysis }) => {
  const [sortCol, setSortCol] = useState<SortColumn>('total');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(
    analysis.mostChangedByDollar?.region || null
  );

  const { quarters, regions, matrix, regionTotals, quarterTotals, grandTotalRevenue, hasQ2AndQ3 } =
    analysis;

  // Handle sorting
  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(false); // default desc for numbers
    }
  };

  const sortedRegions = [...regions].sort((a, b) => {
    let valA = 0;
    let valB = 0;

    if (sortCol === 'region') {
      return sortAsc ? a.localeCompare(b) : b.localeCompare(a);
    } else if (sortCol === 'total') {
      valA = regionTotals[a]?.revenue || 0;
      valB = regionTotals[b]?.revenue || 0;
    } else if (sortCol === 'q2q3Delta') {
      const q2A = matrix[a]?.['Q2']?.revenue || 0;
      const q3A = matrix[a]?.['Q3']?.revenue || 0;
      const q2B = matrix[b]?.['Q2']?.revenue || 0;
      const q3B = matrix[b]?.['Q3']?.revenue || 0;
      valA = q3A - q2A;
      valB = q3B - q2B;
    } else if (sortCol === 'q2q3Pct') {
      const q2A = matrix[a]?.['Q2']?.revenue || 0;
      const q3A = matrix[a]?.['Q3']?.revenue || 0;
      const q2B = matrix[b]?.['Q2']?.revenue || 0;
      const q3B = matrix[b]?.['Q3']?.revenue || 0;
      valA = q2A === 0 ? 0 : (q3A - q2A) / q2A;
      valB = q2B === 0 ? 0 : (q3B - q2B) / q2B;
    } else {
      // Sort by specific quarter
      valA = matrix[a]?.[sortCol]?.revenue || 0;
      valB = matrix[b]?.[sortCol]?.revenue || 0;
    }

    return sortAsc ? valA - valB : valB - valA;
  });

  // Export summary matrix as CSV
  const handleExportCsv = () => {
    const headers = ['Region', ...quarters, 'Total Revenue'];
    if (hasQ2AndQ3) {
      headers.push('Q2 to Q3 Delta ($)', 'Q2 to Q3 Growth (%)');
    }

    const rows = regions.map((r) => {
      const row = [r];
      quarters.forEach((q) => {
        row.push(String(matrix[r]?.[q]?.revenue || 0));
      });
      row.push(String(regionTotals[r]?.revenue || 0));
      if (hasQ2AndQ3) {
        const q2 = matrix[r]?.['Q2']?.revenue || 0;
        const q3 = matrix[r]?.['Q3']?.revenue || 0;
        row.push(String(q3 - q2));
        row.push(`${q2 === 0 ? 0 : (((q3 - q2) / q2) * 100).toFixed(2)}%`);
      }
      return row.join(',');
    });

    // Total row
    const totalRow = ['Total'];
    quarters.forEach((q) => {
      totalRow.push(String(quarterTotals[q]?.revenue || 0));
    });
    totalRow.push(String(grandTotalRevenue));
    if (hasQ2AndQ3) {
      totalRow.push(String(analysis.overallQ2Q3Delta));
      totalRow.push(`${analysis.overallQ2Q3Pct.toFixed(2)}%`);
    }
    rows.push(totalRow.join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'regional_quarterly_sales_matrix.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
      {/* Table Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TableIcon className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Revenue Breakdown Table by Region & Quarter
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cross-tabulated pivot matrix with calculated Q2→Q3 variances and product drill-downs
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Matrix CSV</span>
        </button>
      </div>

      {/* Table Wrapper */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
              <th
                onClick={() => handleSort('region')}
                className="py-3.5 px-4 cursor-pointer hover:text-indigo-600 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Region</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {quarters.map((q) => (
                <th
                  key={q}
                  onClick={() => handleSort(q)}
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-indigo-600 transition font-mono"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{q} Revenue</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              ))}

              <th
                onClick={() => handleSort('total')}
                className="py-3.5 px-4 text-right cursor-pointer hover:text-indigo-600 transition bg-slate-100/60 dark:bg-slate-800"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Total Revenue</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {hasQ2AndQ3 && (
                <>
                  <th
                    onClick={() => handleSort('q2q3Delta')}
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-indigo-600 transition bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Q2 → Q3 Delta ($)</span>
                      <ArrowUpDown className="w-3 h-3 text-indigo-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('q2q3Pct')}
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-indigo-600 transition bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Q2 → Q3 Growth (%)</span>
                      <ArrowUpDown className="w-3 h-3 text-indigo-400" />
                    </div>
                  </th>
                </>
              )}

              <th className="py-3.5 px-3 text-center w-12">Detail</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sortedRegions.map((region) => {
              const isMostChanged = region === analysis.mostChangedByDollar?.region;
              const isExpanded = expandedRegion === region;
              const totalRev = regionTotals[region]?.revenue || 0;

              const q2Rev = matrix[region]?.['Q2']?.revenue || 0;
              const q3Rev = matrix[region]?.['Q3']?.revenue || 0;
              const delta = q3Rev - q2Rev;
              const pct = q2Rev === 0 ? (q3Rev > 0 ? 100 : 0) : ((delta / q2Rev) * 100);

              const comparisonDetails = analysis.q2q3Comparisons.find((c) => c.region === region);

              return (
                <React.Fragment key={region}>
                  <tr
                    onClick={() => setExpandedRegion(isExpanded ? null : region)}
                    className={`cursor-pointer transition-colors ${
                      isMostChanged
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>{region}</span>
                        {isMostChanged && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-sm">
                            <Compass className="w-3 h-3" /> Most Changed
                          </span>
                        )}
                      </div>
                    </td>

                    {quarters.map((q) => {
                      const cell = matrix[region]?.[q] || { revenue: 0, units: 0 };
                      return (
                        <td key={q} className="py-3.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                          {formatCurrency(cell.revenue)}
                        </td>
                      );
                    })}

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/40">
                      {formatCurrency(totalRev)}
                    </td>

                    {hasQ2AndQ3 && (
                      <>
                        <td
                          className={`py-3.5 px-4 text-right font-mono font-bold bg-indigo-50/30 dark:bg-indigo-950/10 ${
                            delta >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {delta >= 0 ? '+' : ''}{formatCurrency(delta)}
                        </td>
                        <td className="py-3.5 px-4 text-right bg-indigo-50/30 dark:bg-indigo-950/10">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                              delta >= 0
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                            }`}
                          >
                            {delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {formatPct(pct)}
                          </span>
                        </td>
                      </>
                    )}

                    <td className="py-3.5 px-3 text-center text-slate-400">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 inline" />
                      ) : (
                        <ChevronDown className="w-4 h-4 inline" />
                      )}
                    </td>
                  </tr>

                  {/* Expanded Row: Drilldown into Products and Channels for this Region */}
                  {isExpanded && comparisonDetails && (
                    <tr className="bg-slate-50/80 dark:bg-slate-800/60">
                      <td colSpan={quarters.length + (hasQ2AndQ3 ? 4 : 2)} className="p-4 sm:p-5">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Package className="w-4 h-4 text-indigo-500" />
                                <span>{region} Drill-Down: Q2 vs Q3 Root Cause Drivers</span>
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Unit volume changed from {comparisonDetails.q2Units.toLocaleString()} to{' '}
                                {comparisonDetails.q3Units.toLocaleString()} units ({formatPct(comparisonDetails.unitsPctChange)}) • Avg Discount:{' '}
                                {comparisonDetails.q2AvgDiscount.toFixed(1)}% → {comparisonDetails.q3AvgDiscount.toFixed(1)}%
                              </p>
                            </div>
                            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold self-start sm:self-auto">
                              Net Revenue: {comparisonDetails.netChange >= 0 ? '+' : ''}{formatCurrency(comparisonDetails.netChange)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Product Breakdown */}
                            <div>
                              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                                <Package className="w-3.5 h-3.5" /> Product Shift (Q2 → Q3)
                              </div>
                              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-slate-100/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                      <th className="py-2 px-3 text-left">Product</th>
                                      <th className="py-2 px-3 text-right">Q2 Rev</th>
                                      <th className="py-2 px-3 text-right">Q3 Rev</th>
                                      <th className="py-2 px-3 text-right">Delta ($)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {comparisonDetails.allProductDrivers.map((pd) => (
                                      <tr key={pd.product} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                        <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                                          {pd.product}
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                                          {formatCurrency(pd.q2Revenue)}
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                                          {formatCurrency(pd.q3Revenue)}
                                        </td>
                                        <td
                                          className={`py-2 px-3 text-right font-mono font-bold ${
                                            pd.deltaRevenue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                          }`}
                                        >
                                          {pd.deltaRevenue >= 0 ? '+' : ''}{formatCurrency(pd.deltaRevenue)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Channel Breakdown */}
                            <div>
                              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5" /> Channel Shift (Q2 → Q3)
                              </div>
                              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-slate-100/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                      <th className="py-2 px-3 text-left">Channel</th>
                                      <th className="py-2 px-3 text-right">Q2 Rev</th>
                                      <th className="py-2 px-3 text-right">Q3 Rev</th>
                                      <th className="py-2 px-3 text-right">Delta ($)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {comparisonDetails.allChannelDrivers.map((cd) => (
                                      <tr key={cd.channel} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                        <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                                          {cd.channel}
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                                          {formatCurrency(cd.q2Revenue)}
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                                          {formatCurrency(cd.q3Revenue)}
                                        </td>
                                        <td
                                          className={`py-2 px-3 text-right font-mono font-bold ${
                                            cd.deltaRevenue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                          }`}
                                        >
                                          {cd.deltaRevenue >= 0 ? '+' : ''}{formatCurrency(cd.deltaRevenue)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>

          {/* Table Footer: Totals across all regions */}
          <tfoot>
            <tr className="bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
              <td className="py-4 px-4 uppercase tracking-wider text-xs">
                Total Company Revenue
              </td>

              {quarters.map((q) => (
                <td key={q} className="py-4 px-4 text-right font-mono">
                  {formatCurrency(quarterTotals[q]?.revenue || 0)}
                </td>
              ))}

              <td className="py-4 px-4 text-right font-mono bg-slate-200/60 dark:bg-slate-700/60 text-indigo-700 dark:text-indigo-300 text-sm">
                {formatCurrency(grandTotalRevenue)}
              </td>

              {hasQ2AndQ3 && (
                <>
                  <td
                    className={`py-4 px-4 text-right font-mono text-sm ${
                      analysis.overallQ2Q3Delta >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {analysis.overallQ2Q3Delta >= 0 ? '+' : ''}
                    {formatCurrency(analysis.overallQ2Q3Delta)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        analysis.overallQ2Q3Delta >= 0
                          ? 'bg-emerald-200/80 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-200/80 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                      }`}
                    >
                      {analysis.overallQ2Q3Delta >= 0 ? '+' : ''}
                      {formatPct(analysis.overallQ2Q3Pct)}
                    </span>
                  </td>
                </>
              )}

              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
