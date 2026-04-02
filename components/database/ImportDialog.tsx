'use client'

import React, { useRef, useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react'
import type { ImportResult } from '@/lib/csv/importer'

interface ImportDialogProps {
  onSuccess: () => void
}

type PanelState = 'idle' | 'importing' | 'done' | 'error'

export function ImportDialog({ onSuccess }: ImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [panelState, setPanelState] = useState<PanelState>('idle')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [fatalError, setFatalError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const mutation = useMutation<ImportResult, Error, File>({
    mutationFn: async (f: File) => {
      const formData = new FormData()
      formData.append('file', f)
      const res = await fetch('/api/materials/import', { method: 'POST', body: formData })
      const json = await res.json() as ImportResult | { error: string; code: string }
      if (!res.ok) {
        const errJson = json as { error: string; code: string }
        throw new Error(errJson.error ?? 'Import failed')
      }
      return json as ImportResult
    },
    onSuccess: (data) => {
      setResult(data)
      setPanelState('done')
      onSuccess()
    },
    onError: (err) => {
      setFatalError(err.message)
      setPanelState('error')
    },
  })

  const handleClose = useCallback(() => {
    setOpen(false)
    setFile(null)
    setDragging(false)
    setPanelState('idle')
    setResult(null)
    setFatalError(null)
    mutation.reset()
  }, [mutation])

  const handleToggle = useCallback(() => {
    if (open) {
      handleClose()
    } else {
      setOpen(true)
    }
  }, [open, handleClose])

  const acceptFile = useCallback((f: File) => {
    if (!f.name.endsWith('.csv')) return
    setFile(f)
    setPanelState('idle')
    setResult(null)
    setFatalError(null)
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      if (f) acceptFile(f)
    },
    [acceptFile],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragging(false)
      const f = e.dataTransfer.files?.[0]
      if (f) acceptFile(f)
    },
    [acceptFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragging(false)
  }, [])

  const handleImport = useCallback(() => {
    if (!file) return
    setPanelState('importing')
    mutation.mutate(file)
  }, [file, mutation])

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5E3] bg-white text-[13px] text-gray-600 hover:bg-[#F0F0EE] transition-colors duration-100"
      >
        <Upload size={14} />
        Import CSV
      </button>

      {open && (
        <div className="w-[480px] bg-white border border-[#E5E5E3] rounded-xl p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-[13px] text-gray-600 leading-snug">
              Upload a Metabase export or template CSV to bulk-import materials.
            </p>
            <button
              onClick={handleClose}
              className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <a
            href="/api/materials/import/template"
            download="material-import-template.csv"
            className="inline-flex items-center gap-1 text-[12px] text-[#2DBDAA] hover:underline mb-3"
          >
            <FileText size={12} />
            Download template
          </a>

          {panelState === 'idle' || panelState === 'importing' ? (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed rounded-lg px-4 py-6 flex flex-col items-center justify-center gap-2 transition-colors duration-100"
                style={{
                  borderColor: dragging ? '#2DBDAA' : '#E5E5E3',
                  backgroundColor: dragging ? '#E6F4F1' : '#FAFAFA',
                }}
              >
                {file ? (
                  <div className="flex items-center gap-2 text-[13px] text-gray-700">
                    <FileText size={14} className="text-[#2DBDAA]" />
                    <span className="font-medium">{file.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload size={20} className="text-gray-400" />
                    <span className="text-[13px] text-gray-500">
                      Drag &amp; drop a .csv file here, or click to browse
                    </span>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileInput}
              />

              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleImport}
                  disabled={!file || panelState === 'importing'}
                  className="px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#2DBDAA' }}
                >
                  {panelState === 'importing' ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Importing…
                    </span>
                  ) : (
                    'Import'
                  )}
                </button>
              </div>
            </>
          ) : panelState === 'done' && result ? (
            <div className="mt-1">
              <div className="flex items-start gap-2 text-[13px] text-gray-700 mb-2">
                <CheckCircle size={16} className="text-[#2DBDAA] flex-shrink-0 mt-0.5" />
                <span>
                  <span className="font-medium">{result.imported}</span> imported,{' '}
                  <span className="font-medium">{result.updated}</span> updated,{' '}
                  <span className="font-medium">{result.skipped}</span> skipped
                </span>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-2 max-h-36 overflow-y-auto">
                  {result.errors.map((e, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] text-red-500 mb-1">
                      <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                      <span>
                        Row {e.row} ({e.sku || 'no sku'}): {e.error}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleClose}
                  className="px-3 py-1.5 rounded-lg border border-[#E5E5E3] text-[13px] text-gray-600 hover:bg-[#F0F0EE] transition-colors duration-100"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-1">
              <div className="flex items-start gap-2 text-[13px] text-red-500 mb-3">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{fatalError ?? 'An unexpected error occurred.'}</span>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setPanelState('idle')}
                  className="px-3 py-1.5 rounded-lg border border-[#E5E5E3] text-[13px] text-gray-600 hover:bg-[#F0F0EE] transition-colors duration-100"
                >
                  Try again
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
