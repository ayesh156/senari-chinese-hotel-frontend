import { useState, useRef } from 'react'
import {
  Store, Clock3, SlidersHorizontal,
  Save, CheckCircle2, MessageSquare, Info, Copy, Check,
  Percent,
} from 'lucide-react'
import { useTheme } from '../../utils/ThemeContext'
import { useSettingsStore, DEFAULT_REMINDER_TEMPLATE } from '../../utils/settingsStore'

// ─────────────────────────────────────────────────────────────────────────────
// TAB CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'general',     label: 'General',           icon: Store             },
  { id: 'billing',     label: 'Billing & POS',     icon: Percent           },
  { id: 'hours',       label: 'Business Hours',     icon: Clock3            },
  { id: 'preferences', label: 'Preferences',        icon: SlidersHorizontal },
  { id: 'messaging',   label: 'Messaging',          icon: MessageSquare     },
]

const DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
]

// ─────────────────────────────────────────────────────────────────────────────
// SHARED PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

/** Numeric input with optional suffix (e.g. %) */
function NumberField({ label, value, onChange, placeholder, hint, min = 0, max, suffix }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          min={min}
          max={max}
          step="any"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-3 rounded-xl text-sm tabular-nums
                     bg-white dark:bg-gray-800
                     border border-gray-200 dark:border-gray-700
                     text-gray-900 dark:text-gray-100
                     placeholder:text-gray-400 dark:placeholder:text-gray-600
                     focus:outline-none focus:ring-2 focus:ring-amber-400/40
                     transition-colors min-h-[44px]
                     pr-10"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium
                           text-gray-400 dark:text-gray-500 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-gray-400 dark:text-gray-600">{hint}</p>}
    </div>
  )
}

/** Labelled text / email / tel / url input */
function Field({ label, type = 'text', value, onChange, placeholder, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400
                        uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-3 rounded-xl text-sm
                   bg-white dark:bg-gray-800
                   border border-gray-200 dark:border-gray-700
                   text-gray-900 dark:text-gray-100
                   placeholder:text-gray-400 dark:placeholder:text-gray-600
                   focus:outline-none focus:ring-2 focus:ring-amber-400/40
                   transition-colors min-h-[44px]"
      />
      {hint && <p className="text-xs text-gray-400 dark:text-gray-600">{hint}</p>}
    </div>
  )
}

/** Textarea field */
function TextareaField({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400
                        uppercase tracking-wide">
        {label}
      </label>
      <textarea
        rows={rows}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-3 rounded-xl text-sm resize-none
                   bg-white dark:bg-gray-800
                   border border-gray-200 dark:border-gray-700
                   text-gray-900 dark:text-gray-100
                   placeholder:text-gray-400 dark:placeholder:text-gray-600
                   focus:outline-none focus:ring-2 focus:ring-amber-400/40
                   transition-colors"
      />
    </div>
  )
}

