/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { MetricCards } from './components/MetricCards';
import { AiSummaryCard } from './components/AiSummaryCard';
import { RevenueChart } from './components/RevenueChart';
import { RevenueTable } from './components/RevenueTable';
import { RawDataTable } from './components/RawDataTable';
import { AuditModal } from './components/AuditModal';
import { parseSalesCsv, getSampleSalesCsv } from './utils/csvParser';
import {
  analyzeSalesData,
  buildSalesAnalyticsPayload,
  generateDeterministicSummary,
} from './utils/salesAnalytics';
import { AnalysisResult, AiSummaryResponse, SalesOrder } from './types/sales';
import { UploadCloud, CheckCircle2, AlertTriangle, Eye, Table2 } from 'lucide-react';

export default function App() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Active view tab (Visual Analytics vs Raw Data)
  const [activeTab, setActiveTab] = useState<'analytics' | 'raw'>('analytics');

  // AI Summary state
  const [aiResponse, setAiResponse] = useState<AiSummaryResponse | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Audit modal state
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Calculate analytics
  const analysis: AnalysisResult = useMemo(() => {
    return analyzeSalesData(orders);
  }, [orders]);

  // Function to call server-side Gemini 3.8 Flash summary endpoint
  const fetchAiSummary = useCallback(async (currentAnalysis: AnalysisResult) => {
    if (!currentAnalysis.hasQ2AndQ3 || !currentAnalysis.mostChangedByDollar) {
      setAiResponse(null);
      setAiError(null);
      return;
    }

    const payload = buildSalesAnalyticsPayload(currentAnalysis);
    if (!payload) return;

    // Set immediate deterministic baseline so UI is never empty
    const deterministic = generateDeterministicSummary(currentAnalysis.mostChangedByDollar);
    setAiResponse({
      summary: deterministic.summary,
      sentences: deterministic.sentences,
      mostChangedRegionName: currentAnalysis.mostChangedByDollar.region,
      calculatedMetricsUsed: payload,
      source: 'fallback-deterministic',
    });

    setIsAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.error && !data.summary) {
        setAiError(data.error);
        // keep deterministic baseline
      } else if (data.summary) {
        setAiResponse({
          summary: data.summary,
          sentences: data.sentences || [data.summary],
          mostChangedRegionName: data.mostChangedRegionName || currentAnalysis.mostChangedByDollar.region,
          calculatedMetricsUsed: payload,
          source: data.source || 'gemini-3.8-flash',
          notice: data.notice,
        });
        setAiError(null);
      }
    } catch (err: any) {
      console.warn('AI summary fetch failed, using deterministic summary:', err);
      setAiError('Note: Could not reach Gemini endpoint; using mathematically exact fallback summary.');
    } finally {
      setIsAiLoading(false);
    }
  }, []);

  // Process raw CSV string
  const processCsv = useCallback(
    (csvText: string, name: string) => {
      setIsProcessingCsv(true);
      const res = parseSalesCsv(csvText);

      if (res.errors.length > 0 && res.orders.length === 0) {
        setParseErrors(res.errors);
        setParseWarnings(res.warnings);
        setIsProcessingCsv(false);
        return;
      }

      setParseErrors([]);
      setParseWarnings(res.warnings);
      setOrders(res.orders);
      setFileName(name);
      setIsUploadModalOpen(false);
      setIsProcessingCsv(false);

      // Re-run analytics and AI
      const newAnalysis = analyzeSalesData(res.orders);
      fetchAiSummary(newAnalysis);
    },
    [fetchAiSummary]
  );

  // Handle uploaded file
  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        processCsv(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  // Load sample data
  const handleLoadSample = useCallback(() => {
    const sample = getSampleSalesCsv();
    processCsv(sample, 'enterprise_sales_orders_q1_q4.csv');
  }, [processCsv]);

  // Download sample CSV
  const handleDownloadSample = () => {
    const sample = getSampleSalesCsv();
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sales_orders_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Auto-load sample dataset on first mount for instant usability
  useEffect(() => {
    handleLoadSample();
  }, [handleLoadSample]);

  const auditPayload = useMemo(() => {
    return buildSalesAnalyticsPayload(analysis);
  }, [analysis]);

  return (
    <div className="min-h-screen bg-[#4169e1] text-slate-900 dark:text-slate-100 font-sans antialiased">
      {/* Top Navigation Bar */}
      <Header
        fileName={fileName}
        totalOrders={orders.length}
        onLoadSample={handleLoadSample}
        onDownloadSample={handleDownloadSample}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        isAiLoading={isAiLoading}
        onRegenerateAi={() => fetchAiSummary(analysis)}
        hasQ2Q3={analysis.hasQ2AndQ3}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* If no orders loaded, show primary upload hero */}
        {orders.length === 0 ? (
          <FileUpload
            onFileSelect={handleFileSelect}
            onLoadSample={handleLoadSample}
            isProcessing={isProcessingCsv}
            parseErrors={parseErrors}
            parseWarnings={parseWarnings}
          />
        ) : (
          <div>
            {/* Top KPI Metrics */}
            <MetricCards analysis={analysis} />

            {/* AI Executive 3-Sentence Summary Section */}
            {analysis.hasQ2AndQ3 ? (
              <AiSummaryCard
                aiResponse={aiResponse}
                isLoading={isAiLoading}
                onRegenerate={() => fetchAiSummary(analysis)}
                mostChangedRegion={analysis.mostChangedByDollar}
                onOpenAudit={() => setIsAuditModalOpen(true)}
                errorMessage={aiError}
              />
            ) : (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-3xl p-6 mb-8 text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold">Q2 and Q3 Data Required for Executive AI Analysis</h3>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                      The uploaded file contains quarters: [{analysis.quarters.join(', ')}]. To generate the three-sentence root cause summary comparing Q2 to Q3, please ensure orders for both Q2 and Q3 are included.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* View Switcher Tabs: Visual Analytics vs Raw Orders */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="inline-flex rounded-2xl bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 shadow-sm">
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                    activeTab === 'analytics'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>Visual Chart & Pivot Table</span>
                </button>
                <button
                  onClick={() => setActiveTab('raw')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                    activeTab === 'raw'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Table2 className="w-4 h-4" />
                  <span>Raw Orders Inspector ({orders.length})</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs text-white/90 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>All formulas verified strictly in-app</span>
              </div>
            </div>

            {/* Visual Analytics View */}
            {activeTab === 'analytics' ? (
              <>
                {/* 1. Chart: Total revenue by region and quarter */}
                <RevenueChart analysis={analysis} />

                {/* 2. Table: Total revenue by region and quarter with Q2->Q3 delta */}
                <RevenueTable analysis={analysis} />
              </>
            ) : (
              /* Raw Orders View */
              <RawDataTable
                orders={orders}
                quarters={analysis.quarters}
                regions={analysis.regions}
              />
            )}
          </div>
        )}
      </main>

      {/* Upload Modal (when replacing current CSV) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Upload Different Sales Orders CSV
                </h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕ Close
              </button>
            </div>

            <FileUpload
              onFileSelect={handleFileSelect}
              onLoadSample={handleLoadSample}
              isProcessing={isProcessingCsv}
              parseErrors={parseErrors}
              parseWarnings={parseWarnings}
              onDismissModal={() => setIsUploadModalOpen(false)}
              isModal
            />
          </div>
        </div>
      )}

      {/* Audit Modal */}
      <AuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        mostChangedRegion={analysis.mostChangedByDollar}
        payload={auditPayload}
        aiSummary={aiResponse?.summary || null}
      />
    </div>
  );
}
