import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  Search, X, Plus, Pencil, Trash2,
  Users, AlertTriangle, CheckCircle2, Eye,
  Banknote, ShoppingBag, TrendingUp, UserPlus,
  Bell, Phone, Mail, MapPin, IdCard, Send, CheckCircle,
  Loader2, ImageIcon, List, LayoutGrid,
} from 'lucide-react'
import SearchableSelect from '../../components/ui/SearchableSelect'
import ModernPagination from '../../components/ui/ModernPagination'
import { useSettingsStore } from '../../utils/settingsStore'
import { useCustomerStore, calcDueCount, calcTotalDue, calcTotalSpent } from '../../utils/customerStore'
import CustomerHistoryModal from '../../components/pos/CustomerHistoryModal'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')
const PAGE_SIZE = 8

const DUE_FILTER_OPTIONS = [
  { value: 'all',     label: 'All Customers'    },
  { value: 'due',     label: 'With Due Amounts' },
  { value: 'settled', label: 'Fully Settled'    },
]

const SEED_REMINDER_LOGS = {
  1: [ { id: 1, date: '26 May 2026', time: '09:15 AM', message: 'Dear Kamal Perera, you have a pending due of Rs. 1,200 at Senari Chinese Hotel. Please settle it at your earliest convenience. Thank you!' }, { id: 2, date: '20 May 2026', time: '02:30 PM', message: 'Dear Kamal Perera, you have a pending due of Rs. 1,200 at Senari Chinese Hotel. Please settle it at your earliest convenience. Thank you!' } ],
  3: [ { id: 1, date: '26 May 2026', time: '10:00 AM', message: 'Dear Sanduni Fernando…' }, { id: 2, date: '24 May 2026', time: '03:45 PM', message: 'Dear Sanduni Fernando…' }, { id: 3, date: '22 May 2026', time: '11:20 AM', message: 'Dear Sanduni Fernando…' }, { id: 4, date: '19 May 2026', time: '04:00 PM', message: 'Dear Sanduni Fernando…' }, { id: 5, date: '15 May 2026', time: '09:30 AM', message: 'Dear Sanduni Fernando…' }, { id: 6, date: '10 May 2026', time: '01:15 PM', message: 'Dear Sanduni Fernando…' }, { id: 7, date: '05 May 2026', time: '10:45 AM', message: 'Dear Sanduni Fernando…' } ],
  6:  [{ id: 1, date: '25 May 2026', time: '11:00 AM', message: 'Dear Chamara Bandara…' }],
  10: [{ id: 1, date: '24 May 2026', time: '02:00 PM', message: 'Dear Malith Bandara…' }],
  12: [ { id: 1, date: '26 May 2026', time: '08:45 AM', message: 'Dear Dinesh Kumara…' }, { id: 2, date: '21 May 2026', time: '03:30 PM', message: 'Dear Dinesh Kumara…' } ],
  16: [{ id: 1, date: '23 May 2026', time: '10:15 AM', message: 'Dear Ishara Madushani…' }],
  20: [ { id: 1, date: '26 May 2026', time: '09:00 AM', message: 'Dear Hiruni Jayasekara…' }, { id: 2, date: '22 May 2026', time: '04:15 PM', message: 'Dear Hiruni Jayasekara…' }, { id: 3, date: '18 May 2026', time: '11:30 AM', message: 'Dear Hiruni Jayasekara…' } ],
}

const REMINDERS_PER_PAGE = 5

function getImageUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  if (path.startsWith('data:')) return path
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`
}

function compressImage(file, { maxDim = 300, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (ev) => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width >= height) { height = Math.round(height * maxDim / width);  width = maxDim }
          else                 { width  = Math.round(width  * maxDim / height); height = maxDim }
        }
        const canvas = document.createElement('canvas')
        canvas.width  = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
          resolve(compressedFile)
        }, 'image/jpeg', quality)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  })
}

function AvatarUploadArea({ value, onChange, initials }) {
  const [dragOver,      setDragOver]      = useState(false)
  const [isProcessing,  setIsProcessing]  = useState(false)
  const fileInputId = 'customer-avatar-input'
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value)
      setPreview(url)
      return () => URL.revokeObjectURL(url)
    } else if (typeof value === 'string' && value) {
      setPreview(value)
    } else {
      setPreview(null)
    }
  }, [value])

  const processFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setIsProcessing(true)
    try {
      const compressedFile = await compressImage(file)
      onChange(compressedFile)
    } catch {
      onChange(file)
    } finally {
      setIsProcessing(false)
    }
  }, [onChange])

  useEffect(() => {
    const handler = async (e) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) await processFile(file)
          break
        }
      }
    }
    document.addEventListener('paste', handler)
    return () => document.removeEventListener('paste', handler)
  }, [processFile])

  return (
    <div className="flex flex-col gap-2">
      {preview ? (
        <div className="relative w-full min-h-[14rem] h-52 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-900/20 dark:bg-black/30">
          <img src={typeof preview === 'string' ? preview : (value instanceof File ? preview : '')} alt="Avatar preview" className="w-full h-full object-contain" />
          <button type="button" onClick={() => onChange(null)} className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors shadow-md"><X size={13} /></button>
          <p className="absolute bottom-0 left-0 right-0 px-3 py-1.5 text-[10px] bg-black/60 text-white/80 text-center">Click × to remove · Ctrl+V to replace</p>
        </div>
      ) : (
        <div onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files?.[0]) }}
          onClick={() => !isProcessing && document.getElementById(fileInputId).click()}
          className={`relative rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 min-h-[14rem] h-52 text-center transition-all duration-200 overflow-hidden ${isProcessing ? 'cursor-wait border-amber-400 bg-amber-500/5' : dragOver ? 'cursor-copy border-amber-500 bg-amber-500/10' : 'cursor-pointer border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-900/10'}`}>
          {isProcessing ? (
            <><div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100 dark:bg-amber-900/30"><Loader2 size={20} className="text-amber-500 animate-spin" /></div><p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Processing image…</p><p className="text-[10px] text-gray-400 dark:text-gray-500">Compressing to avatar size</p></>
          ) : (
            <><div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 text-base font-extrabold border-2 border-dashed border-amber-300 dark:border-amber-700">{initials || <ImageIcon size={18} />}</div><p className="text-xs font-medium text-gray-600 dark:text-gray-400">Drop photo or click to upload</p><p className="text-[10px] text-amber-500 dark:text-amber-400 font-medium">Ctrl+V to paste from clipboard</p></>
          )}
        </div>
      )}
      <input type="url" value={''} onChange={e => onChange(e.target.value)} placeholder="Or paste image URL…"
        className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-colors" />
      <input id={fileInputId} type="file" accept="image/*" className="hidden" onChange={e => processFile(e.target.files?.[0])} />
    </div>
  )
}

function CustomerCard({ customer, onView, onEdit, onDelete, onSettle, onRemind, onHistory }) {
  const hasDue   = customer.dueAmount > 0
  const initials = customer.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const imgUrl   = getImageUrl(customer.image)

  return (
    <div className="group flex flex-col rounded-2xl border overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <div className={`relative h-2 shrink-0 ${hasDue ? 'bg-gradient-to-r from-red-400 to-rose-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`} />
      <div className="flex flex-col gap-3 p-4 flex-1">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            {imgUrl ? (
              <img src={imgUrl} alt={customer.name} onError={e => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex' }} className="w-12 h-12 rounded-2xl object-cover border-2 border-gray-100 dark:border-gray-700 shadow-sm" />
            ) : null}
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 items-center justify-center text-white text-base font-extrabold shadow-sm border-2 border-amber-200 dark:border-amber-700 ${imgUrl ? 'hidden' : 'flex'}`}>{initials}</div>
            {hasDue && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white dark:border-gray-900" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 dark:text-gray-100 truncate text-sm leading-tight">{customer.name}</p>
            <div className="flex items-center gap-1 mt-0.5"><Phone size={10} className="text-gray-400 shrink-0" /><p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums truncate">{customer.phone}</p></div>
          </div>
          <button onClick={() => onView(customer)} aria-label={`View ${customer.name}`} title="View profile"
            className="p-2 rounded-xl shrink-0 transition-colors text-gray-400 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10"><Eye size={15} /></button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20">
            <ShoppingBag size={12} className="text-amber-500" /><p className="text-xs font-extrabold text-gray-900 dark:text-gray-100 tabular-nums">{customer.totalOrders}</p><p className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Orders</p>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl bg-green-50 dark:bg-green-900/20">
            <TrendingUp size={12} className="text-green-500" /><p className="text-[11px] font-extrabold text-gray-900 dark:text-gray-100 tabular-nums">{customer.totalSpent >= 1000 ? `${(customer.totalSpent / 1000).toFixed(1)}k` : customer.totalSpent}</p><p className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Spent</p>
          </div>
          <div className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl ${hasDue ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
            <Banknote size={12} className={hasDue ? 'text-red-500' : 'text-gray-400'} />
            <p className={`text-[11px] font-extrabold tabular-nums ${hasDue ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-600'}`}>{hasDue ? customer.dueAmount >= 1000 ? `${(customer.dueAmount / 1000).toFixed(1)}k` : customer.dueAmount : '—'}</p>
            <p className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Due</p>
          </div>
        </div>
        {hasDue && (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-1.5"><AlertTriangle size={11} className="text-red-500 shrink-0" /><span className="text-xs font-semibold text-red-600 dark:text-red-400">Outstanding Due</span></div>
            <span className="text-xs font-extrabold text-red-600 dark:text-red-400 tabular-nums">Rs. {customer.dueAmount.toLocaleString('en-LK')}</span>
          </div>
        )}
      </div>
      <div className="shrink-0 px-3 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex items-center gap-1.5 flex-wrap">
        <button onClick={() => onEdit(customer)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 transition-colors"><Pencil size={11} /> Edit</button>
        <button onClick={() => onDelete(customer)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 transition-colors"><Trash2 size={11} /> Delete</button>
        {hasDue && (
          <>
            <button onClick={() => onSettle(customer)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800 transition-colors"><Banknote size={11} /> Settle</button>
            <div className="relative">
              <button onClick={() => onRemind(customer)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 border border-violet-200 dark:border-violet-800 transition-colors"><Bell size={11} /> Remind</button>
              {customer.reminderCount > 0 && (
                <button type="button" onClick={e => { e.stopPropagation(); onHistory(customer) }} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-violet-500 hover:bg-violet-600 text-white text-[9px] font-extrabold flex items-center justify-center shadow-sm transition-colors active:scale-90">{customer.reminderCount > 9 ? '9+' : customer.reminderCount}</button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function CustomerFormModal({ initialData, onSave, onCancel }) {
  const isEdit = Boolean(initialData)
  const [name,    setName]    = useState(initialData?.name    ?? '')
  const [phone,   setPhone]   = useState(initialData?.phone   ?? '')
  const [nic,     setNic]     = useState(initialData?.nic     ?? '')
  const [email,   setEmail]   = useState(initialData?.email   ?? '')
  const [address, setAddress] = useState(initialData?.address ?? '')
  // In edit mode, initialData.image holds the existing DB path (e.g., /uploads/customers/avatar-xxx.jpg)
  // Convert it to a full backend URL for preview, or null for new customers.
  const [image,   setImage]   = useState(isEdit ? (initialData?.image ? getImageUrl(initialData.image) : null) : null)
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!name.trim())  e.name  = 'Name is required.'
    if (!phone.trim()) e.phone = 'Phone number is required.'
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Enter a valid email address.'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const fd = new FormData()
    fd.append('name', name.trim())
    fd.append('phone', phone.trim())
    fd.append('nic', nic.trim())
    fd.append('email', email.trim())
    fd.append('address', address.trim())
    if (image instanceof File) {
      fd.append('avatar', image)
    } else if (initialData?.image && !image) {
      // Image was removed — send empty string to clear it
      fd.append('image', '')
    }
    onSave(fd)
  }

  const inputCls = (hasErr) =>
    `w-full px-3 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-800 border text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 transition-colors ${hasErr ? 'border-red-400 dark:border-red-500 focus:ring-red-400/30' : 'border-gray-200 dark:border-gray-700 focus:ring-amber-400/40'}`

  function FieldLabel({ children }) {
    return <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">{children}</label>
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl w-full max-w-2xl shadow-2xl border overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/50 max-h-[92vh] flex flex-col">
        <div className={`relative overflow-hidden shrink-0 ${isEdit ? 'bg-gradient-to-r from-emerald-600 via-teal-500 to-teal-600' : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600'}`}>
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="relative flex items-center gap-3 px-5 py-4">
            <div className="w-11 h-11 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shrink-0"><UserPlus size={20} className="text-white" /></div>
            <div className="flex-1 min-w-0"><h2 className="text-base font-bold text-white truncate">{isEdit ? `Edit — ${initialData.name}` : 'Add New Customer'}</h2><p className="text-white/70 text-xs mt-0.5">{isEdit ? 'Update customer details' : 'Fill in the customer information below'}</p></div>
            <button type="button" onClick={onCancel} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors shrink-0"><X size={16} /></button>
          </div>
        </div>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1">
          <div className="flex-1 px-5 py-5">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-4 flex items-center gap-1.5"><UserPlus size={10} /> Identity</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Name, Phone, NIC, Address */}
              <div className="space-y-4">
                <div>
                  <FieldLabel>Customer Name <span className="text-red-400">*</span></FieldLabel>
                  <input type="text" value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }} placeholder="e.g. Kamal Perera" autoFocus className={inputCls(!!errors.name)} />
                  {errors.name && <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1"><AlertTriangle size={10} /> {errors.name}</p>}
                </div>
                <div>
                  <FieldLabel>Phone Number <span className="text-red-400">*</span></FieldLabel>
                  <input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: '' })) }} placeholder="e.g. 077 123 4567" className={inputCls(!!errors.phone)} />
                  {errors.phone && <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1"><AlertTriangle size={10} /> {errors.phone}</p>}
                </div>
                <div>
                  <FieldLabel>NIC Number</FieldLabel>
                  <input type="text" value={nic} onChange={e => setNic(e.target.value.toUpperCase())} placeholder="e.g. 881234567V or 199012345678" className={inputCls(false)} />
                  <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">Old (9 digits + V/X) or new (12 digits) format</p>
                </div>
                <div>
                  <FieldLabel>Address</FieldLabel>
                  <textarea rows={4} value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. 12 Galle Rd, Matara" className={`${inputCls(false)} resize-none`} />
                </div>
              </div>
              {/* Right Column: Email, Avatar */}
              <div className="space-y-4">
                <div>
                  <FieldLabel>Email Address</FieldLabel>
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }} placeholder="e.g. kamal@example.com" className={inputCls(!!errors.email)} />
                  {errors.email && <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1"><AlertTriangle size={10} /> {errors.email}</p>}
                </div>
                <div>
                  <FieldLabel>Avatar Photo</FieldLabel>
                  <AvatarUploadArea value={image} onChange={setImage} initials={name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()} />
                </div>
              </div>
            </div>
          </div>
          <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-3">
            <button type="submit"
              className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md ${isEdit ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/20 hover:opacity-90' : 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/20 hover:opacity-90'}`}>
              {isEdit ? <><Pencil size={15} /> Save Changes</> : <><Plus size={15} /> Add Customer</>}
            </button>
            <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600/50">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteModal({ customer, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl max-w-md w-full shadow-2xl border overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/50">
        <div className="p-6 border-b bg-gradient-to-r from-red-100 to-red-50 dark:from-red-600/20 dark:to-red-500/10 border-red-200 dark:border-red-500/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-red-100 dark:bg-red-500/20"><AlertTriangle size={22} className="text-red-600 dark:text-red-400" /></div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete Customer</h2>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">This action cannot be undone. The customer record will be permanently removed.</p>
          <p className="text-sm font-semibold p-3 rounded-xl border text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">{customer.name} · {customer.phone}</p>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700/50 flex gap-3">
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 transition-all flex items-center justify-center gap-2"><Trash2 size={15} /> Delete</button>
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600/50">Cancel</button>
        </div>
      </div>
    </div>
  )
}

function SettleModal({ customer, onConfirm, onCancel }) {
  const maxDue = customer.dueAmount; const [amount, setAmount] = useState(String(maxDue)); const [error, setError] = useState(''); const inputRef = useRef(null)
  useEffect(() => { setTimeout(() => inputRef.current?.select(), 50) }, [])
  const parsed = parseFloat(amount) || 0; const isPartial = parsed > 0 && parsed < maxDue; const remaining = Math.max(0, maxDue - parsed)
  function validate() { if (!amount.trim() || parsed <= 0) return 'Enter a payment amount greater than 0.'; if (parsed > maxDue) return `Cannot exceed the due amount of Rs. ${maxDue.toLocaleString('en-LK')}.`; return '' }
  function handleSubmit(e) { e.preventDefault(); const err = validate(); if (err) { setError(err); return } onConfirm(parsed) }
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl max-w-md w-full shadow-2xl border overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/50 max-h-[90vh] flex flex-col">
        <div className="p-5 border-b shrink-0 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 border-green-200 dark:border-green-700/30">
          <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-green-100 dark:bg-green-500/20"><Banknote size={22} className="text-green-600 dark:text-green-400" /></div><div><h2 className="text-lg font-bold text-gray-900 dark:text-white">Settle Due Amount</h2><p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{customer.name}</p></div></div>
        </div>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 flex flex-col gap-4 overflow-y-auto flex-1">
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"><span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">Current Due</span><span className="text-lg font-extrabold text-red-600 dark:text-red-400 tabular-nums">Rs. {maxDue.toLocaleString('en-LK')}</span></div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Payment Amount</label>
                <button type="button" onClick={() => { setAmount(String(maxDue)); setError('') }} className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800 transition-colors">Pay Full</button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400 dark:text-gray-500 pointer-events-none select-none">Rs.</span>
                <input ref={inputRef} type="number" inputMode="decimal" min="1" max={maxDue} step="1" value={amount} onChange={e => { setAmount(e.target.value); setError('') }}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-gray-800 border text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-colors ${error ? 'border-red-400 dark:border-red-500 focus:ring-red-400/30' : 'border-gray-200 dark:border-gray-700 focus:ring-green-400/40 focus:border-green-400'}`} />
              </div>
              {error && <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1"><AlertTriangle size={11} /> {error}</p>}
            </div>
            {parsed > 0 && parsed <= maxDue && (
              <div className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors duration-200 ${isPartial ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'}`}>
                <span className={`text-xs font-bold uppercase tracking-wide ${isPartial ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>{isPartial ? 'Remaining After Payment' : 'Fully Settled ✓'}</span>
                <span className={`text-sm font-extrabold tabular-nums ${isPartial ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>{isPartial ? `Rs. ${remaining.toLocaleString('en-LK')}` : 'Rs. 0'}</span>
              </div>
            )}
          </div>
          <div className="px-5 pb-5 pt-2 flex gap-3 shrink-0 border-t border-gray-100 dark:border-gray-800">
            <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 transition-all shadow-md shadow-green-500/20 flex items-center justify-center gap-2"><CheckCircle2 size={15} /> {isPartial ? 'Process Partial Payment' : 'Process Payment'}</button>
            <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600/50">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ReminderHistoryModal({ customer, logs, onClose }) {
  const [histPage, setHistPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(logs.length / REMINDERS_PER_PAGE))
  const safePage = Math.min(histPage, totalPages)
  const pageItems = logs.slice((safePage - 1) * REMINDERS_PER_PAGE, safePage * REMINDERS_PER_PAGE)
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl w-full max-w-lg shadow-2xl border overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/50 max-h-[90vh] flex flex-col">
        <div className="relative overflow-hidden shrink-0 bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative flex items-center gap-3 px-5 py-4">
            <div className="w-11 h-11 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shrink-0"><Bell size={20} className="text-white" /></div>
            <div className="flex-1 min-w-0"><h2 className="text-base font-bold text-white truncate">Reminder History</h2><p className="text-white/70 text-xs mt-0.5 truncate">{customer.name} · {logs.length} reminder{logs.length !== 1 ? 's' : ''} sent</p></div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors shrink-0"><X size={16} /></button>
          </div>
        </div>
        <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-violet-50 dark:bg-violet-900/10">
          <div className="flex items-center gap-2"><Phone size={13} className="text-violet-500 shrink-0" /><span className="text-sm font-bold text-violet-700 dark:text-violet-300 tabular-nums">{customer.phone}</span></div>
          <span className="text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-2.5 py-1 rounded-full border border-violet-200 dark:border-violet-800">{logs.length} total</span>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center"><div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center"><Bell size={24} className="text-violet-300 dark:text-violet-600" /></div><p className="text-sm font-semibold text-gray-500 dark:text-gray-400">No reminders sent yet</p></div>
          ) : (
            <div className="flex flex-col gap-3">
              {pageItems.map((log, idx) => {
                const globalIdx = (safePage - 1) * REMINDERS_PER_PAGE + idx
                return (
                  <div key={log.id} className="flex gap-3 p-3.5 rounded-2xl border bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50 hover:border-violet-200 dark:hover:border-violet-800 transition-colors duration-150">
                    <div className="w-7 h-7 rounded-full shrink-0 mt-0.5 bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center"><span className="text-[10px] font-extrabold text-violet-600 dark:text-violet-400">{logs.length - globalIdx}</span></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap"><span className="text-xs font-bold text-gray-700 dark:text-gray-300">{log.date}</span><span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md">{log.time}</span></div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">{log.message}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        {totalPages > 1 && <div className="shrink-0 border-t border-gray-100 dark:border-gray-800"><ModernPagination currentPage={safePage} totalPages={totalPages} totalItems={logs.length} itemsPerPage={REMINDERS_PER_PAGE} onPageChange={setHistPage} /></div>}
        <div className="shrink-0 px-5 py-3 border-t border-gray-100 dark:border-gray-800"><button onClick={onClose} className="w-full px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">Close</button></div>
      </div>
    </div>
  )
}

function buildMsg(template, customer) {
  return (template ?? '').replace(/\{name\}/g, customer.name).replace(/\{dueAmount\}/g, customer.dueAmount.toLocaleString('en-LK')).replace(/\{phone\}/g, customer.phone).replace(/\{shop\}/g, 'Senari Chinese Hotel')
}

function ReminderModal({ customer, template, onSend, onCancel }) {
  const [message, setMessage] = useState(() => buildMsg(template, customer))
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl max-w-md w-full shadow-2xl border overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/50 max-h-[90vh] flex flex-col">
        <div className="relative overflow-hidden shrink-0 bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative flex items-center gap-3 px-5 py-4">
            <div className="w-11 h-11 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shrink-0"><Bell size={20} className="text-white" /></div>
            <div className="flex-1 min-w-0"><h2 className="text-base font-bold text-white truncate">Send Payment Reminder</h2><p className="text-white/70 text-xs mt-0.5 truncate">{customer.name}</p></div>
            <button onClick={onCancel} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors shrink-0"><X size={16} /></button>
          </div>
        </div>
        <div className="p-5 flex flex-col gap-4 overflow-y-auto flex-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 flex-1"><Phone size={13} className="text-violet-500 shrink-0" /><span className="text-sm font-bold text-violet-700 dark:text-violet-300 tabular-nums">{customer.phone}</span></div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 shrink-0"><AlertTriangle size={13} className="text-red-500 shrink-0" /><span className="text-sm font-bold text-red-600 dark:text-red-400 tabular-nums">Rs. {customer.dueAmount.toLocaleString('en-LK')}</span></div>
          </div>
          {customer.reminderCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"><Bell size={12} className="text-amber-500 shrink-0" /><span className="text-xs text-amber-700 dark:text-amber-400">{customer.reminderCount} reminder{customer.reminderCount !== 1 ? 's' : ''} already sent</span></div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Message — edit before sending</label>
            <textarea rows={5} value={message} onChange={e => setMessage(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm resize-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-400/40 transition-colors leading-relaxed" />
            <div className="flex items-center justify-between"><button type="button" onClick={() => setMessage(buildMsg(template, customer))} className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">↺ Reset to default</button><span className="text-[11px] text-gray-400 dark:text-gray-600">{message.length} chars</span></div>
          </div>
        </div>
        <div className="px-5 pb-5 pt-2 flex gap-3 shrink-0 border-t border-gray-100 dark:border-gray-800">
          <button onClick={() => onSend(message)} disabled={!message.trim()} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-700 hover:to-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-violet-500/20"><Send size={15} /> Send SMS</button>
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600/50">Cancel</button>
        </div>
      </div>
    </div>
  )
}

function ViewModal({ customer, onClose }) {
  const initials = customer.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const imgUrl = getImageUrl(customer.image)
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl w-full max-w-sm shadow-2xl border overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/50 max-h-[92vh] flex flex-col">
        <div className="relative overflow-hidden shrink-0 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors z-10"><X size={14} /></button>
          <div className="relative flex flex-col items-center gap-2 px-5 pt-6 pb-5">
            {imgUrl ? <img src={imgUrl} alt={customer.name} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white/30" /> : null}
            <div className={`w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-xl font-extrabold shadow-lg border-2 border-white/30 ${imgUrl ? 'hidden' : 'flex'}`}>{initials}</div>
            <div className="text-center"><h2 className="text-base font-bold text-white">{customer.name}</h2><p className="text-white/70 text-xs mt-0.5">{customer.phone}</p></div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-px bg-gray-100 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800">
            {[{ icon: ShoppingBag, label: 'Orders', value: customer.totalOrders, color: 'text-amber-500' },{ icon: TrendingUp, label: 'Spent', value: `Rs.${customer.totalSpent.toLocaleString('en-LK')}`, color: 'text-green-500' },{ icon: Banknote, label: 'Due', value: `Rs.${customer.dueAmount.toLocaleString('en-LK')}`, color: customer.dueAmount > 0 ? 'text-red-500' : 'text-gray-400' }].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 py-4 bg-white dark:bg-gray-900">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${color}`}><Icon size={15} /></div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</p>
                <p className="text-xs font-extrabold text-gray-900 dark:text-gray-100 tabular-nums leading-tight text-center px-1">{value}</p>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 flex flex-col gap-3">
            {customer.reminderCount > 0 && <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800"><Bell size={14} className="text-violet-500 shrink-0" /><div><p className="text-[10px] font-bold text-violet-500 uppercase tracking-wide">Reminders Sent</p><p className="text-sm font-bold text-violet-700 dark:text-violet-300">{customer.reminderCount} reminder{customer.reminderCount !== 1 ? 's' : ''}</p></div></div>}
            {customer.nic && <div className="flex items-start gap-3"><div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 mt-0.5"><IdCard size={14} className="text-gray-500 dark:text-gray-400" /></div><div className="flex-1 min-w-0"><p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">NIC</p><p className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-mono">{customer.nic}</p></div></div>}
            {customer.email && <div className="flex items-start gap-3"><div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 mt-0.5"><Mail size={14} className="text-gray-500 dark:text-gray-400" /></div><div className="flex-1 min-w-0"><p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Email</p><p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{customer.email}</p></div></div>}
            {customer.address && <div className="flex items-start gap-3"><div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 mt-0.5"><MapPin size={14} className="text-gray-500 dark:text-gray-400" /></div><div className="flex-1 min-w-0"><p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Address</p><p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug">{customer.address}</p></div></div>}
            <div className="flex items-start gap-3"><div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 mt-0.5"><Phone size={14} className="text-gray-500 dark:text-gray-400" /></div><div className="flex-1 min-w-0"><p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Phone</p><p className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{customer.phone}</p></div></div>
          </div>
        </div>
        <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-gray-800"><button onClick={onClose} className="w-full px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">Close</button></div>
      </div>
    </div>
  )
}

export default function CustomersPage() {
  const { customers, loading, fetchAll, create, update, remove, settle, sendReminder } = useCustomerStore()
  const reminderTemplate = useSettingsStore(s => s.reminderMessageTemplate)
  const [search, setSearch] = useState('')
  const [dueFilter, setDueFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState('table')
  useEffect(() => { fetchAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const mq = window.matchMedia('(max-width: 767px)'); const handler = (e) => setViewMode(e.matches ? 'grid' : 'table'); if (mq.matches) setViewMode('grid'); mq.addEventListener('change', handler); return () => mq.removeEventListener('change', handler) }, [])

  const [formTarget, setFormTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [settleTarget, setSettleTarget] = useState(null)
  const [viewTarget, setViewTarget] = useState(null)
  const [reminderTarget, setReminderTarget] = useState(null)
  const [historyTarget, setHistoryTarget] = useState(null)
  const [reminderLogs, setReminderLogs] = useState(SEED_REMINDER_LOGS)

  function resetPage() { setPage(1) }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return customers.filter(c => {
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
      const matchDue = dueFilter === 'all' ? true : dueFilter === 'due' ? c.dueAmount > 0 : c.dueAmount === 0
      return matchSearch && matchDue
    })
  }, [customers, search, dueFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  async function handleSaveCustomer(formData) {
    if (formTarget?.id) {
      const result = await update(formTarget.id, formData)
      if (result.success) { /* toast handled in store */ }
    } else {
      const result = await create(formData)
      if (result.success) { /* toast handled in store */ }
      resetPage()
    }
    setFormTarget(null)
  }

  async function handleDelete(id) {
    const result = await remove(id)
    if (result.success) { /* toast handled in store */ }
    setDeleteTarget(null); resetPage()
  }

  async function handleSettle(id, paymentAmount) {
    const result = await settle(id, paymentAmount)
    if (result.success) { /* toast handled in store */ }
    setSettleTarget(null)
  }

  async function handleSendReminder(id, message) {
    // 1. Persist reminder via API
    await sendReminder(id, message)
    // 2. Find customer phone number
    const customer = customers.find(c => c.id === id)
    if (customer) {
      // 3. Format phone for WhatsApp: strip leading 0, prepend 94
      let phone = customer.phone.replace(/[^0-9]/g, '')
      if (phone.startsWith('0')) phone = phone.slice(1)
      const fullPhone = `94${phone}`
      // 4. URL-encode the message
      const encoded = encodeURIComponent(message)
      // 5. Open WhatsApp Desktop/Web
      window.open(`https://wa.me/${fullPhone}?text=${encoded}`, '_blank')
    }
    setReminderTarget(null)
    /* toast handled in store */
  }

  const totalDue = customers.reduce((s, c) => s + c.dueAmount, 0)
  const withDueCount = customers.filter(c => c.dueAmount > 0).length
  const hasAnyFilter = search || dueFilter !== 'all'
  function clearAll() { setSearch(''); setDueFilter('all'); resetPage() }

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1><p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{customers.length} total · {withDueCount} with outstanding dues{loading && <span className="ml-2 text-amber-500">(loading…)</span>}</p></div>
        <div className="flex items-center gap-3 flex-wrap">
          {totalDue > 0 && <div className="flex items-center gap-2 px-4 py-2 rounded-xl shrink-0 bg-red-500/10 border border-red-500/20"><AlertTriangle size={14} className="text-red-500 shrink-0" /><span className="text-xs font-semibold text-red-600 dark:text-red-400">Total Outstanding:</span><span className="text-sm font-extrabold text-red-600 dark:text-red-400 tabular-nums">Rs. {totalDue.toLocaleString('en-LK')}</span></div>}
          <button onClick={() => setFormTarget({})} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 transition-opacity shadow-md shadow-amber-500/20 shrink-0"><UserPlus size={16} /> Add Customer</button>
        </div>
      </div>
      <div className="p-3 sm:p-4 rounded-2xl border bg-white dark:bg-gray-800/30 border-gray-200 dark:border-gray-700/50">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 min-w-[200px] bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
            <Search size={15} className="text-gray-400 dark:text-gray-500 shrink-0" />
            <input type="text" placeholder="Search by name or phone…" value={search} onChange={e => { setSearch(e.target.value); resetPage() }} className="bg-transparent border-none outline-none flex-1 min-w-0 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500" />
            {search && <button onClick={() => { setSearch(''); resetPage() }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><X size={14} /></button>}
          </div>
          <SearchableSelect options={DUE_FILTER_OPTIONS} value={dueFilter} onChange={v => { setDueFilter(v); resetPage() }} placeholder="All Customers" searchPlaceholder="Search filter…" triggerClassName="w-44" />
          {hasAnyFilter && <button onClick={clearAll} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 transition-colors shrink-0"><X size={12} /> Clear</button>}
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl shrink-0 ml-auto">{[{ id: 'table', Icon: List }, { id: 'grid', Icon: LayoutGrid }].map(({ id, Icon }) => (<button key={id} onClick={() => setViewMode(id)} aria-label={`${id} view`} className={`p-2 rounded-lg transition-all duration-150 ${viewMode === id ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}><Icon size={15} /></button>))}</div>
        </div>
        {hasAnyFilter && <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">Showing {filtered.length} of {customers.length} customers</p>}
      </div>

      {viewMode === 'table' ? (
        <div className="rounded-2xl border overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead><tr className="border-b bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700/50">{['Customer', 'Phone', 'Total Orders', 'Total Spent', 'Due Amount', 'Actions'].map(h => (<th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">{h}</th>))}</tr></thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {pageItems.length === 0 ? (<tr><td colSpan={6} className="px-4 py-14 text-center"><Users size={28} className="mx-auto mb-2 text-gray-300 dark:text-gray-700" /><p className="text-sm font-medium text-gray-400 dark:text-gray-600">No customers match your filters</p></td></tr>
                ) : pageItems.map(customer => {
                  const hasDue = customer.dueAmount > 0
                  const imgUrl = getImageUrl(customer.image)
                  return (
                    <tr key={customer.id} className="bg-white dark:bg-gray-900 hover:bg-amber-50/50 dark:hover:bg-gray-800/30 transition-colors duration-150">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {imgUrl ? <img src={imgUrl} alt={customer.name} onError={e => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex' }} className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-200 dark:border-gray-700" /> : null}
                          <div className={`w-8 h-8 rounded-full bg-amber-500 items-center justify-center text-white text-xs font-bold shrink-0 ${imgUrl ? 'hidden' : 'flex'}`}>{customer.name.charAt(0).toUpperCase()}</div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{customer.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap tabular-nums">{customer.phone}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"><ShoppingBag size={10} />{customer.totalOrders}</span></td>
                      <td className="px-4 py-3 font-bold tabular-nums whitespace-nowrap text-gray-900 dark:text-gray-100">Rs. {customer.totalSpent.toLocaleString('en-LK')}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{hasDue ? (<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"><AlertTriangle size={10} />Rs. {customer.dueAmount.toLocaleString('en-LK')}</span>) : (<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"><CheckCircle2 size={10} />Settled</span>)}</td>
                      <td className="px-4 py-3"><div className="flex items-center gap-1">
                        <button onClick={() => setViewTarget(customer)} className="p-2 rounded-xl transition-colors text-gray-400 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10"><Eye size={15} /></button>
                        <button onClick={() => setFormTarget(customer)} className="p-2 rounded-xl transition-colors text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10"><Pencil size={15} /></button>
                        <button onClick={() => setDeleteTarget(customer)} className="p-2 rounded-xl transition-colors text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 size={15} /></button>
                        {hasDue && <button onClick={() => setSettleTarget(customer)} className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800"><Banknote size={12} /> Settle{customer.paymentCount > 0 && <button type="button" onClick={e => { e.stopPropagation(); setHistoryTarget({ ...customer, _historyType: 'payments' }) }} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-extrabold flex items-center justify-center shadow-sm transition-colors active:scale-90">{customer.paymentCount > 9 ? '9+' : customer.paymentCount}</button>}</button>}
                        {hasDue && <button onClick={() => setReminderTarget(customer)} className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 border border-violet-200 dark:border-violet-800"><Bell size={12} /> Remind{customer.reminderCount > 0 && <button type="button" onClick={e => { e.stopPropagation(); setHistoryTarget({ ...customer, _historyType: 'reminders' }) }} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-violet-500 hover:bg-violet-600 text-white text-[9px] font-extrabold flex items-center justify-center shadow-sm transition-colors active:scale-90">{customer.reminderCount > 9 ? '9+' : customer.reminderCount}</button>}</button>}
                      </div></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <ModernPagination currentPage={safePage} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={PAGE_SIZE} onPageChange={p => setPage(p)} />
          {totalPages <= 1 && <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800"><p className="text-xs text-gray-400 dark:text-gray-600">{filtered.length} of {customers.length} customers</p></div>}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pageItems.length === 0 ? (<div className="flex flex-col items-center justify-center py-16 gap-3 text-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"><Users size={32} className="text-gray-300 dark:text-gray-700" /><p className="text-sm font-medium text-gray-400 dark:text-gray-600">No customers match your filters</p></div>
          ) : (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{pageItems.map(customer => (<CustomerCard key={customer.id} customer={customer} onView={setViewTarget} onEdit={setFormTarget} onDelete={setDeleteTarget} onSettle={setSettleTarget} onRemind={setReminderTarget} onHistory={setHistoryTarget} />))}</div>)}
          <ModernPagination currentPage={safePage} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={PAGE_SIZE} onPageChange={p => setPage(p)} />
          {totalPages <= 1 && filtered.length > 0 && <p className="text-xs text-gray-400 dark:text-gray-600 text-center">{filtered.length} of {customers.length} customers</p>}
        </div>
      )}

      {formTarget !== null && <CustomerFormModal initialData={formTarget?.id ? formTarget : null} onSave={handleSaveCustomer} onCancel={() => setFormTarget(null)} />}
      {deleteTarget && <DeleteModal customer={deleteTarget} onConfirm={() => handleDelete(deleteTarget.id)} onCancel={() => setDeleteTarget(null)} />}
      {settleTarget && <SettleModal customer={settleTarget} onConfirm={(paymentAmount) => handleSettle(settleTarget.id, paymentAmount)} onCancel={() => setSettleTarget(null)} />}
      {viewTarget && <ViewModal customer={viewTarget} onClose={() => setViewTarget(null)} />}
      {reminderTarget && <ReminderModal customer={reminderTarget} template={reminderTemplate} onSend={(message) => handleSendReminder(reminderTarget.id, message)} onCancel={() => setReminderTarget(null)} />}
      {historyTarget && historyTarget._historyType ? (
        <CustomerHistoryModal customer={historyTarget} type={historyTarget._historyType} onCancel={() => setHistoryTarget(null)} />
      ) : historyTarget && (
        <ReminderHistoryModal customer={historyTarget} logs={reminderLogs[historyTarget.id] ?? []} onClose={() => setHistoryTarget(null)} />
      )}
    </div>
  )
}