/** Pill toggle switch */
function Toggle({ checked, onChange, label, sub }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5
                    border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">{sub}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full shrink-0 transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-amber-400/40
                    ${checked ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-700'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow
                          transition-transform duration-200
                          ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

/** Section card wrapper */
function Section({ title, sub, children }) {
  return (
    <div className="bg-amber-50 dark:bg-gray-800
                    rounded-2xl border border-amber-100 dark:border-gray-700
                    shadow-md dark:shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-3.5 border-b border-amber-100 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{title}</h3>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
      <div className="px-4 sm:px-5 py-4 sm:py-5">{children}</div>
    </div>
  )
}

/** Save button with transient success state */
function SaveButton({ onSave, saved }) {
  return (
    <button
      onClick={onSave}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold
                  shadow-md transition-all duration-200 min-h-[44px]
                  ${saved
                    ? 'bg-green-500 text-white shadow-green-500/20'
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                  }`}
    >
      {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
      {saved ? 'Saved!' : 'Save Changes'}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: GENERAL
// ─────────────────────────────────────────────────────────────────────────────
function GeneralTab() {
  const [form, setForm] = useState({
    name:    'Senari Chinese Hotel',
    phone:   '+94 76 280 1006',
    email:   'hello@senarichinese.lk',
    address: '5H6MCMP, Mulatiyana',
    tagline: 'Authentic Chinese Cuisine',
  })
  const [saved, setSaved] = useState(false)

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }))

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="flex flex-col gap-4">
      <Section title="Restaurant Identity" sub="Basic information shown to customers">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Restaurant Name" value={form.name}    onChange={set('name')}    placeholder="e.g. Senari Chinese Hotel" />
            <Field label="Tagline"         value={form.tagline} onChange={set('tagline')} placeholder="e.g. Authentic Chinese Cuisine" />
          </div>
          <TextareaField label="Address" value={form.address} onChange={set('address')} placeholder="Full address…" rows={2} />
        </div>
      </Section>

      <Section title="Contact Details" sub="Used for customer communications">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone"  type="tel"   value={form.phone} onChange={set('phone')} placeholder="+94 77 000 0000" />
          <Field label="Email"  type="email" value={form.email} onChange={set('email')} placeholder="hello@restaurant.lk" />
        </div>
      </Section>

      <div className="flex justify-end">
        <SaveButton onSave={handleSave} saved={saved} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: BILLING & POS
// ─────────────────────────────────────────────────────────────────────────────
function BillingPosTab() {
  const settings = useSettingsStore()
  const updateSettings = useSettingsStore(s => s.updateSettings)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    defaultTaxRate:              String(settings.defaultTaxRate),
    defaultServiceCharge:        String(settings.defaultServiceCharge),
    maxDiscountPercent:          String(settings.maxDiscountPercent),
    applyTaxOnReceipt:           settings.applyTaxOnReceipt,
    applyServiceChargeOnReceipt: settings.applyServiceChargeOnReceipt,
    defaultOrderType:            settings.defaultOrderType,
    defaultDiscountType:         settings.defaultDiscountType,
    inventoryLowStockAlerts:     settings.inventoryLowStockAlerts,
    enablePaymentReminders:      settings.enablePaymentReminders,
    showLowStockOnDashboard:     settings.showLowStockOnDashboard,
  })

  const set = key => val => setForm(f => ({ ...f, [key]: val }))

  function handleSave() {
    const tax = parseFloat(form.defaultTaxRate)
    const svc = parseFloat(form.defaultServiceCharge)
    const maxDisc = parseFloat(form.maxDiscountPercent)
    if ([tax, svc, maxDisc].some(n => Number.isNaN(n) || n < 0)) return

    updateSettings({
      defaultTaxRate:              tax,
      defaultServiceCharge:        svc,
      maxDiscountPercent:          maxDisc,
      applyTaxOnReceipt:           form.applyTaxOnReceipt,
      applyServiceChargeOnReceipt: form.applyServiceChargeOnReceipt,
      defaultOrderType:            form.defaultOrderType,
      defaultDiscountType:         form.defaultDiscountType,
      inventoryLowStockAlerts:     form.inventoryLowStockAlerts,
      enablePaymentReminders:      form.enablePaymentReminders,
      showLowStockOnDashboard:     form.showLowStockOnDashboard,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="flex flex-col gap-4">
      <Section title="Taxes & Service Charge" sub="Defaults applied on Quick Invoice and receipts">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <NumberField
            label="Default Tax Rate"
            value={form.defaultTaxRate}
            onChange={set('defaultTaxRate')}
            suffix="%"
            placeholder="5"
            hint="Shown on bills when tax is enabled"
            max={100}
          />
          <NumberField
            label="Default Service Charge"
            value={form.defaultServiceCharge}
            onChange={set('defaultServiceCharge')}
            suffix="%"
            placeholder="10"
            hint="Optional service charge on dine-in orders"
            max={100}
          />
        </div>
        <div className="flex flex-col">
          <Toggle
            checked={form.applyTaxOnReceipt}
            onChange={set('applyTaxOnReceipt')}
            label="Apply tax on thermal receipt"
            sub="Include tax line on printed invoices"
          />
          <Toggle
            checked={form.applyServiceChargeOnReceipt}
            onChange={set('applyServiceChargeOnReceipt')}
            label="Apply service charge on receipt"
            sub="Include service charge when order type is Dine-in"
          />
        </div>
      </Section>

      <Section title="Discounts" sub="Quick Invoice register defaults">
        <div className="flex flex-col gap-4">
          <NumberField
            label="Maximum Discount (%)"
            value={form.maxDiscountPercent}
            onChange={set('maxDiscountPercent')}
            suffix="%"
            placeholder="25"
            hint="Staff cannot exceed this percentage discount"
            max={100}
          />
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Default Discount Type
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'percent', label: 'Percentage (%)' },
                { id: 'fixed',   label: 'Fixed (Rs.)' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => set('defaultDiscountType')(id)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all min-h-[44px]
                             ${form.defaultDiscountType === id
                               ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                               : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                             }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Order Types" sub="Default mode when opening Quick Invoice">
        <div className="flex flex-wrap gap-2">
          {['Dine-in', 'Takeaway'].map(type => (
            <button
              key={type}
              type="button"
              onClick={() => set('defaultOrderType')(type)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all min-h-[44px]
                         ${form.defaultOrderType === type
                           ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                           : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                         }`}
            >
              {type}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Inventory & Reminders" sub="Alerts tied to Inventory and Customers modules">
        <div className="flex flex-col">
          <Toggle
            checked={form.inventoryLowStockAlerts}
            onChange={set('inventoryLowStockAlerts')}
            label="Enable inventory low stock alerts"
            sub="Highlight items when quantity is at or below minimum alert level"
          />
          <Toggle
            checked={form.showLowStockOnDashboard}
            onChange={set('showLowStockOnDashboard')}
            label="Show low stock summary on dashboard"
            sub="Display a count of low/out-of-stock ingredients on the POS dashboard"
          />
          <Toggle
            checked={form.enablePaymentReminders}
            onChange={set('enablePaymentReminders')}
            label="Enable customer payment reminders"
            sub="Allow staff to send due-payment SMS templates from Customers"
          />
        </div>
      </Section>

      <div className="flex justify-end">
        <SaveButton onSave={handleSave} saved={saved} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: BUSINESS HOURS
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_HOURS = DAYS.map(day => ({
  day,
  open:  !['Sunday'].includes(day),
  from:  '08:00',
  to:    '21:00',
}))

function BusinessHoursTab() {
  const [hours, setHours] = useState(DEFAULT_HOURS)
  const [saved, setSaved] = useState(false)

  function toggleDay(idx) {
    setHours(prev => prev.map((h, i) => i === idx ? { ...h, open: !h.open } : h))
  }
  function setTime(idx, key, val) {
    setHours(prev => prev.map((h, i) => i === idx ? { ...h, [key]: val } : h))
  }
  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const timeCls = `px-3 py-2.5 rounded-xl text-sm
                   bg-white dark:bg-gray-900
                   border border-gray-200 dark:border-gray-700
                   text-gray-900 dark:text-gray-100
                   dark:[color-scheme:dark]
                   focus:outline-none focus:ring-2 focus:ring-amber-400/40
                   transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                   min-h-[44px] w-full sm:w-28`

  return (
    <div className="flex flex-col gap-4">
      <Section
        title="Weekly Schedule"
        sub="Set opening and closing times for each day"
      >
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700/60">
          {hours.map((h, idx) => (
            <div key={h.day}
              className="flex flex-col sm:flex-row sm:items-center gap-3 py-3.5
                         first:pt-0 last:pb-0">

              {/* Day + toggle row */}
              <div className="flex items-center justify-between sm:justify-start gap-3 sm:w-40 shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    role="switch"
                    aria-checked={h.open}
                    onClick={() => toggleDay(idx)}
                    className={`relative w-9 h-5 rounded-full shrink-0 transition-colors duration-200
                                focus:outline-none focus:ring-2 focus:ring-amber-400/40
                                ${h.open ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow
                                      transition-transform duration-200
                                      ${h.open ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                  <span className={`text-sm font-semibold transition-colors
                                    ${h.open
                                      ? 'text-gray-900 dark:text-gray-100'
                                      : 'text-gray-400 dark:text-gray-600'
                                    }`}>
                    {h.day}
                  </span>
                </div>

                {/* Closed badge — mobile only, inline with day name */}
                {!h.open && (
                  <span className="sm:hidden text-xs font-semibold text-red-400 dark:text-red-500
                                   bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full
                                   border border-red-200 dark:border-red-800">
                    Closed
                  </span>
                )}
              </div>

              {/* Time range or Closed badge */}
              {h.open ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={h.from}
                    onChange={e => setTime(idx, 'from', e.target.value)}
                    className={timeCls}
                  />
                  <span className="text-xs text-gray-400 dark:text-gray-600 font-medium shrink-0">to</span>
                  <input
                    type="time"
                    value={h.to}
                    onChange={e => setTime(idx, 'to', e.target.value)}
                    className={timeCls}
                  />
                </div>
              ) : (
                <span className="hidden sm:inline-flex text-xs font-semibold text-red-400 dark:text-red-500
                                 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full
                                 border border-red-200 dark:border-red-800 self-start">
                  Closed
                </span>
              )}
            </div>
          ))}
        </div>
      </Section>

      <div className="flex justify-end">
        <SaveButton onSave={handleSave} saved={saved} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: SYSTEM PREFERENCES
// ─────────────────────────────────────────────────────────────────────────────
function SystemPreferencesTab() {
  const { theme, toggleTheme } = useTheme()
  const [prefs, setPrefs] = useState({
    autoAccept:  false,
    orderSound:  true,
    emailAlerts: true,
    compactView: false,
  })
  const [saved, setSaved] = useState(false)

  const set = (key) => (val) => setPrefs(f => ({ ...f, [key]: val }))

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <div className="flex flex-col gap-4">
      <Section title="Order Management" sub="Control how new orders are handled">
        <div className="flex flex-col">
          <Toggle
            checked={prefs.autoAccept}
            onChange={set('autoAccept')}
            label="Auto-accept new online orders"
            sub="Orders move to Preparing immediately without manual confirmation"
          />
          <Toggle
            checked={prefs.orderSound}
            onChange={set('orderSound')}
            label="Play sound on new order"
            sub="An audio alert plays when a new order arrives"
          />
          <Toggle
            checked={prefs.emailAlerts}
            onChange={set('emailAlerts')}
            label="Email alerts for new orders"
            sub="Send a notification email to the admin address"
          />
        </div>
      </Section>

      <Section title="Display" sub="Appearance and layout preferences">
        <div className="flex flex-col">
          <Toggle
            checked={isDark}
            onChange={toggleTheme}
            label="Dark Mode"
            sub="Toggle between light and dark interface themes"
          />
          <Toggle
            checked={prefs.compactView}
            onChange={set('compactView')}
            label="Compact table view"
            sub="Reduce row height in order and menu tables"
          />
        </div>
      </Section>

      <Section title="Data & Privacy" sub="Manage local data">
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Cart and session data is stored locally in your browser.
            Clearing it will not affect orders already submitted.
          </p>
          <button
            className="self-start px-4 py-2.5 rounded-xl text-xs font-semibold
                       text-red-600 dark:text-red-400
                       bg-red-50 dark:bg-red-900/20
                       border border-red-200 dark:border-red-800
                       hover:bg-red-100 dark:hover:bg-red-900/40
                       transition-colors min-h-[44px]"
          >
            Clear Local Cache
          </button>
        </div>
      </Section>

      <div className="flex justify-end">
        <SaveButton onSave={handleSave} saved={saved} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: MESSAGING
// ─────────────────────────────────────────────────────────────────────────────
const PLACEHOLDERS = [
  { key: '{name}',      desc: 'Customer name'   },
  { key: '{dueAmount}', desc: 'Due amount (Rs.)' },
  { key: '{phone}',     desc: 'Customer phone'   },
  { key: '{shop}',      desc: 'Shop name'        },
]

function MessagingTab() {
  const storedTemplate  = useSettingsStore(s => s.reminderMessageTemplate)
  const updateSettings  = useSettingsStore(s => s.updateSettings)
  const [reminderMsg, setReminderMsg] = useState(storedTemplate ?? DEFAULT_REMINDER_TEMPLATE)
  const [copied,      setCopied]      = useState(null)
  const [saved,       setSaved]       = useState(false)
  const textareaRef = useRef(null)

  function copyPlaceholder(key) {
    navigator.clipboard.writeText(key).catch(() => {})
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  function insertPlaceholder(key) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end   = el.selectionEnd
    const next  = reminderMsg.slice(0, start) + key + reminderMsg.slice(end)
    setReminderMsg(next)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + key.length, start + key.length)
    }, 0)
  }

  function handleSave() {
    updateSettings({ reminderMessageTemplate: reminderMsg })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const preview = reminderMsg
    .replace(/\{name\}/g,      'Kamal Perera')
    .replace(/\{dueAmount\}/g, '1,200.00')
    .replace(/\{phone\}/g,     '077 123 4567')
    .replace(/\{shop\}/g,      'Senari Chinese Hotel')

  return (
    <div className="flex flex-col gap-4">
      <Section
        title="Payment Reminder Message"
        sub="Sent to customers with outstanding due amounts"
      >
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500
                          uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Info size={11} />
              Placeholders — tap to insert at cursor
            </p>
            <div className="flex flex-wrap gap-2">
              {PLACEHOLDERS.map(({ key, desc }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => insertPlaceholder(key)}
                  title={`Insert ${key} — ${desc}`}
                  className={`
                    group flex items-center gap-1.5 px-2.5 py-2 rounded-lg
                    text-xs font-mono font-semibold border
                    transition-all duration-150 active:scale-95 min-h-[36px]
                    ${copied === key
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                    }
                  `}
                >
                  {copied === key
                    ? <><Check size={11} /> Copied!</>
                    : <><Copy size={11} className="opacity-60 group-hover:opacity-100" /> {key}</>
                  }
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400
                              uppercase tracking-wide">
              Message Template
            </label>
            <textarea
              ref={textareaRef}
              rows={5}
              value={reminderMsg}
              onChange={e => setReminderMsg(e.target.value)}
              placeholder="Type your reminder message…"
              className="w-full px-3 py-3 rounded-xl text-sm resize-none
                         bg-white dark:bg-gray-800
                         border border-gray-200 dark:border-gray-700
                         text-gray-900 dark:text-gray-100
                         placeholder:text-gray-400 dark:placeholder:text-gray-600
                         focus:outline-none focus:ring-2 focus:ring-amber-400/40
                         transition-colors font-mono leading-relaxed"
            />
            <p className="text-xs text-gray-400 dark:text-gray-600 text-right">
              {reminderMsg.length} characters
            </p>
          </div>

          <button
            type="button"
            onClick={() => setReminderMsg(DEFAULT_REMINDER_TEMPLATE)}
            className="self-start text-xs font-semibold text-gray-400 dark:text-gray-500
                       hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            ↺ Reset to default
          </button>
        </div>
      </Section>

      <Section
        title="Message Preview"
        sub="How the message will appear with sample data"
      >
        <div className="flex flex-col gap-3">
          <div className="flex justify-end">
            <div className="max-w-[90%] sm:max-w-sm bg-green-100 dark:bg-green-900/30
                            rounded-2xl rounded-tr-sm px-4 py-3
                            border border-green-200 dark:border-green-800
                            shadow-sm">
              <p className="text-sm text-gray-800 dark:text-gray-200
                            whitespace-pre-wrap leading-relaxed font-sans">
                {preview}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 text-right mt-1.5">
                12:00 PM ✓✓
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
            Sample: name = Kamal Perera · dueAmount = 1,200.00
          </p>
        </div>
      </Section>

      <div className="flex justify-end">
        <SaveButton onSave={handleSave} saved={saved} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE TAB PILL BAR
// Horizontally scrollable pill strip shown on < md screens.
// ─────────────────────────────────────────────────────────────────────────────
function MobileTabBar({ activeTab, onSelect }) {
  return (
    <div className="md:hidden flex gap-2 overflow-x-auto
                    pb-1 hide-scrollbar snap-x snap-mandatory">
      {TABS.map(tab => {
        const Icon   = tab.icon
        const active = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            snap-align="start"
            className={`
              shrink-0 snap-start flex items-center gap-2
              px-4 py-2.5 rounded-2xl text-sm font-semibold
              whitespace-nowrap transition-all duration-200
              active:scale-95 min-h-[44px]
              ${active
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-700'
              }
            `}
          >
            <Icon size={15} className="shrink-0" />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DESKTOP SIDEBAR TAB RAIL
// Vertical list shown on md+ screens.
// ─────────────────────────────────────────────────────────────────────────────
function DesktopTabRail({ activeTab, onSelect }) {
  return (
    <nav className="hidden md:flex w-52 shrink-0 flex-col gap-1
                    bg-amber-50 dark:bg-gray-800
                    rounded-2xl border border-amber-100 dark:border-gray-700
                    shadow-md dark:shadow-sm p-2 self-start sticky top-4">
      {TABS.map(tab => {
        const Icon   = tab.icon
        const active = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`
              flex items-center gap-2.5 px-3 py-2.5 rounded-xl
              text-sm font-medium w-full text-left
              transition-all duration-150
              ${active
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : `text-gray-600 dark:text-gray-400
                   hover:bg-white dark:hover:bg-gray-700
                   hover:text-gray-900 dark:hover:text-white`
              }
            `}
          >
            <Icon size={16} className="shrink-0" />
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')

  const CONTENT = {
    general:     <GeneralTab />,
    billing:     <BillingPosTab />,
    hours:       <BusinessHoursTab />,
    preferences: <SystemPreferencesTab />,
    messaging:   <MessagingTab />,
  }

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto">

      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
          Settings
        </h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          Manage your restaurant configuration and preferences
        </p>
      </div>

      {/* ── Mobile: horizontal pill tab bar ── */}
      <MobileTabBar activeTab={activeTab} onSelect={setActiveTab} />

      {/* ── Desktop: sidebar + content / Mobile: content only ── */}
      <div className="flex flex-col md:flex-row gap-5 md:gap-6 items-start">

        {/* Desktop sidebar rail */}
        <DesktopTabRail activeTab={activeTab} onSelect={setActiveTab} />

        {/* Content area */}
        <div className="flex-1 min-w-0 w-full">
          {CONTENT[activeTab]}
        </div>
      </div>
    </div>
  )
}
