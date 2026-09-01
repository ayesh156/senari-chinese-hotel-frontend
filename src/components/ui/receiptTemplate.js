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
import { fmtCurrencyDirect } from "../../utils/currency";

// ── Branding & layout constants ──────────────────────────────────────────────
export const RECEIPT_CONSTANTS = {
  logoPath: "/images/logo.jpeg",
  fallbackHotelName: "Senari Restaurant",
  fallbackTagline: "Authentic Chinese Cuisine",
  fallbackAddress: "Senari Restaurant, Mulatiyana.",
  fallbackPhone: "076 280 1006",
  // Developer attribution — fixed bottom brand line (standard POS format)
  developerAttribution: "Software by nebulainfinite - 078 3233 760",
  // 80mm roll minus 2×3mm @page margins → 74mm printable body width
  paperWidth: "74mm",
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

function escapeHTML(str) {
  return String(str ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
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
  const o = order || {};
  const candidates = [
    o.cashierName,
    isNonEmptyString(o.cashier) ? o.cashier : null,
    o.operatorName,
    o.cashier?.name,
    o.operator?.name,
    o.user?.name,
    authUser?.name,
  ];
  return candidates.find(isNonEmptyString) || "Admin";
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
  const settings = opts.settings || {};
  const authUser = opts.authUser || null;
  order = order || {}; // null-safe: never crash on a missing order

  // ── Branding / header ──
  const hotelName = "Senari Restaurant";
  const tagline = settings.tagline || RECEIPT_CONSTANTS.fallbackTagline;
  const address = settings.address || RECEIPT_CONSTANTS.fallbackAddress;
  const phone = "076 280 1006";
  const logoPath = RECEIPT_CONSTANTS.logoPath;

  // ── Timestamps ──
  const issuedAt = new Date(order.createdAt || Date.now());
  const dateStr = issuedAt.toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = issuedAt.toLocaleTimeString("en-LK", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // ── Identity ──
  const invoiceNumber =
    order.invoiceNumber || `INV-${String(order.id).padStart(3, "0")}`;
  const orderType =
    order.type === "DELIVERY"
      ? "Delivery"
      : order.type === "TAKEAWAY"
        ? "Takeaway"
        : "Dine-in";
  const tableNumber = order.table?.tableNumber || order.tableNumber || null;

  // Customer name: direct field → related customer → notes JSON → fallback
  let customerName = order.customerName;
  if (!customerName && order.customer?.name) customerName = order.customer.name;
  let paymentMethod = order.paymentMethod;
  if (order.notes) {
    try {
      const parsed = JSON.parse(order.notes);
      if (!customerName && parsed.customerName)
        customerName = parsed.customerName;
      if (!paymentMethod && parsed.paymentMethod)
        paymentMethod = parsed.paymentMethod;
    } catch {
      /* notes not JSON — ignore */
    }
  }
  if (!customerName) customerName = "Walk-in Customer";

  const cashierName = resolveCashierName(order, authUser);

  // ── Money ──
  const items = (order.items || []).map((i) => ({
    name: i.food?.name || i.name || "Item",
    qty: Number(i.quantity || 0),
    price: Number(i.unitPrice ?? i.price ?? 0),
  }));

  const subtotal = Number(order.subtotal || 0);
  const discount = Number(order.discount || 0);
  const total = Number(order.total || 0);
  const amountPaid = Number(order.amountPaid || 0);
  const paymentStatus = order.paymentStatus || "UNPAID";
  if (!paymentMethod) paymentMethod = "Cash";

  const statusText =
    paymentStatus === "PAID"
      ? "PAID"
      : paymentStatus === "PARTIAL"
        ? `PARTIAL (${fmtCurrencyDirect(amountPaid)})`
        : "NOT PAID";

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
  };
}

// ── Shared CSS (used by the modal preview AND the print document) ────────────
export function buildReceiptStyles() {
  return `
    .sc-receipt {
      width: ${RECEIPT_CONSTANTS.paperWidth};
      max-width: 100%;
      margin: 0 auto;
      padding: 4mm 3mm;
      box-sizing: border-box;
      background: #fff;
      color: #000000 !important;
      font-family: Arial, Helvetica, sans-serif !important;
      font-size: 8.5pt;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sc-receipt * { box-sizing: border-box; color: #000000 !important; }

    /* ── Header ── */
    .sc-receipt .header { text-align: center; margin-bottom: 2mm; }
    .sc-receipt .logo-img {
      width: 16mm;
      height: 16mm;
      object-fit: cover;
      display: block;
      margin: 0 auto 1.5mm;
    }
    .sc-receipt .hotel-name {
      font-size: 11pt;
      font-weight: 900 !important;
      letter-spacing: 1px;
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
    }
    .sc-receipt .address { 
      font-size: 7.5pt; 
      font-weight: 500;
      margin-top: 1mm; 
      line-height: 1.3; 
    }
    .sc-receipt .address .tel { margin-top: 0.5mm; font-weight: 700; }

    /* ── Dividers ── */
    .sc-receipt .divider-line {
      border-top: 1px solid #000000 !important;
      margin: 2mm 0;
    }
    .sc-receipt .divider-dotted {
      border-top: 1px dotted #000000 !important;
      margin: 1.5mm 0;
    }

    /* ── 2-Column Metadata ── */
    .sc-receipt .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1mm 2mm;
      font-size: 7.5pt;
    }
    .sc-receipt .meta-grid .text-right { text-align: right; }
    .sc-receipt .lbl { font-weight: 600; font-size: 7pt; text-transform: uppercase; }
    .sc-receipt .val { font-weight: 800; font-size: 7.8pt; }

    /* ── Items Table ── */
    .sc-receipt .items-container {
      display: flex;
      flex-direction: column;
      gap: 1.8mm;
      margin: 1mm 0;
    }
    .sc-receipt .item-entry {
      display: flex;
      flex-direction: column;
      gap: 0.3mm;
    }
    .sc-receipt .item-name {
      font-size: 8.5pt;
      font-weight: 800 !important;
      line-height: 1.25;
      word-break: break-word;
    }
    .sc-receipt .item-math {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 7.8pt;
    }
    .sc-receipt .qty-calc {
      font-weight: 600;
      letter-spacing: 0.2px;
    }
    .sc-receipt .line-total {
      font-weight: 800 !important;
    }

    /* ── Totals ── */
    .sc-receipt .summary-section { margin-top: 1mm; font-size: 8pt; }
    .sc-receipt .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5mm 0;
      font-weight: 600;
    }
    .sc-receipt .total-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      padding: 1.5mm 0;
      margin: 1.5mm 0 2mm 0;
      font-size: 10pt;
      font-weight: 900 !important;
    }

    /* ── Payment Info ── */
    .sc-receipt .payment-bar {
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      font-weight: 700;
      padding: 0.5mm 0;
    }

    /* ── Footer ── */
    .sc-receipt .footer {
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.8mm;
      padding-bottom: 2mm;
    }
    .sc-receipt .footer .thank-you {
      font-size: 9.5pt;
      font-weight: 900 !important;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .sc-receipt .footer .visit-again { font-size: 7.5pt; font-weight: 600; letter-spacing: 1px; }
    .sc-receipt .footer .developer {
      font-size: 6.8pt;
      font-weight: 800 !important;
      letter-spacing: 0.3px;
    }

    @media print {
      .sc-receipt { box-shadow: none; padding: 0; }
    }
  `;
}

// ── Shared receipt markup (modal preview + print body) ───────────────────────
export function buildReceiptBody(d) {
  const currency = (v) => fmtCurrencyDirect(v);

  const itemRows = (d.items || [])
    .map((item) => {
      const qtyCalc = `${item.qty} × ${currency(item.price)}`;
      const lineTotal = currency(item.qty * item.price);
      return `
        <div class="item-entry">
          <div class="item-name">${escapeHTML(item.name)}</div>
          <div class="item-math">
            <span class="qty-calc">${qtyCalc}</span>
            <span class="line-total">${lineTotal}</span>
          </div>
        </div>
      `;
    })
    .join("");

  const discountRow =
    d.discount > 0
      ? `<div class="summary-row"><span>Discount</span><span>- ${currency(d.discount)}</span></div>`
      : "";

  const tableSuffix = d.tableNumber ? ` · Table ${d.tableNumber}` : "";

  return `
    <!-- ── HEADER ── -->
    <div class="header">
      <img class="logo-img" src="${d.logoPath}" alt="Senari Restaurant logo" />
      <div class="hotel-name">${escapeHTML(d.hotelName)}</div>
      <div class="address">
        <div>${escapeHTML(d.address)}</div>
        <div class="tel">Tel: ${escapeHTML(d.phone)}</div>
      </div>
    </div>

    <div class="divider-line"></div>

    <!-- ── 2-COLUMN METADATA ── -->
    <div class="meta-grid">
      <div><span class="lbl">INV:</span> <span class="val">${escapeHTML(d.invoiceNumber)}</span></div>
      <div class="text-right"><span class="lbl">DATE:</span> <span class="val">${escapeHTML(d.dateStr)}</span></div>
      <div><span class="lbl">TYPE:</span> <span class="val">${escapeHTML(d.orderType)}${escapeHTML(tableSuffix)}</span></div>
      <div class="text-right"><span class="lbl">TIME:</span> <span class="val">${escapeHTML(d.timeStr)}</span></div>
      <div><span class="lbl">CASHIER:</span> <span class="val">${escapeHTML(d.cashierName)}</span></div>
      <div class="text-right"><span class="lbl">CUST:</span> <span class="val">${escapeHTML(d.customerName)}</span></div>
    </div>

    <div class="divider-line"></div>

    <!-- ── ORDER ITEMS (2-Line Stack Layout) ── -->
    <div class="items-container">
      ${itemRows}
    </div>

    <div class="divider-dotted"></div>

    <!-- ── SUMMARY / TOTALS ── -->
    <div class="summary-section">
      <div class="summary-row"><span>Subtotal</span><span>${currency(d.subtotal)}</span></div>
      ${discountRow}
    </div>

    <div class="total-box">
      <span>TOTAL</span>
      <span>${currency(d.total)}</span>
    </div>

    <!-- ── PAYMENT META ── -->
    <div class="payment-bar">
      <span><span class="lbl">PAYMENT:</span> ${escapeHTML(d.paymentMethod)}</span>
      <span><span class="lbl">STATUS:</span> ${escapeHTML(d.statusText)}</span>
    </div>

    <div class="divider-line"></div>

    <!-- ── FOOTER ── -->
    <div class="footer">
      <div class="thank-you">THANK YOU!</div>
      <div class="visit-again">Please come again</div>
      <div class="divider-dotted"></div>
      <div class="developer">${escapeHTML(RECEIPT_CONSTANTS.developerAttribution)}</div>
    </div>
  `;
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

    @page { size: 80mm auto; margin: 2mm 3mm; }

    body {
      background: #fff;
      color: #000000 !important;
      font-family: Arial, Helvetica, sans-serif !important;
      font-weight: 700 !important;
      width: 74mm;
      margin: 0 auto;
    }

    ${buildReceiptStyles()}

    @media print {
  body { 
    background: #fff; 
    padding: 0; 
    width: 74mm; 
    font-family: Arial, Helvetica, sans-serif !important; 
  }
  .sc-receipt { box-shadow: none; }
}
  </style>
</head>
<body>
<div class="sc-receipt">
  ${buildReceiptBody(d)}
</div>
</body>
</html>`;
}