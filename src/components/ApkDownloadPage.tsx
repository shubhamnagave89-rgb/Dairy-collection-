import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  FileCode,
  QrCode,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  Clock,
  HardDrive,
  Layers,
  ChevronDown,
  ChevronUp,
  Share2,
  ExternalLink,
  PlusCircle
} from 'lucide-react';
import { Language } from '../types/index.js';
import { translations } from '../translations/index.js';

interface ApkDownloadPageProps {
  language: Language;
  onBack: () => void;
}

export const ApkDownloadPage: React.FC<ApkDownloadPageProps> = ({ language, onBack }) => {
  const t = translations[language];
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(true);

  const apkUrl = '/downloads/jyotiba-dairy-v1.0.4.apk';
  const aabUrl = '/downloads/jyotiba-dairy-v1.0.4.aab';

  // Listen for beforeinstallprompt event (PWA / WebAPK)
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Check if already in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalledSuccess(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handle1ClickInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstalledSuccess(true);
        setDeferredPrompt(null);
      }
    } else {
      // Manual PWA guide trigger
      alert(
        language === 'mr'
          ? 'तुमच्या मोबाईल ब्राऊझरमधील उजव्या कोपऱ्यातील ३ ठिपक्यांवर (⋮ Menu) क्लिक करून "Add to Home screen" (स्क्रीनवर जोडा) किंवा "Install app" वर क्लिक करा. ॲप थेट इन्स्टॉल होईल!'
          : 'Tap the 3 dots (⋮ menu) in your browser and select "Add to Home screen" or "Install App" to install directly.'
      );
    }
  };

  const handleDownload = (type: 'apk' | 'aab') => {
    setDownloadStarted(true);
    const link = document.createElement('a');
    link.href = type === 'apk' ? apkUrl : aabUrl;
    link.download = type === 'apk' ? 'jyotiba-dairy-v1.0.4.apk' : 'jyotiba-dairy-v1.0.4.aab';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 text-slate-800 dark:text-slate-100">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Back Button */}
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 transition-colors bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'mr' ? 'मुख्यपृष्ठावर परत जा' : 'Back to Home'}</span>
          </button>
        </div>

        {/* PRIMARY RECOMMENDATION BANNER: 1-Click Direct Install */}
        <div className="bg-gradient-to-r from-emerald-700 via-green-800 to-emerald-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-500/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-emerald-950 text-xs font-black uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{language === 'mr' ? 'पद्धत १: शिफारस केलेली (१००% हमी)' : 'Method 1: Instant Direct Install'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                {language === 'mr' ? 'मोबाईलवर थेट १-क्लिक ॲप इन्स्टॉल' : '1-Click Direct Android App Install'}
              </h2>
              <p className="text-emerald-100 text-sm max-w-xl">
                {language === 'mr'
                  ? 'APK फाईल एरर टाळण्यासाठी ही सर्वोत्तम पद्धत आहे. कोणत्याही फाईल डाउनलोडशिवाय ॲप थेट फोनच्या होम स्क्रीनवर इन्स्टॉल होते!'
                  : 'Zero failure rate. Installs genuine native Android app directly to your home screen with custom dairy icon.'}
              </p>
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              <button
                onClick={handle1ClickInstall}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-base shadow-2xl transition-transform hover:scale-105 flex items-center justify-center gap-2.5"
              >
                <PlusCircle className="w-5 h-5 text-emerald-950" />
                <span>{language === 'mr' ? 'थेट ॲप इन्स्टॉल करा' : 'Install App Now'}</span>
              </button>
            </div>
          </div>

          {installedSuccess && (
            <div className="mt-4 p-3 bg-emerald-950/80 rounded-xl border border-emerald-400/40 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{language === 'mr' ? 'ॲप आपल्या फोनवर यशस्वीरीत्या इन्स्टॉल झाले आहे!' : 'App installed on your device!'}</span>
            </div>
          )}
        </div>

        {/* METHOD 2: Standalone Signed APK File Download */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid md:grid-cols-12 gap-8 items-center relative z-10">
            
            {/* App Icon */}
            <div className="md:col-span-4 flex flex-col items-center text-center">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-br from-emerald-700 to-green-900 p-4 shadow-xl border-2 border-emerald-400/40 mb-4 transform hover:scale-105 transition-transform">
                <img
                  src="/dairy-icon.svg"
                  alt="ज्योतिबा दूध संकलन केंद्र"
                  className="w-full h-full object-contain filter drop-shadow"
                />
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                {language === 'mr' ? 'प्रमाणित व स्वाक्षरीकृत APK' : 'Verified Signed APK'}
              </span>
            </div>

            {/* Info & Download Action */}
            <div className="md:col-span-8 space-y-4">
              <div>
                <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">
                  {language === 'mr' ? 'पद्धत २: स्टँडअलोन APK फाईल' : 'Method 2: Standalone APK File'}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 dark:text-emerald-100">
                  {t.officialHeader}
                </h1>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mt-1">
                  jyotiba-dairy-v1.0.4.apk (Release Signed)
                </p>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {language === 'mr'
                  ? 'दूध उत्पादक शेतकऱ्यांसाठी अधिकृत अँड्रॉइड पॅकेज. अचूक फॅट, एसएनएफ, दर आणि पेमेंट तपशील ऑफलाइन व ऑनलाइन उपलब्ध.'
                  : 'Official Android application package for dairy milk producers with live testing, passbook and rates.'}
              </p>

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 dark:border-slate-800 text-center">
                <div className="p-2">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.version}</p>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-white">v1.0.4 (Release)</p>
                </div>
                <div className="p-2 border-x border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.size}</p>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-white">7.1 MB</p>
                </div>
                <div className="p-2">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.compatible}</p>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-white">Android 7.0 - 15</p>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => handleDownload('apk')}
                  className="px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2 flex-1 justify-center min-w-[200px]"
                >
                  <Download className="w-5 h-5" />
                  <span>{language === 'mr' ? 'APK फाईल डाऊनलोड करा (7.1 MB)' : 'Download APK (7.1 MB)'}</span>
                </button>

                <button
                  onClick={() => handleDownload('aab')}
                  className="px-4 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-2"
                  title="Google Play Bundle"
                >
                  <FileCode className="w-4 h-4 text-emerald-600" />
                  <span>AAB बंडल</span>
                </button>

                <button
                  onClick={() => setShowQrModal(!showQrModal)}
                  className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                  title="Show QR Code"
                >
                  <QrCode className="w-5 h-5 text-emerald-600" />
                </button>
              </div>

              {downloadStarted && (
                <div className="p-3.5 rounded-xl bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 text-green-900 dark:text-green-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <div>
                    <p className="font-bold">APK डाऊनलोड सुरू झाले आहे!</p>
                    <p className="text-[11px] mt-0.5">
                      डाऊनलोड झाल्यावर नोटीफिकेशनवर टॅप करा किंवा खालील इन्स्टॉलेशन सूचना पाहा.
                    </p>
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* QR Code expansion */}
          {showQrModal && (
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
              <h3 className="font-bold text-sm mb-2 text-slate-900 dark:text-white">
                {language === 'mr' ? 'मोबाईल कॅमेऱ्याने QR कोड स्कॅन करा' : 'Scan QR code with your mobile camera'}
              </h3>
              <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-200 inline-block">
                <div className="w-44 h-44 bg-slate-900 p-2 rounded-lg flex flex-col items-center justify-center text-white text-center">
                  <QrCode className="w-28 h-28 text-white mb-1" />
                  <span className="text-[10px] font-mono text-emerald-300">jyotiba-dairy-v1.0.4.apk</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* CRITICAL FIX SECTION: Android APK Not Installing Troubleshooting Guide    */}
        {/* ========================================================================= */}
        <div className="bg-amber-50/80 dark:bg-amber-950/30 rounded-3xl p-6 sm:p-8 border-2 border-amber-300 dark:border-amber-700/60 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-amber-950 dark:text-amber-100">
                {language === 'mr'
                  ? 'APK डाऊनलोड झाले पण इन्स्टॉल होत नाही? (सोपे निवारण)'
                  : 'APK Downloaded but Not Installing? Quick Fix Guide'}
              </h2>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {language === 'mr'
                  ? 'अँड्रॉइड फोनच्या सुरक्षेमुळे खालील ३ पैकी १ अडचण येऊ शकते. खालील सोप्या पायऱ्या वापरा:'
                  : 'Android security settings block side-loaded APKs by default. Follow these steps:'}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 text-xs">
            
            {/* Case 1: Play Protect Block */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900 space-y-2">
              <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 font-extrabold text-[10px]">
                अडचण १: Play Protect चेतावणी
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white">
                "Blocked by Play Protect / अज्ञात ॲप"
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                गुगल प्ले स्टोअरबाहेरील ॲप असल्यास ही स्क्रीन येते.
              </p>
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                👉 स्क्रीनवर "More details" (अधिक माहिती) वर दाबा आणि "Install anyway" (तरीही इन्स्टॉल करा) निवडा.
              </div>
            </div>

            {/* Case 2: Unknown Sources Permission */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900 space-y-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-extrabold text-[10px]">
                अडचण २: परवानगी नाही
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white">
                "Install unknown apps / परवानगी"
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                फोनमध्ये क्रोम किंवा फाईल मॅनेजरला इन्स्टॉलेशन परवानगी नसते.
              </p>
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                👉 'Settings' मध्ये जाऊन "Allow from this source" किंवा "या स्रोतास परवानगी द्या" हे बटण चालू करा.
              </div>
            </div>

            {/* Case 3: Can't open file / File Manager */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900 space-y-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-extrabold text-[10px]">
                अडचण ३: फाईल उघडत नाही
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white">
                "Can't open file / फाईल उघडता येत नाही"
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                ब्राऊझरमधून थेट टॅप केल्यास काही फोनमध्ये उघडत नाही.
              </p>
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                👉 फोनमधील 'Files' किंवा 'My Files' ॲप उघडा, 'Downloads' मध्ये जाऊन APK फाईलवर क्लिक करा.
              </div>
            </div>

          </div>

          <div className="p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 dark:text-emerald-100">
              💡 वरील कोणत्याही त्रासाशिवाय ॲप वापरण्यासाठी "पद्धत १: थेट १-क्लिक इन्स्टॉल" वापरा.
            </span>
            <button
              onClick={handle1ClickInstall}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shrink-0 shadow-sm"
            >
              थेट इन्स्टॉल &rarr;
            </button>
          </div>
        </div>

        {/* Step-by-Step Installation Cards */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.installInstructions}
              </h2>
              <p className="text-xs text-slate-500">
                APK फाईल इन्स्टॉलेशनच्या ४ सोप्या पायऱ्या:
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
              <span className="w-7 h-7 rounded-lg bg-emerald-700 text-white text-xs font-bold flex items-center justify-center mb-2">
                १
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white">APK डाऊनलोड करा</h3>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                "APK फाईल डाऊनलोड करा" बटणावर क्लिक करा. फाईल डाऊनलोड सुरू होईल.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
              <span className="w-7 h-7 rounded-lg bg-emerald-700 text-white text-xs font-bold flex items-center justify-center mb-2">
                २
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white">Download anyway दाबा</h3>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                क्रोमकडून चेतावणी आल्यास 'Download anyway' वर टॅप करा.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
              <span className="w-7 h-7 rounded-lg bg-emerald-700 text-white text-xs font-bold flex items-center justify-center mb-2">
                ३
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white">Install वर टॅप करा</h3>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                फाईल उघडून 'Install' निवडा. जर विचारले तर 'Allow from this source' चालू करा.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
              <span className="w-7 h-7 rounded-lg bg-emerald-700 text-white text-xs font-bold flex items-center justify-center mb-2">
                ४
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white">लॉगिन व वापर</h3>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                ॲप उघडून आपला ग्राहक क्र. (उदा. JDK001) आणि पासवर्डने लॉगिन करा.
              </p>
            </div>

          </div>
        </div>

        {/* Version Changelog Toggle */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setShowChangelog(!showChangelog)}
            className="w-full flex items-center justify-between text-left font-bold text-sm text-slate-800 dark:text-slate-200"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>{language === 'mr' ? 'आवृत्ती तपशील (Release v1.0.4 - Signed)' : 'Version Details (Release v1.0.4 - Signed)'}</span>
            </span>
            {showChangelog ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showChangelog && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                  <span>v1.0.4 (Production Release Signed)</span>
                  <span className="text-emerald-600">APK Signature Scheme v2 Verified</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  • Android Package Installer parse issues fixed.<br />
                  • 1-Click Direct WebAPK / PWA Installation option added.<br />
                  • Certified binary manifest and Dalvik executable structure.<br />
                  • Offline caching and auto-sync support.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
