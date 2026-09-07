import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ShoppingBag, ArrowRight } from 'lucide-react'
import { fmtCurrencyDirect } from '../../utils/currency'

export default function LiveOrderNotification() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [liveOrders, setLiveOrders] = useState([])
  const containerRef = useRef(null)

  // 🌟 Fetch Initial Live Orders on Mount
  const fetchLiveQueue = async () => {
    try {
      const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
      const token = sessionStorage.getItem('pos_token') || sessionStorage.getItem('token')
      const res = await fetch(`${baseUrl}/orders/live`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        // Only active/kitchen orders (PENDING, PREPARING)
        setLiveOrders(json.data.filter(o => o.status !== 'READY' && o.status !== 'COMPLETED'))
      }
    } catch {
      // Ignore background fetch error
    }
  }

  useEffect(() => {
    fetchLiveQueue()
  }, [])

  // 🌟 Real-time Native SSE Listener
  useEffect(() => {
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')
    const sseUrl = `${baseUrl}/api/sync/stream?tenantId=default-tenant&terminalId=SHOP`
    const eventSource = new EventSource(sseUrl)

    eventSource.onmessage = (event) => {
      try {
        const { event: evName, payload } = JSON.parse(event.data)
        if (evName === 'invoice_finalized' && payload) {
          // New web order arrives -> prepend and increase count
          setLiveOrders(prev => {
            const exists = prev.some(o => o.id === payload.id)
            if (exists) return prev
            return [payload, ...prev]
          })
        } else if (evName === 'order_status_changed' && payload) {
          // If marked READY or COMPLETED -> reduce count
          if (payload.status === 'READY' || payload.status === 'COMPLETED') {
            setLiveOrders(prev => prev.filter(o => o.id !== payload.id))
          }
        }
      } catch (e) {
        console.warn('[Notification SSE Error]:', e)
      }
    }

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