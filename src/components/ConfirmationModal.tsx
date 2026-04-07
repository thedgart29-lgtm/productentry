import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, HelpCircle, Trash2, Save, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'save' | 'delete' | 'info';
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText,
  cancelText = 'Cancel'
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const icons = {
    save: <Save className="text-blue-500" size={24} />,
    delete: <Trash2 className="text-red-500" size={24} />,
    info: <HelpCircle className="text-slate-500" size={24} />
  };

  const colors = {
    save: 'bg-blue-600 hover:bg-blue-700',
    delete: 'bg-red-600 hover:bg-red-700',
    info: 'bg-slate-900 hover:bg-slate-800'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
              type === 'save' ? "bg-blue-50" : type === 'delete' ? "bg-red-50" : "bg-slate-50"
            )}>
              {icons[type]}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{message}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="bg-slate-50/50 p-4 flex gap-3 justify-end border-t border-slate-100">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-700 transition-all"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold text-white shadow-lg transition-all active:scale-95",
              colors[type]
            )}
          >
            {confirmText || (type === 'delete' ? 'Delete' : 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
