import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft, Save, Tag, DollarSign,
  FileText, ImageIcon, Upload, X, AlertCircle, Loader2,
  Clock, Flame, Leaf, Sparkles, Star, Utensils,
} from 'lucide-react'
import { useMasterDataStore } from '../../utils/masterDataStore'
import { useFoodStore } from '../../utils/foodStore'
import SearchableSelect from '../../components/ui/SearchableSelect'
import { fmtCurrencyDirect } from '../../utils/currency'
import FoodImageUploader from '../../components/pos/FoodImageUploader'
import { useSettingsStore } from '../../utils/settingsStore'


const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ── Constants ──────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name:        '',
  description: '',
  price:       '',
  categoryId:  null,
  image:       '',
  imageFile:   null,
  isNew:       false,
  isFeatured:  false,
  isHealthy:   false,
  available:   true,
  prepTimeMinutes: '15',
  calories:        '450',
  serves:          '1-2 persons',
  ingredients:     '',
  imageUrl:        '',
}

// ── Field Primitives ───────────────────────────────────────────────────────────
function FieldLabel({ icon: Icon, children, required }) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
      {Icon && <Icon size={15} className="shrink-0" />}
      {children}
      {required && <span className="text-red-500">*</span>}
    </label>
  )
}

function inputCls(hasError) {
  return `w-full px-4 py-2.5 rounded-xl border text-sm transition-all bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 ${hasError ? 'border-red-400 dark:border-red-500 focus:ring-red-400/30' : 'border-gray-200 dark:border-gray-700/50 focus:border-amber-400 focus:ring-amber-400/20'}`
}

function FieldError({ msg }) {
  if (!msg) return null
  return <p className="flex items-center gap-1 mt-1 text-xs text-red-500"><AlertCircle size={11} /> {msg}</p>
}

