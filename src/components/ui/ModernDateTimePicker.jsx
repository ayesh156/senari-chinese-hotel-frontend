import { useState, useRef, useEffect } from 'react'
import { CalendarDays, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

export default function ModernDateTimePicker({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
}) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [viewDate, setViewDate] = useState(() => dateValue ? new Date(dateValue) : new Date())

  const dateRef = useRef(null)
  const timeRef = useRef(null)

  // Outside click listener to auto-close pickers
  useEffect(() => {
    function handleClickOutside(e) {
      if (dateRef.current && !dateRef.current.contains(e.target)) setShowDatePicker(false)
      if (timeRef.current && !timeRef.current.contains(e.target)) setShowTimePicker(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Month navigation
  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))

  // Calendar Day Generation
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  const today = new Date().toISOString().split('T')[0]

  // Time Slots generation (30 min increments between 8:00 AM and 10:00 PM)
  const timeSlots = []
  for (let h = 8; h <= 22; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      timeSlots.push(`${hh}:${mm}`)
    }
  }

  const formatDisplayTime = (timeStr) => {
    if (!timeStr) return '--:-- --'
    const [hh, mm] = timeStr.split(':')
    const h = parseInt(hh, 10)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayH = h % 12 || 12
    return `${displayH}:${mm} ${ampm}`
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
      {/* ── Modern Date Drop-up Picker ── */}
      <div className="relative" ref={dateRef}>
        <label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1 font-medium select-none">
          <CalendarDays size={12} className="text-amber-500" />
          Date
        </label>
        <button
          type="button"
          onClick={() => { setShowDatePicker(!showDatePicker); setShowTimePicker(false) }}
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                     bg-white dark:bg-gray-800 text-left text-sm font-semibold
                     text-gray-900 dark:text-gray-100 flex items-center justify-between
                     hover:border-amber-400 dark:hover:border-amber-500 transition shadow-sm"
        >
          <span>{dateValue || 'Select Date'}</span>
          <CalendarDays size={15} className="text-amber-500 shrink-0" />
        </button>

        {showDatePicker && (
          <div className="absolute bottom-full left-0 mb-2 z-[90] p-3.5 rounded-2xl border
                          bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700
                          shadow-2xl w-64 select-none animate-in fade-in zoom-in-95 duration-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                {viewDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                  <ChevronLeft size={14} />
                </button>
                <button type="button" onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: totalDays }).map((_, i) => {
                const dayNum = i + 1
                const curISO = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                const isSelected = dateValue === curISO
                const isPast = curISO < today

                return (
                  <button
                    key={curISO}
                    type="button"
                    disabled={isPast}
                    onClick={() => {
                      onDateChange(curISO)
                      setShowDatePicker(false)
                    }}
                    className={`h-7 w-7 rounded-lg text-xs font-semibold flex items-center justify-center transition
                      ${isSelected ? 'bg-amber-500 text-white shadow-sm font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/30'}
                      ${isPast ? 'opacity-20 cursor-not-allowed' : ''}
                    `}
                  >
                    {dayNum}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Modern Time Drop-up Picker ── */}
      <div className="relative" ref={timeRef}>
        <label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1 font-medium select-none">
          <Clock size={12} className="text-amber-500" />
          Time
        </label>
        <button
          type="button"
          onClick={() => { setShowTimePicker(!showTimePicker); setShowDatePicker(false) }}
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                     bg-white dark:bg-gray-800 text-left text-sm font-semibold
                     text-gray-900 dark:text-gray-100 flex items-center justify-between
                     hover:border-amber-400 dark:hover:border-amber-500 transition shadow-sm"
        >
          <span>{formatDisplayTime(timeValue)}</span>
          <Clock size={15} className="text-amber-500 shrink-0" />
        </button>

        {showTimePicker && (
          <div className="absolute bottom-full left-0 mb-2 z-[90] p-2.5 rounded-2xl border
                          bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700
                          shadow-2xl w-56 select-none animate-in fade-in zoom-in-95 duration-100">
            <div className="max-h-48 overflow-y-auto pr-1 grid grid-cols-2 gap-1.5 scrollbar-thin scrollbar-thumb-amber-500/20">
              {timeSlots.map((timeStr) => (
                <button
                  key={timeStr}
                  type="button"
                  onClick={() => {
                    onTimeChange(timeStr)
                    setShowTimePicker(false)
                  }}
                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold text-center transition ${
                    timeValue === timeStr
                      ? 'bg-amber-500 text-white shadow-sm font-bold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                  }`}
                >
                  {formatDisplayTime(timeStr)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}