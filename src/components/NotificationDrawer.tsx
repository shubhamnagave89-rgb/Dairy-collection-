import React from 'react';
import { X, Bell, Check, Clock, Milk, Receipt, AlertCircle } from 'lucide-react';
import { NotificationItem, Language } from '../types/index.js';
import { api } from '../services/api.js';

interface NotificationDrawerProps {
  isOpen: boolean;
  notifications: NotificationItem[];
  language: Language;
  onClose: () => void;
  onRefresh: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  notifications,
  language,
  onClose,
  onRefresh
}) => {
  if (!isOpen) return null;

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-300">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {language === 'mr' ? 'सूचना व अलर्ट्स' : 'Notifications'}
              </h3>
              <p className="text-[11px] text-slate-500">
                दूध संकलन व पेमेंट नोंदी
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              कोणतीही नवीन सूचना नाही.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  n.isRead
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 opacity-80'
                    : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 shadow-xs'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    {n.type === 'collection' && <Milk className="w-4 h-4 text-emerald-600" />}
                    {n.type === 'payment' && <Receipt className="w-4 h-4 text-blue-600" />}
                    {n.type === 'system' && <AlertCircle className="w-4 h-4 text-amber-600" />}
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      {n.title}
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {n.message}
                </p>

                {!n.isRead && (
                  <div className="mt-2 text-right">
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>वाचले म्हणून खूण करा</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
          >
            बंद करा
          </button>
        </div>

      </div>
    </div>
  );
};
