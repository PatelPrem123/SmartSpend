import React, { useEffect, useState } from 'react';
import { useTransactionStore } from '../store/transactionStore';
import { useAccountStore } from '../store/accountStore';
import { useCategoryStore } from '../store/categoryStore';
import { formatCurrency, parseRupeesToPaise, formatDate, formatDateTime } from '../utils/formatters';
import {
  Plus,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Trash2,
  Edit3,
  X,
  AlertCircle,
  Loader2,
  Calendar,
  CreditCard,
  Building2,
  Tag,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

export default function TransactionsPage() {
  const {
    transactions,
    pagination,
    filters,
    fetchTransactions,
    createTransaction,
    createTransfer,
    updateTransaction,
    deleteTransaction,
    setFilters,
    setPage,
    isLoading,
    error,
  } = useTransactionStore();

  const { accounts, fetchAccounts } = useAccountStore();
  const { categories, fetchCategories } = useCategoryStore();

  // Modal States
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  // Transaction Form State
  const [txType, setTxType] = useState('expense');
  const [amountRupees, setAmountRupees] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [formError, setFormError] = useState('');

  // Transfer Form State
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferAmountRupees, setTransferAmountRupees] = useState('');
  const [transferDescription, setTransferDescription] = useState('Account Transfer');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferError, setTransferError] = useState('');

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
    fetchTransactions();
  }, [fetchAccounts, fetchCategories, fetchTransactions]);

  // Set default accounts for modals when loaded
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0]._id);
    }
    if (accounts.length > 1 && !fromAccountId) {
      setFromAccountId(accounts[0]._id);
      setToAccountId(accounts[1]._id);
    }
  }, [accounts, accountId, fromAccountId]);

  const openTxModal = (type = 'expense') => {
    setEditingTx(null);
    setTxType(type);
    setAmountRupees('');
    if (accounts.length > 0) setAccountId(accounts[0]._id);
    setCategoryId('');
    setDescription('');
    setNotes('');
    setPaymentMethod(type === 'income' ? 'net_banking' : 'upi');
    setFormError('');
    setIsTxModalOpen(true);
  };

  const openEditModal = (tx) => {
    setEditingTx(tx);
    setTxType(tx.type);
    setAmountRupees((tx.amountMinor / 100).toString());
    setAccountId(tx.accountId?._id || tx.accountId || '');
    setCategoryId(tx.categoryId?._id || tx.categoryId || '');
    setDescription(tx.description);
    setNotes(tx.notes || '');
    setPaymentMethod(tx.paymentMethod || 'upi');
    setFormError('');
    setIsTxModalOpen(true);
  };

  const openTransferModal = () => {
    if (accounts.length < 2) {
      alert('You need at least two active accounts to execute an inter-account transfer.');
      return;
    }
    setFromAccountId(accounts[0]._id);
    setToAccountId(accounts[1]._id);
    setTransferAmountRupees('');
    setTransferDescription('Inter-Account Transfer');
    setTransferNotes('');
    setTransferError('');
    setIsTransferModalOpen(true);
  };

  const handleTxSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const amountMinor = parseRupeesToPaise(amountRupees);
    if (!amountMinor || amountMinor <= 0) {
      setFormError('Please enter a valid monetary amount');
      return;
    }

    if (editingTx) {
      const res = await updateTransaction(editingTx._id, {
        amountMinor,
        description,
        notes,
        categoryId: categoryId || null,
        paymentMethod,
      });
      if (res.success) {
        setIsTxModalOpen(false);
      } else {
        setFormError(res.error);
      }
    } else {
      const res = await createTransaction({
        type: txType,
        amountMinor,
        accountId,
        categoryId: categoryId || undefined,
        description,
        notes,
        paymentMethod,
      });
      if (res.success) {
        setIsTxModalOpen(false);
        fetchAccounts(); // Refresh account balances
      } else {
        setFormError(res.error);
      }
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setTransferError('');

    if (fromAccountId === toAccountId) {
      setTransferError('Source and destination accounts must be distinct');
      return;
    }

    const amountMinor = parseRupeesToPaise(transferAmountRupees);
    if (!amountMinor || amountMinor <= 0) {
      setTransferError('Please enter a valid transfer amount');
      return;
    }

    const res = await createTransfer({
      fromAccountId,
      toAccountId,
      amountMinor,
      description: transferDescription,
      notes: transferNotes,
    });

    if (res.success) {
      setIsTransferModalOpen(false);
      fetchAccounts(); // Refresh account balances
    } else {
      setTransferError(res.error);
    }
  };

  const handleDelete = async (id, desc) => {
    if (window.confirm(`Are you sure you want to delete transaction "${desc}"? Account balances will be automatically restored.`)) {
      await deleteTransaction(id);
      fetchAccounts();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Ledger & Transactions
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Record income, daily expenditures, and transfer funds between accounts with transfer neutrality.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openTxModal('income')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Add Income</span>
          </button>
          <button
            onClick={() => openTxModal('expense')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <TrendingDown className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
          <button
            onClick={openTransferModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
            <span>Transfer Funds</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold w-fit">
            {[
              { id: '', label: 'All Events' },
              { id: 'income', label: 'Incomes' },
              { id: 'expense', label: 'Expenses' },
              { id: 'transfer', label: 'Transfers' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilters({ type: tab.id })}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filters.type === tab.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search description..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Filter Account</label>
            <select
              value={filters.accountId}
              onChange={(e) => setFilters({ accountId: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
            >
              <option value="">All Accounts</option>
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Filter Category</label>
            <select
              value={filters.categoryId}
              onChange={(e) => setFilters({ categoryId: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ startDate: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ endDate: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading && transactions.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
            <p className="text-sm text-slate-500">Retrieving ledger events...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Transactions Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No transactions match your current filters. Add a new income, expense, or transfer above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Event Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Account Reference</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const isExpense = tx.type === 'expense';
                  const isTransfer = tx.type === 'transfer';

                  return (
                    <tr
                      key={tx._id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(tx.transactionDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {tx.description}
                        </div>
                        {tx.notes && (
                          <div className="text-[11px] text-slate-400 line-clamp-1">{tx.notes}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {tx.categoryId ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: tx.categoryId.color || '#047857' }}
                            />
                            {tx.categoryId.name}
                          </span>
                        ) : isTransfer ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                            <ArrowLeftRight className="w-3 h-3" />
                            Transfer
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Uncategorized</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isTransfer ? (
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                            <span className="font-medium text-slate-900 dark:text-white">
                              {tx.fromAccountId?.name || 'Account'}
                            </span>
                            <ArrowLeftRight className="w-3 h-3 text-slate-400" />
                            <span className="font-medium text-slate-900 dark:text-white">
                              {tx.toAccountId?.name || 'Account'}
                            </span>
                          </div>
                        ) : (
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {tx.accountId?.name || 'Account'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 uppercase tracking-wider text-[10px] font-semibold text-slate-500 whitespace-nowrap">
                        {tx.paymentMethod?.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold">
                        <span
                          className={
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isExpense
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }
                        >
                          {isIncome && '+'}
                          {isExpense && '-'}
                          {isTransfer && '↔ '}
                          {formatCurrency(tx.amountMinor)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(tx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx._id, tx.description)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {transactions.length} of {pagination.total} records (Page {pagination.page} of{' '}
            {pagination.totalPages})
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => setPage(pagination.page - 1)}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-white dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages || isLoading}
              onClick={() => setPage(pagination.page + 1)}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-white dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Modal (Income / Expense) */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {editingTx ? (
                  <span>Edit Transaction</span>
                ) : txType === 'income' ? (
                  <>
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    <span>Record Income</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-5 h-5 text-rose-500" />
                    <span>Record Expense</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setIsTxModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleTxSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Amount in Rupees (₹ INR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  placeholder="e.g. 1500.50"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Precision: Stored exclusively as integer minor units (paise)
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grocery shopping at DMart, Client Payment"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    {txType === 'income' ? 'Receiving Account' : 'Paid From Account'}
                  </label>
                  <select
                    disabled={!!editingTx}
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {accounts.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name} ({formatCurrency(a.currentBalanceMinor)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Category Taxonomy
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Uncategorized</option>
                    {categories
                      .filter((c) => c.type === txType)
                      .map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Payment Instrument
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="upi">UPI (GPay, PhonePe, Paytm)</option>
                  <option value="net_banking">Net Banking (NEFT/IMPS/RTGS)</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="cash">Cash In Hand</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other Method</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Notes & Remarks
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional tags, invoice ref, or memo..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2 ${
                    txType === 'income'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingTx ? 'Update Record' : 'Record Transaction'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Funds Modal (Dual-Entry Subsystem) */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-emerald-500" />
                <span>Inter-Account Transfer</span>
              </h3>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs leading-relaxed">
              <strong>Transfer Neutrality (DEC-003):</strong> Moving funds mutates account balances symmetrically, but produces zero net change in monthly income or expense totals.
            </div>

            {transferError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{transferError}</span>
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Source Account (Debited)
                  </label>
                  <select
                    value={fromAccountId}
                    onChange={(e) => setFromAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {accounts.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name} ({formatCurrency(a.currentBalanceMinor)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Destination Account (Credited)
                  </label>
                  <select
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {accounts.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name} ({formatCurrency(a.currentBalanceMinor)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Transfer Amount in Rupees (₹ INR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  placeholder="e.g. 5000.00"
                  value={transferAmountRupees}
                  onChange={(e) => setTransferAmountRupees(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Transfer Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Moving emergency cash to wallet"
                  value={transferDescription}
                  onChange={(e) => setTransferDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Execute Atomic Transfer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
