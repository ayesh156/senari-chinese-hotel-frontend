import { useState } from 'react'
import { Phone, Mail, MapPin, Send, CheckCircle2 } from 'lucide-react'
import AnimatedSection from '../../components/ui/AnimatedSection'

// ── Shared input style ────────────────────────────────────────────────────────
const inputClass = [
  'w-full px-4 py-2.5 rounded-xl border',
  'border-gray-200 dark:border-gray-700',
  'bg-white dark:bg-gray-800',
  'text-gray-900 dark:text-gray-100',
  'placeholder:text-gray-400 dark:placeholder:text-gray-500',
  'focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent',
  'dark:[color-scheme:dark]',
  'transition text-sm',
].join(' ')

// ── Contact Detail Item ───────────────────────────────────────────────────────
function ContactDetail({ icon: Icon, label, value, href }) {
  const content = (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/30
                      flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={18} className="text-amber-500" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</p>
      </div>
    </div>
  )
  return href
    ? <a href={href} className="hover:opacity-80 transition-opacity">{content}</a>
    : <div>{content}</div>
}

// ── Contact Form ──────────────────────────────────────────────────────────────
function ContactForm() {
  const [form, setForm]           = useState({ name: '', email: '', subject: '', message: '' })
  const [errors, setErrors]       = useState({})
  const [submitted, setSubmitted] = useState(false)

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => ({ ...p, [k]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())    e.name    = 'Name is required.'
    if (!form.email.trim())   e.email   = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.'
    if (!form.subject.trim()) e.subject = 'Subject is required.'
    if (!form.message.trim()) e.message = 'Message is required.'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20
                        flex items-center justify-center">
          <CheckCircle2 size={36} className="text-green-500" strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Message Sent!</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          Thanks for reaching out. We'll get back to you as soon as possible.
        </p>
        <button
          onClick={() => { setForm({ name: '', email: '', subject: '', message: '' }); setSubmitted(false) }}
          className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
          <input type="text" placeholder="Kamal Perera" value={form.name}
            onChange={e => set('name', e.target.value)} className={inputClass} />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
          <input type="email" placeholder="kamal@example.com" value={form.email}
            onChange={e => set('email', e.target.value)} className={inputClass} />
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
        <input type="text" placeholder="e.g. Table reservation enquiry" value={form.subject}
          onChange={e => set('subject', e.target.value)} className={inputClass} />
        {errors.subject && <p className="text-xs text-red-500">{errors.subject}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
        <textarea rows={5} placeholder="Write your message here…" value={form.message}
          onChange={e => set('message', e.target.value)} className={`${inputClass} resize-none`} />
        {errors.message && <p className="text-xs text-red-500">{errors.message}</p>}
      </div>

      <button type="submit"
        className="self-start inline-flex items-center gap-2
                   bg-amber-500 hover:bg-amber-600 active:scale-95
                   text-white font-semibold px-7 py-3 rounded-full
                   shadow-md shadow-amber-200 dark:shadow-amber-900/30
                   transition-all duration-150 text-sm">
        <Send size={15} /> Send Message
      </button>
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ContactPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">

      {/* Page header */}
      <AnimatedSection className="mb-10 text-center md:text-left">
        <p className="text-amber-600 dark:text-amber-400 text-sm font-semibold uppercase tracking-widest mb-1">
          Get in Touch
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100">
          Contact Us
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm md:text-base max-w-lg mx-auto md:mx-0">
          Have a question, feedback, or want to make a group reservation? We'd love to hear from you.
        </p>
      </AnimatedSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Left: Details + Map ── */}
        <AnimatedSection delay={0.05}>
          <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800
                            rounded-3xl p-6 flex flex-col gap-5 shadow-sm">
              <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Find Us</h2>
              <ContactDetail icon={Phone} label="Phone" value="+94 76 280 1006" href="tel:+94762801006" />
              <ContactDetail icon={Mail}  label="Email" value="hello@senarichinese.lk" href="mailto:hello@senarichinese.lk" />
              <ContactDetail icon={MapPin} label="Address" value="Senari Chinese Hotel, Sri Lanka" />
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                  Opening Hours
                </p>
                <div className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span>Mon – Fri</span><span className="font-medium">10:00 AM – 9:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sat – Sun</span><span className="font-medium">8:00 AM – 10:00 PM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Map */}
            <div className="rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
              <iframe
                src="https://maps.google.com/maps?q=Senari+Chinese+Hotel,Sri+Lanka&t=&z=13&ie=UTF8&iwloc=&output=embed"
                className="w-full h-80 border-0"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Senari Chinese Hotel location on Google Maps"
              />
            </div>
          </div>
        </AnimatedSection>

        {/* ── Right: Contact Form ── */}
        <AnimatedSection delay={0.15}>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800
                          rounded-3xl p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-5">Send a Message</h2>
            <ContactForm />
          </div>
        </AnimatedSection>

      </div>
    </div>
  )
}
