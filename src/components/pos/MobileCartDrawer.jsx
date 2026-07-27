import { useEffect } from 'react';
import { X } from 'lucide-react';
import CartPanel from './CartPanel';

export default function MobileCartDrawer({ open, onClose, ...cartProps }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <>
      <div aria-hidden="true" onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <div role="dialog"
        className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl transition-transform duration-300 ${open ? 'translate-y-0' : 'translate-y-full'} max-h-[85vh]`}>
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="flex items-center justify-between px-5 py-2 shrink-0">
          <h2 className="font-bold text-gray-900 text-lg">Order Ticket</h2>
          <button onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <CartPanel {...cartProps} onPay={() => { cartProps.onPay(); onClose(); }} />
        </div>
      </div>
    </>
  );
}