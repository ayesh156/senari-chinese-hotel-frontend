import { Printer, X } from 'lucide-react'
import { printThermalReceipt } from '../ui/ThermalReceipt'
import { buildReceiptData, buildReceiptStyles, buildReceiptBody } from '../ui/receiptTemplate'
import { useSettingsStore } from '../../utils/settingsStore'
import { useAuthStore } from '../../utils/authStore'

/**
 * Shared Receipt Preview Modal — 80mm thermal paper style.
 *
 * Renders the EXACT same markup + CSS as the print output (see
 * ../ui/receiptTemplate.js), so the on-screen preview and the
 * browser/thermal print output are structurally and visually identical.
 *
 * Props:
 *   isOpen  — boolean, controls visibility
 *   onClose — () => void
 *   order   — the order/invoice object from the API
 */
export default function ReceiptModal({ isOpen, onClose, order }) {
  const hotelName = useSettingsStore(s => s.hotelName)
  const tagline = useSettingsStore(s => s.tagline)
  const currencySymbol = useSettingsStore(s => s.currencySymbol)
  const address = useSettingsStore(s => s.address)
  const phone = useSettingsStore(s => s.phone)
  const authUser = useAuthStore(s => s.user)

  if (!isOpen || !order) return null

  const settings = { hotelName, tagline, currencySymbol, address, phone }

  // Single normalized receipt payload — the SAME object passed to the printer,
  // so the preview can never drift from the print output.
  const receipt = buildReceiptData(order, { settings, authUser })

  function handlePrint() {
    printThermalReceipt(receipt)
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
          {/* Shared receipt CSS (also injected into the print document) */}
          <style>{buildReceiptStyles()}</style>

          {/* Receipt paper — shared template, identical to print output */}
          <div
            className="sc-receipt rounded-xl shadow-lg border border-gray-200"
            dangerouslySetInnerHTML={{ __html: buildReceiptBody(receipt) }}
          />
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
