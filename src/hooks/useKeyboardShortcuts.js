import { useEffect, useRef } from 'react';

/**
 * Custom hook for QuickPOS keyboard shortcuts.
 * F4=Search focus, F8=Discount focus, F9=Cash focus, F10=Toggle order type, F11=Toggle discount type, F12=Pay
 */
export function useKeyboardShortcuts({ searchRef, discountInputRef, customerCashInputRef, setOrderType, setDiscountType, setDiscount, handlePayRef }) {
  useEffect(() => {
    const handler = (e) => {
      switch (e.key) {
        case 'F4':
          e.preventDefault();
          searchRef.current?.focus();
          break;
        case 'F8':
          e.preventDefault();
          discountInputRef.current?.focus();
          break;
        case 'F9':
          e.preventDefault();
          customerCashInputRef.current?.focus();
          break;
        case 'F10':
          e.preventDefault();
          setOrderType(v => v === 'Dine-in' ? 'Takeaway' : v === 'Takeaway' ? 'Delivery' : 'Dine-in');
          break;
        case 'F11':
          e.preventDefault();
          setDiscountType(v => v === '%' ? 'fixed' : '%');
          setDiscount('');
          break;
        case 'F12':
          e.preventDefault();
          handlePayRef.current?.();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchRef, discountInputRef, customerCashInputRef, setOrderType, setDiscountType, setDiscount, handlePayRef]);
}