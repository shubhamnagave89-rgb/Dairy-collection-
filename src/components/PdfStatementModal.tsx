import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  Calendar,
  Milk,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Language, UserProfile } from '../types/index.js';
import { translations } from '../translations/index.js';
import { api } from '../services/api.js';
import jsPDF from 'jspdf';

interface PdfStatementModalProps {
  isOpen: boolean;
  supplierId: string | null;
  language: Language;
  onClose: () => void;
}

export const PdfStatementModal: React.FC<PdfStatementModalProps> = ({
  isOpen,
  supplierId,
  language,
  onClose
}) => {
  const t = translations[language];

  const [loading, setLoading] = useState(true);
  const [statementData, setStatementData] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7) // YYYY-MM
  );

  useEffect(() => {
    if (!isOpen || !supplierId) return;
    setLoading(true);
    api.getSupplierStatement({ supplierId, month: selectedMonth })
      .then((data) => setStatementData(data))
      .catch((err) => console.error('Failed to load statement:', err))
      .finally(() => setLoading(false));
  }, [isOpen, supplierId, selectedMonth]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (!statementData) return;
    const doc = new jsPDF();
    const s = statementData.supplier;
    const sum = statementData.summary;
    const set = statementData.settings;

    // Header
    doc.setFontSize(16);
    doc.text('JYOTIBA MILK COLLECTION CENTER', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Wadi Ratnagiri (Jyotiba Dongar), Tal. Panhala, Dist. Kolhapur', 105, 26, { align: 'center' });
    doc.text(`Reg. No: ${set?.registrationNumber || 'MAH/KOP/DAIRY/2019/9421'} | Contact: ${set?.contactPhone || '9822054321'}`, 105, 31, { align: 'center' });
    doc.line(15, 34, 195, 34);

    // Bill Title
    doc.setFontSize(12);
    doc.text(`MONTHLY MILK STATEMENT / PASSBOOK BILL: ${selectedMonth}`, 105, 42, { align: 'center' });

    // Supplier details
    doc.setFontSize(10);
    doc.text(`Supplier ID: ${s.id}`, 20, 52);
    doc.text(`Farmer Name: ${s.fullName}`, 20, 58);
    doc.text(`Village: ${s.village}`, 20, 64);
    doc.text(`Mobile: ${s.mobile}`, 140, 52);
    doc.text(`Date of Issue: ${new Date().toLocaleDateString()}`, 140, 58);
    doc.line(15, 68, 195, 68);

    // Summary Box
    doc.text(`Total Cow Milk: ${sum.cowQuantity} Ltrs`, 20, 76);
    doc.text(`Total Buffalo Milk: ${sum.buffaloQuantity} Ltrs`, 20, 82);
    doc.text(`Total Milk Supplied: ${sum.totalQuantity} Ltrs`, 20, 88);
    doc.text(`Average Fat: ${sum.avgFat}%  |  Average SNF: ${sum.avgSNF}%`, 20, 94);

    doc.text(`Total Milk Bill: Rs. ${sum.totalAmount.toFixed(2)}`, 130, 76);
    doc.text(`Amount Paid (Advance/Cheque): Rs. ${sum.totalPaid.toFixed(2)}`, 130, 82);
    doc.setFont('helvetica', 'bold');
    doc.text(`NET PAYABLE BALANCE: Rs. ${sum.periodBalance.toFixed(2)}`, 130, 92);
    doc.setFont('helvetica', 'normal');
    doc.line(15, 98, 195, 98);

    // Table Header
    let y = 106;
    doc.setFontSize(9);
    doc.text('Date', 20, y);
    doc.text('Shift', 45, y);
    doc.text('Type', 65, y);
    doc.text('Qty(L)', 85, y);
    doc.text('Fat%', 105, y);
    doc.text('SNF%', 125, y);
    doc.text('Rate(Rs)', 145, y);
    doc.text('Total(Rs)', 175, y);
    doc.line(15, y + 2, 195, y + 2);

    y += 8;
    statementData.collections.slice(0, 15).forEach((c: any) => {
      doc.text(c.date, 20, y);
      doc.text(c.shift, 45, y);
      doc.text(c.milkType, 65, y);
      doc.text(c.quantity.toFixed(1), 85, y);
      doc.text(c.fat.toFixed(1), 105, y);
      doc.text(c.snf.toFixed(1), 125, y);
      doc.text(c.appliedRate.toFixed(2), 145, y);
      doc.text(c.totalAmount.toFixed(2), 175, y);
      y += 6;
    });

    // Signature Footer
    doc.text('Authorized Dairy Signatory', 145, 270);
    doc.text('Jyotiba Milk Center', 145, 275);

    doc.save(`Jyotiba_Statement_${s.id}_${selectedMonth}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Controls (No Print) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              {language === 'mr' ? 'दूध संकलन मासिक बिल व पासबुक' : 'Milk Collection Monthly Statement'}
            </h3>
            <p className="text-xs text-slate-500">
              {statementData?.supplier?.fullName} ({statementData?.supplier?.id})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-800"
            />

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>प्रिंट</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF डाउनलोड</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE BILL SHEET */}
        {loading || !statementData ? (
          <div className="py-16 text-center text-slate-400">
            बिल पत्रक तयार होत आहे...
          </div>
        ) : (
          <div className="bg-white text-slate-900 p-6 rounded-2xl border-2 border-emerald-800 shadow-sm space-y-5 print:border-none print:p-0">
            
            {/* Header */}
            <div className="text-center pb-3 border-b-2 border-emerald-900">
              <div className="flex justify-center mb-1">
                <img src="/dairy-icon.svg" alt="Logo" className="w-12 h-12" />
              </div>
              <h1 className="text-2xl font-black text-emerald-950 uppercase tracking-wide">
                {statementData.settings?.dairyName || 'ज्योतिबा दूध संकलन केंद्र'}
              </h1>
              <p className="text-xs text-slate-700 font-semibold">
                {statementData.settings?.village || 'वाडी रत्नागिरी (ज्योतिबा डोंगर), ता. पन्हाळा, जि. कोल्हापूर'}
              </p>
              <p className="text-[11px] text-slate-600">
                नोंदणी क्र.: {statementData.settings?.registrationNumber} · संपर्क: {statementData.settings?.contactPhone}
              </p>
              <div className="inline-block mt-2 px-4 py-1 rounded-full bg-emerald-900 text-white font-extrabold text-xs">
                मासिक दूध बिल पत्रक · कालावधी: {selectedMonth}
              </div>
            </div>

            {/* Farmer Details */}
            <div className="grid grid-cols-2 gap-2 text-xs border-b border-slate-300 pb-3">
              <div>
                <p><strong>ग्राहक क्र. (ID):</strong> <span className="font-mono font-bold text-sm">{statementData.supplier.id}</span></p>
                <p><strong>उत्पादकाचे नाव:</strong> <span className="font-bold">{statementData.supplier.fullName}</span></p>
                <p><strong>गाव:</strong> {statementData.supplier.village}</p>
              </div>
              <div className="text-right">
                <p><strong>मोबाईल:</strong> {statementData.supplier.mobile}</p>
                <p><strong>बिल तारीख:</strong> {new Date().toLocaleDateString('mr-IN')}</p>
                {statementData.supplier.bankDetails && (
                  <p className="text-[11px] text-slate-600">
                    बँक: {statementData.supplier.bankDetails.bankName} ({statementData.supplier.bankDetails.accountNumber})
                  </p>
                )}
              </div>
            </div>

            {/* Summary Highlights */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
              <div>
                <p className="text-slate-600">गाय दूध प्रमाण:</p>
                <p className="font-bold text-sm">{statementData.summary.cowQuantity} लिटर</p>
                <p className="text-slate-600 mt-1">म्हैस दूध प्रमाण:</p>
                <p className="font-bold text-sm">{statementData.summary.buffaloQuantity} लिटर</p>
              </div>

              <div>
                <p className="text-slate-600">एकूण पुरवठा दूध:</p>
                <p className="font-black text-base text-emerald-900">{statementData.summary.totalQuantity} लिटर</p>
                <p className="text-slate-600 mt-1">सरासरी गुणवत्ता:</p>
                <p className="font-bold">फॅट: {statementData.summary.avgFat}% · SNF: {statementData.summary.avgSNF}%</p>
              </div>

              <div className="text-right">
                <p className="text-slate-600">एकूण दूध बिल:</p>
                <p className="font-bold text-sm text-slate-900">₹{statementData.summary.totalAmount.toFixed(2)}</p>
                <p className="text-slate-600 mt-1">अदा केलेले पेमेंट:</p>
                <p className="font-bold text-blue-700">₹{statementData.summary.totalPaid.toFixed(2)}</p>
                <p className="text-slate-600 mt-1 font-bold">शिल्लक देय रक्कम:</p>
                <p className="font-black text-base text-emerald-800">
                  ₹{statementData.summary.periodBalance.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Collection Register Entries */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase text-slate-700">संकलन नोंदी तपशील:</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b border-slate-300">
                      <th className="p-1.5">तारीख</th>
                      <th className="p-1.5">सत्र</th>
                      <th className="p-1.5">प्रकार</th>
                      <th className="p-1.5">लिटर</th>
                      <th className="p-1.5">फॅट</th>
                      <th className="p-1.5">SNF</th>
                      <th className="p-1.5">दर (₹)</th>
                      <th className="p-1.5 text-right">रक्कम (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {statementData.collections.map((c: any) => (
                      <tr key={c.id}>
                        <td className="p-1.5">{c.date}</td>
                        <td className="p-1.5">{c.shift === 'morning' ? 'सकाळ' : 'संध्या.'}</td>
                        <td className="p-1.5">{c.milkType === 'cow' ? 'गाय' : 'म्हैस'}</td>
                        <td className="p-1.5 font-bold">{c.quantity.toFixed(1)}</td>
                        <td className="p-1.5">{c.fat.toFixed(1)}</td>
                        <td className="p-1.5">{c.snf.toFixed(1)}</td>
                        <td className="p-1.5">₹{c.appliedRate.toFixed(2)}</td>
                        <td className="p-1.5 text-right font-bold">₹{c.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-8 flex justify-between items-end text-xs">
              <div>
                <p className="border-t border-slate-400 pt-1 px-4 text-center font-bold">
                  उत्पादकाची स्वाक्षरी
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 mb-6">ज्योतिबा दूध संकलन केंद्र शिक्का</p>
                <p className="border-t border-slate-400 pt-1 px-4 font-bold">
                  अधिकृत व्यवस्थापक स्वाक्षरी
                </p>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
