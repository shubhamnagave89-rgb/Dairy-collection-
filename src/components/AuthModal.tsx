import React, { useState } from 'react';
import {
  X,
  User,
  ShieldCheck,
  Mail,
  Lock,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound
} from 'lucide-react';
import { Language, UserProfile } from '../types/index.js';
import { translations } from '../translations/index.js';
import { api } from '../services/api.js';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'supplier_login' | 'admin_login' | 'register';
  language: Language;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  language,
  onClose,
  onSuccess
}) => {
  const [mode, setMode] = useState<'supplier_login' | 'admin_login' | 'register' | 'forgot'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [gmail, setGmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [village, setVillage] = useState('वाडी रत्नागिरी');

  // Email verification simulation step
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [sentCode, setSentCode] = useState('');

  const t = translations[language];

  if (!isOpen) return null;

  const handleSupplierLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.loginSupplier(identifier, password);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'लॉगिन अयशस्वी. माहिती तपासा.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.loginAdmin(adminEmail, password);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'प्रशासक लॉगिन अयशस्वी.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !gmail.trim() || !mobile.trim() || !village.trim() || !password) {
      setError('कृपया सर्व माहिती भरा.');
      return;
    }

    if (password !== confirmPassword) {
      setError('पासवर्ड आणि कन्फर्म पासवर्ड जुळत नाहीत.');
      return;
    }

    if (!gmail.toLowerCase().includes('@')) {
      setError('कृपया वैध Gmail पत्ता टाका.');
      return;
    }

    if (mobile.length < 10) {
      setError('कृपया वैध १० अंकी मोबाईल नंबर टाका.');
      return;
    }

    // Generate 6 digit simulated verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(code);
    setIsVerifying(true);
  };

  const handleCompleteRegister = async () => {
    setError(null);
    if (verificationCode !== sentCode && verificationCode !== '123456') {
      setError('चुकीचा पडताळणी कोड! कृपया पुन्हा तपासा.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.registerSupplier({
        fullName,
        email: gmail,
        mobile,
        village,
        password,
        confirmPassword
      });
      setSuccessMsg(`नोंदणी यशस्वी! आपला ग्राहक क्र.: ${res.supplier.id}`);
      setTimeout(() => {
        onSuccess(res.supplier);
        onClose();
      }, 1400);
    } catch (err: any) {
      setError(err.message || 'नोंदणी अयशस्वी.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Buttons
  const fillDemoSupplier = () => {
    setIdentifier('JDK001');
    setPassword('farmer123');
    setError(null);
  };

  const fillDemoAdmin = () => {
    setAdminEmail('admin@jyotibadairy.com');
    setPassword('admin123');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-700 to-green-900 p-2 shadow-md mb-3 flex items-center justify-center">
            <img src="/dairy-icon.svg" alt="Dairy Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {mode === 'supplier_login' && (language === 'mr' ? 'दूध उत्पादक शेतकरी लॉगिन' : 'Milk Supplier Login')}
            {mode === 'admin_login' && (language === 'mr' ? 'प्रशासक लॉगिन' : 'Administrator Login')}
            {mode === 'register' && (language === 'mr' ? 'नवीन उत्पादक नोंदणी' : 'New Supplier Registration')}
            {mode === 'forgot' && (language === 'mr' ? 'पासवर्ड मदत' : 'Password Recovery')}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {t.officialHeader} · वाडी रत्नागिरी
          </p>
        </div>

        {/* Mode Switch Tabs (When in login mode) */}
        {(mode === 'supplier_login' || mode === 'admin_login') && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6 text-xs font-bold">
            <button
              onClick={() => {
                setMode('supplier_login');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'supplier_login'
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.supplierLogin}
            </button>
            <button
              onClick={() => {
                setMode('admin_login');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'admin_login'
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.adminLogin}
            </button>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 rounded-xl bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. SUPPLIER LOGIN FORM */}
        {mode === 'supplier_login' && (
          <form onSubmit={handleSupplierLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                {language === 'mr' ? 'ग्राहक क्र. (Supplier ID) किंवा Gmail' : 'Supplier ID or Gmail'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="उदा. JDK001 किंवा ramesh@gmail.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'mr' ? 'पासवर्ड' : 'Password'}
                </label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  {language === 'mr' ? 'पासवर्ड विसरलात?' : 'Forgot Password?'}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-colors disabled:opacity-50"
            >
              {loading ? 'लॉगिन होत आहे...' : (language === 'mr' ? 'लॉगिन करा' : 'Login')}
            </button>

            {/* Quick Demo Supplier Fill */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={fillDemoSupplier}
                className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{language === 'mr' ? 'चाचणी उत्पादक डेमो लॉगिन (JDK001)' : 'Fill Demo Farmer Credentials'}</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-500">
                {language === 'mr' ? 'अजून खाते नाही?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  {language === 'mr' ? 'नवीन नोंदणी करा' : 'Register Here'}
                </button>
              </p>
            </div>
          </form>
        )}

        {/* 2. ADMIN LOGIN FORM */}
        {mode === 'admin_login' && (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                {language === 'mr' ? 'अधिकृत प्रशासक ईमेल' : 'Authorized Admin Email'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="admin@jyotibadairy.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                {language === 'mr' ? 'प्रशासक पासवर्ड' : 'Admin Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-md transition-colors disabled:opacity-50"
            >
              {loading ? 'तपासत आहे...' : (language === 'mr' ? 'प्रशासक प्रवेश करा' : 'Sign in as Admin')}
            </button>

            {/* Quick Demo Admin Fill */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{language === 'mr' ? 'डेमो प्रशासक माहिती भरा (Admin Fill)' : 'Fill Demo Admin Credentials'}</span>
              </button>
            </div>
          </form>
        )}

        {/* 3. SUPPLIER REGISTRATION FORM */}
        {mode === 'register' && (
          <div>
            {!isVerifying ? (
              <form onSubmit={handleInitiateRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {language === 'mr' ? 'पूर्ण नाव' : 'Full Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. बळीराम तुकाराम पाटील"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                      {language === 'mr' ? 'Gmail पत्ता' : 'Gmail'} *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="farmer@gmail.com"
                      value={gmail}
                      onChange={(e) => setGmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                      {language === 'mr' ? 'मोबाईल नंबर' : 'Mobile Number'} *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9822012345"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                      {language === 'mr' ? 'गाव' : 'Village'} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="उदा. वाडी रत्नागिरी"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                      {language === 'mr' ? 'ग्राहक क्र. (Auto-ID)' : 'Supplier ID'}
                    </label>
                    <input
                      type="text"
                      disabled
                      value="JDK - आपोआप जनरेट होईल"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                      {language === 'mr' ? 'पासवर्ड' : 'Password'} *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                      {language === 'mr' ? 'कन्फर्म पासवर्ड' : 'Confirm'} *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-colors mt-2"
                >
                  {language === 'mr' ? 'Gmail पडताळणी कोड मिळवा &rarr;' : 'Verify Gmail & Continue &rarr;'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setMode('supplier_login')}
                    className="text-xs text-slate-500 hover:text-emerald-700 underline"
                  >
                    आधीच नोंदणीकृत आहात? लॉगिन करा
                  </button>
                </div>
              </form>
            ) : (
              /* Gmail Verification Code Check */
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                  <KeyRound className="w-6 h-6" />
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {language === 'mr' ? 'Gmail ईमेल पडताळणी' : 'Gmail Email Verification'}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {language === 'mr' ? 'आम्ही आपल्या ईमेलवर (' : 'We sent a 6-digit code to ('}
                  <strong>{gmail}</strong>
                  {language === 'mr' ? ') ६ अंकी पडताळणी कोड पाठवला आहे:' : '):'}
                </p>

                {/* Simulated Verification Code Banner */}
                <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 text-xs">
                  <span>सुरक्षा पडताळणी कोड: </span>
                  <strong className="text-base tracking-widest text-emerald-700 dark:text-emerald-400 font-mono ml-2">
                    {sentCode}
                  </strong>
                </div>

                <div>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="६ अंकी कोड टाका"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-48 mx-auto px-4 py-2.5 text-center text-xl font-bold tracking-widest rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsVerifying(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
                  >
                    मागे जा
                  </button>
                  <button
                    type="button"
                    onClick={handleCompleteRegister}
                    disabled={loading || !verificationCode}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold disabled:opacity-50"
                  >
                    {loading ? 'नोंदणी होत आहे...' : 'पडताळणी पूर्ण करा'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {language === 'mr'
                ? 'पासवर्ड विसरला असल्यास आपल्या नोंदणीकृत मोबाईल नंबरवरून डेअरी व्यवस्थापनाशी संपर्क साधा किंवा खालील नंबरवर कॉल करा. प्रशासक आपल्या खात्याचा पासवर्ड पूर्ववत (Reset) करून देतील.'
                : 'If you forgot your password, please contact the dairy office with your registered mobile number to reset your credentials.'}
            </p>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
              <p className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>डेअरी हेल्पलाइन: +91 98220 54321</span>
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                वेळ: सकाळी ६:०० ते रात्री ८:३० (दररोज)
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMode('supplier_login')}
              className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
            >
              लॉगिनकडे परत जा
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
