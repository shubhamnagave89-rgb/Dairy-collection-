import React, { useState, useEffect } from 'react';
import {
  Milk,
  Users,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  Settings,
  ShieldAlert,
  Search,
  Plus,
  Trash2,
  Edit2,
  Printer,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  ArrowUpRight,
  Filter,
  DollarSign,
  ChevronRight,
  Save,
  Check
} from 'lucide-react';
import {
  Language,
  UserProfile,
  MilkCollectionItem,
  PaymentItem,
  RateChartConfig,
  DairySettings,
  AuditLogItem
} from '../types/index.js';
import { translations } from '../translations/index.js';
import { api } from '../services/api.js';

interface AdminDashboardProps {
  language: Language;
  user: UserProfile;
  onOpenStatementModal: (supplierId: string) => void;
  onOpenSlipModal: (collection: MilkCollectionItem) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  language,
  user,
  onOpenStatementModal,
  onOpenSlipModal
}) => {
  const t = translations[language];

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<
    'collection' | 'suppliers' | 'rates' | 'payments' | 'reports' | 'settings' | 'audit'
  >('collection');

  // Dashboard Overview Metrics
  const [summary, setSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Common Data states
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [todayCollections, setTodayCollections] = useState<MilkCollectionItem[]>([]);
  const [rateCharts, setRateCharts] = useState<{ cow: RateChartConfig[]; buffalo: RateChartConfig[] } | null>(null);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [dairySettings, setDairySettings] = useState<DairySettings | null>(null);

  // Feedback notifications
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // ----------------------------------------
  // FETCH INITIAL DATA
  // ----------------------------------------
  const loadDashboardData = async () => {
    setLoadingSummary(true);
    try {
      const [sumRes, supRes, colRes, rateRes, payRes, setRes, logRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getSuppliers(),
        api.getCollections({ date: new Date().toISOString().split('T')[0] }),
        api.getRates(),
        api.getPayments(),
        api.getSettings(),
        api.getAuditLogs()
      ]);

      setSummary(sumRes);
      setSuppliers(supRes.suppliers);
      setTodayCollections(colRes.collections);
      setRateCharts(rateRes);
      setPayments(payRes.payments);
      setDairySettings(setRes.settings);
      setAuditLogs(logRes.logs);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      showAlert('error', 'माहिती लोड करताना अडचण आली.');
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // ========================================
  // 1. MILK COLLECTION ENTRY TAB STATE
  // ========================================
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryShift, setEntryShift] = useState<'morning' | 'evening'>(
    new Date().getHours() < 14 ? 'morning' : 'evening'
  );
  const [entryMilkType, setEntryMilkType] = useState<'cow' | 'buffalo'>('cow');
  const [entryQty, setEntryQty] = useState<string>('');
  const [entryFat, setEntryFat] = useState<string>('3.8');
  const [entrySnf, setEntrySnf] = useState<string>('8.5');
  const [pricingMode, setPricingMode] = useState<'automatic' | 'manual'>('automatic');
  const [manualRateInput, setManualRateInput] = useState<string>('38.00');
  const [calculatedRate, setCalculatedRate] = useState<number>(37.85);
  const [rateDetailsText, setRateDetailsText] = useState<string>('');
  const [rateChartVersion, setRateChartVersion] = useState<string>('');
  const [savingCollection, setSavingCollection] = useState(false);

  // Recalculate auto rate whenever milkType, fat, or snf change
  useEffect(() => {
    const fatVal = parseFloat(entryFat) || 0;
    const snfVal = parseFloat(entrySnf) || 0;
    if (pricingMode === 'automatic' && fatVal > 0 && snfVal > 0) {
      api.calculateRate(entryMilkType, fatVal, snfVal)
        .then((res) => {
          setCalculatedRate(res.rate);
          setRateDetailsText(res.details);
          setRateChartVersion(res.chartVersion);
        })
        .catch(() => {});
    }
  }, [entryMilkType, entryFat, entrySnf, pricingMode]);

  const effectiveRate = pricingMode === 'manual' ? parseFloat(manualRateInput) || 0 : calculatedRate;
  const quantityNum = parseFloat(entryQty) || 0;
  const entryTotalAmount = Math.round(quantityNum * effectiveRate * 100) / 100;

  // Filter suppliers for quick select
  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return false;
    return (
      s.id.toLowerCase().includes(q) ||
      s.fullName.toLowerCase().includes(q) ||
      s.mobile.includes(q) ||
      s.village.toLowerCase().includes(q)
    );
  });

  const handleSelectSupplier = (s: any) => {
    setSelectedSupplier(s);
    setSearchQuery('');
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) {
      showAlert('error', 'कृपया प्रथम उत्पादक (Supplier) निवडा.');
      return;
    }
    if (!quantityNum || quantityNum <= 0) {
      showAlert('error', 'कृपया वैध दूध प्रमाण (Quantity in Litres) टाका.');
      return;
    }

    setSavingCollection(true);
    try {
      const res = await api.addCollection({
        supplierId: selectedSupplier.id,
        date: entryDate,
        shift: entryShift,
        milkType: entryMilkType,
        quantity: quantityNum,
        fat: parseFloat(entryFat) || 0,
        snf: parseFloat(entrySnf) || 0,
        pricingMode,
        manualRate: pricingMode === 'manual' ? parseFloat(manualRateInput) : undefined,
        notes: `${entryShift === 'morning' ? 'सकाळ' : 'संध्याकाळ'} संकलन`
      });

      showAlert('success', `दूध नोंद यशस्वी! एकूण रक्कम: ₹${res.collection.totalAmount.toFixed(2)}`);
      
      // Add to today's table
      setTodayCollections((prev) => [res.collection, ...prev]);

      // Offer slip
      onOpenSlipModal(res.collection);

      // Reset form
      setEntryQty('');
      // Keep selected supplier or clear for next
      setSelectedSupplier(null);
      
      // Refresh dashboard summary
      api.getDashboardSummary().then(setSummary);
    } catch (err: any) {
      showAlert('error', err.message || 'नोंद साठवताना अडचण आली.');
    } finally {
      setSavingCollection(false);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!confirm('ही दूध संकलन नोंद नक्की वगळायची आहे का?')) return;
    try {
      await api.deleteCollection(id);
      setTodayCollections((prev) => prev.filter((c) => c.id !== id));
      showAlert('success', 'नोंद वगळली.');
      api.getDashboardSummary().then(setSummary);
    } catch (err: any) {
      showAlert('error', err.message || 'वगळताना त्रुटी.');
    }
  };

  // ========================================
  // 2. SUPPLIER MANAGEMENT STATE
  // ========================================
  const [supSearch, setSupSearch] = useState('');
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupMobile, setNewSupMobile] = useState('');
  const [newSupVillage, setNewSupVillage] = useState('वाडी रत्नागिरी');
  const [newSupEmail, setNewSupEmail] = useState('');
  const [newSupBank, setNewSupBank] = useState('');
  const [newSupAcc, setNewSupAcc] = useState('');
  const [newSupIfsc, setNewSupIfsc] = useState('');

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.addSupplier({
        fullName: newSupName,
        mobile: newSupMobile,
        village: newSupVillage,
        email: newSupEmail || `${newSupMobile}@jyotibadairy.com`,
        bankDetails: newSupBank ? { bankName: newSupBank, accountNumber: newSupAcc, ifsc: newSupIfsc } : undefined
      });
      showAlert('success', `नवीन उत्पादक जोडला: ${res.supplier.fullName} (ID: ${res.supplier.id})`);
      setShowAddSupplierModal(false);
      // reload
      const up = await api.getSuppliers();
      setSuppliers(up.suppliers);
      setNewSupName('');
      setNewSupMobile('');
    } catch (err: any) {
      showAlert('error', err.message || 'उत्पादक जोडता आला नाही.');
    }
  };

  // ========================================
  // 3. RATE CHART MANAGEMENT STATE
  // ========================================
  const [activeRateTab, setActiveRateTab] = useState<'cow' | 'buffalo'>('cow');
  const [chartEditBaseRate, setChartEditBaseRate] = useState<number>(36.5);
  const [chartEditFatStep, setChartEditFatStep] = useState<number>(0.35);
  const [chartEditSnfStep, setChartEditSnfStep] = useState<number>(0.25);
  const [chartEditVersion, setChartEditVersion] = useState<string>('COW-CHART-2026-V2');
  const [savingChart, setSavingChart] = useState(false);

  useEffect(() => {
    if (rateCharts) {
      const current = activeRateTab === 'cow' ? rateCharts.cow[0] : rateCharts.buffalo[0];
      if (current) {
        setChartEditBaseRate(current.baseRate);
        setChartEditFatStep(current.fatStep);
        setChartEditSnfStep(current.snfStep);
        setChartEditVersion(current.version);
      }
    }
  }, [activeRateTab, rateCharts]);

  const handleSaveRateChart = async () => {
    setSavingChart(true);
    try {
      const baseObj = activeRateTab === 'cow' ? rateCharts!.cow[0] : rateCharts!.buffalo[0];
      const updated: RateChartConfig = {
        ...baseObj,
        baseRate: chartEditBaseRate,
        fatStep: chartEditFatStep,
        snfStep: chartEditSnfStep,
        version: chartEditVersion,
        effectiveDate: new Date().toISOString().split('T')[0]
      };
      await api.updateRateChart(activeRateTab, updated);
      showAlert('success', `${activeRateTab === 'cow' ? 'गाय' : 'म्हैस'} दूध दर पत्रक अद्ययावत केले.`);
      const ratesRes = await api.getRates();
      setRateCharts(ratesRes);
    } catch (err: any) {
      showAlert('error', err.message || 'दर पत्रक साठवता आले नाही.');
    } finally {
      setSavingChart(false);
    }
  };

  // ========================================
  // 4. PAYMENT MANAGEMENT STATE
  // ========================================
  const [paySupplierId, setPaySupplierId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'cheque'>('upi');
  const [payRef, setPayRef] = useState('');
  const [payIsAdvance, setPayIsAdvance] = useState(false);
  const [payNotes, setPayNotes] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);

  const selectedPaySupplier = suppliers.find((s) => s.id === paySupplierId);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paySupplierId || !payAmount) {
      showAlert('error', 'कृपया उत्पादक व रक्कम भरा.');
      return;
    }

    setRecordingPayment(true);
    try {
      const res = await api.addPayment({
        supplierId: paySupplierId,
        amount: parseFloat(payAmount),
        paymentDate: payDate,
        paymentMethod: payMethod,
        transactionRef: payRef,
        isAdvance: payIsAdvance,
        notes: payNotes || 'दूध बिल वाटप'
      });

      showAlert('success', `पेमेंट यशस्वीरीत्या नोंदवले: ₹${res.payment.amount.toFixed(2)}`);
      setPayments((prev) => [res.payment, ...prev]);
      setPayAmount('');
      setPayRef('');
      // reload suppliers for balance updates
      const up = await api.getSuppliers();
      setSuppliers(up.suppliers);
      api.getDashboardSummary().then(setSummary);
    } catch (err: any) {
      showAlert('error', err.message || 'पेमेंट नोंदवताना त्रुटी.');
    } finally {
      setRecordingPayment(false);
    }
  };

  // ========================================
  // 5. DATABASE BACKUP / RESTORE
  // ========================================
  const handleExportBackup = () => {
    window.open('/api/backup/export', '_blank');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await api.restoreDatabase(json);
        showAlert('success', 'डेटाबेस यशस्वीरीत्या पूर्ववत (Restore) करण्यात आला.');
        loadDashboardData();
      } catch {
        showAlert('error', 'अवैध JSON बॅकअप फाईल.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 pb-16 text-slate-800 dark:text-slate-100">
      
      {/* Top Banner / Summary Strip */}
      <section className="bg-emerald-900 text-white pt-6 pb-12 px-4 sm:px-6 lg:px-8 border-b border-emerald-800">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-emerald-800/80">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-800 text-emerald-200 text-xs font-semibold mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{language === 'mr' ? 'अधिकृत प्रशासक पॅनेल' : 'Authorized Admin Console'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {t.officialHeader}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-200 mt-0.5">
                {dairySettings?.village || 'वाडी रत्नागिरी, कोल्हापूर'} · {language === 'mr' ? 'प्रशासक:' : 'Admin:'} {user.fullName}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadDashboardData}
                disabled={loadingSummary}
                className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingSummary ? 'animate-spin' : ''}`} />
                <span>{t.refresh}</span>
              </button>

              <button
                onClick={handleExportBackup}
                className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{language === 'mr' ? 'डेटा बॅकअप' : 'Backup DB'}</span>
              </button>
            </div>
          </div>

          {/* 8 Essential Metrics Cards */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-6 text-slate-900">
              
              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-xs border border-emerald-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                  {t.todayCollection}
                </p>
                <p className="text-lg font-black text-emerald-950 dark:text-white mt-0.5">
                  {summary.today.totalQuantity} <span className="text-[10px] font-normal text-slate-500">L</span>
                </p>
                <span className="text-[10px] text-emerald-600 font-semibold">{summary.today.entryCount} नोंदी</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-xs border border-emerald-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                  {t.cowMilk} (आज)
                </p>
                <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {summary.today.cowQuantity} <span className="text-[10px] font-normal text-slate-500">L</span>
                </p>
                <span className="text-[10px] text-slate-400">गाय संकलन</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-xs border border-emerald-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                  {t.buffaloMilk} (आज)
                </p>
                <p className="text-lg font-black text-green-700 dark:text-green-400 mt-0.5">
                  {summary.today.buffaloQuantity} <span className="text-[10px] font-normal text-slate-500">L</span>
                </p>
                <span className="text-[10px] text-slate-400">म्हैस संकलन</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-xs border border-emerald-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                  आजची रक्कम
                </p>
                <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  ₹{summary.today.totalAmount.toFixed(0)}
                </p>
                <span className="text-[10px] text-slate-400">देय बिल</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-xs border border-emerald-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                  {t.monthlyCollection}
                </p>
                <p className="text-lg font-black text-emerald-950 dark:text-white mt-0.5">
                  {summary.monthly.totalQuantity} <span className="text-[10px] font-normal text-slate-500">L</span>
                </p>
                <span className="text-[10px] text-slate-400">{summary.monthly.monthName}</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-xs border border-emerald-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                  {t.totalPayable}
                </p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  ₹{summary.financials.totalPayable.toFixed(0)}
                </p>
                <span className="text-[10px] text-slate-400">एकूण बिल</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-xs border border-emerald-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                  {t.totalPaid}
                </p>
                <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">
                  ₹{summary.financials.totalPaid.toFixed(0)}
                </p>
                <span className="text-[10px] text-blue-500">अदा केलेले</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-xs border border-emerald-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                  {t.remainingBalance}
                </p>
                <p className="text-lg font-black text-red-600 dark:text-red-400 mt-0.5">
                  ₹{summary.financials.outstandingBalance.toFixed(0)}
                </p>
                <span className="text-[10px] text-red-500">बाकी रक्कम</span>
              </div>

            </div>
          )}

        </div>
      </section>

      {/* Global Toast Alert */}
      {alertMsg && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div
            className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-bold shadow-md ${
              alertMsg.type === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {alertMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{alertMsg.text}</span>
          </div>
        </div>
      )}

      {/* Admin Tab Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-slate-800">
          
          <button
            onClick={() => setActiveTab('collection')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shrink-0 transition-all ${
              activeTab === 'collection'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Milk className="w-4 h-4" />
            <span>{t.tabCollection}</span>
          </button>

          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shrink-0 transition-all ${
              activeTab === 'suppliers'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t.tabSuppliers} ({suppliers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rates')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shrink-0 transition-all ${
              activeTab === 'rates'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{t.tabRates}</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shrink-0 transition-all ${
              activeTab === 'payments'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>{t.tabPayments}</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shrink-0 transition-all ${
              activeTab === 'reports'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t.tabReports}</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shrink-0 transition-all ${
              activeTab === 'audit'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{t.tabAudit}</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shrink-0 transition-all ${
              activeTab === 'settings'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{t.tabSettings}</span>
          </button>

        </div>
      </div>

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* ========================================================= */}
        {/* TAB 1: MILK COLLECTION ENTRY SYSTEM                       */}
        {/* ========================================================= */}
        {activeTab === 'collection' && (
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Collection Entry Form */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-300">
                    <Milk className="w-4 h-4" />
                  </div>
                  <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {language === 'mr' ? 'नवीन दूध संकलन नोंद' : 'Milk Collection Entry'}
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                  Admin Only
                </span>
              </div>

              <form onSubmit={handleSaveCollection} className="space-y-4">
                
                {/* 1. Supplier Search & Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'mr' ? 'उत्पादक शोधा (ID / नाव / मोबाईल)' : 'Search Supplier'} *
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="उदा. JDK001 किंवा रमेश किंवा 9822"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Autocomplete Dropdown list */}
                  {searchQuery && filteredSuppliers.length > 0 && (
                    <div className="mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-20 divide-y divide-slate-100 dark:divide-slate-700">
                      {filteredSuppliers.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => handleSelectSupplier(s)}
                          className="p-2.5 hover:bg-emerald-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center text-xs"
                        >
                          <div>
                            <span className="font-black text-emerald-800 dark:text-emerald-300 mr-2">{s.id}</span>
                            <span className="font-bold text-slate-900 dark:text-white">{s.fullName}</span>
                            <span className="text-[11px] text-slate-500 ml-2">({s.village})</span>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-400">{s.mobile}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected Supplier Badge */}
                  {selectedSupplier ? (
                    <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white font-black text-xs">
                            {selectedSupplier.id}
                          </span>
                          <span className="font-extrabold text-sm text-emerald-950 dark:text-emerald-100">
                            {selectedSupplier.fullName}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                          गाव: {selectedSupplier.village} · मोबाईल: {selectedSupplier.mobile}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedSupplier(null)}
                        className="text-xs text-red-600 hover:underline font-bold px-2 py-1"
                      >
                        बदला
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                      * कृपया वरील शोध पेटीतून उत्पादक निवडा.
                    </p>
                  )}
                </div>

                {/* Date and Shift */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">{language === 'mr' ? 'तारीख' : 'Date'}</label>
                    <input
                      type="date"
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">{t.shift}</label>
                    <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setEntryShift('morning')}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          entryShift === 'morning'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {t.morning}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEntryShift('evening')}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          entryShift === 'evening'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {t.evening}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Milk Type (Cow vs Buffalo) */}
                <div>
                  <label className="block text-xs font-bold mb-1">{t.milkType}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEntryMilkType('cow');
                        if (pricingMode === 'automatic') {
                          setEntryFat('3.8');
                          setEntrySnf('8.5');
                        }
                      }}
                      className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 ${
                        entryMilkType === 'cow'
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      <span>🐄 {t.cowMilk}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEntryMilkType('buffalo');
                        if (pricingMode === 'automatic') {
                          setEntryFat('6.5');
                          setEntrySnf('9.0');
                        }
                      }}
                      className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 ${
                        entryMilkType === 'buffalo'
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      <span>🐃 {t.buffaloMilk}</span>
                    </button>
                  </div>
                </div>

                {/* Milk Quantity (Litres) - Large Input for Fast Entry */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.quantity} (लिटर) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    placeholder="उदा. 12.5"
                    value={entryQty}
                    onChange={(e) => setEntryQty(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-emerald-500/40 focus:border-emerald-600 bg-white dark:bg-slate-800 text-xl font-black text-slate-900 dark:text-white"
                  />
                </div>

                {/* Pricing Mode Toggle: Mode A vs Mode B */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold">{t.pricingMode}:</span>
                    <div className="flex gap-1 p-0.5 bg-slate-200 dark:bg-slate-700 rounded-lg text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setPricingMode('automatic')}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          pricingMode === 'automatic'
                            ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                            : 'text-slate-600'
                        }`}
                      >
                        {t.automaticRate}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPricingMode('manual')}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          pricingMode === 'manual'
                            ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                            : 'text-slate-600'
                        }`}
                      >
                        {t.manualRate}
                      </button>
                    </div>
                  </div>

                  {/* Mode A: Automatic Rate inputs (Fat & SNF) */}
                  {pricingMode === 'automatic' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1">{t.fat} (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={entryFat}
                          onChange={(e) => setEntryFat(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">{t.snf} (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={entrySnf}
                          onChange={(e) => setEntrySnf(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                        />
                      </div>
                      {rateChartVersion && (
                        <div className="col-span-2 text-[10px] text-slate-500">
                          लागू दर पत्रक: <span className="font-mono font-bold">{rateChartVersion}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Mode B: Manual Rate Input */
                    <div>
                      <label className="block text-xs font-semibold mb-1">
                        प्रति लिटर मॅन्युअल दर (₹) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={manualRateInput}
                        onChange={(e) => setManualRateInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                      />
                    </div>
                  )}
                </div>

                {/* Real-time Calculation Summary Display */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/60 dark:to-green-950/60 border border-emerald-300 dark:border-emerald-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                        {t.rate}
                      </p>
                      <p className="text-xl font-black text-slate-900 dark:text-white">
                        ₹{effectiveRate.toFixed(2)}
                        <span className="text-xs font-normal text-slate-500"> /L</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                        {t.totalAmount}
                      </p>
                      <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                        ₹{entryTotalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    सूत्र: {quantityNum || 0} लिटर × ₹{effectiveRate.toFixed(2)} = ₹{entryTotalAmount.toFixed(2)}
                  </p>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={savingCollection || !selectedSupplier || !quantityNum}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingCollection ? 'नोंद साठवत आहे...' : t.saveEntry}</span>
                </button>

              </form>
            </div>

            {/* Right Column: Today's Collection Register Table */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {language === 'mr' ? "आजचे संकलन रजिस्टर" : "Today's Collection Register"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    तारीख: {entryDate} · एकूण नोंदी: {todayCollections.length}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-lg">
                    एकूण: {todayCollections.reduce((s, c) => s + c.quantity, 0).toFixed(1)} L
                  </span>
                </div>
              </div>

              {todayCollections.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Milk className="w-12 h-12 mx-auto opacity-30 text-emerald-600" />
                  <p className="text-sm font-bold">आजच्या तारखेची कोणतीही नोंद सापडली नाही.</p>
                  <p className="text-xs">डाव्या बाजूच्या फॉर्ममधून पहिली नोंद भरा.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                        <th className="py-2.5 px-3">ID / नाव</th>
                        <th className="py-2.5 px-2">सत्र</th>
                        <th className="py-2.5 px-2">प्रकार</th>
                        <th className="py-2.5 px-2">लिटर</th>
                        <th className="py-2.5 px-2">फॅट/SNF</th>
                        <th className="py-2.5 px-2">दर</th>
                        <th className="py-2.5 px-2">रक्कम</th>
                        <th className="py-2.5 px-2 text-right">कृती</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {todayCollections.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-emerald-800 dark:text-emerald-300">{c.supplierId}</span>
                            <div className="text-[11px] font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">
                              {c.supplierName}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 font-medium">
                            {c.shift === 'morning' ? 'सकाळ' : 'संध्या.'}
                          </td>
                          <td className="py-2.5 px-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              c.milkType === 'cow' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-800'
                            }`}>
                              {c.milkType === 'cow' ? 'गाय' : 'म्हैस'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 font-black text-slate-900 dark:text-white">
                            {c.quantity.toFixed(1)}
                          </td>
                          <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400">
                            {c.fat.toFixed(1)} / {c.snf.toFixed(1)}
                          </td>
                          <td className="py-2.5 px-2 font-bold text-slate-700 dark:text-slate-300">
                            ₹{c.appliedRate.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-2 font-black text-emerald-700 dark:text-emerald-400">
                            ₹{c.totalAmount.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-2 text-right space-x-1">
                            <button
                              onClick={() => onOpenSlipModal(c)}
                              className="p-1 text-slate-500 hover:text-emerald-700"
                              title="पावती प्रिंट"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCollection(c.id)}
                              className="p-1 text-slate-400 hover:text-red-600"
                              title="वगळा"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: SUPPLIER MANAGEMENT                                */}
        {/* ========================================================= */}
        {activeTab === 'suppliers' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  {t.tabSuppliers} ({suppliers.length})
                </h2>
                <p className="text-xs text-slate-500">
                  {language === 'mr' ? 'सर्व दूध उत्पादक शेतकरी माहिती, बँक तपशील व हिशोब' : 'All milk suppliers, bank details and ledger'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="नाव / ID शोधा..."
                    value={supSearch}
                    onChange={(e) => setSupSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
                  />
                </div>
                <button
                  onClick={() => setShowAddSupplierModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'mr' ? 'नवीन उत्पादक जोडा' : 'Add Supplier'}</span>
                </button>
              </div>
            </div>

            {/* Suppliers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-300">
                    <th className="py-3 px-3">ग्राहक क्र. (ID)</th>
                    <th className="py-3 px-3">पूर्ण नाव</th>
                    <th className="py-3 px-3">गाव</th>
                    <th className="py-3 px-3">मोबाईल</th>
                    <th className="py-3 px-3">एकूण दूध</th>
                    <th className="py-3 px-3">एकूण बिल</th>
                    <th className="py-3 px-3">जमा</th>
                    <th className="py-3 px-3">शिल्लक रक्कम</th>
                    <th className="py-3 px-3">स्थिती</th>
                    <th className="py-3 px-3 text-right">कृती</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {suppliers
                    .filter((s) => {
                      const q = supSearch.toLowerCase().trim();
                      if (!q) return true;
                      return s.id.toLowerCase().includes(q) || s.fullName.toLowerCase().includes(q) || s.mobile.includes(q);
                    })
                    .map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-mono font-black text-emerald-800 dark:text-emerald-300">
                          {s.id}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          {s.fullName}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {s.village}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-400">
                          {s.mobile}
                        </td>
                        <td className="py-3 px-3 font-bold">
                          {s.financials?.totalQuantity?.toFixed(1) || 0} L
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          ₹{s.financials?.totalCollectionAmount?.toFixed(2) || 0}
                        </td>
                        <td className="py-3 px-3 font-bold text-blue-600 dark:text-blue-400">
                          ₹{s.financials?.totalPaidAmount?.toFixed(2) || 0}
                        </td>
                        <td className="py-3 px-3 font-black text-red-600 dark:text-red-400">
                          ₹{s.financials?.remainingBalance?.toFixed(2) || 0}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {s.status === 'active' ? 'सक्रिय' : 'प्रलंबित'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1">
                          <button
                            onClick={() => onOpenStatementModal(s.id)}
                            className="px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold hover:bg-emerald-100"
                            title="बिल पत्रक डाउनलोड"
                          >
                            बिल पत्रक
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Add Supplier Modal */}
            {showAddSupplierModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-extrabold text-base">नवीन उत्पादक नोंदवा</h3>
                    <button onClick={() => setShowAddSupplierModal(false)}>✕</button>
                  </div>

                  <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold mb-1">पूर्ण नाव *</label>
                      <input
                        type="text"
                        required
                        placeholder="उदा. विठ्ठल सखाराम मोरे"
                        value={newSupName}
                        onChange={(e) => setNewSupName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold mb-1">मोबाईल नंबर *</label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="9822012345"
                          value={newSupMobile}
                          onChange={(e) => setNewSupMobile(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">गाव *</label>
                        <input
                          type="text"
                          required
                          value={newSupVillage}
                          onChange={(e) => setNewSupVillage(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">ईमेल (पर्यायी)</label>
                      <input
                        type="email"
                        placeholder="farmer@gmail.com"
                        value={newSupEmail}
                        onChange={(e) => setNewSupEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                      <p className="font-bold text-slate-700 dark:text-slate-300">बँक तपशील (पेमेंट थेट खात्यात देण्यासाठी)</p>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="बँक नाव"
                          value={newSupBank}
                          onChange={(e) => setNewSupBank(e.target.value)}
                          className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                        <input
                          type="text"
                          placeholder="खाते क्र."
                          value={newSupAcc}
                          onChange={(e) => setNewSupAcc(e.target.value)}
                          className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                        <input
                          type="text"
                          placeholder="IFSC कोड"
                          value={newSupIfsc}
                          onChange={(e) => setNewSupIfsc(e.target.value)}
                          className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs"
                    >
                      उत्पादक साठवा
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: MILK RATE MANAGEMENT (RATE CHARTS)                 */}
        {/* ========================================================= */}
        {activeTab === 'rates' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  {t.tabRates}
                </h2>
                <p className="text-xs text-slate-500">
                  {language === 'mr'
                    ? 'गाय व म्हैस दुधाचे फॅट (Fat) आणि एसएनएफ (SNF) आधारित प्रमाणित दर पत्रक कॉन्फिगरेशन'
                    : 'Configure base rates and steps per 0.1 Fat / SNF for Cow and Buffalo milk'}
                </p>
              </div>

              {/* Cow vs Buffalo Sub-Tab */}
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  onClick={() => setActiveRateTab('cow')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeRateTab === 'cow'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  🐄 {t.cowMilk} पत्रक
                </button>
                <button
                  onClick={() => setActiveRateTab('buffalo')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeRateTab === 'buffalo'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  🐃 {t.buffaloMilk} पत्रक
                </button>
              </div>
            </div>

            {/* Rate Chart Config Form */}
            <div className="grid md:grid-cols-2 gap-6 items-start">
              
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>
                    {activeRateTab === 'cow' ? 'गाय' : 'म्हैस'} दर पत्रक पॅरामीटर्स
                  </span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold mb-1">दर पत्रक आवृत्ती (Version Code) *</label>
                    <input
                      type="text"
                      value={chartEditVersion}
                      onChange={(e) => setChartEditVersion(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1">
                        बेस दर (Base Rate ₹) *
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        value={chartEditBaseRate}
                        onChange={(e) => setChartEditBaseRate(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      />
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {activeRateTab === 'cow' ? '३.५ Fat / ८.५ SNF वर' : '६.० Fat / ९.० SNF वर'}
                      </p>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">
                        प्रति ०.१ Fat फरक दर (₹) *
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        value={chartEditFatStep}
                        onChange={(e) => setChartEditFatStep(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">
                      प्रति ०.१ SNF फरक दर (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={chartEditSnfStep}
                      onChange={(e) => setChartEditSnfStep(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                    />
                  </div>

                  <button
                    onClick={handleSaveRateChart}
                    disabled={savingChart}
                    className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 mt-4"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingChart ? 'साठवत आहे...' : 'दर पत्रक अद्ययावत करा व लागू करा'}</span>
                  </button>
                </div>
              </div>

              {/* Sample Matrix Simulation Grid */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  उदाहरणादाखल दर तक्ता (Sample Rate Matrix)
                </h3>
                <p className="text-[11px] text-slate-500">
                  नवीन बदल केल्यास प्रत्यक्षात लागू होणारे दर तपासा:
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-center text-[11px]">
                    <thead>
                      <tr className="bg-emerald-100 dark:bg-emerald-950 font-bold text-emerald-950 dark:text-emerald-200">
                        <th className="p-1.5">Fat %</th>
                        <th className="p-1.5">SNF 8.3</th>
                        <th className="p-1.5">SNF 8.5</th>
                        <th className="p-1.5">SNF 8.7</th>
                        <th className="p-1.5">SNF 9.0</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {[3.2, 3.5, 3.8, 4.0, 4.2].map((f) => {
                        const baseF = activeRateTab === 'cow' ? 3.5 : 6.0;
                        const baseS = activeRateTab === 'cow' ? 8.5 : 9.0;
                        const calc = (sVal: number) => {
                          const fDiff = (f - baseF) / 0.1;
                          const sDiff = (sVal - baseS) / 0.1;
                          return (chartEditBaseRate + fDiff * chartEditFatStep + sDiff * chartEditSnfStep).toFixed(2);
                        };
                        return (
                          <tr key={f} className="hover:bg-white dark:hover:bg-slate-900">
                            <td className="p-1.5 font-bold bg-slate-100 dark:bg-slate-800">{f.toFixed(1)}</td>
                            <td className="p-1.5">₹{calc(8.3)}</td>
                            <td className="p-1.5 font-bold text-emerald-700 dark:text-emerald-400">₹{calc(8.5)}</td>
                            <td className="p-1.5">₹{calc(8.7)}</td>
                            <td className="p-1.5">₹{calc(9.0)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: PAYMENT MANAGEMENT                                 */}
        {/* ========================================================= */}
        {activeTab === 'payments' && (
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            
            {/* Record Payment Form */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {language === 'mr' ? 'दूध बिल वाटप / पेमेंट नोंद' : 'Record Supplier Payment'}
                </h3>
                <p className="text-xs text-slate-500">
                  शेतकऱ्याला दिलेली रक्कम रोख, बँक किंवा UPI द्वारे नोंदवा
                </p>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold mb-1">उत्पादक निवडा *</label>
                  <select
                    value={paySupplierId}
                    onChange={(e) => setPaySupplierId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="">-- उत्पादक निवडा --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id} - {s.fullName} (बाकी: ₹{s.financials?.remainingBalance?.toFixed(0) || 0})
                      </option>
                    ))}
                  </select>

                  {selectedPaySupplier && (
                    <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between items-center text-[11px]">
                      <span>एकूण देय बिल: <strong>₹{selectedPaySupplier.financials?.totalCollectionAmount?.toFixed(2)}</strong></span>
                      <span className="text-red-600 font-black">
                        शिल्लक: ₹{selectedPaySupplier.financials?.remainingBalance?.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">पेमेंट रक्कम (₹) *</label>
                    <input
                      type="number"
                      step="1"
                      required
                      placeholder="उदा. 1500"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-black text-emerald-800 dark:text-emerald-300"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">तारीख</label>
                    <input
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">पेमेंट पद्धत *</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="upi">UPI / PhonePe / Google Pay</option>
                    <option value="bank_transfer">बँक ट्रान्सफर (NEFT/RTGS)</option>
                    <option value="cash">रोख (Cash)</option>
                    <option value="cheque">धनादेश (Cheque)</option>
                    <option value="other">इतर</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">व्यवहार संदर्भ क्र. (Ref / UTR No.)</label>
                  <input
                    type="text"
                    placeholder="उदा. UPI-12345678"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                {/* Advance Checkbox safeguard */}
                <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900">
                  <input
                    type="checkbox"
                    id="isAdvance"
                    checked={payIsAdvance}
                    onChange={(e) => setPayIsAdvance(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                  <label htmlFor="isAdvance" className="text-slate-800 dark:text-slate-200 font-semibold cursor-pointer">
                    आगाऊ उचल (Advance Payment) - शिल्लक नसताना देण्यास परवानगी
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={recordingPayment || !paySupplierId || !payAmount}
                  className="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm shadow-md transition-colors disabled:opacity-50"
                >
                  {recordingPayment ? 'पेमेंट नोंदवत आहे...' : 'पेमेंट जमा करा'}
                </button>
              </form>
            </div>

            {/* Payments Table */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  पेमेंट व्यवहार इतिहास ({payments.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-300">
                      <th className="py-2.5 px-3">तारीख</th>
                      <th className="py-2.5 px-3">उत्पादक</th>
                      <th className="py-2.5 px-3">रक्कम</th>
                      <th className="py-2.5 px-3">पद्धत</th>
                      <th className="py-2.5 px-3">संदर्भ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-medium text-slate-600 dark:text-slate-400">
                          {p.paymentDate}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-emerald-800 dark:text-emerald-300">{p.supplierId}</span>
                          <span className="ml-1.5 font-bold text-slate-900 dark:text-white">{p.supplierName}</span>
                        </td>
                        <td className="py-2.5 px-3 font-black text-emerald-700 dark:text-emerald-400">
                          ₹{p.amount.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-semibold capitalize text-slate-700 dark:text-slate-300">
                          {p.paymentMethod}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                          {p.transactionRef || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: REPORTS & ANALYTICS                                */}
        {/* ========================================================= */}
        {activeTab === 'reports' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  अहवाल व विश्लेषण (Reports & Statements)
                </h2>
                <p className="text-xs text-slate-500">
                  दैनिक संकलन पत्रक, उत्पादकनिहाय मासिक बिल आणि डेअरी ताळेबंद
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-emerald-950 dark:text-emerald-100 mb-1">
                    १. उत्पादक मासिक बिल (PDF)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                    कोणत्याही उत्पादकाचे अधिकृत मराठी मासिक स्टेटमेंट तयार करून त्वरित डाउनलोड किंवा प्रिंट करा.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (suppliers.length > 0) onOpenStatementModal(suppliers[0].id);
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                >
                  स्टेटमेंट जनरेटर उघडा &rarr;
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-blue-950 dark:text-blue-100 mb-1">
                    २. संपूर्ण डेटा बॅकअप (JSON)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                    संपूर्ण डेअरी संकलन, शेतकरी यादी, दर पत्रके व पेमेंटचा सुरक्षा बॅकअप सेव्ह करा.
                  </p>
                </div>
                <button
                  onClick={handleExportBackup}
                  className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs"
                >
                  बॅकअप फाईल डाउनलोड करा
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-amber-950 dark:text-amber-100 mb-1">
                    ३. डेटाबेस रिस्टोअर (Restore)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                    आधी घेतलेली बॅकअप फाईल अपलोड करून डेटा पूर्ववत करा.
                  </p>
                </div>
                <label className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs text-center cursor-pointer block">
                  <span>बॅकअप फाईल निवडा</span>
                  <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                </label>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: AUDIT LOGS                                         */}
        {/* ========================================================= */}
        {activeTab === 'audit' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">
                सुरक्षा ऑडिट लॉग (Audit Trail)
              </h2>
              <p className="text-xs text-slate-500">
                प्रत्येक संकलन नोंद, बदल, दर अपडेट व पेमेंट नोंदीचा अचूक प्रशासकीय ट्रॅक
              </p>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300">
                    <th className="py-2.5 px-3">वेळ</th>
                    <th className="py-2.5 px-3">प्रशासक</th>
                    <th className="py-2.5 px-3">कृती (Action)</th>
                    <th className="py-2.5 px-3">तपशील (Details)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('mr-IN')}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                        {log.adminName}
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-sans">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: SETTINGS                                           */}
        {/* ========================================================= */}
        {activeTab === 'settings' && dairySettings && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-6 max-w-3xl">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">
                डेअरी माहिती व सिस्टिम सेटिंग्ज
              </h2>
              <p className="text-xs text-slate-500">
                पावती, बिल आणि अधिकृत कागदपत्रांवर दिसणारी माहिती
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">डेअरीचे अधिकृत नाव (मराठी)</label>
                <input
                  type="text"
                  value={dairySettings.dairyName}
                  onChange={(e) => setDairySettings({ ...dairySettings, dairyName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">नोंदणी क्रमांक (Registration No.)</label>
                <input
                  type="text"
                  value={dairySettings.registrationNumber}
                  onChange={(e) => setDairySettings({ ...dairySettings, registrationNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">गाव / ठिकाण</label>
                  <input
                    type="text"
                    value={dairySettings.village}
                    onChange={(e) => setDairySettings({ ...dairySettings, village: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">संपर्क फोन</label>
                  <input
                    type="text"
                    value={dairySettings.contactPhone}
                    onChange={(e) => setDairySettings({ ...dairySettings, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    await api.updateSettings(dairySettings);
                    showAlert('success', 'सेटिंग्ज यशस्वीरीत्या सेव्ह केल्या.');
                  }}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md"
                >
                  बदल साठवा
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
};
