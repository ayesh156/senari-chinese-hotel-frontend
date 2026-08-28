/**
 * receiptTemplate.js
 *
 * Single source of truth for the 80mm thermal POS receipt. It is shared by BOTH
 * the on-screen ReceiptModal preview and the browser/thermal print output
 * (ThermalReceipt), so the preview and the printed paper are guaranteed to be
 * identical: same markup, same CSS, same normalized data.
 *
 * Usage:
 *   import { buildReceiptData, buildReceiptBody, buildReceiptHTML } from './receiptTemplate'
 *
 *   const receipt = buildReceiptData(order, { settings, authUser })
 *   const html    = buildReceiptHTML(receipt)   // full standalone document for print
 *   const body    = buildReceiptBody(receipt)   // receipt fragment for the modal preview
 */
import { fmtCurrencyDirect } from '../../utils/currency'

// ── Branding & layout constants ──────────────────────────────────────────────
export const RECEIPT_CONSTANTS = {
  logoPath: '/images/logo.jpeg',
  fallbackHotelName: 'Senari Chinese Hotel',
  fallbackTagline: 'Authentic Chinese Cuisine',
  fallbackAddress: 'Senari Restaurant, Mulatiyana.',
  fallbackPhone: '+94 76 280 1006',
  // Developer attribution — fixed bottom brand line (standard POS format)
  developerAttribution: 'Software by nebulainfinite - 078 3233 760',
  // 80mm roll minus 2×3mm @page margins → 74mm printable body width
  paperWidth: '74mm',
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0

function escapeHTML(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]))
}

/**
 * Safely resolve the cashier/operator name for the receipt.
 * Precedence:
 *   1. order.cashierName / order.cashier / order.operatorName  (raw strings)
 *   2. order.cashier?.name / order.operator?.name / order.user?.name
 *   3. logged-in auth user (authUser?.name)
 *   4. 'Admin' fallback — never renders "undefined"
 */
export function resolveCashierName(order = {}, authUser) {
  const o = order || {}
  const candidates = [
    o.cashierName,
    isNonEmptyString(o.cashier) ? o.cashier : null,
    o.operatorName,
    o.cashier?.name,
    o.operator?.name,
    o.user?.name,
    authUser?.name,
  ]
  return candidates.find(isNonEmptyString) || 'Admin'
}

/**
 * Normalize a backend order into the flat receipt payload consumed by BOTH the
 * preview and the print template. Every display field (invoice, date, time,
 * type, customer, cashier, status, footer) is resolved here ONCE so the two
 * views can never drift apart.
 *
 * @param {object} order  - raw order/invoice object from the API
 * @param {object} opts   - { settings, authUser }
 */
