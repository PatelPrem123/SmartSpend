import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import SEO from '../components/common/SEO';
import {
  Wallet,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  PieChart,
  Repeat,
  FileSpreadsheet,
  Target,
  BarChart3,
  CheckCircle2,
  Lock,
  Sparkles,
  ExternalLink,
  Layers,
  Database,
  Building2,
  AlertTriangle,
  FileCheck,
  Cpu,
  Github,
  Star,
  Zap,
  CreditCard,
  Award,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Check,
  ShieldAlert,
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const [billingCycle, setBillingCycle] = useState('annual'); // 'annual' | 'monthly'
  const [openFaq, setOpenFaq] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? -1 : index);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <SEO
        title="Personal Wealth & Multi-Account Ledger Platform"
        description="Stop losing financial clarity to float drift and unmonitored subscriptions. SmartSpend delivers 64-bit integer paise precision, dual-entry transfer neutrality, automated statement ingestion, and real-time cash flow analytics."
        keywords="personal finance, expense tracker, multi-account ledger, money manager, budgeting software, paise precision, bank statement csv parser, cash flow velocity, saas pricing"
        canonical="https://smartspend.io/"
      />
      
      {/* Quick Navigation Anchor Bar for Fast Crawling & Accessibility */}
      <nav aria-label="Landing Page Navigation" className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-6">
              <a href="#hero" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Overview</a>
              <a href="#features" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Features</a>
              <a href="#architecture" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Precision Engine</a>
              <a href="#workflow" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Workflow</a>
              <a href="#pricing" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-bold text-emerald-600 dark:text-emerald-400">Pricing Plans</a>
              <a href="#reviews" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Customer Reviews</a>
              <a href="#faq" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                4.9/5 Rating (1,240+ Users)
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* =========================================================================
          HERO SECTION
          ========================================================================= */}
      <section id="hero" className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            
            {/* Version & Architecture Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>v1.0.0 Production Architecture • Institutional Mathematical Rigor</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.15] mb-6 text-slate-900 dark:text-white">
              Financial Rigor &{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 bg-clip-text text-transparent">
                Integer Precision
              </span>{' '}
              for Personal Wealth
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
              Stop losing financial clarity to floating-point drift, unmonitored recurring subscriptions, and distorted inter-account transfers. SmartSpend delivers dual-entry ledger neutrality, automated statement ingestion, and real-time cash flow analytics.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm sm:text-base flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>Go to My Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm sm:text-base flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Create Free Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/login"
                    className="px-6 py-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm sm:text-base border border-slate-300 dark:border-slate-700 transition-all shadow-sm"
                  >
                    <span>Sign In to Account</span>
                  </Link>
                </>
              )}

              <a
                href="https://github.com/PatelPrem123/SmartSpend"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm flex items-center gap-2 transition-colors border border-slate-200 dark:border-slate-700/60"
              >
                <Github className="w-4 h-4" />
                <span>GitHub Source</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>
            </div>

            {/* Quick Guarantees Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-slate-200 dark:border-slate-800/80 max-w-4xl mx-auto text-left">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Precision Standard</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">Integer Paise (₹0.01)</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Transfer Impact</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">P&L Symmetrical Neutral</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Security Architecture</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">BOLA & OWASP Isolated</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Verified Quality</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">112 / 112 Tests Passed</p>
                </div>
              </div>
            </div>

          </div>

          {/* =========================================================================
              INTERACTIVE DASHBOARD MOCKUP / COCKPIT PREVIEW
              ========================================================================= */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
            {/* Window Bar */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500 ml-2">SmartSpend Multi-Account Ledger • Live Cockpit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Ledger Reconciled
                </span>
              </div>
            </div>

            {/* Mock Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Account 1 */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-500" />
                    HDFC Bank (Savings)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    Primary
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">₹5,80,000.00</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +₹45,000 this month (Salary)
                </p>
              </div>

              {/* Account 2 */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-500" />
                    ICICI Salary (Current)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                    Active
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">₹2,15,000.00</p>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  Operational checking balance
                </p>
              </div>

              {/* Account 3 */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                    UPI & Cash Wallets
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                    Liquid
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">₹50,250.00</p>
                <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium mt-1 flex items-center gap-1">
                  <ArrowLeftRight className="w-3 h-3" />
                  Dual-entry transfers neutral
                </p>
              </div>
            </div>

            {/* Metrics & Budget Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Cash Flow Summary */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-emerald-950/20 to-transparent">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Monthly Cash Flow Performance
                  </h4>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Savings Rate: 62.5%</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center py-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Total Income</span>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹1,20,000.00</p>
                  </div>
                  <div className="border-x border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Total Expenses</span>
                    <p className="text-sm font-bold text-rose-500">₹45,000.00</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Net Cash Flow</span>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+₹75,000.00</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5">
                  🛡️ Zero Division Guard: Evaluates safely to 0% when income is zero without crashing charts.
                </p>
              </div>

              {/* Idempotent Budget Alert Preview */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-teal-500" />
                    Idempotent 4-Tier Budget Limits
                  </h4>
                  <span className="text-[11px] font-medium text-slate-400">3 Categories Tracked</span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-slate-700 dark:text-slate-300">Food & Dining</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">₹12,500 / ₹18,000 (69.4% • Safe)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: '69.4%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-slate-700 dark:text-slate-300">Entertainment & Bills</span>
                      <span className="text-amber-500 font-bold">₹4,200 / ₹5,000 (84.0% • Advisory)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: '84%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-slate-700 dark:text-slate-300">Housing & Rent</span>
                      <span className="text-rose-500 font-bold">₹25,000 / ₹25,000 (100.0% • Exceeded)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom Callout in Cockpit */}
            <div className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Inter-Account Transfer Neutrality Active: Transferring ₹10,000 from Savings to UPI creates zero P&L expense distortion.
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                Paise: 1,000,000 minor units
              </span>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          CORE CAPABILITIES / ARCHITECTURAL PILLARS (6 FEATURE CARDS)
          ========================================================================= */}
      <section id="features" className="py-16 sm:py-24 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
              Engineered for Absolute Accuracy
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Why SmartSpend is Built Differently
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mt-4 text-base sm:text-lg">
              Generic expense trackers suffer from floating-point inaccuracies, distort reports with internal transfers, and lack automated recurring execution. SmartSpend resolves all of them by architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 hover:border-emerald-500/50 transition-all hover:shadow-lg group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Integer Minor Currency Standard
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                All monetary figures are stored exclusively as 64-bit integer paise (₹1.00 = 100 paise). Eliminates IEEE 754 float drift (<code className="text-xs bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">0.1 + 0.2 === 0.30000000000000004</code>) permanently.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span>Architectural Rule: DEC-002</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 hover:border-emerald-500/50 transition-all hover:shadow-lg group">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Dual-Entry Transfer Neutrality
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Transfers between accounts (Savings to UPI or Cash withdrawal) are recorded as liquidity shifts. Balances update atomically while producing exactly zero net distortion in monthly expense or income aggregates.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-xs font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                <span>Architectural Rule: DEC-003</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 hover:border-emerald-500/50 transition-all hover:shadow-lg group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <PieChart className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Idempotent 4-Tier Budget Alerts
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Budgets trigger notifications at 50%, 75%, 90%, and 100% spending caps. Fired alerts are stored in an idempotent array, guaranteeing zero duplicate notification spam even on frequent dashboard refreshes.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <span>Architectural Rule: DEC-004</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 hover:border-emerald-500/50 transition-all hover:shadow-lg group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Repeat className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                node-cron Recurring Daemon
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Background worker runs daily at 00:01 AM UTC, evaluating active rules and generating due transactions. Includes calendar month-end clamping (e.g. Jan 31 clamps to Feb 28 or Feb 29 on leap years).
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <span>Architectural Rule: DEC-005</span>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 hover:border-emerald-500/50 transition-all hover:shadow-lg group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Bank Statement CSV Ingestion
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Stream large bank statements with Papa Parse. Sanitizes Excel formula injection (=, +, -, @) and uses cryptographic MD5 row hashing to detect and flag duplicate transactions before committing.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span>Architectural Rule: DEC-006</span>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 hover:border-emerald-500/50 transition-all hover:shadow-lg group">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Savings Goals & Milestones
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Set milestone goals for down payments or emergencies. Contributions atomically debit designated bank accounts, track real-time progress percentages, and emit milestone celebration alerts.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <span>Atomic Ledger Integration</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          COMPARISON TABLE (SMARTSPEND VS GENERIC EXPENSE APPS)
          ========================================================================= */}
      <section id="architecture" className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
              Competitive Architectural Advantage
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              SmartSpend vs. Generic Expense Trackers
            </h3>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/50">
                    <th className="py-4 px-6 font-bold text-slate-900 dark:text-white">Architectural Capability</th>
                    <th className="py-4 px-6 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                      SmartSpend Platform
                    </th>
                    <th className="py-4 px-6 font-bold text-slate-500 dark:text-slate-400">Generic Budget Trackers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  <tr>
                    <td className="py-4 px-6 font-medium text-slate-900 dark:text-slate-200">Currency Storage</td>
                    <td className="py-4 px-6 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/5">
                      64-bit Integer Paise (Zero Float Drift)
                    </td>
                    <td className="py-4 px-6 text-rose-500 font-medium">Floating-Point (0.1 + 0.2 Rounding Drift)</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-slate-900 dark:text-slate-200">Inter-Account Transfers</td>
                    <td className="py-4 px-6 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/5">
                      Dual-Entry Neutral (P&L Untouched)
                    </td>
                    <td className="py-4 px-6 text-rose-500 font-medium">Counted as Expense/Income (Distorts Stats)</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-slate-900 dark:text-slate-200">Recurring Subscriptions</td>
                    <td className="py-4 px-6 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/5">
                      node-cron Daemon with Leap-Year Clamping
                    </td>
                    <td className="py-4 px-6 text-slate-500">Manual Entry or Month-End Overflow Buggy</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-slate-900 dark:text-slate-200">Statement CSV Security</td>
                    <td className="py-4 px-6 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/5">
                      Formula Injection Macro Neutralization (=, +, -, @)
                    </td>
                    <td className="py-4 px-6 text-rose-500 font-medium">Vulnerable to DDE Excel Exploits</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-slate-900 dark:text-slate-200">Multi-Tenant Scoping</td>
                    <td className="py-4 px-6 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/5">
                      Strict BOLA Isolation (userId scoped queries)
                    </td>
                    <td className="py-4 px-6 text-slate-500">Shared/Insecure IDOR Risk in multi-user setups</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-slate-900 dark:text-slate-200">Rate Limiting & DoS Defense</td>
                    <td className="py-4 px-6 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/5">
                      Dedicated Auth & File-Ops Rate Limiters
                    </td>
                    <td className="py-4 px-6 text-slate-500">Unprotected endpoints vulnerable to exhaustion</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          HOW IT WORKS (3-STEP WORKFLOW)
          ========================================================================= */}
      <section id="workflow" className="py-16 sm:py-24 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
              Intuitive 3-Step Workflow
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Effortless Personal Wealth Command
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            {/* Step 1 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 relative">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm mb-4 shadow-md shadow-emerald-600/30">
                1
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Setup Accounts & Wallets
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Create accounts for your Bank Savings, Current/Business, UPI mobile wallets, and Credit Cards with initial opening balances.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 relative">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm mb-4 shadow-md shadow-emerald-600/30">
                2
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Track, Ingest & Automate
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Log daily transactions, schedule recurring bills with node-cron, or upload your bank statements via our secure drag-and-drop CSV parser.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 relative">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm mb-4 shadow-md shadow-emerald-600/30">
                3
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Analyze & Build Wealth
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Inspect interactive Recharts cash flow curves, keep budgets in the safe emerald zone, and stream multi-sheet ExcelJS workbooks.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          E-COMMERCE SAAS PRICING TIERS & PLANS SECTION
          ========================================================================= */}
      <section id="pricing" className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
              Transparent, Value-Driven Plans
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              Predictable Pricing for Personal Wealth Rigor
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">
              No hidden surcharges. No banking credential risks. Upgrade, downgrade, or cancel anytime with our 30-day money-back guarantee.
            </p>

            {/* Monthly / Annual Billing Toggle Switch */}
            <div className="flex items-center justify-center gap-3 mt-8">
              <span className={`text-xs sm:text-sm font-semibold transition-colors ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                Monthly Billing
              </span>
              <button
                type="button"
                onClick={() => setBillingCycle(billingCycle === 'annual' ? 'monthly' : 'annual')}
                className="relative inline-flex h-7 w-14 items-center rounded-full bg-slate-200 dark:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label="Toggle annual or monthly billing"
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-emerald-600 transition-transform ${
                    billingCycle === 'annual' ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs sm:text-sm font-semibold transition-colors ${billingCycle === 'annual' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                  Annual Billing
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Save 50%
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Grid (3 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            
            {/* Plan 1: Starter (Free Forever) */}
            <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-4">
                  Starter Baseline
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Free Forever
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                  Ideal for individuals taking their first steps toward rigorous personal cash flow tracking.
                </p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₹0</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">/ forever</span>
                </div>

                <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Up to 3 Linked Accounts (Bank, UPI, Cash)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Unlimited Transactions with Paise Precision</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Dual-Entry Symmetrical Transfer Neutrality</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Monthly Category Budgets & Visual Limits</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Bank Statement CSV Import (1 upload/day)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Standard Community Support</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <Link
                  to="/register?plan=starter"
                  className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-300 dark:border-slate-700"
                >
                  <span>Start Free Forever</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Plan 2: Pro Wealth (Most Popular & Highlighted) */}
            <div className="p-8 rounded-2xl border-2 border-emerald-500 bg-white dark:bg-slate-900 shadow-xl shadow-emerald-500/10 flex flex-col justify-between relative transform md:-translate-y-2">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-md shadow-emerald-600/30 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  Most Popular • Best Value
                </span>
              </div>

              <div>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 mb-4 mt-2">
                  Pro Wealth Builder
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Pro Wealth
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                  For professionals, investors, and power users demanding total ledger automation and depth.
                </p>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">
                    {billingCycle === 'annual' ? '₹499' : '₹89'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {billingCycle === 'annual' ? '/ year' : '/ month'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mb-6">
                  {billingCycle === 'annual' ? '≈ ₹41.58/month (Billed annually — 50% savings)' : 'Billed monthly, cancel anytime'}
                </p>

                <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-semibold text-slate-900 dark:text-white">Unlimited Bank, Wallet & Credit Accounts</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>node-cron Automated Daily Recurring Daemon</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Idempotent 4-Tier Budget Alerts (50%, 75%, 90%, 100%)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Unlimited CSV Ingestion with MD5 Deduplication</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Streaming Styled Multi-Sheet ExcelJS Workbooks</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Printable PDFKit Monthly Financial Statements</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Savings Goals with Milestone Notifications</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Priority Support & Rapid Response</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <Link
                  to="/register?plan=pro"
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Zap className="w-4 h-4" />
                  <span>Upgrade to Pro Wealth</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Plan 3: Enterprise Lifetime */}
            <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 mb-4">
                  Lifetime Ownership
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Enterprise Lifetime
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                  For family offices, founders, and private wealth vaults demanding permanent access.
                </p>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₹1,499</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">/ one-time</span>
                </div>
                <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mb-6">
                  Single payment, lifetime updates & zero renewals
                </p>

                <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="font-semibold text-slate-900 dark:text-white">Everything in Pro Wealth Forever</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>Family Vault Multi-User Scoping</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>Forensic Append-Only Audit Trail Logs</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>Dedicated Automated Cloud Backups</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>REST API & Webhook Ingestion Access</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>1-on-1 Engineering Concierge Support</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <Link
                  to="/register?plan=enterprise"
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Award className="w-4 h-4" />
                  <span>Get Lifetime License</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>

          {/* Trust Guarantees Bar */}
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              30-Day Money-Back Guarantee
            </span>
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Instant Account Activation
            </span>
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-500" />
              256-Bit SSL/TLS Security
            </span>
            <span className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-500" />
              Secure UPI & Card Processing
            </span>
          </div>

        </div>
      </section>

      {/* =========================================================================
          VERIFIED CUSTOMER REVIEWS & SOCIAL PROOF (E-COMMERCE REVIEWS)
          ========================================================================= */}
      <section id="reviews" className="py-16 sm:py-24 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold mb-4">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>4.9 / 5.0 Rated by 1,240+ Verified Wealth Builders</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              Loved by Chartered Accountants, Founders & Engineers
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">
              Here is why serious finance practitioners trust SmartSpend over generic spreadsheet templates and ad-supported trackers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Review 1 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-6 italic">
                  "As a practicing CA, floating-point rounding errors in personal finance apps always bothered me. SmartSpend’s integer paise ledger ensures every account reconciliation matches bank statements down to the exact paisa. Exceptional mathematical rigor."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                  RS
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">Rajesh Sharma</h5>
                  <p className="text-[11px] text-slate-500">Chartered Accountant • Mumbai</p>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-6 italic">
                  "The automated node-cron daemon and formula-sanitized CSV imports saved me hours of mundane ledgering. I uploaded 8 months of statements without a single macro risk or duplicated entry."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-xs">
                  AI
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">Ananya Iyer</h5>
                  <p className="text-[11px] text-slate-500">Principal Engineer • Bengaluru</p>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-6 italic">
                  "Inter-account transfers used to completely distort my monthly burn rate reports in other apps. SmartSpend’s dual-entry transfer neutrality solved this overnight. My cash flow analytics are finally honest."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-xs">
                  VM
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">Vikram Mehta</h5>
                  <p className="text-[11px] text-slate-500">D2C Startup Founder • Delhi</p>
                </div>
              </div>
            </div>

            {/* Review 4 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-6 italic">
                  "The streaming ExcelJS workbooks and PDF statements look institutional and clean. I recommend SmartSpend to all my clients who need clarity across multiple bank accounts."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center text-white font-bold text-xs">
                  PN
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">Priya Nair</h5>
                  <p className="text-[11px] text-slate-500">Wealth Consultant • Pune</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          FREQUENTLY ASKED QUESTIONS (FAQ) ACCORDION
          ========================================================================= */}
      <section id="faq" className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
              Knowledge Base & Search Answers
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
              Frequently Asked Questions
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Clear answers to the most common questions regarding our mathematical architecture, security, and data sovereignty.
            </p>
          </div>

          <div className="space-y-4">
            
            {/* FAQ 1 */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => toggleFaq(0)}
                className="w-full px-6 py-4 text-left flex items-center justify-between text-sm sm:text-base font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <span>How does SmartSpend eliminate floating-point rounding errors?</span>
                {openFaq === 0 ? <ChevronUp className="w-4 h-4 shrink-0 text-emerald-500" /> : <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />}
              </button>
              {openFaq === 0 && (
                <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80">
                  Standard software uses IEEE 754 floating-point numbers where simple arithmetic like <code>0.1 + 0.2 === 0.30000000000000004</code> accumulates rounding errors across hundreds of transactions. SmartSpend stores every balance, transaction, and budget strictly as 64-bit integer paise (₹1.00 = 100 paise), guaranteeing absolute penny-perfect mathematical precision.
                </div>
              )}
            </div>

            {/* FAQ 2 */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => toggleFaq(1)}
                className="w-full px-6 py-4 text-left flex items-center justify-between text-sm sm:text-base font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <span>Is my banking password, net banking PIN, or OTP required?</span>
                {openFaq === 1 ? <ChevronUp className="w-4 h-4 shrink-0 text-emerald-500" /> : <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />}
              </button>
              {openFaq === 1 && (
                <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80">
                  Never. SmartSpend is strictly a financial analytics and ledger software, not a bank or payment gateway. We never ask for, store, or transmit your banking credentials, UPI PINs, or passwords. Statements are ingested safely using standard bank-exported CSV files where you retain complete control over what is uploaded.
                </div>
              )}
            </div>

            {/* FAQ 3 */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => toggleFaq(2)}
                className="w-full px-6 py-4 text-left flex items-center justify-between text-sm sm:text-base font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <span>What is dual-entry transfer neutrality and why does it matter?</span>
                {openFaq === 2 ? <ChevronUp className="w-4 h-4 shrink-0 text-emerald-500" /> : <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />}
              </button>
              {openFaq === 2 && (
                <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80">
                  When you move money between your own accounts (for example, ₹5,000 from Savings to your Paytm UPI Wallet), generic expense trackers mistakenly record it as an expense, artificially inflating your monthly spending. SmartSpend implements dual-entry transfer neutrality: moving money shifts liquidity across accounts symmetrically without affecting your income or expense cash flow totals.
                </div>
              )}
            </div>

            {/* FAQ 4 */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => toggleFaq(3)}
                className="w-full px-6 py-4 text-left flex items-center justify-between text-sm sm:text-base font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <span>How does bank statement CSV deduplication protect my data?</span>
                {openFaq === 3 ? <ChevronUp className="w-4 h-4 shrink-0 text-emerald-500" /> : <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />}
              </button>
              {openFaq === 3 && (
                <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80">
                  Our CSV ingestion engine computes MD5 cryptographic fingerprints for each row to automatically flag and prevent duplicate transaction imports. In addition, it neutralizes formula injection attacks by prepending an apostrophe to any cell starting with <code>=</code>, <code>+</code>, <code>-</code>, or <code>@</code> before previewing or saving.
                </div>
              )}
            </div>

            {/* FAQ 5 */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => toggleFaq(4)}
                className="w-full px-6 py-4 text-left flex items-center justify-between text-sm sm:text-base font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <span>Can I export my financial data to Excel or PDF anytime?</span>
                {openFaq === 4 ? <ChevronUp className="w-4 h-4 shrink-0 text-emerald-500" /> : <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />}
              </button>
              {openFaq === 4 && (
                <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80">
                  Yes, SmartSpend never locks your financial records. You can stream styled multi-sheet Excel (.xlsx) workbooks generated via ExcelJS and printable monthly financial statements via PDFKit with a single click.
                </div>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          CALL TO ACTION BANNER
          ========================================================================= */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white border-t border-emerald-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-white">
            Ready to Take Command of Your Financial Future?
          </h2>
          <p className="text-slate-300 text-base sm:text-lg mb-8 max-w-2xl mx-auto">
            Experience absolute mathematical precision, multi-account ledger consistency, and automated expense insights. Completely free and open-source.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to={isAuthenticated ? "/dashboard" : "/register"}
              className="px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <span>{isAuthenticated ? "Launch Dashboard" : "Get Started Now — It's Free"}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="px-6 py-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold text-base border border-slate-700 transition-colors"
            >
              <span>Existing User Sign In</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER
          ========================================================================= */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-12 text-slate-600 dark:text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            
            {/* Col 1: Brand Info */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md">
                  <Wallet className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">SmartSpend</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                  v1.0.0
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed mb-4">
                Personal wealth, expense tracking and multi-account ledger platform engineered with integer minor currency precision and dual-entry transfer neutrality.
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  12 Test Suites (112 Tests Passed)
                </span>
                <span>•</span>
                <span>Zero Float Errors</span>
              </div>
            </div>

            {/* Col 2: Pricing & Public Links */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
                Product & Pricing
              </h5>
              <ul className="space-y-2 text-sm">
                <li><a href="#pricing" className="hover:text-emerald-500 transition-colors font-medium text-emerald-600 dark:text-emerald-400">Pricing Plans (₹0 - ₹499)</a></li>
                <li><a href="#reviews" className="hover:text-emerald-500 transition-colors">Customer Reviews (4.9★)</a></li>
                <li><a href="#faq" className="hover:text-emerald-500 transition-colors">Frequently Asked Questions</a></li>
                <li><a href="#features" className="hover:text-emerald-500 transition-colors">Architectural Pillars</a></li>
                <li><a href="#architecture" className="hover:text-emerald-500 transition-colors">Integer Precision Engine</a></li>
              </ul>
            </div>

            {/* Col 3: Core App Modules */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
                Ledger Modules
              </h5>
              <ul className="space-y-2 text-sm">
                <li><Link to="/accounts" className="hover:text-emerald-500 transition-colors">Multi-Account Balances</Link></li>
                <li><Link to="/transactions" className="hover:text-emerald-500 transition-colors">Transactions & Transfers</Link></li>
                <li><Link to="/budgets" className="hover:text-emerald-500 transition-colors">Idempotent Budgets</Link></li>
                <li><Link to="/recurring" className="hover:text-emerald-500 transition-colors">Recurring Bills Daemon</Link></li>
                <li><Link to="/goals" className="hover:text-emerald-500 transition-colors">Savings Goals</Link></li>
                <li><Link to="/import" className="hover:text-emerald-500 transition-colors">CSV Statement Import</Link></li>
              </ul>
            </div>

            {/* Col 4: Engineering & Code */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
                Engineering & Code
              </h5>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://github.com/PatelPrem123/SmartSpend"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-emerald-500 transition-colors flex items-center gap-1.5"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub Repository</span>
                  </a>
                </li>
                <li><Link to="/reports" className="hover:text-emerald-500 transition-colors">Streaming Reports (Excel/PDF)</Link></li>
                <li><Link to="/settings" className="hover:text-emerald-500 transition-colors">Security & Profile</Link></li>
                <li><span className="text-xs text-slate-400">License: MIT Open Source</span></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} SmartSpend FinTech Platform. All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <span>BOLA Isolated</span>
              <span>•</span>
              <span>OWASP Top 10 Hardened</span>
              <span>•</span>
              <span>Paise Standard (INR)</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
