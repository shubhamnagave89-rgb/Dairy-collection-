import React from 'react';
import { X, Printer, CheckCircle } from 'lucide-react';
import { MilkCollectionItem } from '../types/index.js';

interface ThermalSlipModalProps {
  isOpen: boolean;
  collection: MilkCollectionItem | null;
  onClose: () => void;
}

export const ThermalSlipModal: React.FC<ThermalSlipModalProps> = ({
  isOpen,
  collection,
  onClose
}) => {
  if (!isOpen || !collection) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white text-slate-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-200 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="no-print absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Slip Content */}
        <div className="text-center font-mono space-y-3">
          
          <div className="pb-2 border-b-2 border-dashed border-slate-400">
            <h3 className="font-extrabold text-base tracking-tight font-sans">
              ज्योतिबा दूध संकलन केंद्र
            </h3>
            <p className="text-[11px] text-slate-600 font-sans">
              वाडी रत्नागिरी, ता. पन्हाळा, कोल्हापूर
            </p>
            <p className="text-[10px] text-slate-500 font-sans">
              दूध संकलन पावती (Receipt)
            </p>
          </div>

          <div className="text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span>पावती क्र.:</span>
              <span className="font-bold">{collection.id}</span>
            </div>
            <div className="flex justify-between">
              <span>तारीख व सत्र:</span>
              <span>{collection.date} ({collection.shift === 'morning' ? 'सकाळ' : 'संध्या.'})</span>
            </div>
            <div className="flex justify-between">
              <span>ग्राहक क्र. (ID):</span>
              <span className="font-bold text-emerald-800">{collection.supplierId}</span>
            </div>
            <div className="flex justify-between">
              <span>नाव:</span>
              <span className="font-bold truncate max-w-[170px]">{collection.supplierName}</span>
            </div>
            <div className="flex justify-between">
              <span>दूध प्रकार:</span>
              <span className="font-bold">{collection.milkType === 'cow' ? 'गाय (Cow)' : 'म्हैस (Buffalo)'}</span>
            </div>
          </div>

          <div className="py-2 border-y-2 border-dashed border-slate-400 text-xs space-y-1.5 text-left">
            <div className="flex justify-between">
              <span>दूध प्रमाण (Qty):</span>
              <span className="font-black text-sm">{collection.quantity.toFixed(1)} Litre</span>
            </div>
            <div className="flex justify-between">
              <span>फॅट (FAT %):</span>
              <span className="font-bold">{collection.fat.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>एसएनएफ (SNF %):</span>
              <span className="font-bold">{collection.snf.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>लागू दर (Rate):</span>
              <span className="font-bold">₹{collection.appliedRate.toFixed(2)} /L</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm font-black pt-1">
            <span>एकूण रक्कम (Total):</span>
            <span className="text-base text-emerald-800">₹{collection.totalAmount.toFixed(2)}</span>
          </div>

          <div className="pt-2 text-[10px] text-slate-500 border-t border-slate-200">
            <p>नोंद करणारा: {collection.enteredByName}</p>
            <p className="font-sans mt-0.5">धन्यवाद! ज्योतिबा डेअरीमध्ये आपले स्वागत आहे.</p>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="no-print mt-5 flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>पावती प्रिंट करा</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-bold"
          >
            बंद करा
          </button>
        </div>

      </div>
    </div>
  );
};
