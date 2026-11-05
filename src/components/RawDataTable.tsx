import React, { useState, useMemo } from 'react';
import { Search, Filter, Database, ChevronLeft, ChevronRight } from 'lucide-react';
import { SalesOrder } from '../types/sales';
import { formatCurrency } from '../utils/salesAnalytics';

interface RawDataTableProps {
  orders: SalesOrder[];
  quarters: string[];
  regions: string[];
}

export const RawDataTable: React.FC<RawDataTableProps> = ({ orders, quarters, regions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchQuarter = selectedQuarter === 'ALL' || order.quarter === selectedQuarter;
      const matchRegion = selectedRegion === 'ALL' || order.region === selectedRegion;
      const matchSearch =
        !searchTerm ||
        order.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.channel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.quarter.toLowerCase().includes(searchTerm.toLowerCase());

      return matchQuarter && matchRegion && matchSearch;
    });
  }, [orders, selectedQuarter, selectedRegion, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Raw Order Records Inspector
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Displaying {filteredOrders.length} of {orders.length} total sales orders from the uploaded CSV
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search product, channel..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44 sm:w-56"
            />
          </div>

          <select
            value={selectedQuarter}
            onChange={(e) => {
              setSelectedQuarter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Quarters</option>
            {quarters.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>

          <select
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
              <th className="py-2.5 px-4">#</th>
              <th className="py-2.5 px-4 font-mono">Quarter</th>
              <th className="py-2.5 px-4">Region</th>
              <th className="py-2.5 px-4">Channel</th>
              <th className="py-2.5 px-4">Product</th>
              <th className="py-2.5 px-4 text-right font-mono">Units</th>
              <th className="py-2.5 px-4 text-right font-mono">Discount %</th>
              <th className="py-2.5 px-4 text-right font-mono">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedOrders.map((ord, idx) => (
              <tr key={ord.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="py-2 px-4 text-slate-400">{(currentPage - 1) * pageSize + idx + 1}</td>
                <td className="py-2 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {ord.quarter}
                </td>
                <td className="py-2 px-4 font-medium text-slate-900 dark:text-white">{ord.region}</td>
                <td className="py-2 px-4 text-slate-600 dark:text-slate-400">{ord.channel}</td>
                <td className="py-2 px-4 text-slate-800 dark:text-slate-200 font-medium">
                  {ord.product}
                </td>
                <td className="py-2 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                  {ord.units.toLocaleString()}
                </td>
                <td className="py-2 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                  {ord.discount_pct.toFixed(1)}%
                </td>
                <td className="py-2 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                  {formatCurrency(ord.revenue)}
                </td>
              </tr>
            ))}
            {paginatedOrders.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  No orders match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4 text-xs text-slate-500 dark:text-slate-400">
        <span>
          Showing {(currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-slate-700 dark:text-slate-300 px-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
