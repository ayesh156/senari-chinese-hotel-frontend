import { Printer, X } from 'lucide-react'
import { printThermalReceipt } from '../ui/ThermalReceipt'

const fmtM = (n) => `Rs. ${Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`

/**
 * Extract customer name from order notes JSON or fallback
 */
function getName(order) {
  if (order.customerName) return order.customerName
  try {
    if (order.notes) {
      const parsed = JSON.parse(order.notes)
      if (parsed.customerName) return parsed.customerName
    }
  } catch {}
  return 'Walk-in Customer'
}

/**
 * Shared Receipt Preview Modal — 80mm thermal paper style.
 *
 * Props:
 *   isOpen      — boolean, controls visibility
 *   onClose     — () => void
 *   order       — the order/invoice object from the API
 */
export default function ReceiptModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null

  const dateStr = new Date(order.createdAt || Date.now()).toLocaleDateString('en-LK', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
  const timeStr = new Date(order.createdAt || Date.now()).toLocaleTimeString('en-LK', {
    hour: '2-digit', minute: '2-digit',
  })
  const customerName = getName(order)
  const invNum = order.invoiceNumber || `INV-${String(order.id).padStart(3, '0')}`

  const items = (order.items || []).map(i => ({
    name: i.food?.name || i.name || 'Item',
    qty: i.quantity,
    price: i.unitPrice,
  }))

  function handlePrint() {
    printThermalReceipt({
      invoiceNumber: invNum,
      orderType: order.type === 'DINE_IN' ? 'Dine-in' : 'Takeaway',
      customerName,
      items,
      subtotal: order.subtotal,
      discount: Number(order.discount || 0),
      total: Number(order.total || 0),
      paymentMethod: 'Cash',
      issuedAt: new Date(),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
          <span className="text-sm font-bold text-gray-900 dark:text-white">Receipt</span>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable paper area */}
        <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-800 px-4 py-5">
          {/* Receipt paper — ALL text pure black on white */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 px-5 py-5 flex flex-col gap-2 font-mono">

            {/* ── Header ── */}
            <div className="text-center mb-1">
              <p className="text-base font-black tracking-widest uppercase text-black">SENARI CHINESE</p>
              <p className="text-base font-black tracking-widest uppercase text-black">HOTEL</p>
              <p className="text-[10px] tracking-[3px] uppercase text-black/60">Authentic Chinese Cuisine</p>
              <p className="text-[10px] text-black/50 mt-0.5 leading-snug">Senari Chinese Hotel, Sri Lanka</p>
            </div>

            <p className="border-t border-dashed border-black/20 my-1" />

            {/* ── Meta ── */}
            <div className="flex flex-col gap-0.5 text-[11px] text-black">
              <div className="flex justify-between"><span className="font-bold">Invoice:</span><span>{invNum}</span></div>
              <div className="flex justify-between"><span className="font-bold">Date:</span><span>{dateStr}</span></div>
              <div className="flex justify-between"><span className="font-bold">Time:</span><span>{timeStr}</span></div>
              <div className="flex justify-between"><span className="font-bold">Type:</span><span>{order.type === 'DINE_IN' ? 'Dine-in' : 'Takeaway'}</span></div>
              <div className="flex justify-between"><span className="font-bold">Customer:</span><span>{customerName}</span></div>
            </div>

            <p className="border-t border-dashed border-black/20 my-1" />

            <p className="text-center text-[10px] font-bold tracking-[3px] uppercase text-black/60">Order Items</p>

            <p className="border-t border-dashed border-black/20 my-1" />

            {/* ── Items ── */}
            <div className="flex flex-col gap-1.5">
              {items.map((item, idx) => (
                <div key={idx} className="text-[11px] text-black">
                  <p className="font-bold truncate">{item.name}</p>
                  <div className="flex justify-between text-black/70">
                    <span>{item.qty} × {fmtM(item.price)}</span>
                    <span className="tabular-nums">{fmtM(Number(item.price) * Number(item.qty))}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="border-t border-dashed border-black/20 my-1" />

            {/* ── Totals ── */}
            <div className="flex flex-col gap-0.5 text-[11px] text-black">
              <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{fmtM(order.subtotal)}</span></div>
              {Number(order.discount || 0) > 0 && (
                <div className="flex justify-between"><span>Discount</span><span className="tabular-nums text-black/60">− {fmtM(order.discount)}</span></div>
              )}
              <div className="flex justify-between border-t-2 border-black pt-1 mt-1">
                <span className="font-bold">TOTAL</span>
                <span className="font-bold tabular-nums">{fmtM(order.total || 0)}</span>
              </div>
            </div>

            <p className="border-t border-dashed border-black/20 my-1" />

            {/* ── Payment ── */}
            <div className="flex flex-col gap-0.5 text-[11px] text-black">
              <div className="flex justify-between"><span className="font-bold">Payment</span><span>Cash</span></div>
              <div className="flex justify-between"><span className="font-bold">Status</span><span className="text-black">✓ PAID</span></div>
            </div>

            <p className="border-t border-dashed border-black/20 my-1" />

            {/* ── Footer ── */}
            <div className="text-center mt-1 flex flex-col gap-0.5 text-black">
              <p className="text-xs font-black tracking-widest uppercase">Thank You!</p>
              <p className="text-[10px] text-black/60">Please come again</p>
              <p className="text-[10px] text-black/50">Pay at Counter</p>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 shrink-0 flex gap-2">
          <button onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-md shadow-amber-500/20">
            <Printer size={15} /> Print Receipt
          </button>
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 dark:border-gray-600">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}