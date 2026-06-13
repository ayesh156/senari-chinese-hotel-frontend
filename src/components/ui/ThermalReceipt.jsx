/**
 * ThermalReceipt.jsx
 *
 * Generates and prints an 80mm thermal-paper-style receipt by opening a
 * dedicated print window with fully self-contained HTML + CSS.
 *
 * Usage:
 *   import { printThermalReceipt } from './ThermalReceipt'
 *
 *   printThermalReceipt({
 *     invoiceNumber : 'INV-0042',
 *     orderType     : 'Dine-in',          // or 'Pick-up'
 *     tableNumber   : '5',                // optional
 *     cashierName   : 'Admin',
 *     items         : [{ name, qty, price }],
 *     subtotal      : 2400,
 *     discount      : 0,
 *     taxRate       : 5,                  // optional — % (e.g. 5 = 5%)
 *     serviceCharge : 10,                 // optional — % (e.g. 10 = 10%)
 *     total         : 2400,
 *     paymentMethod : 'Cash',
 *   })
 *
 * Returns a Promise that resolves when the print dialog closes (or rejects
 * if the popup is blocked).
 */

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => `Rs. ${Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`

/** Pad a string to `width` chars, aligning left or right */
const pad = (str, width, align = 'left') => {
  const s = String(str)
  if (s.length >= width) return s.slice(0, width)
  const spaces = ' '.repeat(width - s.length)
  return align === 'right' ? spaces + s : s + spaces
}

