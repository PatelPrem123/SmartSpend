import React, { useEffect, useState } from 'react';
import { useAccountStore } from '../store/accountStore';
import { formatCurrency, parseRupeesToPaise } from '../utils/formatters';
import { 
  Plus, 
  Wallet, 
  Building2, 
  CreditCard, 
  PiggyBank, 
  Smartphone, 
  Banknote,
  Archive, 
  Edit3, 
  X, 
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';

const ACCOUNT_TYPE_LABELS = {
  cash: { label: 'Physical Cash', icon: Banknote, bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' },
  savings: { label: 'Savings Account', icon: Building2, bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' },
  current: { label: 'Current Account', icon: Building2, bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' },
  wallet: { label: 'Digital Wallet / UPI', icon: Smartphone, bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' },
  credit_card: { label: 'Credit Card', icon: CreditCard, bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400' },
  emergency_fund: { label: 'Emergency Fund', icon: PiggyBank, bg: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400' },
};

export default function AccountsPage() {
  const { accounts, fetchAccounts, createAccount, updateAccount, archiveAccount, isLoading, error } = useAccountStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState('savings');
  const [openingBalanceRupees, setOpeningBalanceRupees] = useState('0');
  const [color, setColor] = useState('#047857');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const openCreateModal = () => {
    setEditingAccount(null);
    setName('');
    setAccountType('savings');
    setOpeningBalanceRupees('0');
    setColor('#047857');
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (acc) => {
    setEditingAccount(acc);
    setName(acc.name);
    setAccountType(acc.accountType);
    setOpeningBalanceRupees((acc.openingBalanceMinor / 100).toString());
    setColor(acc.color || '#047857');
    setNotes(acc.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Account name is required');
      return;
    }

    if (editingAccount) {
      const res = await updateAccount(editingAccount._id, {
        name,
        accountType,
        color,
        notes,
      });
      if (res.success) {
        setIsModalOpen(false);
      } else {
        setFormError(res.error);
      }
    } else {
      const openingBalanceMinor = parseRupeesToPaise(openingBalanceRupees);
      const res = await createAccount({
        name,
        accountType,
        openingBalanceMinor,
        color,
        notes,
      });
      if (res.success) {
        setIsModalOpen(false);
      } else {
        setFormError(res.error);
      }
    }
  };

  const handleArchive = async (id, accName) => {
    if (window.confirm(`Are you sure you want to archive "${accName}"? It will be safely hidden while preserving financial ledger history.`)) {
      await archiveAccount(id);
    }
  };

  const totalLiquidityPaise = accounts.reduce((acc, curr) => acc + (curr.currentBalanceMinor || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Financial Accounts
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your physical cash, commercial banks, UPI wallets, and credit cards with integer precision.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Account</span>
        </button>
      </div>

      {/* Overview Stat Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Multi-Account Balance
          </p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalLiquidityPaise)}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            Aggregated across {accounts.length} active liquidity pool{accounts.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
          <span>Currency: <strong>INR (₹)</strong></span>
          <span>•</span>
          <span>Paise Standard (₹0.01)</span>
        </div>
      </div>

      {/* Accounts Grid */}
      {isLoading && accounts.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
          <p className="text-sm text-slate-500">Loading your accounts...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Wallet className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Financial Accounts Yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Create your first account (e.g. HDFC Salary, Cash in Hand, or Paytm Wallet) to begin recording transactions and inter-account transfers.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Account</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc) => {
            const meta = ACCOUNT_TYPE_LABELS[acc.accountType] || ACCOUNT_TYPE_LABELS.savings;
            const IconComponent = meta.icon;

            return (
              <div
                key={acc._id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                {/* Account Header with Color Accent */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                        style={{ backgroundColor: acc.color || '#047857' }}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                          {acc.name}
                        </h4>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium mt-1 ${meta.bg}`}>
                          {meta.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(acc)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Account"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleArchive(acc._id, acc.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Archive Account"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Balance Display */}
                  <div className="mt-6">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Current Balance
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {formatCurrency(acc.currentBalanceMinor)}
                    </p>
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span>Opening: {formatCurrency(acc.openingBalanceMinor)}</span>
                  <span>{acc.currency || 'INR'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog (Create / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingAccount ? 'Edit Account Details' : 'Create Financial Account'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
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

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Salary Account, Physical Wallet"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Account Classification
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="savings">Savings Account (Bank)</option>
                  <option value="cash">Physical Cash in Hand</option>
                  <option value="wallet">Digital Mobile Wallet (Paytm, PhonePe, UPI)</option>
                  <option value="current">Current / Business Account</option>
                  <option value="credit_card">Credit Card (Liability Tracking)</option>
                  <option value="emergency_fund">Emergency Fund</option>
                </select>
              </div>

              {!editingAccount && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Opening Balance (₹ INR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={openingBalanceRupees}
                    onChange={(e) => setOpeningBalanceRupees(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Stored accurately as integer paise (e.g. ₹1,250.50 = 125050 paise)
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Color Accent
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{color}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Currency
                  </label>
                  <input
                    type="text"
                    disabled
                    value="INR (₹)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Optional Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Account number last 4 digits, branch details, etc."
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-all flex items-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingAccount ? 'Update Account' : 'Save Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
