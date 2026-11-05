import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Lazy-loaded route pages for code splitting & bundle optimization
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
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
  const [showMoreNav, setShowMoreNav] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  // Close menus on route change
  useEffect(() => {
    setShowMoreNav(false);
    setMobileMenuOpen(false);
    setShowNotifications(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItemClass = (path) =>
    `px-3 py-1.5 rounded-lg text-xs lg:text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
      location.pathname === path
        ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 font-semibold'
        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              SmartSpend
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                v1.0.0
              </span>
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Personal Wealth Ledger
            </p>
          </div>
        </Link>

        {/* Center / Navigation Bar */}
        {isAuthenticated ? (
          <div className="flex items-center gap-1">
            {/* Primary Nav Links */}
            <nav className="hidden md:flex items-center space-x-0.5 lg:space-x-1">
              <Link to="/dashboard" className={navItemClass('/dashboard')}>
                <LayoutDashboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Dashboard</span>
              </Link>
              <Link to="/transactions" className={navItemClass('/transactions')}>
                <ArrowLeftRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Transactions</span>
              </Link>
              <Link to="/accounts" className={navItemClass('/accounts')}>
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Accounts</span>
              </Link>
              <Link to="/budgets" className={navItemClass('/budgets')}>
                <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Budgets</span>
              </Link>
              <Link to="/goals" className={navItemClass('/goals')}>
                <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Goals</span>
              </Link>
              <Link to="/reports" className={navItemClass('/reports')}>
                <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Reports</span>
              </Link>

              {/* More Dropdown for Secondary Navigation */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreNav(!showMoreNav)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs lg:text-sm font-medium flex items-center gap-1 transition-colors ${
                    ['/recurring', '/categories', '/import', '/settings'].includes(location.pathname)
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>More</span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${showMoreNav ? 'rotate-90' : ''}`}
                  />
                </button>

                {showMoreNav && (
                  <div className="absolute left-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    <Link
                      to="/recurring"
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Repeat className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Recurring Bills</span>
                    </Link>
                    <Link
                      to="/categories"
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Categories</span>
                    </Link>
                    <Link
                      to="/import"
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Import CSV</span>
                    </Link>
                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                    <Link
                      to="/settings"
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span>Settings</span>
                    </Link>
                  </div>
                )}
              </div>
            </nav>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Toggle Menu"
            >
              <LayoutDashboard className="w-5 h-5 text-emerald-600" />
            </button>
          </div>
        ) : null}

        {/* Right Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {isAuthenticated ? (
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              
              {/* Notifications Popover */}
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
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
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

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Toggle Theme"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>

              <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

              {/* User Profile Pill */}
              <div className="flex items-center gap-1.5 pl-1">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs shrink-0">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden lg:inline max-w-[100px] truncate">
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
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Toggle Theme"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Mobile Navigation Drawer */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-200">
          <Link to="/dashboard" className={navItemClass('/dashboard')}>
            <LayoutDashboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Dashboard</span>
          </Link>
          <Link to="/transactions" className={navItemClass('/transactions')}>
            <ArrowLeftRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Transactions</span>
          </Link>
          <Link to="/accounts" className={navItemClass('/accounts')}>
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Accounts</span>
          </Link>
          <Link to="/budgets" className={navItemClass('/budgets')}>
            <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Budgets</span>
          </Link>
          <Link to="/goals" className={navItemClass('/goals')}>
            <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Goals</span>
          </Link>
          <Link to="/reports" className={navItemClass('/reports')}>
            <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Reports</span>
          </Link>
          <Link to="/recurring" className={navItemClass('/recurring')}>
            <Repeat className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Recurring Bills</span>
          </Link>
          <Link to="/categories" className={navItemClass('/categories')}>
            <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Categories</span>
          </Link>
          <Link to="/import" className={navItemClass('/import')}>
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Import CSV</span>
          </Link>
          <Link to="/settings" className={navItemClass('/settings')}>
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Settings</span>
          </Link>
        </div>
      )}
    </header>
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
              <Route path="/" element={<LandingPage />} />
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