/** Build the full HTML string for the thermal receipt */
function buildReceiptHTML({
  invoiceNumber,
  orderType,
  tableNumber,
  customerName,
  cashierName,
  items,
  subtotal,
  discount,
  taxRate,
  serviceCharge,
  total,
  paymentMethod,
  issuedAt,
}) {
  const now = issuedAt ?? new Date()
  const dateStr = now.toLocaleDateString('en-LK', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
  const timeStr = now.toLocaleTimeString('en-LK', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  // 32-char wide receipt (standard 80mm @ 12pt monospace ≈ 32 chars)
  const W = 32
  const DASH = '-'.repeat(W)
  const DASH_THIN = '·'.repeat(W)

  // Build item rows — flex layout guarantees strict right-alignment of price
  const itemRows = items.map((item) => {
    const qtyPrice = `${item.qty} × ${fmt(item.price)}`
    const lineTotal = fmt(item.qty * item.price)
    // Name line — truncate if needed
    const nameLine = item.name.length > W ? item.name.slice(0, W - 1) + '…' : item.name
    return `<div class="item-name">${nameLine}</div>` +
           `<div class="item-detail"><span class="item-qty">${qtyPrice}</span><span class="item-total">${lineTotal}</span></div>`
  }).join('')

  // Discount row (only rendered when discount > 0)
  const discountLine = discount > 0
    ? `<div class="row"><span>Discount</span><span class="neg">- ${fmt(discount)}</span></div>`
    : ''

  // Tax row (only rendered when taxRate > 0)
  const afterDiscount = subtotal - (discount || 0)
  const taxAmt = (taxRate > 0) ? Math.round(afterDiscount * taxRate / 100) : 0
  const taxLine = taxAmt > 0
    ? `<div class="row"><span>Tax (${taxRate}%)</span><span>${fmt(taxAmt)}</span></div>`
    : ''

  // Service charge row (only rendered when serviceCharge > 0)
  const serviceAmt = (serviceCharge > 0) ? Math.round(afterDiscount * serviceCharge / 100) : 0
  const serviceLine = serviceAmt > 0
    ? `<div class="row"><span>Service (${serviceCharge}%)</span><span>${fmt(serviceAmt)}</span></div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Receipt ${invoiceNumber}</title>
  <style>
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Page: 80mm thermal roll ── */
    @page {
      size: 80mm auto;
      margin: 2mm 3mm;
    }

    body {
      background: #fff;
      color: #000;
      font-family: 'Courier New', Courier, 'Lucida Console', monospace;
      font-size: 11pt;
      line-height: 1.4;
      width: 74mm;          /* 80mm - 2×3mm margin */
      margin: 0 auto;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Receipt wrapper ── */
    .receipt {
      width: 100%;
      padding: 1mm 0;
    }

    /* ── Header ── */
    .header {
      text-align: center;
      margin-bottom: 2mm;
    }
    .header .logo {
      font-size: 15pt;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .header .tagline {
      font-size: 8pt;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 0.5mm;
    }
    .header .address {
      font-size: 8pt;
      margin-top: 1mm;
      line-height: 1.35;
    }

    /* ── Dividers ── */
    .dash      { font-size: 9pt; letter-spacing: 0; white-space: pre; overflow: hidden; }
    .dash-thin { font-size: 9pt; letter-spacing: 0; white-space: pre; overflow: hidden; color: #555; }

    /* ── Meta rows ── */
    .meta { font-size: 9pt; margin: 0.5mm 0; }
    .meta .row {
      display: flex;
      justify-content: space-between;
    }
    .meta .label { color: #444; }
    .meta .value { font-weight: 700; }

    /* ── Section title ── */
    .section-title {
      text-align: center;
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin: 1.5mm 0 0.5mm;
    }

    /* ── Items ── */
    .items { margin: 0.5mm 0; }
    .item-name {
      font-size: 10pt;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    /* Flex row: qty×price left, line-total strictly right */
    .item-detail {
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
      color: #333;
      margin-bottom: 1mm;
    }
    .item-qty   { flex: 1; }
    .item-total { text-align: right; white-space: nowrap; }

    /* ── Totals ── */
    .totals { margin: 0.5mm 0; font-size: 10pt; }
    .totals .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5mm;
    }
    .totals .neg { color: #000; }
    .totals .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 13pt;
      font-weight: 900;
      margin-top: 1mm;
      padding-top: 1mm;
      border-top: 2px solid #000;
    }

    /* ── Payment ── */
    .payment {
      font-size: 9pt;
      margin: 1mm 0;
    }
    .payment .row {
      display: flex;
      justify-content: space-between;
    }

    /* ── Footer ── */
    .footer {
      text-align: center;
      font-size: 8.5pt;
      margin-top: 2mm;
      line-height: 1.5;
    }
    .footer .thank-you {
      font-size: 11pt;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 0.5mm;
    }
    .footer .website {
      font-size: 8pt;
      letter-spacing: 1px;
    }

    /* ── Screen-only: preview card ── */
    @media screen {
      body {
        background: #f5f5f5;
        padding: 10mm;
        width: auto;
      }
      .receipt {
        background: #fff;
        box-shadow: 0 4px 24px rgba(0,0,0,0.15);
        padding: 5mm 4mm;
        width: 80mm;
        margin: 0 auto;
      }
    }

    /* ── Print: hide everything except receipt ── */
    @media print {
      body { background: #fff; padding: 0; width: 74mm; }
      .receipt { box-shadow: none; }
    }
  </style>
</head>
<body>
<div class="receipt">

  <!-- ── HEADER ── -->
  <div class="header">
    <div class="logo">SENARI CHINESE HOTEL</div>
    <div class="tagline">Authentic Chinese Cuisine</div>
    <div class="address">
      5H6MCMP, Mulatiyana<br>
      Tel: +94 76 280 1006
    </div>
  </div>

  <div class="dash">${DASH}</div>

  <!-- ── META ── -->
  <div class="meta">
    <div class="row"><span class="label">Invoice :</span><span class="value">${invoiceNumber}</span></div>
    <div class="row"><span class="label">Date    :</span><span class="value">${dateStr}</span></div>
    <div class="row"><span class="label">Time    :</span><span class="value">${timeStr}</span></div>
    <div class="row"><span class="label">Type    :</span><span class="value">${orderType}${tableNumber ? ` · Table ${tableNumber}` : ''}</span></div>
    ${customerName ? `<div class="row"><span class="label">Customer:</span><span class="value">${customerName}</span></div>` : ''}
    <div class="row"><span class="label">Cashier :</span><span class="value">${cashierName}</span></div>
  </div>

  <div class="dash">${DASH}</div>

  <!-- ── ITEMS ── -->
  <div class="section-title">Order Items</div>
  <div class="dash-thin">${DASH_THIN}</div>
  <div class="items">
    ${itemRows}
  </div>
  <div class="dash-thin">${DASH_THIN}</div>

  <!-- ── TOTALS ── -->
  <div class="totals">
    <div class="row">
      <span>Subtotal</span>
      <span>${fmt(subtotal)}</span>
    </div>
    ${discountLine}
    ${taxLine}
    ${serviceLine}
    <div class="total-row">
      <span>TOTAL</span>
      <span>${fmt(total)}</span>
    </div>
  </div>

  <div class="dash">${DASH}</div>

  <!-- ── PAYMENT ── -->
  <div class="payment">
    <div class="row">
      <span>Payment</span>
      <span><strong>${paymentMethod}</strong></span>
    </div>
    <div class="row">
      <span>Status</span>
      <span><strong>PAID</strong></span>
    </div>
  </div>

  <div class="dash">${DASH}</div>

  <!-- ── FOOTER ── -->
  <div class="footer">
    <div class="thank-you">Thank You!</div>
    <div>Please come again</div>
    <div>Pick-up &amp; Dine-in only · Pay at Counter</div>
    <div class="website">www.senarichinese.lk</div>
  </div>

</div>
</body>
</html>`
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Opens a print window with a thermal receipt and triggers the browser
 * print dialog. Returns a Promise that resolves after the dialog closes.
 *
 * @param {object} receiptData
 * @returns {Promise<void>}
 */
export function printThermalReceipt(receiptData) {
  return new Promise((resolve, reject) => {
    // Open a small popup window sized for an 80mm receipt preview
    const win = window.open(
      '',
      '_blank',
      'width=340,height=600,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes'
    )

    if (!win) {
      reject(new Error('Popup blocked. Please allow popups for this site.'))
      return
    }

    const html = buildReceiptHTML(receiptData)
    win.document.open()
    win.document.write(html)
    win.document.close()

    // Wait for resources to load, then print
    win.onload = () => {
      // Small delay ensures fonts/layout are fully rendered
      setTimeout(() => {
        win.focus()
        win.print()

        // Resolve after print dialog closes (afterprint fires on most browsers)
        const cleanup = () => {
          resolve()
          win.close()
        }

        if ('onafterprint' in win) {
          win.onafterprint = cleanup
          // Fallback timeout in case onafterprint doesn't fire
          setTimeout(cleanup, 30_000)
        } else {
          // Safari fallback
          setTimeout(cleanup, 1_000)
        }
      }, 250)
    }
  })
}

export default printThermalReceipt