// ── Toggle Switch ──────────────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, label, sub, icon: Icon, iconColor }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={16} className={iconColor || 'text-gray-400'} />}
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
          {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
        </div>
      </div>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full shrink-0 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400/40 ${checked ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function FoodFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const currencySymbol = useSettingsStore(s => s.currencySymbol || 'Rs.')


  const foodCategories = useMasterDataStore(s => s.foodCategories)
  const foods = useFoodStore(s => s.foods)
  const loading = useFoodStore(s => s.loading)
  const create = useFoodStore(s => s.create)
  const update = useFoodStore(s => s.update)

  const categoryOptions = useMemo(() => {
    if (!Array.isArray(foodCategories)) return []
    return foodCategories.map(c => ({ value: c.id, label: c.name }))
  }, [foodCategories])

  const [form, setForm] = useState(EMPTY_FORM)
  // Image catalog state: array of { id, preview, file, path }
  const [catalog, setCatalog] = useState([])
  const [primaryId, setPrimaryId] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (!foodCategories || foodCategories.length === 0) {
      useMasterDataStore.getState().fetchAll?.()
    }
  }, [foodCategories])

  // Fetch item directly from API if refreshed or not found in state store
  useEffect(() => {
    if (!isEditing) {
      if (!form.categoryId && categoryOptions[0]) {
        setForm(f => ({ ...f, categoryId: categoryOptions[0].value }))
      }
      return
    }

    let isMounted = true
    async function loadItem() {
      setFetching(true)
      try {
        let item = foods.find(f => f.id === parseInt(id, 10))
        if (!item) {
          const res = await fetch(`${API_BASE}/foods/${id}`)
          const json = await res.json()
          if (json.success && json.data) item = json.data
        }

        if (item && isMounted) {
          const serverBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')
          
          // Build images catalog array from item.images or fallback to item.image
          const rawImages = Array.isArray(item.images) && item.images.length > 0
            ? item.images
            : (item.image ? [item.image] : [])

          const loadedCatalog = rawImages.map((imgPath, idx) => {
            const fullUrl = imgPath.startsWith('http://') || imgPath.startsWith('https://')
              ? imgPath
              : `${serverBase}${imgPath.startsWith('/') ? '' : '/'}${imgPath}`
            return {
              id: `db-${idx}-${Date.now()}`,
              preview: fullUrl,
              file: null,
              path: imgPath,
            }
          })

          setCatalog(loadedCatalog)
          if (loadedCatalog.length > 0) {
            // Match primaryId with current item.image
            const matchedPrimary = loadedCatalog.find(c => c.path === item.image)
            setPrimaryId(matchedPrimary ? matchedPrimary.id : loadedCatalog[0].id)
          }

          setForm({
            name: item.name || '',
            description: item.description || '',
            price: String(item.price ?? ''),
            categoryId: item.categoryId,
            image: item.image || '',
            imageFile: null,
            isNew: item.isNew ?? false,
            isFeatured: item.isFeatured ?? false,
            isHealthy: item.isHealthy ?? false,
            available: item.isAvailable ?? true,
            prepTimeMinutes: String(item.prepTimeMinutes ?? 15),
            calories: String(item.calories ?? 450),
            serves: item.serves || '1-2 persons',
            ingredients: Array.isArray(item.ingredients) ? item.ingredients.join(', ') : (item.ingredients || ''),
            imageUrl: '',
          })
        }
      } catch (err) {
        console.error('Failed to fetch food details:', err)
      } finally {
        if (isMounted) setFetching(false)
      }
    }

    loadItem()
    return () => { isMounted = false }
  }, [id, isEditing, categoryOptions])

  const set = (key) => (val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.categoryId) e.category = 'Category is required'
    const p = Number(form.price)
    if (!form.price || isNaN(p) || p <= 0) e.price = 'Enter a valid price greater than 0'
    const prep = Number(form.prepTimeMinutes)
    if (!form.prepTimeMinutes || isNaN(prep) || prep <= 0) e.prepTimeMinutes = 'Enter valid prep time'
    const cal = Number(form.calories)
    if (!form.calories || isNaN(cal) || cal <= 0) e.calories = 'Enter valid calories'
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name.trim())
      fd.append('price', form.price)
      fd.append('categoryId', String(form.categoryId))
      fd.append('description', form.description)
      fd.append('isAvailable', form.available ? 'true' : 'false')
      fd.append('isNew', form.isNew ? 'true' : 'false')
      fd.append('isFeatured', form.isFeatured ? 'true' : 'false')
      fd.append('isHealthy', form.isHealthy ? 'true' : 'false')
      // Format serves: if only a number is entered, auto-append person/persons
      let formattedServes = (form.serves || '').trim()
      if (/^\d+$/.test(formattedServes)) {
        const count = parseInt(formattedServes, 10)
        formattedServes = count === 1 ? '1 person' : `${count} persons`
      }

      fd.append('prepTimeMinutes', form.prepTimeMinutes)
      fd.append('calories', form.calories)
      fd.append('serves', formattedServes || '1-2 persons')
      fd.append('ingredients', form.ingredients)

      // Append all new files to 'images' for multer upload.array('images')
      catalog.forEach(item => {
        if (item.file instanceof File) {
          fd.append('images', item.file)
        }
      })

      // Send list of existing DB paths to preserve in catalog
      const existingPaths = catalog.filter(i => Boolean(i.path)).map(i => i.path)
      fd.append('existingImages', JSON.stringify(existingPaths))

      // Specify primary image path
      const currentPrimary = catalog.find(i => i.id === primaryId) || catalog[0]
      if (currentPrimary && currentPrimary.path) {
        fd.append('primaryImage', currentPrimary.path)
      }

      let success;
      if (isEditing) {
        success = await update(id, fd);
      } else {
        success = await create(fd);
      }

      if (success) {
        navigate('/pos/foods');
      } else {
        setErrors({ form: 'Failed to save food item' });
      }
    } catch (err) {
      console.error('[FoodFormPage] Save error:', err)
      setErrors({ form: err.message })
    } finally {
      setSaving(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 size={20} className="animate-spin" />
          <span>Loading food item…</span>
        </div>
      </div>
    )
  }

  const pageTitle = isEditing ? `Edit: ${form.name || 'Food Item'}` : 'Add New Food'

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => navigate('/pos/foods')}
          className="p-2 rounded-xl transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Back to Foods">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">{pageTitle}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{isEditing ? 'Update the details below and save' : 'Fill in the details to add a new food item'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="rounded-2xl border p-4 sm:p-6 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
          {errors.form && (
            <div className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">{errors.form}</div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col gap-5">
              <div>
                <FieldLabel icon={Tag} required>Item Name</FieldLabel>
                <input type="text" value={form.name} onChange={e => set('name')(e.target.value)} placeholder="e.g. Chicken Kottu" className={inputCls(errors.name)} />
                <FieldError msg={errors.name} />
              </div>
              <div>
                <FieldLabel icon={FileText}>Description</FieldLabel>
                <textarea rows={4} value={form.description} onChange={e => set('description')(e.target.value)} placeholder="Describe the dish…" className={`${inputCls(false)} resize-none`} />
              </div>
              <div>
                <FieldLabel icon={DollarSign} required>Price ({currencySymbol})</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-gray-500 pointer-events-none">{currencySymbol}</span>
                  <input type="number" min="1" step="1" value={form.price} onChange={e => set('price')(e.target.value)} placeholder="0" className={`${inputCls(errors.price)} pl-10`} />
                </div>
                <FieldError msg={errors.price} />
              </div>
              <div>
                <FieldLabel required>Category</FieldLabel>
                <SearchableSelect options={categoryOptions} value={form.categoryId} onChange={val => set('categoryId')(val)} placeholder="Select category…" searchPlaceholder="Search categories…" />
                <FieldError msg={errors.category} />
              </div>

              {/* Nutritional fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel icon={Clock}>Prep Time (min)</FieldLabel>
                  <input type="number" min="1" step="1" value={form.prepTimeMinutes} onChange={e => set('prepTimeMinutes')(e.target.value)} placeholder="15" className={inputCls(errors.prepTimeMinutes)} />
                  <FieldError msg={errors.prepTimeMinutes} />
                </div>
                <div>
                  <FieldLabel icon={Flame}>Calories (kcal)</FieldLabel>
                  <input type="number" min="1" step="1" value={form.calories} onChange={e => set('calories')(e.target.value)} placeholder="450" className={inputCls(errors.calories)} />
                  <FieldError msg={errors.calories} />
                </div>
              </div>

              {/* Serves & Ingredients */}
              <div>
                <FieldLabel icon={Utensils}>Serves / Portion Size</FieldLabel>
                <input type="text" value={form.serves} onChange={e => set('serves')(e.target.value)} placeholder="e.g. 1-2 Persons" className={inputCls(false)} />
              </div>
              <div>
                <FieldLabel icon={FileText}>Key Ingredients</FieldLabel>
                <input type="text" value={form.ingredients} onChange={e => set('ingredients')(e.target.value)} placeholder="e.g. Egg, Soy Sauce, Garlic (comma-separated)" className={inputCls(false)} />
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <FieldLabel icon={ImageIcon}>Food Image Catalog</FieldLabel>
                <FoodImageUploader
                  catalog={catalog}
                  primaryId={primaryId}
                  onAddImages={(newItems) => setCatalog(prev => [...prev, ...newItems])}
                  onRemoveImage={(id) => setCatalog(prev => prev.filter(i => i.id !== id))}
                  onSetPrimary={(id) => setPrimaryId(id)}
                />
              </div>
              <div className="flex flex-col gap-4 p-4 rounded-2xl border bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700/50">
                <ToggleSwitch checked={form.available} onChange={set('available')} label="Available" sub="Show as orderable on the menu" />
                <div className="border-t border-gray-200 dark:border-gray-700/50" />
                <ToggleSwitch checked={form.isNew} onChange={set('isNew')} label="Mark as New" sub="Display 'NEW' badge on the food card" icon={Sparkles} iconColor="text-amber-500" />
                <div className="border-t border-gray-200 dark:border-gray-700/50" />
                <ToggleSwitch checked={form.isFeatured} onChange={set('isFeatured')} label="Mark as Featured" sub="Highlight as a featured item" icon={Star} iconColor="text-yellow-500" />
                <div className="border-t border-gray-200 dark:border-gray-700/50" />
                <ToggleSwitch checked={form.isHealthy} onChange={set('isHealthy')} label="Healthy Item" sub="Mark as under 500 kcal" icon={Leaf} iconColor="text-green-500" />
              </div>
              {form.price && Number(form.price) > 0 && (
                <div className="p-4 rounded-2xl border bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-500/20">
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">Price Preview</p>
                  <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">{fmtCurrencyDirect(form.price)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700/50">
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-amber-500/20">
              {saving ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving…</span>
              ) : (
                <><Save size={16} />{isEditing ? 'Save Changes' : 'Add Food'}</>
              )}
            </button>
            <button type="button" onClick={() => navigate('/pos/foods')} disabled={saving}
              className="flex-1 px-6 py-2.5 rounded-xl font-medium text-sm border transition-colors bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600/50 disabled:opacity-60">
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}