export function buildReceiptData(order = {}, opts = {}) {
  const settings = opts.settings || {}
  const authUser = opts.authUser || null
  order = order || {} // null-safe: never crash on a missing order

  // ── Branding / header ──
  const hotelName = settings.hotelName || RECEIPT_CONSTANTS.fallbackHotelName
  const tagline = settings.tagline || RECEIPT_CONSTANTS.fallbackTagline
  const address = settings.address || RECEIPT_CONSTANTS.fallbackAddress
  const phone = settings.phone || RECEIPT_CONSTANTS.fallbackPhone
  const logoPath = RECEIPT_CONSTANTS.logoPath

  // ── Timestamps ──
  const issuedAt = new Date(order.createdAt || Date.now())
  const dateStr = issuedAt.toLocaleDateString('en-LK', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
  const timeStr = issuedAt.toLocaleTimeString('en-LK', {
    hour: '2-digit', minute: '2-digit',
  })

  // ── Identity ──
  const invoiceNumber = order.invoiceNumber || `INV-${String(order.id).padStart(3, '0')}`
  const orderType = order.type === 'DELIVERY' ? 'Delivery'
    : order.type === 'TAKEAWAY' ? 'Takeaway'
    : 'Dine-in'
  const tableNumber = order.table?.tableNumber || order.tableNumber || null

  // Customer name: direct field → related customer → notes JSON → fallback
  let customerName = order.customerName
  if (!customerName && order.customer?.name) customerName = order.customer.name
  let paymentMethod = order.paymentMethod
  if (order.notes) {
    try {
      const parsed = JSON.parse(order.notes)
      if (!customerName && parsed.customerName) customerName = parsed.customerName
      if (!paymentMethod && parsed.paymentMethod) paymentMethod = parsed.paymentMethod
    } catch { /* notes not JSON — ignore */ }
  }
  if (!customerName) customerName = 'Walk-in Customer'

  const cashierName = resolveCashierName(order, authUser)


  // ── Money ──
  const items = (order.items || []).map((i) => ({
    name: i.food?.name || i.name || 'Item',
    qty: Number(i.quantity || 0),
    price: Number(i.unitPrice ?? i.price ?? 0),
  }))

  const subtotal = Number(order.subtotal || 0)
  const discount = Number(order.discount || 0)
  const total = Number(order.total || 0)
  const amountPaid = Number(order.amountPaid || 0)
  const paymentStatus = order.paymentStatus || 'UNPAID'
  if (!paymentMethod) paymentMethod = 'Cash'

  const statusText = paymentStatus === 'PAID'
    ? 'PAID'
    : paymentStatus === 'PARTIAL'
      ? `PARTIAL (${fmtCurrencyDirect(amountPaid)})`
      : 'NOT PAID'

  return {
    // identity
    invoiceNumber,
    orderType,
    tableNumber,
    customerName,
    cashierName,
    // money
    items,
    subtotal,
    discount,
    total,
    amountPaid,
    // payment
    paymentMethod,
    paymentStatus,
    statusText,
    // branding
    hotelName,
    tagline,
    address,
    phone,
    logoPath,
    // timestamps
    issuedAt,
    dateStr,
    timeStr,
  }
}

// ── Shared CSS (used by the modal preview AND the print document) ────────────
export function buildReceiptStyles() {
  return `
    .sc-receipt {
      width: ${RECEIPT_CONSTANTS.paperWidth};
      max-width: 100%;
      margin: 0 auto;
      padding: 5mm 4mm;
      box-sizing: border-box;
      background: #fff;
      color: #000;
      font-family: 'Courier New', Courier, 'Lucida Console', monospace;
      font-size: 9pt;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sc-receipt * { box-sizing: border-box; }

    /* ── Header ── */
    .sc-receipt .header { text-align: center; margin-bottom: 2.5mm; }
    .sc-receipt .logo-img {
      width: 18mm;
      height: 18mm;
      object-fit: cover;
      border-radius: 2mm;
      display: block;
      margin: 0 auto 1.5mm;
    }
    .sc-receipt .hotel-name {
      font-size: 13pt;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
      white-space: nowrap;          /* keep "SENARI CHINESE HOTEL" on ONE line */
      overflow: hidden;
    }
    .sc-receipt .tagline {
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 1mm;
    }
    .sc-receipt .address { font-size: 8pt; margin-top: 1mm; line-height: 1.35; }
    .sc-receipt .address .tel { margin-top: 0.5mm; }

    /* ── Dividers ── */
    .sc-receipt .divider-dashed {
      border-top: 1px dashed rgba(0, 0, 0, 0.35);
      margin: 2mm 0;
    }
    .sc-receipt .divider-solid {
      border-top: 2px solid #000;
      margin: 1.5mm 0;
    }

    /* ── Rows ── */
    .sc-receipt .row { display: flex; justify-content: space-between; align-items: baseline; }
    .sc-receipt .row .label { font-weight: 700; }
    .sc-receipt .row .value { font-weight: 700; }

    /* ── Meta ── */
    .sc-receipt .meta { display: flex; flex-direction: column; gap: 0.5mm; }

    /* ── Section title ── */
    .sc-receipt .section-title {
      text-align: center;
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin: 1mm 0;
    }

    /* ── Items ── */
    .sc-receipt .items { display: flex; flex-direction: column; gap: 1.5mm; }
    .sc-receipt .item-name {
      font-size: 10pt;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sc-receipt .item-detail {
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
      color: rgba(0, 0, 0, 0.75);
    }

    /* ── Totals ── */
    .sc-receipt .totals { display: flex; flex-direction: column; gap: 0.5mm; }
    .sc-receipt .total-row {
      font-weight: 900;
      padding-top: 1mm;
      margin-top: 1mm;
      border-top: 2px solid #000;
    }

    /* ── Payment ── */
    .sc-receipt .payment { display: flex; flex-direction: column; gap: 0.5mm; }

    /* ── Footer ── */
    .sc-receipt .footer {
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 1mm;
      padding-bottom: 3mm;   /* keep the developer line clear of the slip cut / modal edge */
    }
    .sc-receipt .footer .divider-dashed { margin: 1mm 0; }
    .sc-receipt .footer .thank-you {
      font-size: 11pt;
      font-weight: 900;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-top: 1mm;
    }
    .sc-receipt .footer .developer {
      font-size: 8pt;
      letter-spacing: 0.5px;
      color: rgba(0, 0, 0, 0.65);
    }

    @media print {
      .sc-receipt { box-shadow: none; padding: 0; }
    }
  `
}

// ── Shared receipt markup (modal preview + print body) ───────────────────────
export function buildReceiptBody(d) {
  const currency = (v) => fmtCurrencyDirect(v)

  const itemRows = (d.items || []).map((item) => {
    const qtyPrice = `${item.qty} × ${currency(item.price)}`
    const lineTotal = currency(item.qty * item.price)
    return (
      `<div class="item-name">${escapeHTML(item.name)}</div>` +
      `<div class="item-detail"><span>${qtyPrice}</span><span>${lineTotal}</span></div>`
    )
  }).join('')

  const discountRow = d.discount > 0
    ? `<div class="row"><span>Discount</span><span>- ${currency(d.discount)}</span></div>`
    : ''

  const tableSuffix = d.tableNumber ? ` · Table ${d.tableNumber}` : ''

  return `
    <!-- ── HEADER ── -->
    <div class="header">
      <img class="logo-img" src="${d.logoPath}" alt="Senari Chinese Hotel logo" />
      <div class="hotel-name">${escapeHTML(d.hotelName)}</div>
      <div class="tagline">${escapeHTML(d.tagline)}</div>
      <div class="address">
        <div>${escapeHTML(d.address)}</div>
        <div class="tel">Tel: ${escapeHTML(d.phone)}</div>
      </div>
    </div>

    <div class="divider-dashed"></div>

    <!-- ── META ── -->
    <div class="meta">
      <div class="row"><span class="label">Invoice</span><span class="value">${escapeHTML(d.invoiceNumber)}</span></div>
      <div class="row"><span class="label">Date</span><span class="value">${escapeHTML(d.dateStr)}</span></div>
      <div class="row"><span class="label">Time</span><span class="value">${escapeHTML(d.timeStr)}</span></div>
      <div class="row"><span class="label">Type</span><span class="value">${escapeHTML(d.orderType)}${escapeHTML(tableSuffix)}</span></div>
      <div class="row"><span class="label">Customer</span><span class="value">${escapeHTML(d.customerName)}</span></div>
      <div class="row"><span class="label">Cashier</span><span class="value">${escapeHTML(d.cashierName)}</span></div>
    </div>

    <div class="divider-dashed"></div>

    <!-- ── ITEMS ── -->
    <div class="section-title">Order Items</div>
    <div class="divider-dashed"></div>
    <div class="items">
      ${itemRows}
    </div>

    <div class="divider-dashed"></div>

    <!-- ── TOTALS ── -->
    <div class="totals">
      <div class="row"><span>Subtotal</span><span>${currency(d.subtotal)}</span></div>
      ${discountRow}
      <div class="total-row row"><span>TOTAL</span><span>${currency(d.total)}</span></div>
    </div>

    <div class="divider-dashed"></div>

    <!-- ── PAYMENT ── -->
    <div class="payment">
      <div class="row"><span class="label">Payment</span><span>${escapeHTML(d.paymentMethod)}</span></div>
      <div class="row"><span class="label">Status</span><span>${escapeHTML(d.statusText)}</span></div>
    </div>

    <!-- ── FOOTER ── -->
    <div class="footer">
      <div class="divider-dashed"></div>
      <div class="thank-you">Thank You!</div>
      <div>Please come again</div>
      <div class="divider-dashed"></div>
      <div class="developer">${escapeHTML(RECEIPT_CONSTANTS.developerAttribution)}</div>
    </div>
  `
}

// ── Full standalone HTML document for the print window ───────────────────────
export function buildReceiptHTML(d) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Receipt ${d.invoiceNumber}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* 80mm thermal roll */
    @page { size: 80mm auto; margin: 2mm 3mm; }

    body {
      background: #fff;
      color: #000;
      font-family: 'Courier New', Courier, 'Lucida Console', monospace;
      width: 74mm;            /* 80mm - 2×3mm margin */
      margin: 0 auto;
    }

    ${buildReceiptStyles()}

    /* ── Screen-only: preview card in the popup window ── */
    @media screen {
      body { background: #f5f5f5; padding: 8mm 0; width: auto; }
      .sc-receipt { box-shadow: 0 4px 24px rgba(0, 0, 0, 0.18); }
    }

    /* ── Print: crisp black-on-white, no shadows ── */
    @media print {
      body { background: #fff; padding: 0; width: 74mm; }
      .sc-receipt { box-shadow: none; }
    }
  </style>
</head>
<body>
<div class="sc-receipt">
  ${buildReceiptBody(d)}
</div>
</body>
</html>`
}

