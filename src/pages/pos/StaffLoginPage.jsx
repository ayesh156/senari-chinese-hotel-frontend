import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChefHat, Delete, LogIn, AlertCircle, ShieldCheck } from 'lucide-react'
import { useAuthStore, STAFF_ACCOUNTS } from '../../utils/authStore'

// ── PIN Pad digit button ──────────────────────────────────────────────────────
function PinKey({ label, sub, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center
        h-14 rounded-2xl text-lg font-bold
        transition-all duration-100 active:scale-95 select-none
        ${danger
          ? `text-red-500 dark:text-red-400
             bg-red-50 dark:bg-red-900/20
             hover:bg-red-100 dark:hover:bg-red-900/40
             border border-red-200 dark:border-red-800`
          : `text-gray-900 dark:text-gray-100
             bg-white dark:bg-gray-800
             hover:bg-amber-50 dark:hover:bg-gray-700
             border border-gray-200 dark:border-gray-700
             shadow-sm hover:shadow-md hover:-translate-y-px`
        }
      `}
    >
      <span>{label}</span>
      {sub && <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 tracking-widest -mt-0.5">{sub}</span>}
    </button>
  )
}

// ── PIN dot display ───────────────────────────────────────────────────────────
function PinDots({ length, filled, shake }) {
  return (
    <div className={`flex items-center justify-center gap-3 h-8 ${shake ? 'animate-[shake_0.35s_ease-in-out]' : ''}`}>
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full transition-all duration-150
                      ${i < filled
                        ? 'bg-amber-500 scale-110 shadow-md shadow-amber-500/40'
                        : 'bg-gray-200 dark:bg-gray-700'
                      }`}
        />
      ))}
    </div>
  )
}

