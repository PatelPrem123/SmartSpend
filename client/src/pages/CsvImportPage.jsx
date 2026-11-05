import React, { useState, useEffect, useRef } from 'react';
import { useImportStore } from '../store/importStore';
import { useAccountStore } from '../store/accountStore';
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Download,
  Building2,
  Check,
  X,
  History,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Trash2,
} from 'lucide-react';

export default function CsvImportPage() {
  const {
    batches,
    previewData,
    fetchBatches,
    uploadAndPreview,
    confirmImport,
    clearPreview,
    isUploading,
    isCommitting,
    error,
  } = useImportStore();

  const { accounts, fetchAccounts } = useAccountStore();

  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchAccounts();
    fetchBatches();
  }, [fetchAccounts, fetchBatches]);

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0]._id);
    }
  }, [accounts, selectedAccountId]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile || !selectedAccountId) {
      alert('Please select both a target account and a CSV file.');
      return;
    }
    setSuccessMessage('');
    try {
      await uploadAndPreview(selectedFile, selectedAccountId);
    } catch (err) {
      // Error handled by store
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || !previewData.preview) return;

    try {
      const res = await confirmImport(
        previewData.accountId,
        previewData.filename,
        previewData.preview.previewRows,
        skipDuplicates
      );
      setSuccessMessage(
        `Successfully imported ${res.importedCount} transactions into your ledger! (${res.skippedCount} skipped as duplicates/invalid)`
      );
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      // Error handled by store
    }
  };

  const handleDownloadSampleCsv = () => {
    const sample = `Date,Description,Amount,Category\n2026-11-01,Monthly Salary,75000.00,Salary\n2026-11-02,Swiggy Food Delivery,-450.50,Food & Dining\n2026-11-03,Airtel Broadband Recharge,-1178.82,Utilities\n2026-11-04,Supermarket Groceries,-2340.00,Groceries`;
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smartspend_sample_statement.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatINR = (minor) => {
    return (
      '₹' +
      ((minor || 0) / 100).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  const preview = previewData?.preview;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              Bank Statement CSV Ingestion
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              Formula Macro Sanitized (DEC-006)
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Bulk ingest bank statements with MD5 fingerprint deduplication and automatic account ledger updates
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadSampleCsv}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-4 h-4" />
            <span>Sample CSV Format</span>
          </button>
          <a
            href="/api/v1/imports/csv/export"
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Clean Ledger CSV</span>
          </a>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-between text-xs text-rose-800 dark:text-rose-300 font-medium">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Upload & Stage 1 Form (Hidden if already in preview) */}
      {!preview && (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="max-w-xl mx-auto space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                1. Select Target Account to Ingest Transactions Into
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.name} ({acc.accountType} - Current Balance: {formatINR(acc.currentBalanceMinor)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                2. Select Bank Statement CSV File (Max 5MB)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/20"
              >
                <Upload className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {selectedFile ? selectedFile.name : 'Click to browse or drag & drop CSV file'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports HDFC, ICICI, SBI, Axis, PhonePe & standard bank export headers
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv,application/vnd.ms-excel"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            <button
              onClick={handleUploadAndAnalyze}
              disabled={isUploading || !selectedFile}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <span>Analyzing and Deduplicating Rows...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Upload & Analyze Statement (Stage 1)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Stage 2: Preview & Deduplication Summary Table */}
      {preview && (
        <div className="space-y-6 animate-in fade-in">
          {/* Analysis Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Rows</span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {preview.totalRows}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
                New Valid Rows
              </span>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {preview.validCount}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 bg-amber-50/30">
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase">
                Duplicates Detected (DEC-006)
              </span>
              <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {preview.duplicateCount}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Invalid Rows</span>
              <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                {preview.errorCount}
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span>Skip all duplicate transactions (Recommended to prevent duplicate ledger records)</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                onClick={clearPreview}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
              >
                Cancel / Choose Another File
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={isCommitting || preview.validCount === 0}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
              >
                {isCommitting ? (
                  <span>Committing Transactions...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Commit ({skipDuplicates ? preview.validCount : preview.validCount + preview.duplicateCount} Transactions)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview Table */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Parsed Statement Rows Preview
            </h3>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <tr className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5">Date</th>
                    <th className="pb-2.5">Description (Sanitized)</th>
                    <th className="pb-2.5">Category</th>
                    <th className="pb-2.5">Type</th>
                    <th className="pb-2.5 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {preview.previewRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 ${
                        row.isDuplicate ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="py-2.5 whitespace-nowrap">
                        {row.isDuplicate ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Duplicate</span>
                          </span>
                        ) : row.isValid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <Check className="w-3 h-3" />
                            <span>Ready</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            <X className="w-3 h-3" />
                            <span>{row.error}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-slate-500 whitespace-nowrap">
                        {row.displayDate || row.date}
                      </td>
                      <td className="py-2.5 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                        {row.description}
                      </td>
                      <td className="py-2.5 text-slate-500">
                        {row.category || 'General'}
                      </td>
                      <td className="py-2.5 capitalize text-slate-500">
                        {row.type}
                      </td>
                      <td
                        className={`py-2.5 text-right font-bold whitespace-nowrap ${
                          row.type === 'income'
                            ? 'text-teal-600 dark:text-teal-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {row.type === 'income' ? '+' : '-'} {formatINR(row.amountMinor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Historical Batches */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Statement Import History</span>
        </h3>

        {batches.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center border rounded-2xl border-dashed border-slate-200 dark:border-slate-800">
            No previous statements imported yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((batch) => (
              <div
                key={batch._id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                      {batch.filename}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 capitalize">
                    {batch.status}
                  </span>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <p>Account: <strong className="text-slate-800 dark:text-slate-200">{batch.accountId?.name || 'Account'}</strong></p>
                  <p>Imported: <strong className="text-emerald-600">{batch.importedCount} transactions</strong></p>
                  <p>Skipped Duplicates: <strong>{batch.skippedCount}</strong></p>
                </div>

                <p className="text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                  Uploaded on {new Date(batch.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
