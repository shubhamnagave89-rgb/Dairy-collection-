import React, { useState, useEffect } from 'react';
import {
  Milk,
  Smartphone,
  Download,
  ShieldCheck,
  CheckCircle,
  Clock,
  Phone,
  MapPin,
  TrendingUp,
  Receipt,
  Award,
  Users,
  ChevronRight,
  ArrowRight,
  Calculator
} from 'lucide-react';
import { Language, UserProfile, RateChartConfig } from '../types/index.js';
import { translations } from '../translations/index.js';
import { api } from '../services/api.js';

interface PublicWebsiteProps {
  language: Language;
  user: UserProfile | null;
  onOpenAuth: (mode: 'supplier_login' | 'admin_login' | 'register') => void;
  onNavigate: (view: 'website' | 'dashboard' | 'apk_download') => void;
}

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({
  language,
  user,
  onOpenAuth,
  onNavigate
}) => {
  const t = translations[language];
  const [rates, setRates] = useState<{ cow: RateChartConfig[]; buffalo: RateChartConfig[] } | null>(null);

  // Rate calculator quick widget state
  const [calcType, setCalcType] = useState<'cow' | 'buffalo'>('cow');
  const [calcFat, setCalcFat] = useState<number>(3.8);
  const [calcSnf, setCalcSnf] = useState<number>(8.5);
  const [calcQty, setCalcQty] = useState<number>(10);
  const [calcResult, setCalcResult] = useState<{ rate: number; details: string; total: number } | null>(null);

  useEffect(() => {
    api.getRates()
      .then((data) => setRates(data))
      .catch((err) => console.error('Failed to fetch rates:', err));
  }, []);

  useEffect(() => {
    api.calculateRate(calcType, calcFat, calcSnf)
      .then((res) => {
        setCalcResult({
          rate: res.rate,
          details: res.details,
          total: Math.round(calcQty * res.rate * 100) / 100
        });
      })
      .catch(() => {});
  }, [calcType, calcFat, calcSnf, calcQty]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-emerald-800 to-green-900 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-7 text-left space-y-6">
              
              {/* Trust Tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-400/30 text-emerald-200 text-xs font-semibold backdrop-blur-md shadow-xs">
                <Award className="w-3.5 h-3.5 text-amber-300" />
                <span>{language === 'mr' ? 'प्रमाणित सहकारी दूध संकलन केंद्र · कोल्हापूर' : 'Certified Cooperative Dairy · Kolhapur'}</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                {t.officialHeader}
              </h1>

              <p className="text-lg sm:text-xl text-emerald-100 font-medium leading-relaxed max-w-2xl">
                {language === 'mr'
                  ? 'वाडी रत्नागिरी आणि ज्योतिबा डोंगर परिसरातील शेतकरी बांधवांसाठी अत्याधुनिक व पारदर्शक दूध संकलन व्यवस्था. अचूक फॅट, प्रमाणित दर आणि थेट खात्यात वेळेवर पेमेंट!'
                  : 'Modern, transparent dairy milk collection management for farmers of Wadi Ratnagiri & Jyotiba Hill. Precise testing, approved rate charts and timely payments!'}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap gap-3 sm:gap-4">
                {user ? (
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-base shadow-lg transition-transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <span>{t.dashboard}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => onOpenAuth('supplier_login')}
                      className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-base shadow-lg transition-transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                      <Users className="w-5 h-5" />
                      <span>{t.supplierLogin}</span>
                    </button>

                    <button
                      onClick={() => onOpenAuth('register')}
                      className="px-6 py-3.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-950 text-emerald-100 font-bold text-base border border-emerald-400/40 backdrop-blur-md transition-transform hover:-translate-y-0.5"
                    >
                      {t.register}
                    </button>
                  </>
                )}

                <button
                  onClick={() => onNavigate('apk_download')}
                  className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-base border border-white/20 backdrop-blur-md transition-transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <Smartphone className="w-5 h-5 text-amber-300" />
                  <span>{t.downloadApk}</span>
                </button>
              </div>

              {/* Shift timing chip */}
              <div className="flex flex-wrap items-center gap-4 pt-4 text-xs sm:text-sm text-emerald-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span><strong>{t.morning}:</strong> ६:०० ते ९:३०</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span><strong>{t.evening}:</strong> ५:०० ते ८:३०</span>
                </div>
              </div>

            </div>

            {/* Quick Live Rates & Calculator Card */}
            <div className="lg:col-span-5">
              <div className="bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 rounded-2xl p-6 shadow-2xl border border-emerald-200/60 dark:border-slate-800 backdrop-blur-xl">
                
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-800 dark:text-emerald-300">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base leading-tight">
                        {language === 'mr' ? 'दूध दर अंदाज कॅल्क्युलेटर' : 'Live Milk Rate Estimator'}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {language === 'mr' ? 'फॅट व SNF टाकून अंदाजित रक्कम पहा' : 'Calculate price based on Fat & SNF'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded-md">
                    {language === 'mr' ? 'आजचे दर' : 'Today'}
                  </span>
                </div>

                {/* Milk Type Selector */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setCalcType('cow');
                      setCalcFat(3.8);
                      setCalcSnf(8.5);
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      calcType === 'cow'
                        ? 'bg-emerald-700 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span>{t.cowMilk}</span>
                    <span className="text-[10px] opacity-80">(Base ₹36.50)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCalcType('buffalo');
                      setCalcFat(6.5);
                      setCalcSnf(9.0);
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      calcType === 'buffalo'
                        ? 'bg-emerald-700 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span>{t.buffaloMilk}</span>
                    <span className="text-[10px] opacity-80">(Base ₹62.00)</span>
                  </button>
                </div>

                {/* Input Sliders & Fields */}
                <div className="space-y-4 mt-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>{t.quantity}</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">{calcQty} Ltr</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      step="0.5"
                      value={calcQty}
                      onChange={(e) => setCalcQty(parseFloat(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">
                        {t.fat} (3.0 - 10.0)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="2.5"
                        max="12"
                        value={calcFat}
                        onChange={(e) => setCalcFat(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1">
                        {t.snf} (7.5 - 10.5)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="6.0"
                        max="12"
                        value={calcSnf}
                        onChange={(e) => setCalcSnf(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Calculated Result Display */}
                {calcResult && (
                  <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/60 dark:to-green-950/60 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                          {t.rate}
                        </p>
                        <p className="text-2xl font-black text-emerald-950 dark:text-white">
                          ₹{calcResult.rate.toFixed(2)}
                          <span className="text-xs font-normal text-slate-500"> /Ltr</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                          {t.totalAmount} ({calcQty} L)
                        </p>
                        <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                          ₹{calcResult.total.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 truncate">
                      {calcResult.details}
                    </p>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Core Advantages Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-emerald-950 dark:text-emerald-100">
            {language === 'mr' ? 'आमची ठळक वैशिष्ट्ये' : 'Why Choose Jyotiba Dairy'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-base">
            {language === 'mr'
              ? 'दूध उत्पादक शेतकऱ्यांच्या कष्टाला पूर्ण सन्मान आणि पारदर्शक व्यवहार'
              : 'Honoring farmers hard work with 100% transparency, honest testing, and digital convenience.'}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">
              {language === 'mr' ? 'डिजिटल मोजणी व अचूक फॅट' : 'Digital Milk Analyzer'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {language === 'mr'
                ? 'अत्याधुनिक इलेक्ट्रॉनिक वजन काटा व फॅट मशीनद्वारे प्रत्येक थेंबाचे अचूक मूल्यमापन.'
                : 'Advanced ultrasonic milk analyzers ensure precise Fat & SNF readings without human error.'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-300 flex items-center justify-center mb-4">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">
              {language === 'mr' ? 'मोबाईल ॲप व त्वरित पावती' : 'Android Mobile App'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {language === 'mr'
                ? 'दूध घालताच शेतकऱ्याच्या मोबाईलवर तत्काळ नोंद व डिजिटल पासबुक अपडेट होते.'
                : 'Real-time updates directly to farmer Android application with daily and monthly passbook.'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-4">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">
              {language === 'mr' ? '१० दिवसांचे नियमित पेमेंट' : '10-Day Regular Payments'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {language === 'mr'
                ? 'दर १० दिवसांनी दूध बिल बँक खाते, UPI किंवा रोख स्वरूपात वेळेत अदा केले जाते.'
                : 'Punctual 10-day payment disbursements directly into Bank account, UPI, or cash.'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">
              {language === 'mr' ? 'पारदर्शक दर पत्रक' : 'Strict Role Security'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {language === 'mr'
                ? 'शासकीय व प्रमाणित दर पत्रकानुसार हिशोब. कोणत्याही छुपा कपात किंवा हेराफेरी नाही.'
                : 'Authorized admin entries with complete audit logs and strict privacy protection.'}
            </p>
          </div>

        </div>
      </section>

      {/* APK Banner Showcase */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-emerald-800 to-green-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
          <div className="grid md:grid-cols-12 gap-8 items-center relative z-10">
            <div className="md:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-300 text-xs font-semibold">
                <span>{language === 'mr' ? 'नवीन आवृत्ती v1.0.4 उपलब्ध' : 'New Version v1.0.4 Available'}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                {language === 'mr'
                  ? 'आपल्या Android मोबाईलवर ज्योतिबा डेअरी ॲप डाउनलोड करा'
                  : 'Download Jyotiba Dairy Official Android App'}
              </h2>
              <p className="text-emerald-100 text-base max-w-xl">
                {language === 'mr'
                  ? 'रोजचे दूध संकलन, फॅट, दर, जमा रक्कम व मासिक स्टेटमेंट आता एका क्लिकवर मोबाईलमध्ये!'
                  : 'Track your daily milk collection, fat, rates, payments and download PDF bills right from your smartphone.'}
              </p>
              <div className="pt-2 flex flex-wrap gap-4">
                <button
                  onClick={() => onNavigate('apk_download')}
                  className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-sm shadow-md transition-transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{t.downloadNow} (7.1 MB)</span>
                </button>
                <a
                  href="/downloads/jyotiba-dairy-v1.0.4.apk"
                  download="jyotiba-dairy-v1.0.4.apk"
                  className="px-6 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-sm border border-white/30 backdrop-blur-md transition-colors flex items-center gap-2"
                >
                  <span>{language === 'mr' ? 'थेट APK फाईल सेव्ह करा' : 'Direct APK Download'}</span>
                </a>
              </div>
            </div>

            <div className="md:col-span-4 flex justify-center">
              <div className="w-48 h-48 bg-white/10 rounded-2xl p-4 border border-white/20 flex flex-col items-center justify-center text-center backdrop-blur-md">
                <img
                  src="/dairy-icon.svg"
                  alt="App Icon"
                  className="w-20 h-20 mb-2 drop-shadow-md"
                />
                <span className="font-bold text-sm">ज्योतिबा दूध संकलन</span>
                <span className="text-xs text-emerald-200">v1.0.4 · Android 7.0+</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Timing Footer Info */}
      <section className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          
          <div>
            <h4 className="font-bold text-lg text-emerald-950 dark:text-emerald-100 mb-3">
              {t.officialHeader}
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              {language === 'mr'
                ? 'वाडी रत्नागिरी (ज्योतिबा डोंगर), ता. पन्हाळा, जि. कोल्हापूर - ४१६२२९. दूध उत्पादक शेतकरी कल्याण व प्रामाणिक डेअरी सेवा.'
                : 'Wadi Ratnagiri (Jyotiba Hill), Tal. Panhala, Dist. Kolhapur - 416229. Dedicated to dairy farmer welfare and authentic service.'}
            </p>
            <p className="text-xs text-slate-500">
              {t.regNo}: MAH/KOP/DAIRY/2019/9421
            </p>
          </div>

          <div>
            <h4 className="font-bold text-base text-slate-900 dark:text-white mb-3">
              {language === 'mr' ? 'संकलन सत्र व वेळा' : 'Shift Timings'}
            </h4>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span><strong>{t.morning}:</strong> सकाळी ६:०० ते ९:३० पर्यंत</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span><strong>{t.evening}:</strong> संध्याकाळी ५:०० ते ८:३० पर्यंत</span>
              </li>
              <li className="text-xs text-slate-500 pt-1">
                * वेळेत दूध संकलन केंद्रात आणल्यास अचूक तापमान व फॅट टिकून राहते.
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-base text-slate-900 dark:text-white mb-3">
              {language === 'mr' ? 'मदत व संपर्क' : 'Contact & Support'}
            </h4>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>+91 98220 54321 / +91 88888 12345</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>ज्योतिबा मंदिर पायथा, वाडी रत्नागिरी</span>
              </p>
              <p className="text-xs text-slate-500 pt-2">
                व्यवस्थापक: श्री. मिलिंद नागवे (डेअरी प्रमुख)
              </p>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {t.officialHeader}. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <button onClick={() => onOpenAuth('admin_login')} className="hover:text-emerald-700 underline">
              {t.adminLogin}
            </button>
            <span>·</span>
            <button onClick={() => onNavigate('apk_download')} className="hover:text-emerald-700 underline">
              {t.downloadApk}
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
