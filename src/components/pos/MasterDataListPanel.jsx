import { useState, useRef, useEffect } from 'react'
import {
  Plus, Pencil, Trash2, Check, X, AlertTriangle, Layers, Loader2,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
function DeleteConfirmModal({ name, entityLabel, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]
                    flex items-center justify-center p-4">
      <div className="rounded-2xl max-w-md w-full shadow-2xl border overflow-hidden
                      bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/50">
        <div className="p-6 border-b
                        bg-gradient-to-r from-red-100 to-red-50
                        dark:from-red-600/20 dark:to-red-500/10
                        border-red-200 dark:border-red-500/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                            bg-red-100 dark:bg-red-500/20">
              <AlertTriangle size={22} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Delete {entityLabel}
            </h2>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
            This {entityLabel.toLowerCase()} will be removed from lookup lists. The server will verify it is not in use. This cannot be undone.
          </p>
          <p className="text-sm font-semibold p-3 rounded-xl border
                        text-gray-900 dark:text-white
                        bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
            "{name}"
          </p>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700/50 flex gap-3">
          <button type="button" onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm text-white
                       bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600
                       transition-all flex items-center justify-center gap-2">
            <Trash2 size={15} /> Delete
          </button>
          <button type="button" onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors
                       bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700
                       text-gray-900 dark:text-white border-gray-300 dark:border-gray-600/50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
function ListRow({ name, onRename, onDeleteRequest }) {
  const [editing, setEditing] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [editValue, setEditValue] = useState(name)
  const [editError, setEditError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) {
      setEditValue(name)
      setEditError('')
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing, name])

  const inputCls =
    `flex-1 min-w-0 px-3 py-2 rounded-xl text-sm
     bg-white dark:bg-gray-800 border text-gray-900 dark:text-white
     focus:outline-none focus:ring-2 transition-colors
     ${editError
       ? 'border-red-400 focus:ring-red-400/30'
       : 'border-gray-200 dark:border-gray-700 focus:ring-amber-400/40'
     }`

  async function saveEdit() {
    const trimmed = editValue.trim()
    if (!trimmed) { setEditError('Name cannot be empty'); return }
    if (trimmed === name) { setEditing(false); return }
    setRenaming(true)
    const ok = await onRename(name, trimmed)
    setRenaming(false)
    if (!ok) { setEditError('This name already exists'); return }
    setEditing(false)
  }

  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-center gap-2 p-3 rounded-xl border
                      bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700/50">
        {editing ? (
          <>
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={e => { setEditValue(e.target.value); setEditError('') }}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); saveEdit() }
                if (e.key === 'Escape') { setEditing(false); setEditValue(name) }
              }}
              className={inputCls}
            />
            <button type="button" onClick={saveEdit} disabled={renaming}
              className="p-2 rounded-xl shrink-0 text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 disabled:opacity-50">
              {renaming ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            </button>
            <button type="button" onClick={() => { setEditing(false); setEditValue(name) }}
              className="p-2 rounded-xl shrink-0 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
              <X size={16} />
            </button>
          </>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{name}</p>
            </div>
            <button type="button" onClick={() => setEditing(true)}
              className="p-2 rounded-xl shrink-0 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10">
              <Pencil size={15} />
            </button>
            <button type="button" onClick={() => onDeleteRequest(name)}
              className="p-2 rounded-xl shrink-0 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
              <Trash2 size={15} />
            </button>
          </>
        )}
      </div>
      {editError && editing && (
        <p className="text-xs text-red-500 px-1 flex items-center gap-1">
          <AlertTriangle size={10} /> {editError}
        </p>
      )}
    </li>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function MasterDataListPanel({
  items,
  entityLabel,
  addPlaceholder,
  onAdd,
  onRename,
  onDelete,
}) {
  const [newName, setNewName] = useState('')
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Debug: confirm we receive the items prop
  console.log(`[MasterDataListPanel] ${entityLabel} render - items:`, items?.length, 'isArray:', Array.isArray(items))

  async function handleAdd(e) {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) { setAddError(`Enter a ${entityLabel.toLowerCase()} name`); return }
    setAdding(true)
    const ok = await onAdd(trimmed)
    setAdding(false)
    if (!ok) { setAddError('This name already exists'); return }
    setNewName('')
    setAddError('')
  }

  const inputCls =
    `flex-1 min-w-0 px-3 py-2.5 rounded-xl text-sm
     bg-white dark:bg-gray-800 border text-gray-900 dark:text-white
     focus:outline-none focus:ring-2 focus:ring-amber-400/40
     border-gray-200 dark:border-gray-700
     ${addError ? 'border-red-400' : ''}`

  return (
    <>
      <form onSubmit={handleAdd} className="mb-4">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
          Add {entityLabel}
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => { setNewName(e.target.value); setAddError('') }}
            placeholder={addPlaceholder}
            className={inputCls}
          />
          <button type="submit" disabled={adding}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                       font-semibold text-sm text-white shrink-0 disabled:opacity-50
                       bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-amber-500/20 hover:opacity-90">
            {adding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {adding ? 'Adding…' : 'Add'}
          </button>
        </div>
        {addError && (
          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
            <AlertTriangle size={10} /> {addError}
          </p>
        )}
      </form>

      {/* items is an array of objects [{id, name, ...}]. Map over each .name */}
      {!Array.isArray(items) || items.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <Layers size={28} className="mx-auto mb-2 text-gray-300 dark:text-gray-700" />
          <p className="text-sm font-medium text-gray-400 dark:text-gray-600">No entries yet</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2 max-h-[min(50vh,420px)] overflow-y-auto pr-1">
          {items.map(item => {
            const name = (typeof item === 'string') ? item : item.name
            return (
              <ListRow
                key={name}
                name={name}
                onRename={(oldName, newName) => onRename(oldName, newName)}
                onDeleteRequest={(name) => setPendingDelete(name)}
              />
            )
          })}
        </ul>
      )}

      {pendingDelete && (
        <DeleteConfirmModal
          name={pendingDelete}
          entityLabel={entityLabel}
          onConfirm={async () => {
            setDeleting(true)
            await onDelete(pendingDelete)
            setDeleting(false)
            setPendingDelete(null)
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </>
  )
}