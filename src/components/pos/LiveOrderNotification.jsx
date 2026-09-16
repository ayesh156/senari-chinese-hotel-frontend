import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ShoppingBag, ArrowRight } from 'lucide-react'
import { fmtCurrencyDirect } from '../../utils/currency'
// 🌟 Use the authenticated POS apiClient to avoid manual token handling and 401 errors// 🌟 Import useLiveOrdersStore from frontend/src/utils/liveOrdersStore.js
import { useLiveOrdersStore } from '../../utils/liveOrdersStore.js';
import { useInvoiceStore } from '../../utils/invoiceStore.js';

export default function LiveOrderNotification() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  // 🌟 Directly use orders from liveOrdersStore to avoid 401 Unauthorized manual fetch errors
  const storeOrders = useLiveOrdersStore((state) => state.orders || []);
  const fetchLiveOrders = useLiveOrdersStore((state) => state.fetchLiveOrders);

  useEffect(() => {
    if (typeof fetchLiveOrders === 'function') {
      fetchLiveOrders();
    }
  }, [fetchLiveOrders]);

  // 🌟 Filter strictly for active WEB orders (ignores Walk-in / Quick POS transactions)
  const liveOrders = storeOrders.filter((o) => {
    const isNotDone = o.status !== 'READY' && o.status !== 'COMPLETED';
    if (!isNotDone) return false;

    // Detect Customer Phone from all possible object locations
    const phone = o.phone || o.customer?.phone || '';
    const customerName = o.customerName || o.customer?.name || '';

    // Check notes JSON for web identifiers
    let hasWebNotes = false;
    if (o.notes) {
      try {
        const parsed = typeof o.notes === 'string' ? JSON.parse(o.notes) : o.notes;
        if (parsed.phone || parsed.arrivalDate || parsed.source === 'WEB') {
          hasWebNotes = true;
        }
      } catch {}
    }

    // 🌟 A Web order has an explicit WEB source, a phone number, or arrival notes
    const isWebOrder = o.source === 'WEB' || Boolean(phone) || Boolean(o.arrivalDate) || hasWebNotes;
    const isWalkIn = customerName === 'Walk-in Customer' && !phone;

    return isWebOrder && !isWalkIn;
  });

// 🌟 Real-time Native SSE Listener (Handles order_created, invoice_finalized & default message)
  useEffect(() => {
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || sessionStorage.getItem('token') || ''
    const sseUrl = `${baseUrl}/api/sync/stream?tenantId=default-tenant&terminalId=SHOP${token ? `&token=${token}` : ''}`
    const eventSource = new EventSource(sseUrl)

    // 🌟 Millisecond-level Instant SSE Handler for Live Web Orders
    const handleIncomingOrder = (rawPayload) => {
      try {
        let order = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
        if (!order) return;
        if (order.payload && order.payload.id) order = order.payload;
        if (!order.id) return;

        // Quick POS counter orders are explicitly excluded
        if (order.source === 'POS') return;

        // 1. Immediately inject incoming order to Live Orders Store for instant badge bump
        useLiveOrdersStore.getState().addNewOrder(order);

        // 2. Trigger fresh background sync to guarantee full customer relations
        const liveStore = useLiveOrdersStore.getState();
        if (typeof liveStore.fetchLiveOrders === 'function') {
          liveStore.fetchLiveOrders();
        }

        // 3. Sync invoices store in parallel
        const invStore = useInvoiceStore.getState();
        if (typeof invStore.fetchOrders === 'function') {
          invStore.fetchOrders();
        } else if (typeof invStore.fetchInvoices === 'function') {
          invStore.fetchInvoices();
        }
      } catch (e) {
        console.warn('[Notification Parse Error]:', e);
      }
    };

    // 🌟 Listen to both standard named events
    eventSource.addEventListener('order_created', (e) => {
      try {
        const data = JSON.parse(e.data);
        handleIncomingOrder(data.payload || data);
      } catch (err) {
        console.warn('[SSE order_created error]', err);
      }
    });

    eventSource.addEventListener('invoice_finalized', (e) => {
      try {
        const data = JSON.parse(e.data);
        handleIncomingOrder(data.payload || data);
      } catch (err) {
        console.warn('[SSE invoice_finalized error]', err);
      }
    });

    // 🌟 Catch default SSE message stream as well as named events
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.event === 'order_created' || data.event === 'invoice_created' || data.event === 'invoice_finalized') {
          handleIncomingOrder(data.payload || data);
        }
      } catch {}
    };

    return () => eventSource.close()
  }, [])

  // Outside click listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const count = liveOrders.length

  const getCustomer = (order) => {
    if (order.customerName) return order.customerName
    if (order.customer?.name) return order.customer.name
    if (order.notes) {
      try {
        const parsed = typeof order.notes === 'string' ? JSON.parse(order.notes) : order.notes
        if (parsed.customerName) return parsed.customerName
      } catch {}
    }
    return 'Customer'
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* 🌟 Notification Bell Button */}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-amber-500 transition-colors"
        title="Live Orders Notifications"
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center animate-pulse">
            {count}
          </span>
        )}
      </button>

      {/* 🌟 Notification Dropdown Popup */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/40">
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Live Orders ({count})</span>
            <button
              onClick={() => { setOpen(false); navigate('/pos/invoices'); }}
              className="text-[11px] text-amber-500 hover:underline font-semibold"
            >
              View Invoices
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {count === 0 ? (
              <div className="p-6 text-center text-gray-400 text-xs font-medium">
                No active orders in kitchen
              </div>
            ) : (
              liveOrders.slice(0, 5).map(order => (
                <div
                  key={order.id}
                  onClick={() => { setOpen(false); navigate('/pos/invoices'); }}
                  className="p-3 hover:bg-amber-50/60 dark:hover:bg-gray-800/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      {order.invoiceNumber || `INV-${order.id}`}
                    </span>
                    <span className="text-xs font-extrabold text-gray-900 dark:text-gray-100">
                      {fmtCurrencyDirect(order.total || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                    <span className="truncate max-w-[150px]">{getCustomer(order)}</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[10px] font-semibold">
                      {order.type || order.orderType || 'Order'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {count > 0 && (
            <div className="p-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
              <button
                onClick={() => { setOpen(false); navigate('/pos/invoices'); }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 dark:hover:text-amber-400"
              >
                Go to Invoices <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}