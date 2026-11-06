import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';

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
  BarChart3,
  ChevronDown,
  Menu,
  X
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
  const [showMoreMenu, setShowMoreMenu] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const moreMenuRef = React.useRef(null);
  const userMenuRef = React.useRef(null);
  const notifMenuRef = React.useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  // Close menus on route navigation
  useEffect(() => {
    setShowMobileMenu(false);
    setShowMoreMenu(false);
    setShowUserMenu(false);
    setShowNotifications(false);
  }, [location.pathname]);

  // Click-outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const isMoreActive = ['/goals', '/recurring', '/categories', '/import'].includes(location.pathname);

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center space-x-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                SmartSpend
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                v1.0.0
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Personal Wealth & Multi-Account Ledger
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links (when authenticated) */}
        {isAuthenticated && (
          <nav className="hidden lg:flex items-center space-x-1 shrink">
            <Link
              to="/dashboard"
              className={`px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium flex items-center gap-1.5 transition-colors ${
                isActive('/dashboard')
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/transactions"
              className={`px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium flex items-center gap-1.5 transition-colors ${
                isActive('/transactions')
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Transactions</span>
            </Link>

            <Link
              to="/accounts"
              className={`px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium flex items-center gap-1.5 transition-colors ${
                isActive('/accounts')
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Accounts</span>
            </Link>

            <Link
              to="/budgets"
              className={`px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium flex items-center gap-1.5 transition-colors ${
                isActive('/budgets')
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Budgets</span>
            </Link>

            <Link
              to="/reports"
              className={`px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium flex items-center gap-1.5 transition-colors ${
                isActive('/reports')
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Reports</span>
            </Link>

            {/* "More Tools" Dropdown */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className={`px-2.5 py-1.5 rounded-lg text-xs xl:text-sm font-medium flex items-center gap-1 transition-colors ${
                  isMoreActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>More</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showMoreMenu ? 'rotate-180' : ''}`} />
              </button>

              {showMoreMenu && (
                <div className="absolute left-0 mt-2 w-52 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50">
                  <Link
                    to="/goals"
                    className={`flex items-center gap-2.5 px-3 py-2 text-xs xl:text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      isActive('/goals') ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Target className="w-4 h-4 text-emerald-500" />
                    <span>Savings Goals</span>
                  </Link>
                  <Link
                    to="/recurring"
                    className={`flex items-center gap-2.5 px-3 py-2 text-xs xl:text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      isActive('/recurring') ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Repeat className="w-4 h-4 text-emerald-500" />
                    <span>Recurring Bills</span>
                  </Link>
                  <Link
                    to="/categories"
                    className={`flex items-center gap-2.5 px-3 py-2 text-xs xl:text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      isActive('/categories') ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Tag className="w-4 h-4 text-emerald-500" />
                    <span>Categories Taxonomy</span>
                  </Link>
                  <Link
                    to="/import"
                    className={`flex items-center gap-2.5 px-3 py-2 text-xs xl:text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      isActive('/import') ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    <span>Statement CSV Import</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        )}

        {/* Right Section: Notifications, Theme, User Menu, Hamburger */}
        <div className="flex items-center space-x-2 shrink-0">
          
          {/* Unauthenticated Quick Links */}
          {!isAuthenticated && (
            <div className="hidden sm:flex items-center space-x-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Notifications Button & Dropdown */}
          {isAuthenticated && (
            <div className="relative" ref={notifMenuRef}>
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
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* User Profile Menu (when authenticated) */}
          {isAuthenticated && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 hidden md:inline max-w-[100px] truncate">
                  {user?.name?.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/settings"
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Settings & Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile / Tablet Hamburger Toggle */}
          {isAuthenticated && (
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Menu"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

        </div>
      </div>

      {/* Mobile / Tablet Dropdown Drawer Menu */}
      {isAuthenticated && showMobileMenu && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
              Core Modules
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <Link
                to="/dashboard"
                className={`p-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  isActive('/dashboard') ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-500" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/transactions"
                className={`p-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  isActive('/transactions') ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4 text-emerald-500" />
                <span>Transactions</span>
              </Link>
              <Link
                to="/accounts"
                className={`p-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  isActive('/accounts') ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Building2 className="w-4 h-4 text-emerald-500" />
                <span>Accounts</span>
              </Link>
              <Link
                to="/budgets"
                className={`p-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  isActive('/budgets') ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <PieChart className="w-4 h-4 text-emerald-500" />
                <span>Budgets</span>
              </Link>
              <Link
                to="/reports"
                className={`p-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  isActive('/reports') ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <span>Reports</span>
              </Link>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
              Tools & Automation
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <Link
                to="/goals"
                className={`p-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  isActive('/goals') ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Target className="w-4 h-4 text-emerald-500" />
                <span>Savings Goals</span>
              </Link>
              <Link
                to="/recurring"
                className={`p-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  isActive('/recurring') ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Repeat className="w-4 h-4 text-emerald-500" />
                <span>Recurring Bills</span>
              </Link>
              <Link
                to="/categories"
                className={`p-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  isActive('/categories') ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Tag className="w-4 h-4 text-emerald-500" />
                <span>Categories</span>
              </Link>
              <Link
                to="/import"
                className={`p-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  isActive('/import') ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>CSV Import</span>
              </Link>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-2">
            <Link
              to="/settings"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-500"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

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
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          <Header />
          <ErrorBoundary>
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
          </ErrorBoundary>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