// ── Staff selector card ───────────────────────────────────────────────────────
function StaffCard({ staff, selected, onClick }) {
  const roleColor = staff.role === 'ADMIN'
    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'

  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-2 p-4 rounded-2xl border-2
        transition-all duration-150 active:scale-95
        ${selected
          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-md shadow-amber-500/20'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-amber-300 dark:hover:border-amber-700'
        }
      `}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center
                       text-white text-lg font-extrabold shadow-sm
                       ${selected ? 'bg-amber-500' : 'bg-gray-400 dark:bg-gray-600'}`}>
        {staff.avatar}
      </div>
      <p className={`text-sm font-semibold truncate max-w-[80px]
                     ${selected ? 'text-amber-700 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'}`}>
        {staff.name}
      </p>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleColor}`}>
        {staff.role}
      </span>
    </button>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const PIN_LENGTH = 4

export default function StaffLoginPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const login     = useAuthStore(s => s.login)

  // Where to go after successful login (default: POS dashboard)
  const from = location.state?.from?.pathname ?? '/pos/dashboard'

  const [selectedStaff, setSelectedStaff] = useState(STAFF_ACCOUNTS[0])
  const [pin,           setPin]           = useState('')
  const [error,         setError]         = useState('')
  const [shake,         setShake]         = useState(false)
  const [isLogging,     setIsLogging]     = useState(false)

  // Clear error when staff or pin changes
  useEffect(() => { setError('') }, [selectedStaff, pin])

  // ── PIN pad handlers ──────────────────────────────────────────────────────
  const appendDigit = useCallback((d) => {
    setPin(prev => prev.length < PIN_LENGTH ? prev + d : prev)
  }, [])

  const deleteDigit = useCallback(() => {
    setPin(prev => prev.slice(0, -1))
  }, [])

  const clearPin = useCallback(() => setPin(''), [])

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleLogin = useCallback(() => {
    if (pin.length < PIN_LENGTH) {
      setError(`Enter your ${PIN_LENGTH}-digit PIN`)
      triggerShake()
      return
    }
    if (pin !== selectedStaff.pin) {
      setError('Incorrect PIN. Please try again.')
      triggerShake()
      setPin('')
      return
    }
    setIsLogging(true)
    // Small delay for visual feedback
    setTimeout(() => {
      login({ id: selectedStaff.id, name: selectedStaff.name, role: selectedStaff.role, avatar: selectedStaff.avatar })
      navigate(from, { replace: true })
    }, 350)
  }, [pin, selectedStaff, login, navigate, from])

  function triggerShake() {
    setShake(true)
    setTimeout(() => setShake(false), 400)
  }

  // Auto-submit when PIN is fully entered
  useEffect(() => {
    if (pin.length === PIN_LENGTH) handleLogin()
  }, [pin]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (e.key >= '0' && e.key <= '9') appendDigit(e.key)
      else if (e.key === 'Backspace')    deleteDigit()
      else if (e.key === 'Escape')       clearPin()
      else if (e.key === 'Enter')        handleLogin()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [appendDigit, deleteDigit, clearPin, handleLogin])

  const PIN_KEYS = [
    ['1',''],['2','ABC'],['3','DEF'],
    ['4','GHI'],['5','JKL'],['6','MNO'],
    ['7','PQRS'],['8','TUV'],['9','WXYZ'],
    ['*',''],['0',''],['⌫',''],
  ]

  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-gray-50 dark:bg-gray-950 p-4">

      {/* Card */}
      <div className="w-full max-w-sm flex flex-col gap-6">

        {/* Brand header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center
                          w-16 h-16 rounded-2xl bg-amber-500 shadow-xl shadow-amber-500/30 mb-4">
            <ChefHat size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
            POS System
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Senari Chinese Hotel
          </p>
        </div>

        {/* Staff selector */}
        <div>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500
                        uppercase tracking-widest mb-3 text-center">
            Select Staff
          </p>
          <div className="grid grid-cols-3 gap-2">
            {STAFF_ACCOUNTS.map(s => (
              <StaffCard
                key={s.id}
                staff={s}
                selected={selectedStaff.id === s.id}
                onClick={() => { setSelectedStaff(s); setPin('') }}
              />
            ))}
          </div>
        </div>

        {/* PIN entry */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border
                        border-gray-200 dark:border-gray-800 shadow-sm p-5">

          {/* Greeting */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center
                            text-white text-xs font-bold shrink-0">
              {selectedStaff.avatar}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {selectedStaff.name}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                Enter your {PIN_LENGTH}-digit PIN
              </p>
            </div>
            <ShieldCheck size={16} className="ml-auto text-amber-500 shrink-0" />
          </div>

          {/* PIN dots */}
          <PinDots length={PIN_LENGTH} filled={pin.length} shake={shake} />

          {/* Error */}
          <div className={`flex items-center justify-center gap-1.5 mt-2 h-5
                           transition-opacity duration-200 ${error ? 'opacity-100' : 'opacity-0'}`}>
            <AlertCircle size={12} className="text-red-500 shrink-0" />
            <p className="text-xs text-red-500 font-medium">{error || ' '}</p>
          </div>

          {/* PIN pad */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {PIN_KEYS.map(([label, sub]) => {
              if (label === '⌫') {
                return (
                  <PinKey
                    key="del"
                    label={<Delete size={18} />}
                    onClick={deleteDigit}
                    danger
                  />
                )
              }
              if (label === '*') {
                return (
                  <PinKey
                    key="clear"
                    label="C"
                    onClick={clearPin}
                    danger
                  />
                )
              }
              return (
                <PinKey
                  key={label}
                  label={label}
                  sub={sub}
                  onClick={() => appendDigit(label)}
                />
              )
            })}
          </div>

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={pin.length < PIN_LENGTH || isLogging}
            className="mt-4 w-full flex items-center justify-center gap-2
                       py-3 rounded-2xl font-bold text-sm
                       bg-gradient-to-r from-amber-500 to-orange-500 text-white
                       shadow-lg shadow-amber-500/30
                       hover:opacity-90 active:scale-[0.98]
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all duration-150"
          >
            {isLogging ? (
              <>
                <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
                Signing in…
              </>
            ) : (
              <>
                <LogIn size={16} />
                Sign In
              </>
            )}
          </button>
        </div>

        {/* Footer hint */}
        <p className="text-center text-[11px] text-gray-400 dark:text-gray-600">
          © 2026 Senari Chinese Hotel
        </p>
      </div>
    </div>
  )
}
