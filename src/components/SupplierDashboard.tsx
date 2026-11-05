import React, { useState, useEffect } from 'react';
import {
  Milk,
  Receipt,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  ChevronRight,
  PieChart,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import {
  Language,
  UserProfile,
  MilkCollectionItem,
  PaymentItem,
  SupplierFinancials
} from '../types/index.js';
import { translations } from '../translations/index.js';
import { api } from '../services/api.js';

interface SupplierDashboardProps {
  language: Language;
  user: UserProfile;
  onOpenStatementModal: (supplierId: string) => void;
  onOpenSlipModal: (collection: MilkCollectionItem) => void;
}

export const SupplierDashboard: React.FC<SupplierDashboardProps> = ({
  language,
  user,
  onOpenStatementModal,
  onOpenSlipModal
}) => {
  const t = translations[language];

  const [loading, setLoading] = useState(true);
  const [financials, setFinancials] = useState<SupplierFinancials | null>(null);
  const [collections, setCollections] = useState<MilkCollectionItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  
  // Filter state
  const [filterMode, setFilterMode] = useState<
    'all' | 'today' | 'yesterday' | 'last7' | 'currentMonth' | 'prevMonth' | 'custom'
  >('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Active view tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'payments'>('dashboard');

  const loadSupplierData = async () => {
    setLoading(true);
    try {
      const [supRes, colRes, payRes] = await Promise.all([
        api.getSupplier(user.id),
        api.getCollections(),
        api.getPayments()
      ]);

      setFinancials(supRes.financials);
      setCollections(colRes.collections);
      setPayments(payRes.payments);
    } catch (err) {
      console.error('Failed to load supplier data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupplierData();
  }, [user.id]);

  // Date filtering logic
  const todayStr = new Date().toISOString().split('T')[0];
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterdayStr = d.toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM
  
  const dPrev = new Date();
  dPrev.setMonth(dPrev.getMonth() - 1);
  const prevMonthStr = dPrev.toISOString().substring(0, 7);

  const filteredCollections = collections.filter((c) => {
    if (filterMode === 'today') return c.date === todayStr;
    if (filterMode === 'yesterday') return c.date === yesterdayStr;
    if (filterMode === 'last7') {
      const target = new Date();
      target.setDate(target.getDate() - 7);
      return c.date >= target.toISOString().split('T')[0];
    }
    if (filterMode === 'currentMonth') return c.date.startsWith(currentMonthStr);
    if (filterMode === 'prevMonth') return c.date.startsWith(prevMonthStr);
    if (filterMode === 'custom' && customStart && customEnd) {
      return c.date >= customStart && c.date <= customEnd;
    }
    return true;
  });

  // Today's summary
  const todayItems = collections.filter((c) => c.date === todayStr);
  const todayQty = todayItems.reduce((s, c) => s + c.quantity, 0);
  const todayAmount = todayItems.reduce((s, c) => s + c.totalAmount, 0);

  // Month summary
  const monthItems = collections.filter((c) => c.date.startsWith(currentMonthStr));
  const monthQty = monthItems.reduce((s, c) => s + c.quantity, 0);
  const monthAmount = monthItems.reduce((s, c) => s + c.totalAmount, 0);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 pb-16 text-slate-800 dark:text-slate-100">
      
      {/* Header Banner */}
      <section className="bg-emerald-900 text-white pt-6 pb-12 px-4 sm:px-6 lg:px-8 border-b border-emerald-800">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-emerald-800/80">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800 text-emerald-200 text-xs font-semibold mb-2">
                <span>दूध उत्पादक शेतकरी खाते (Farmer Portal)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {language === 'mr' ? 'नमस्कार,' : 'Welcome,'} {user.fullName}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-200 mt-1 flex flex-wrap items-center gap-2">
                <span><strong>ग्राहक क्र.:</strong> {user.id}</span>
                <span>·</span>
                <span><strong>गाव:</strong> {user.village || 'वाडी रत्नागिरी'}</span>
                <span>·</span>
                <span>{t.officialHeader}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenStatementModal(user.id)}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs flex items-center gap-2 shadow-md transition-transform hover:-translate-y-0.5"
              >
                <FileText className="w-4 h-4" />
                <span>{language === 'mr' ? 'माझे बिल पत्रक (PDF)' : 'Download Bill (PDF)'}</span>
              </button>

              <button
                onClick={loadSupplierData}
                className="p-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Key Summary Cards */}
          {financials && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-6 text-slate-900">
              
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl shadow-xs border border-emerald-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t.todayCollection}
                </p>
                <p className="text-xl font-black text-emerald-950 dark:text-white mt-0.5">
                  {todayQty.toFixed(1)} <span className="text-xs font-normal text-slate-500">L</span>
                </p>
                <span className="text-[10px] text-emerald-600 font-semibold">₹{todayAmount.toFixed(2)}</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl shadow-xs border border-emerald-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  चालू महिना दूध
                </p>
                <p className="text-xl font-black text-emerald-950 dark:text-white mt-0.5">
                  {monthQty.toFixed(1)} <span className="text-xs font-normal text-slate-500">L</span>
                </p>
                <span className="text-[10px] text-slate-400">एकूण लिटर</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl shadow-xs border border-emerald-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t.cowMilk} / {t.buffaloMilk}
                </p>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-1">
                  🐄 {financials.cowQuantity}L / 🐃 {financials.buffaloQuantity}L
                </p>
                <span className="text-[10px] text-slate-400">दूध प्रकार वाटप</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl shadow-xs border border-emerald-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t.avgFat} / {t.avgSnf}
                </p>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {financials.avgFat.toFixed(1)} / {financials.avgSNF.toFixed(1)}
                </p>
                <span className="text-[10px] text-slate-400">गुणवत्ता सरासरी</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl shadow-xs border border-emerald-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t.totalPayable}
                </p>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  ₹{financials.totalCollectionAmount.toFixed(0)}
                </p>
                <span className="text-[10px] text-slate-400">एकूण बिल</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl shadow-xs border border-emerald-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t.remainingBalance}
                </p>
                <p className="text-xl font-black text-red-600 dark:text-red-400 mt-0.5">
                  ₹{financials.remainingBalance.toFixed(0)}
                </p>
                <span className="text-[10px] text-red-500 font-semibold">शिल्लक रक्कम</span>
              </div>

            </div>
          )}

        </div>
      </section>

      {/* Safety Notice: Strict read-only notice */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {language === 'mr'
                ? 'सुरक्षा नियम: दूध संकलन नोंदी केवळ अधिकृत डेअरी प्रशासक करू शकतात. उत्पादकांना स्वतःचे संपूर्ण रेकॉर्ड पाहण्याची व बिल डाउनलोड करण्याची सुविधा आहे.'
                : 'Security Rule: Collection entries are authoritative and made by Admin only. Suppliers have real-time read and statement download access.'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
            }`}
          >
            {t.tabMyDashboard}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
            }`}
          >
            {t.tabMyHistory} ({collections.length})
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'payments'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
            }`}
          >
            {t.tabMyPayments} ({payments.length})
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        
        {/* ========================================================= */}
        {/* 1. VISUAL CHARTS & METRICS                                */}
        {/* ========================================================= */}
        {activeTab === 'dashboard' && (
          <div className="grid md:grid-cols-12 gap-6">
            
            {/* Recent Daily Trend Bar Visualizer */}
            <div className="md:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  <span>दैनिक दूध पुरवठा आलेख (Daily Supply Trend)</span>
                </h3>
                <span className="text-xs text-slate-500">मागील संकलन नोंदी</span>
              </div>

              {collections.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  अद्याप दूध संकलन नोंद झालेली नाही.
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {collections.slice(0, 7).map((c) => {
                    const pct = Math.min(100, Math.round((c.quantity / 20) * 100));
                    return (
                      <div key={c.id} className="space-y-1 text-xs">
                        <div className="flex justify-between font-bold">
                          <span>
                            {c.date} ({c.shift === 'morning' ? 'सकाळ' : 'संध्याकाळ'}) -{' '}
                            <span className="text-slate-500 font-normal">{c.milkType === 'cow' ? 'गाय' : 'म्हैस'}</span>
                          </span>
                          <span className="text-emerald-700 dark:text-emerald-400">
                            {c.quantity} Ltr · ₹{c.totalAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              c.milkType === 'cow' ? 'bg-emerald-500' : 'bg-green-600'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>फॅट: {c.fat}% · SNF: {c.snf}%</span>
                          <span>दर: ₹{c.appliedRate.toFixed(2)}/ली ({c.pricingMode === 'automatic' ? 'चार्ट' : 'मॅन्युअल'})</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Balance Breakdown Card */}
            <div className="md:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
              <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  हिशोब ताळेबंद (Account Summary)
                </h3>
              </div>

              {financials && (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400">एकूण संकलन बिल</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      ₹{financials.totalCollectionAmount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200">
                    <span>एकूण अदा केलेले (जमा)</span>
                    <span className="font-extrabold">
                      ₹{financials.totalPaidAmount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 border border-red-200 dark:border-red-900">
                    <span className="font-bold">शिल्लक येणे रक्कम</span>
                    <span className="font-black text-base">
                      ₹{financials.remainingBalance.toFixed(2)}
                    </span>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => onOpenStatementModal(user.id)}
                      className="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>अधिकृत मराठी बिल पत्रक डाऊनलोड</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* 2. COLLECTION HISTORY WITH COMPREHENSIVE FILTERS         */}
        {/* ========================================================= */}
        {(activeTab === 'history' || activeTab === 'dashboard') && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {t.tabMyHistory} ({filteredCollections.length} नोंदी)
                </h3>
                <p className="text-xs text-slate-500">
                  तारीख, सत्र, दूध प्रकार, फॅट, SNF व दर तपशील
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    filterMode === 'all'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  सर्व
                </button>
                <button
                  onClick={() => setFilterMode('today')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    filterMode === 'today'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  आज
                </button>
                <button
                  onClick={() => setFilterMode('yesterday')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    filterMode === 'yesterday'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  काल
                </button>
                <button
                  onClick={() => setFilterMode('last7')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    filterMode === 'last7'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  ७ दिवस
                </button>
                <button
                  onClick={() => setFilterMode('currentMonth')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    filterMode === 'currentMonth'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  चालू महिना
                </button>
              </div>
            </div>

            {/* Collections Table */}
            {filteredCollections.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                निवडलेल्या कालावधीत कोणतीही दूध संकलन नोंद नाही.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-300">
                      <th className="py-2.5 px-3">तारीख</th>
                      <th className="py-2.5 px-3">सत्र</th>
                      <th className="py-2.5 px-3">प्रकार</th>
                      <th className="py-2.5 px-3">लिटर</th>
                      <th className="py-2.5 px-3">फॅट (%)</th>
                      <th className="py-2.5 px-3">SNF (%)</th>
                      <th className="py-2.5 px-3">दर (₹/ली)</th>
                      <th className="py-2.5 px-3">एकूण रक्कम</th>
                      <th className="py-2.5 px-3 text-right">पावती</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredCollections.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">
                          {c.date}
                        </td>
                        <td className="py-2.5 px-3 font-semibold">
                          {c.shift === 'morning' ? 'सकाळ' : 'संध्याकाळ'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            c.milkType === 'cow' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-800'
                          }`}>
                            {c.milkType === 'cow' ? 'गाय' : 'म्हैस'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white">
                          {c.quantity.toFixed(1)} L
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">
                          {c.fat.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">
                          {c.snf.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 font-bold text-emerald-800 dark:text-emerald-300">
                          ₹{c.appliedRate.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-black text-emerald-700 dark:text-emerald-400">
                          ₹{c.totalAmount.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => onOpenSlipModal(c)}
                            className="p-1 text-slate-400 hover:text-emerald-700"
                            title="पावती पहा"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

        {/* ========================================================= */}
        {/* 3. PAYMENTS LIST                                          */}
        {/* ========================================================= */}
        {activeTab === 'payments' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                पेमेंट इतिहास (Received Payments)
              </h3>
              <p className="text-xs text-slate-500">
                डेअरीकडून बँक खात्यात, UPI किंवा रोख स्वरूपात जमा झालेल्या रकमांची यादी
              </p>
            </div>

            {payments.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                कोणतेही पेमेंट व्यवहार सापडले नाहीत.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-300">
                      <th className="py-2.5 px-3">तारीख</th>
                      <th className="py-2.5 px-3">रक्कम (₹)</th>
                      <th className="py-2.5 px-3">पद्धत</th>
                      <th className="py-2.5 px-3">व्यवहार संदर्भ क्र.</th>
                      <th className="py-2.5 px-3">शेरा / नोंद</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-medium text-slate-600 dark:text-slate-400">
                          {p.paymentDate}
                        </td>
                        <td className="py-2.5 px-3 font-black text-emerald-700 dark:text-emerald-400 text-sm">
                          ₹{p.amount.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-bold uppercase text-slate-700 dark:text-slate-300">
                          {p.paymentMethod}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">
                          {p.transactionRef || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                          {p.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

    </div>
  );
};
