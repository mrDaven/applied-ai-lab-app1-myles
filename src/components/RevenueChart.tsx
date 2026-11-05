import React, { useState, useMemo } from 'react';
import { BarChart3, Layers, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { AnalysisResult } from '../types/sales';
import { formatCurrency, formatPct } from '../utils/salesAnalytics';

interface RevenueChartProps {
  analysis: AnalysisResult;
}

const QUARTER_COLORS: Record<string, { bg: string; fill: string; border: string; text: string }> = {
  Q1: { bg: 'bg-blue-500', fill: '#3b82f6', border: 'border-blue-600', text: 'text-blue-500' },
  Q2: { bg: 'bg-emerald-500', fill: '#10b981', border: 'border-emerald-600', text: 'text-emerald-500' },
  Q3: { bg: 'bg-amber-500', fill: '#f59e0b', border: 'border-amber-600', text: 'text-amber-500' },
  Q4: { bg: 'bg-purple-500', fill: '#8b5cf6', border: 'border-purple-600', text: 'text-purple-500' },
};

const DEFAULT_COLOR = { bg: 'bg-indigo-500', fill: '#6366f1', border: 'border-indigo-600', text: 'text-indigo-500' };

export const RevenueChart: React.FC<RevenueChartProps> = ({ analysis }) => {
  const [groupBy, setGroupBy] = useState<'region' | 'quarter'>('region');
  const [hoveredBar, setHoveredBar] = useState<{
    groupKey: string;
    subKey: string;
    revenue: number;
    units: number;
    avgDiscount: number;
    x: number;
    y: number;
  } | null>(null);

  const { quarters, regions, matrix, mostChangedByDollar } = analysis;

  // Find max revenue for scaling
  const maxRevenue = useMemo(() => {
    let max = 0;
    regions.forEach((r) => {
      quarters.forEach((q) => {
        const rev = matrix[r]?.[q]?.revenue || 0;
        if (rev > max) max = rev;
      });
    });
    return max > 0 ? max * 1.15 : 100000; // 15% headroom for top labels
  }, [regions, quarters, matrix]);

  // Chart dimensions
  const height = 340;
  const padding = { top: 40, right: 30, bottom: 65, left: 75 };
  const chartWidth = 860;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Groups and items depending on toggle
  const primaryGroups = groupBy === 'region' ? regions : quarters;
  const subItems = groupBy === 'region' ? quarters : regions;

  const groupWidth = innerWidth / Math.max(1, primaryGroups.length);
  const barGap = 4;
  const availableBarSpace = groupWidth * 0.76;
  const barWidth = Math.max(8, (availableBarSpace - (subItems.length - 1) * barGap) / Math.max(1, subItems.length));

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => pct * maxRevenue);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Total Revenue by Region & Quarter
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Grouped revenue comparison across quarterly sales cycles
          </p>
        </div>

        {/* Group By Selector and Legend */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setGroupBy('region')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                groupBy === 'region'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Group by Region
            </button>
            <button
              onClick={() => setGroupBy('quarter')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                groupBy === 'quarter'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Group by Quarter
            </button>
          </div>
        </div>
      </div>

      {/* Legend & Callout Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Legend:</span>
          {quarters.map((q) => {
            const c = QUARTER_COLORS[q] || DEFAULT_COLOR;
            return (
              <div key={q} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-sm ${c.bg}`}></span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{q}</span>
              </div>
            );
          })}
        </div>

        {mostChangedByDollar && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300">
            <span className="font-bold">Key Insight:</span>
            <span>{mostChangedByDollar.region} changed most in Q2→Q3 ({mostChangedByDollar.netChange >= 0 ? '+' : ''}{formatCurrency(mostChangedByDollar.netChange, true)})</span>
          </div>
        )}
      </div>

      {/* Responsive SVG Chart Container */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full min-w-[650px] select-none"
          style={{ overflow: 'visible' }}
        >
          {/* Grid lines and Y labels */}
          {yTicks.map((val, idx) => {
            const yPos = padding.top + innerHeight - (val / maxRevenue) * innerHeight;
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={yPos}
                  x2={chartWidth - padding.right}
                  y2={yPos}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  className="dark:stroke-slate-800"
                />
                <text
                  x={padding.left - 10}
                  y={yPos + 4}
                  textAnchor="end"
                  className="text-[11px] fill-slate-400 font-mono"
                >
                  {formatCurrency(val, true)}
                </text>
              </g>
            );
          })}

          {/* Grouped Bars */}
          {primaryGroups.map((groupKey, gIdx) => {
            const groupCenterX = padding.left + gIdx * groupWidth + groupWidth / 2;
            const startX = groupCenterX - availableBarSpace / 2;
            const isMostChanged = groupBy === 'region' && groupKey === mostChangedByDollar?.region;

            return (
              <g key={groupKey}>
                {/* Background highlight pill for the most changed region */}
                {isMostChanged && (
                  <rect
                    x={padding.left + gIdx * groupWidth + 6}
                    y={padding.top - 8}
                    width={groupWidth - 12}
                    height={innerHeight + 16}
                    rx={12}
                    fill="rgba(99, 102, 241, 0.06)"
                    stroke="rgba(99, 102, 241, 0.25)"
                    strokeDasharray="4 4"
                  />
                )}

                {/* Sub-item Bars */}
                {subItems.map((subKey, sIdx) => {
                  const regionName = groupBy === 'region' ? groupKey : subKey;
                  const quarterName = groupBy === 'region' ? subKey : groupKey;

                  const cell = matrix[regionName]?.[quarterName] || {
                    revenue: 0,
                    units: 0,
                    avgDiscount: 0,
                  };
                  const barHeight = Math.max(0, (cell.revenue / maxRevenue) * innerHeight);
                  const x = startX + sIdx * (barWidth + barGap);
                  const y = padding.top + innerHeight - barHeight;

                  const color = QUARTER_COLORS[quarterName] || DEFAULT_COLOR;

                  return (
                    <g key={subKey}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        rx={4}
                        fill={color.fill}
                        className="transition-all duration-200 cursor-pointer hover:opacity-85"
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredBar({
                            groupKey,
                            subKey,
                            revenue: cell.revenue,
                            units: cell.units,
                            avgDiscount: cell.avgDiscount,
                            x: x + barWidth / 2,
                            y: y - 10,
                          });
                        }}
                        onMouseLeave={() => setHoveredBar(null)}
                      />

                      {/* Small value label on top if height is enough */}
                      {barHeight > 35 && (
                        <text
                          x={x + barWidth / 2}
                          y={y - 6}
                          textAnchor="middle"
                          className="text-[9px] fill-slate-500 dark:fill-slate-400 font-mono font-medium pointer-events-none"
                        >
                          {formatCurrency(cell.revenue, true)}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Group X Axis Label */}
                <text
                  x={groupCenterX}
                  y={padding.top + innerHeight + 22}
                  textAnchor="middle"
                  className={`text-xs font-semibold ${
                    isMostChanged
                      ? 'fill-indigo-600 dark:fill-indigo-400 font-bold'
                      : 'fill-slate-700 dark:fill-slate-300'
                  }`}
                >
                  {groupKey}
                </text>

                {/* Subtitle tag under group */}
                {isMostChanged && (
                  <g>
                    <rect
                      x={groupCenterX - 45}
                      y={padding.top + innerHeight + 30}
                      width={90}
                      height={18}
                      rx={6}
                      fill="#6366f1"
                    />
                    <text
                      x={groupCenterX}
                      y={padding.top + innerHeight + 43}
                      textAnchor="middle"
                      className="text-[10px] fill-white font-bold tracking-tight"
                    >
                      ★ Top Shift
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Interactive Tooltip Overlay inside SVG */}
          {hoveredBar && (
            <g pointerEvents="none" transform={`translate(${hoveredBar.x}, ${Math.max(30, hoveredBar.y - 65)})`}>
              <rect
                x={-75}
                y={0}
                width={150}
                height={62}
                rx={8}
                fill="#0f172a"
                stroke="#334155"
                filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
              />
              <text x={0} y={16} textAnchor="middle" className="text-[11px] font-bold fill-white">
                {hoveredBar.groupKey} • {hoveredBar.subKey}
              </text>
              <text x={0} y={32} textAnchor="middle" className="text-[12px] font-extrabold fill-emerald-400">
                {formatCurrency(hoveredBar.revenue)}
              </text>
              <text x={0} y={48} textAnchor="middle" className="text-[10px] fill-slate-300 font-mono">
                {hoveredBar.units.toLocaleString()} units • {hoveredBar.avgDiscount}% disc
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="mt-3 text-[11px] text-slate-400 dark:text-slate-500 text-center flex items-center justify-center gap-1.5">
        <Info className="w-3.5 h-3.5" />
        <span>Hover over any bar to inspect calculated revenue, volume, and discount metrics</span>
      </div>
    </div>
  );
};
