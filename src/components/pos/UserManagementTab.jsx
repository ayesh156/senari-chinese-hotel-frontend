import { useState, useEffect, useCallback } from 'react'
import {
  Users, Plus, Pencil, Trash2, Lock, Power, PowerOff,
  X, CheckCircle2, AlertTriangle, Search, Mail, Shield,
  Calendar, RefreshCw, UserCog,
} from 'lucide-react'
import { useAuthStore, selectIsAdmin, selectUser } from '../../utils/authStore'
import { userApi } from '../../api/user.api'

// ─────────────────────────────────────────────────────────────────────────────
// ROLE BADGE COLORS
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_STYLES = {
  ADMIN:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  MANAGER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  CASHIER: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  STAFF:   'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400 border-gray-200 dark:border-gray-700',
}

const STATUS_STYLES = {
  active:       'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  deactivated:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ConfirmModal({ open, title, message, confirmLabel, onConfirm, onCancel, danger }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-full ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
            <AlertTriangle size={20} className={danger ? 'text-red-500' : 'text-amber-500'} />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400
                       bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                       border border-gray-200 dark:border-gray-600 transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold text-white min-h-[44px] transition-colors
                        ${danger
                          ? 'bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20'
                          : 'bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20'
                        }`}
          >
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────
function ToastNotification({ message, type, onClose }) {
  if (!message) return null
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [message, onClose])
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border
                      ${type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                      }`}>
      {type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// USER FORM MODAL (Create / Edit)
// ─────────────────────────────────────────────────────────────────────────────
function UserFormModal({ open, onClose, onSave, editUser }) {
  const isEdit = !!editUser
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STAFF',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editUser) {
      setForm({
        name: editUser.name || '',
        email: editUser.email || '',
        password: '',
        role: editUser.role || 'STAFF',
      })
    } else {
      setForm({ name: '', email: '', password: '', role: 'STAFF' })
    }
    setError('')
  }, [editUser, open])

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('Name is required'); return }
    if (!form.email.trim()) { setError('Email is required'); return }
    if (!isEdit && !form.password) { setError('Password is required'); return }
    if (!isEdit && form.password.length < 4) { setError('Password must be at least 4 characters'); return }

    setSaving(true)
    try {
      if (isEdit) {
        const payload = { name: form.name.trim(), email: form.email.trim(), role: form.role }
        await userApi.update(editUser.id, payload)
      } else {
        await userApi.create({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        })
      }
      onSave(isEdit ? 'updated' : 'created')
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save user')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg flex items-center gap-2">
            <UserCog size={20} />
            {isEdit ? 'Edit User' : 'Create New User'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name')(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-3 py-3 rounded-xl text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                         text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-colors min-h-[44px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email')(e.target.value)}
              placeholder="e.g. john@restaurant.com"
              className="w-full px-3 py-3 rounded-xl text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                         text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-colors min-h-[44px]"
            />
          </div>

          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => set('password')(e.target.value)}
                placeholder="Min. 4 characters"
                className="w-full px-3 py-3 rounded-xl text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                           text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-colors min-h-[44px]"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Role</label>
            <div className="flex flex-wrap gap-2">
              {['ADMIN', 'MANAGER', 'CASHIER', 'STAFF'].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => set('role')(r)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all min-h-[44px]
                              ${form.role === r
                                ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-amber-300'
                              }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400
                         bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                         border border-gray-200 dark:border-gray-600 transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600
                         text-white shadow-md shadow-amber-500/20 transition-all min-h-[44px] disabled:opacity-60"
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {saving ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD RESET MODAL (Admin)
// ─────────────────────────────────────────────────────────────────────────────
function PasswordResetModal({ open, onClose, user, onSuccess }) {
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setNewPassword('')
    setError('')
  }, [open])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!newPassword || newPassword.length < 4) {
      setError('Password must be at least 4 characters')
      return
    }
    setSaving(true)
    try {
      await userApi.resetPassword(user.id, newPassword)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Lock size={18} />
            Reset Password
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={20} className="text-gray-400" />
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Reset password for <strong className="text-gray-700 dark:text-gray-300">{user?.name}</strong>
        </p>
        {error && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Enter new password (min. 4 chars)"
            className="w-full px-3 py-3 rounded-xl text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                       text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 min-h-[44px]"
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400
                         bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 min-h-[44px]">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600
                         text-white shadow-md shadow-amber-500/20 min-h-[44px] disabled:opacity-60">
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Lock size={16} />}
              {saving ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SELF-PROFILE TAB (Non-Admin users)
// ─────────────────────────────────────────────────────────────────────────────
function MyProfileTab() {
  const user = useAuthStore(selectUser)
  const [form, setForm] = useState({
    name: user?.name || '',
    password: '',
    confirmPassword: '',
    currentPassword: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }))

  async function handleSave(e) {
    e.preventDefault()
    setError('')

    if (!form.currentPassword) {
      setError('Current password is required to make changes')
      return
    }

    if (form.password && form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (form.password && form.password.length < 4) {
      setError('New password must be at least 4 characters')
      return
    }

    if (!form.name.trim() && !form.password) {
      setError('At least name or new password must be provided')
      return
    }

    setSaving(true)
    try {
      const payload = { currentPassword: form.currentPassword }
      if (form.name.trim()) payload.name = form.name.trim()
      if (form.password) payload.password = form.password
      await userApi.selfUpdate(payload)
      setSaved(true)
      setForm(f => ({ ...f, password: '', confirmPassword: '', currentPassword: '' }))
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-amber-50 dark:bg-gray-800 rounded-2xl border border-amber-100 dark:border-gray-700 shadow-md overflow-hidden">
        <div className="px-5 py-3.5 border-b border-amber-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
            <UserCog size={16} /> My Account Profile
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Update your name and password. Email and role cannot be changed.
          </p>
        </div>
        <div className="px-5 py-5">
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Name</label>
                <input type="text" value={form.name} onChange={e => set('name')(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                             text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-400/40 min-h-[44px]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</label>
                <input type="email" value={user?.email || ''} disabled
                  className="w-full px-3 py-3 rounded-xl text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700
                             text-gray-400 dark:text-gray-600 cursor-not-allowed min-h-[44px]" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">New Password</label>
                <input type="password" value={form.password} onChange={e => set('password')(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="w-full px-3 py-3 rounded-xl text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                             text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-400/40 min-h-[44px]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Confirm Password</label>
                <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword')(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-3 rounded-xl text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                             text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-400/40 min-h-[44px]" />
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Current Password <span className="text-red-400">*</span>
                </label>
                <input type="password" value={form.currentPassword} onChange={e => set('currentPassword')(e.target.value)}
                  placeholder="Enter your current password to confirm changes"
                  className="w-full px-3 py-3 rounded-xl text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                             text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-400/40 min-h-[44px]" />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={saving}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all min-h-[44px]
                            ${saved
                              ? 'bg-green-500 text-white shadow-green-500/20'
                              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                            } disabled:opacity-60`}>
                {saving ? <RefreshCw size={16} className="animate-spin" /> : saved ? <CheckCircle2 size={16} /> : <UserCog size={16} />}
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN USER MANAGEMENT TAB
// ─────────────────────────────────────────────────────────────────────────────
export default function UserManagementTab() {
  const isAdmin = useAuthStore(selectIsAdmin)
  const currentUser = useAuthStore(selectUser)

  // If not admin, show self-profile tab
  if (!isAdmin) {
    return <MyProfileTab />
  }

  // ── State ──
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [passwordResetUser, setPasswordResetUser] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmToggle, setConfirmToggle] = useState(null)
  const [toast, setToast] = useState(null)

  // ── Toast helper ──
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
  }, [])

  // ── Fetch users ──
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await userApi.getAll()
      if (res.success) {
        setUsers(res.data.users || [])
      }
    } catch (err) {
      showToast(err.message || 'Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // ── Filter users by search ──
  const filtered = users.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q)
  })

  // ── Handlers ──
  function handleCreate() {
    setEditUser(null)
    setShowForm(true)
  }

  function handleEdit(user) {
    setEditUser(user)
    setShowForm(true)
  }

  function handlePasswordReset(user) {
    setPasswordResetUser(user)
    setShowPasswordReset(true)
  }

  async function handleDelete(user) {
    setConfirmDelete(null)
    try {
      await userApi.delete(user.id)
      showToast(`User "${user.name}" deleted successfully`)
      fetchUsers()
    } catch (err) {
      showToast(err.message || 'Failed to delete user', 'error')
    }
  }

  async function handleToggleStatus(user) {
    setConfirmToggle(null)
    try {
      await userApi.toggleStatus(user.id)
      showToast(`User "${user.name}" ${user.active ? 'deactivated' : 'activated'} successfully`)
      fetchUsers()
    } catch (err) {
      showToast(err.message || 'Failed to toggle status', 'error')
    }
  }

  function handleFormSave(action) {
    showToast(`User ${action === 'created' ? 'created' : 'updated'} successfully`)
    fetchUsers()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toast */}
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-800
                       border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100
                       placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 min-h-[44px]"
          />
        </div>

        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold
                     bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20
                     transition-all min-h-[44px] self-start"
        >
          <Plus size={16} />
          Add User
        </button>
      </div>

      {/* Users table */}
      <div className="bg-amber-50 dark:bg-gray-800 rounded-2xl border border-amber-100 dark:border-gray-700 shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={24} className="animate-spin text-amber-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-600">
            <Users size={40} className="mb-3 opacity-50" />
            <p className="text-sm font-medium">{search ? 'No users match your search' : 'No users found'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-100 dark:border-gray-700 bg-amber-100/50 dark:bg-gray-700/50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Created</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 dark:divide-gray-700">
                {filtered.map(user => (
                  <tr key={user.id} className="hover:bg-amber-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{user.name}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_STYLES[user.role] || ROLE_STYLES.STAFF}`}>
                        <Shield size={11} />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${user.active ? STATUS_STYLES.active : STATUS_STYLES.deactivated}`}>
                        {user.active ? <Power size={11} /> : <PowerOff size={11} />}
                        {user.active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(user)}
                          title="Edit user"
                          className="p-2 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handlePasswordReset(user)}
                          title="Reset password"
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          <Lock size={15} />
                        </button>
                        <button
                          onClick={() => setConfirmToggle(user)}
                          title={user.active ? 'Deactivate' : 'Activate'}
                          className={`p-2 rounded-lg transition-colors ${user.active
                            ? 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                            : 'text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                        >
                          {user.active ? <PowerOff size={15} /> : <Power size={15} />}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(user)}
                          title="Delete user"
                          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Count */}
      <p className="text-xs text-gray-400 dark:text-gray-600 text-right">
        Showing {filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}
      </p>

      {/* ── Modals ── */}

      <UserFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditUser(null) }}
        onSave={handleFormSave}
        editUser={editUser}
      />

      <PasswordResetModal
        open={showPasswordReset}
        onClose={() => { setShowPasswordReset(false); setPasswordResetUser(null) }}
        user={passwordResetUser}
        onSuccess={() => showToast('Password reset successfully')}
      />

      <ConfirmModal
        open={!!confirmDelete}
        title="Delete User"
        message={`Are you sure you want to permanently delete "${confirmDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmModal
        open={!!confirmToggle}
        title={confirmToggle?.active ? 'Deactivate User' : 'Activate User'}
        message={`Are you sure you want to ${confirmToggle?.active ? 'deactivate' : 'activate'} "${confirmToggle?.name}"? ${confirmToggle?.active ? 'They will not be able to log in.' : 'They will regain access to the system.'}`}
        confirmLabel={confirmToggle?.active ? 'Deactivate' : 'Activate'}
        danger={!!confirmToggle?.active}
        onConfirm={() => handleToggleStatus(confirmToggle)}
        onCancel={() => setConfirmToggle(null)}
      />
    </div>
  )
}