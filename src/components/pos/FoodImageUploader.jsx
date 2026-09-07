import { useState, useEffect, useCallback } from 'react'
import { Upload, X, Loader2, Star, Check } from 'lucide-react'

function compressImageToBlob(file, { maxDim = 800, quality = 0.82 } = {}) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) { resolve(null); return }
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        if (width >= height) { height = Math.round((height * maxDim) / width); width = maxDim }
        else { width = Math.round((width * maxDim) / height); height = maxDim }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => resolve(blob), 'image/webp', quality)
    }
    img.onerror = () => resolve(null)
    img.src = URL.createObjectURL(file)
  })
}

export default function FoodImageUploader({
  catalog = [],            // Array of { id, preview, file, path }
  primaryId,               // Which image is set as primary
  onAddImages,             // (newItems) => void
  onRemoveImage,           // (id) => void
  onSetPrimary,            // (id) => void
}) {
  const [dragOver, setDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputId = 'pos-food-multi-image-input'

  const processFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return
    setIsProcessing(true)
    const newItems = []
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue
        const compressedBlob = await compressImageToBlob(file)
        const compFile = compressedBlob
          ? new File([compressedBlob], `food-${Date.now()}.webp`, { type: 'image/webp' })
          : file
        const previewUrl = URL.createObjectURL(compressedBlob || file)
        newItems.push({
          id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          preview: previewUrl,
          file: compFile,
          path: null,
        })
      }
      if (newItems.length > 0) {
        onAddImages(newItems)
      }
    } catch (err) {
      console.error('Error compressing files:', err)
    } finally {
      setIsProcessing(false)
    }
  }, [onAddImages])

  // Clipboard Paste Listener (Ctrl+V)
  useEffect(() => {
    const handlePaste = async (e) => {
      const items = e.clipboardData?.items
      if (!items) return
      const filesToProcess = []
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) filesToProcess.push(file)
        }
      }
      if (filesToProcess.length > 0) {
        await processFiles(filesToProcess)
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [processFiles])

  const primaryItem = catalog.find(i => i.id === primaryId) || catalog[0]

  return (
    <div className="flex flex-col gap-4">
      {/* Primary Image Showcase */}
      {primaryItem ? (
        <div className="relative w-full h-56 rounded-2xl border-2 border-dashed overflow-hidden border-gray-200 dark:border-gray-700 bg-gray-950/40 flex items-center justify-center p-2">
          <img
            src={primaryItem.preview || primaryItem.path}
            alt="Primary food"
            className="w-full h-full object-contain rounded-xl"
            loading="eager"
          />
          <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md">
            <Star size={13} fill="currentColor" /> Primary / Invoice Image
          </div>
          <p className="absolute bottom-0 left-0 right-0 px-3 py-1.5 text-xs bg-black/70 text-white/90 text-center backdrop-blur-sm">
            Press Ctrl+V anytime to paste more photos to catalog
          </p>
        </div>
      ) : null}

      {/* Compact Image Catalog Grid with inline "+" tile */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Image Catalog ({catalog.length})
          </p>
          <span className="text-[11px] text-amber-500/90 dark:text-amber-400/90 font-medium">
            Tip: Press Ctrl+V to paste from clipboard
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
          {/* Catalog Thumbnails */}
          {catalog.map((item) => {
            const isPrimary = (primaryId ? item.id === primaryId : item === catalog[0])
            return (
              <div
                key={item.id}
                onClick={() => onSetPrimary(item.id)}
                title="Click to set as primary image"
                className={`group relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-150 ${
                  isPrimary
                    ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-md scale-[1.02]'
                    : 'border-gray-200 dark:border-gray-700 hover:border-amber-400/60 opacity-80 hover:opacity-100'
                }`}
              >
                <img
                  src={item.preview || item.path}
                  alt="Catalog item"
                  className="w-full h-full object-cover"
                />
                {isPrimary && (
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                    <Star size={10} fill="currentColor" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveImage(item.id)
                  }}
                  title="Remove from catalog"
                  className="absolute top-1 right-1 p-1 rounded-md bg-red-500/90 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow"
                >
                  <X size={12} />
                </button>
              </div>
            )
          })}

          {/* Inline compact square tile for uploading/dropping new images */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              processFiles(e.dataTransfer.files)
            }}
            onClick={() => !isProcessing && document.getElementById(fileInputId).click()}
            title="Click or drop images here"
            className={`relative aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-2 text-center transition-all duration-150 cursor-pointer ${
              isProcessing
                ? 'border-amber-400 bg-amber-500/10 cursor-wait'
                : dragOver
                ? 'border-amber-500 bg-amber-500/10 scale-105'
                : 'border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 hover:border-amber-400 hover:bg-amber-500/5'
            }`}
          >
            {isProcessing ? (
              <Loader2 size={18} className="text-amber-500 animate-spin" />
            ) : (
              <>
                <div className="w-7 h-7 rounded-lg bg-gray-200/70 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 mb-1">
                  <Upload size={14} />
                </div>
                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 leading-tight">
                  Add Photo
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <input
        id={fileInputId}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => processFiles(e.target.files)}
      />
    </div>
  )
}