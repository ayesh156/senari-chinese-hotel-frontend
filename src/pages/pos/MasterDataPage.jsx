import { useState, useEffect } from 'react'
import { Database, UtensilsCrossed, Package, Ruler, Loader2 } from 'lucide-react'
import { useMasterDataStore } from '../../utils/masterDataStore'
import MasterDataListPanel from '../../components/pos/MasterDataListPanel'

const TABS = [
  { id: 'food',       label: 'Food Categories',      icon: UtensilsCrossed },
  { id: 'inventory',  label: 'Inventory Categories', icon: Package         },
  { id: 'units',      label: 'Units',                icon: Ruler           },
]

export default function MasterDataPage() {
  const [tab, setTab] = useState('food')

  const foodCategories      = useMasterDataStore(s => s.foodCategories)
  const inventoryCategories = useMasterDataStore(s => s.inventoryCategories)
  const units               = useMasterDataStore(s => s.units)
  const loading             = useMasterDataStore(s => s.loading)
  const error               = useMasterDataStore(s => s.error)
  const fetchAll            = useMasterDataStore(s => s.fetchAll)

  const addFoodCategory      = useMasterDataStore(s => s.addFoodCategory)
  const renameFoodCategory   = useMasterDataStore(s => s.renameFoodCategory)
  const deleteFoodCategory   = useMasterDataStore(s => s.deleteFoodCategory)

  const addInventoryCategory    = useMasterDataStore(s => s.addInventoryCategory)
  const renameInventoryCategory = useMasterDataStore(s => s.renameInventoryCategory)
  const deleteInventoryCategory = useMasterDataStore(s => s.deleteInventoryCategory)

  const addUnit    = useMasterDataStore(s => s.addUnit)
  const renameUnit = useMasterDataStore(s => s.renameUnit)
  const deleteUnit = useMasterDataStore(s => s.deleteUnit)

  // Fetch master data on mount
  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Database size={26} className="text-amber-500 shrink-0" />
          Master Data
        </h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          Shared categories and units for Foods and Inventory
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1 rounded-2xl border
                      bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-semibold
                       transition-all duration-150 flex-1 sm:flex-none justify-center min-w-0
                       ${tab === id
                         ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                         : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
                       }`}
          >
            <Icon size={16} className="shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500 dark:text-gray-400">
          <Loader2 size={16} className="animate-spin" />
          Loading master data…
        </div>
      )}

      {/* Error indicator */}
      {error && (
        <div className="px-4 py-3 rounded-xl text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
          {error}
        </div>
      )}

      {/* Panel */}
      <div className="p-4 sm:p-5 rounded-2xl border
                      bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        {tab === 'food' && (
          <MasterDataListPanel
            items={foodCategories}
            entityLabel="Category"
            addPlaceholder="e.g. Appetizers"
            onAdd={addFoodCategory}
            onRename={renameFoodCategory}
            onDelete={deleteFoodCategory}
          />
        )}
        {tab === 'inventory' && (
          <MasterDataListPanel
            items={inventoryCategories}
            entityLabel="Category"
            addPlaceholder="e.g. Frozen"
            onAdd={addInventoryCategory}
            onRename={renameInventoryCategory}
            onDelete={deleteInventoryCategory}
          />
        )}
        {tab === 'units' && (
          <MasterDataListPanel
            items={units}
            entityLabel="Unit"
            addPlaceholder="e.g. kg, portions"
            onAdd={addUnit}
            onRename={renameUnit}
            onDelete={deleteUnit}
          />
        )}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-600 text-center px-2">
        Changes apply immediately across Foods and Inventory forms.
      </p>
    </div>
  )
}