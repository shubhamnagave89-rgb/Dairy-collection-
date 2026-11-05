import React, { useState } from 'react';
import {
  Milk,
  Download,
  Bell,
  Sun,
  Moon,
  Globe,
  User,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  PhoneCall,
  Smartphone,
  ChevronRight
} from 'lucide-react';
import { Language, Theme, UserProfile } from '../types/index.js';
import { translations } from '../translations/index.js';

interface NavbarProps {
  user: UserProfile | null;
  language: Language;
  theme: Theme;
  onLanguageChange: (lang: Language) => void;
  onThemeChange: (theme: Theme) => void;
  onOpenAuth: (mode: 'supplier_login' | 'admin_login' | 'register') => void;
  onLogout: () => void;
  onNavigate: (view: 'website' | 'dashboard' | 'apk_download') => void;
  currentView: 'website' | 'dashboard' | 'apk_download';
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  language,
  theme,
  onLanguageChange,
  onThemeChange,
  onOpenAuth,
  onLogout,
  onNavigate,
  currentView,
  unreadNotificationsCount,
  onOpenNotifications
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[language];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-emerald-100 dark:border-slate-800 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Brand Logo & Title */}
          <div
            onClick={() => onNavigate('website')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-700 to-green-900 p-1.5 shadow-md group-hover:scale-105 transition-transform">
              <img
                src="/dairy-icon.svg"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-xl md:text-2xl font-bold tracking-tight text-emerald-950 dark:text-emerald-100 block leading-tight">
                {t.officialHeader}
              </span>
              <span className="text-[11px] md:text-xs text-emerald-700 dark:text-emerald-400 font-medium block">
                {language === 'mr' ? 'वाडी रत्नागिरी, जि. कोल्हापूर' : 'Wadi Ratnagiri, Kolhapur'}
              </span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => onNavigate('website')}
              className={`text-sm font-semibold transition-colors ${
                currentView === 'website'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700'
              }`}
            >
              {t.home}
            </button>

            <button
              onClick={() => onNavigate('apk_download')}
              className={`text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                currentView === 'apk_download'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700'
              }`}
            >
              <Download className="w-4 h-4 text-emerald-600" />
              {t.downloadApk}
            </button>

            {user && (
              <button
                onClick={() => onNavigate('dashboard')}
                className={`text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                  currentView === 'dashboard'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700'
                }`}
              >
                {t.dashboard}
              </button>
            )}
          </nav>

          {/* Right Action Controls */}
          <div className="hidden md:flex items-center gap-3">
            {/* Quick Install Button */}
            <button
              onClick={() => onNavigate('apk_download')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-xs font-bold transition-all shadow-xs"
              title="Install Mobile App"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>{language === 'mr' ? 'ॲप इन्स्टॉल' : 'Install App'}</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => onLanguageChange(language === 'mr' ? 'en' : 'mr')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'mr' ? 'English' : 'मराठी'}</span>
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Notifications Bell */}
            {user && (
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] flex items-center justify-center font-bold animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {/* Auth Buttons / User Chip */}
            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-700">
                <div
                  onClick={() => onNavigate('dashboard')}
                  className="flex items-center gap-2 cursor-pointer bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">
                    {user.role === 'admin' ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-emerald-950 dark:text-emerald-100 truncate max-w-[130px]">
                      {user.fullName}
                    </p>
                    <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                      {user.role === 'admin' ? t.roleAdmin : `${user.id}`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                  title={t.logout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('supplier_login')}
                  className="px-3.5 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl transition-colors border border-emerald-200 dark:border-emerald-800"
                >
                  {t.supplierLogin}
                </button>
                <button
                  onClick={() => onOpenAuth('admin_login')}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-xs"
                >
                  {t.adminLogin}
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onLanguageChange(language === 'mr' ? 'en' : 'mr')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'mr' ? 'English' : 'मराठी'}</span>
            </button>

            <button
              onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex flex-col space-y-2">
            <button
              onClick={() => {
                onNavigate('website');
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl font-bold text-left text-sm text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800"
            >
              <span>{t.home}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => {
                onNavigate('apk_download');
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl font-bold text-left text-sm text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40"
            >
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-600" />
                {t.downloadApk} (v1.0.4)
              </span>
              <ChevronRight className="w-4 h-4 text-emerald-600" />
            </button>

            {user && (
              <button
                onClick={() => {
                  onNavigate('dashboard');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl font-bold text-left text-sm text-emerald-900 dark:text-emerald-200 bg-emerald-100/60 dark:bg-emerald-900/40"
              >
                <span>{t.dashboard} ({user.role === 'admin' ? t.roleAdmin : user.id})</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {user ? (
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-700 font-bold text-sm"
              >
                <LogOut className="w-4 h-4" />
                {t.logout}
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onOpenAuth('supplier_login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 px-2 text-center rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 text-emerald-900 dark:text-emerald-200 font-bold text-xs"
                >
                  {t.supplierLogin}
                </button>
                <button
                  onClick={() => {
                    onOpenAuth('admin_login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 px-2 text-center rounded-xl bg-emerald-700 text-white font-bold text-xs shadow-sm"
                >
                  {t.adminLogin}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
