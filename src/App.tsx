import React, { useState, useEffect } from 'react';
import { Language, Theme, UserProfile, MilkCollectionItem, NotificationItem } from './types/index.js';
import { api } from './services/api.js';
import { SplashScreen } from './components/SplashScreen.js';
import { Navbar } from './components/Navbar.js';
import { PublicWebsite } from './components/PublicWebsite.js';
import { ApkDownloadPage } from './components/ApkDownloadPage.js';
import { AuthModal } from './components/AuthModal.js';
import { AdminDashboard } from './components/AdminDashboard.js';
import { SupplierDashboard } from './components/SupplierDashboard.js';
import { PdfStatementModal } from './components/PdfStatementModal.js';
import { ThermalSlipModal } from './components/ThermalSlipModal.js';
import { NotificationDrawer } from './components/NotificationDrawer.js';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [language, setLanguage] = useState<Language>('mr');
  const [theme, setTheme] = useState<Theme>('light');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<'website' | 'dashboard' | 'apk_download'>('website');

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'supplier_login' | 'admin_login' | 'register'>('supplier_login');

  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [statementSupplierId, setStatementSupplierId] = useState<string | null>(null);

  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [slipCollection, setSlipCollection] = useState<MilkCollectionItem | null>(null);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Dark mode effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Load current user and notifications
  const loadUserAndNotifs = async () => {
    try {
      const res = await api.getCurrentUser();
      if (res && res.user) {
        setUser(res.user);
        // Load notifications
        const notifRes = await api.getNotifications();
        setNotifications(notifRes.notifications);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    loadUserAndNotifs();
  }, []);

  const handleOpenAuth = (mode: 'supplier_login' | 'admin_login' | 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (loggedUser: UserProfile) => {
    setUser(loggedUser);
    setCurrentView('dashboard');
    loadUserAndNotifs();
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setCurrentView('website');
  };

  const handleOpenStatement = (supId: string) => {
    setStatementSupplierId(supId);
    setStatementModalOpen(true);
  };

  const handleOpenSlip = (col: MilkCollectionItem) => {
    setSlipCollection(col);
    setSlipModalOpen(true);
  };

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* 1. Splash Screen on first load */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* 2. Brand Navigation Bar */}
      <Navbar
        user={user}
        language={language}
        theme={theme}
        onLanguageChange={setLanguage}
        onThemeChange={setTheme}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onNavigate={setCurrentView}
        currentView={currentView}
        unreadNotificationsCount={unreadNotifsCount}
        onOpenNotifications={() => setNotificationsOpen(true)}
      />

      {/* 3. Main Views */}
      <div className="flex-1">
        {currentView === 'website' && (
          <PublicWebsite
            language={language}
            user={user}
            onOpenAuth={handleOpenAuth}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'apk_download' && (
          <ApkDownloadPage
            language={language}
            onBack={() => setCurrentView('website')}
          />
        )}

        {currentView === 'dashboard' && user && user.role === 'admin' && (
          <AdminDashboard
            language={language}
            user={user}
            onOpenStatementModal={handleOpenStatement}
            onOpenSlipModal={handleOpenSlip}
          />
        )}

        {currentView === 'dashboard' && user && user.role === 'supplier' && (
          <SupplierDashboard
            language={language}
            user={user}
            onOpenStatementModal={handleOpenStatement}
            onOpenSlipModal={handleOpenSlip}
          />
        )}

        {/* Fallback if user is guest on dashboard */}
        {currentView === 'dashboard' && !user && (
          <div className="py-24 text-center px-4 max-w-md mx-auto space-y-4">
            <h2 className="text-xl font-bold">कृपया डॅशबोर्ड पाहण्यासाठी लॉगिन करा.</h2>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => handleOpenAuth('supplier_login')}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs"
              >
                उत्पादक लॉगिन
              </button>
              <button
                onClick={() => handleOpenAuth('admin_login')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs"
              >
                प्रशासक लॉगिन
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Modals and Overlays */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        language={language}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <PdfStatementModal
        isOpen={statementModalOpen}
        supplierId={statementSupplierId}
        language={language}
        onClose={() => {
          setStatementModalOpen(false);
          setStatementSupplierId(null);
        }}
      />

      <ThermalSlipModal
        isOpen={slipModalOpen}
        collection={slipCollection}
        onClose={() => {
          setSlipModalOpen(false);
          setSlipCollection(null);
        }}
      />

      <NotificationDrawer
        isOpen={notificationsOpen}
        notifications={notifications}
        language={language}
        onClose={() => setNotificationsOpen(false)}
        onRefresh={loadUserAndNotifs}
      />

    </div>
  );
}
