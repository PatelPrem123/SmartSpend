import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Lazy-loaded route pages for code splitting & bundle optimization
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const AccountsPage = React.lazy(() => import('./pages/AccountsPage'));
const CategoriesPage = React.lazy(() => import('./pages/CategoriesPage'));
const TransactionsPage = React.lazy(() => import('./pages/TransactionsPage'));
const BudgetsPage = React.lazy(() => import('./pages/BudgetsPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const RecurringPage = React.lazy(() => import('./pages/RecurringPage'));
const CsvImportPage = React.lazy(() => import('./pages/CsvImportPage'));
const GoalsPage = React.lazy(() => import('./pages/GoalsPage'));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage'));

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading module...</span>
      </div>
    </div>
  );
}
import { useDashboardStore } from './store/dashboardStore';
import { useNotificationStore } from './store/notificationStore';
import { 
  Wallet, 
  Sun, 
  Moon, 
  LayoutDashboard,
  ShieldCheck,
  User,
  LogOut,
  Settings,
  ArrowRight,
  Building2,
  Tag,
  TrendingUp,
  TrendingDown,
  Percent,
  Coins,
  ArrowLeftRight,
  PieChart,
  Bell,
  CheckCheck,
  Repeat,
  FileSpreadsheet,
  Target,
  BarChart3
} from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function Header() {
  const { isDark, toggleTheme } = useThemeStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } =
    useNotificationStore();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              SmartSpend
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                v1.0.0
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Personal Wealth & Multi-Account Ledger
            </p>
          </div>
        </Link>

        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              <Link
                to="/dashboard"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link
                to="/transactions"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeftRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Transactions</span>
              </Link>
              <Link
                to="/budgets"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Budgets</span>
              </Link>
              <Link
                to="/goals"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Goals</span>
              </Link>
              <Link
                to="/reports"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Reports</span>
              </Link>
              <Link
                to="/recurring"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <Repeat className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Recurring</span>
              </Link>
              <Link
                to="/accounts"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Accounts</span>
              </Link>
              <Link
                to="/categories"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Categories</span>
              </Link>
              <Link
                to="/import"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Import</span>
              </Link>
              <Link
                to="/settings"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Settings</span>
              </Link>

              {/* Notification Popover */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Alerts & Notifications
                      </h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllAsRead()}
                          className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <CheckCheck className="w-3 h-3" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">
                          No notifications yet
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            onClick={() => !n.isRead && markAsRead(n._id)}
                            className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                              n.isRead
                                ? 'border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400'
                                : 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 text-slate-800 dark:text-slate-200 font-medium'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-slate-900 dark:text-white">
                                {n.title}
                              </span>
                              {!n.isRead && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              )}
                            </div>
                            <p className="text-[11px] mt-1 line-clamp-2">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="flex items-center gap-2 pl-1">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 hidden md:inline">
                  {user?.name}
                </span>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
}

function LandingHero() {
  const { isAuthenticated } = useAuthStore();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="p-8 sm:p-12 rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white shadow-2xl relative overflow-hidden border border-emerald-800/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium mb-6">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Phase 2: Authentication & User Scoping Active
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Financial Rigor, Integer Precision & Multi-Account Intelligence
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
            Engineered with 64-bit integer paise precision, dual-entry atomic transfer neutrality, idempotent budget alerts, and automated statement deduplication.
          </p>

          <div className="flex flex-wrap gap-3 mb-8">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-all border border-slate-700"
                >
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Precision Unit</p>
              <p className="text-lg font-bold text-emerald-400 mt-1">Paise (₹0.01)</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Ledger Model</p>
              <p className="text-lg font-bold text-white mt-1">Dual-Entry</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Transfer Impact</p>
              <p className="text-lg font-bold text-emerald-400 mt-1">P&L Neutral</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Security</p>
              <p className="text-lg font-bold text-white mt-1">BOLA Isolated</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function App() {
  const initTheme = useThemeStore((state) => state.initTheme);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    initTheme();
    checkAuth();
  }, [initTheme, checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          <Header />
          <React.Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingHero />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounts"
                element={
                  <ProtectedRoute>
                    <AccountsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transactions"
                element={
                  <ProtectedRoute>
                    <TransactionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/budgets"
                element={
                  <ProtectedRoute>
                    <BudgetsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/goals"
                element={
                  <ProtectedRoute>
                    <GoalsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recurring"
                element={
                  <ProtectedRoute>
                    <RecurringPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/import"
                element={
                  <ProtectedRoute>
                    <CsvImportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/categories"
                element={
                  <ProtectedRoute>
                    <CategoriesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </React.Suspense>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
