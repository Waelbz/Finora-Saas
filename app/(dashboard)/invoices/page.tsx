// @ts-nocheck
'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Download, Copy, RotateCcw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface InvoiceResult {
  filename: string
  status: 'waiting' | 'processing' | 'done' | 'error'
  fournisseur?: string
  montant_ttc?: number
  journal?: string
  arf_lines?: string
  error?: string
}

export default function InvoicesPage() {
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<InvoiceResult[]>([])
  const [processing, setProcessing] = useState(false)
  const [apiKey, setApiKey] = useState(() => typeof window !== 'undefined' ? sessionStorage.getItem('finora_key') || '' : '')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles).filter(f =>
      ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(f.type)
    )
    setFiles(prev => [...prev, ...arr])
    setResults(prev => [
      ...prev,
      ...arr.map(f => ({ filename: f.name, status: 'waiting' as const }))
    ])
  }

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
    setResults(prev => prev.filter((_, i) => i !== idx))
  }

  const reset = () => { setFiles([]); setResults([]) }

  const analyzeAll = async () => {
    if (!files.length) return
    if (!apiKey) { alert('Configurez votre clé API Anthropic dans Paramètres'); return }

    setProcessing(true)

    for (let i = 0; i < files.length; i++) {
      setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'processing' } : r))

      try {
        const base64 = await toBase64(files[i])
        const isPdf = files[i].type === 'application/pdf'

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-opus-4-5',
            max_tokens: 2048,
            system: `Tu es un expert-comptable français. Analyse cette facture et génère les écritures comptables ARF Coala.
Réponds UNIQUEMENT avec un JSON valide sans backticks:
{
  "fournisseur": "NOM FOURNISSEUR",
  "numero": "FA-2026-001",
  "date": "2026-01-15",
  "montant_ht": 1000.00,
  "tva": 200.00,
  "montant_ttc": 1200.00,
  "type": "achat",
  "compte_fournisseur": "401NOM",
  "journal": "HA",
  "arf": "01/01/2026\tHA\t401NOM\tFA001\tFournisseur NOM\tC\t1200,000\nE\n01/01/2026\tHA\t445660\tFA001\tTVA déductible\tD\t200,000\nE\n01/01/2026\tHA\t607100\tFA001\tAchat marchandises\tD\t1000,000\nE"
}`,
            messages: [{
              role: 'user',
              content: [
                isPdf
                  ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
                  : { type: 'image', source: { type: 'base64', media_type: files[i].type, data: base64 } },
                { type: 'text', text: 'Analyse cette facture et génère les écritures ARF.' }
              ]
            }]
          })
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error?.message || `Erreur API ${res.status}`)

        const raw = data.content?.find((b: { type: string }) => b.type === 'text')?.text || '{}'
        const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())

        setResults(prev => prev.map((r, idx) => idx === i ? {
          ...r,
          status: 'done',
          fournisseur: parsed.fournisseur,
          montant_ttc: parsed.montant_ttc,
          journal: parsed.journal,
          arf_lines: parsed.arf,
        } : r))

        // Sauvegarder en BDD via API
        await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_id: localStorage.getItem('finora_current_company'),
            filename: files[i].name,
            type: parsed.type || 'achat',
            supplier: parsed.fournisseur,
            amount_ht: parsed.montant_ht,
            tva: parsed.tva,
            amount_ttc: parsed.montant_ttc,
            date_invoice: parsed.date,
            journal: parsed.journal || 'HA',
            arf_lines: parsed.arf,
            raw_analysis: parsed,
          })
        }).catch(() => {}) // Non bloquant

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue'
        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', error: message } : r))
      }
    }

    setProcessing(false)
  }

  const exportARF = () => {
    const doneResults = results.filter(r => r.status === 'done' && r.arf_lines)
    if (!doneResults.length) return
    const content = 'COMPTABILITE "dossier"  DU 01/01/2026  AU  31/12/2026\nPLAN COMPTABLE\nECRITURES\n' +
      doneResults.map(r => r.arf_lines).join('\n')
    download(`export_factures_${Date.now()}.arf`, content, 'text/plain')
  }

  const copyARF = () => {
    const doneResults = results.filter(r => r.status === 'done' && r.arf_lines)
    if (!doneResults.length) return
    const content = doneResults.map(r => r.arf_lines).join('\n')
    navigator.clipboard.writeText(content)
  }

  return (
    <div className="animate-page-in">
      {/* Topbar */}
      <div className="bg-[#111827] border-b border-white/[0.07] px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg font-display">Factures</h1>
          <p className="text-white/40 text-sm mt-0.5">Analysez une ou plusieurs factures — export ARF Sage GE</p>
        </div>
        <div className="flex items-center gap-2">
          {results.some(r => r.status === 'done') && (
            <>
              <button onClick={copyARF} className="btn btn-sm gap-1.5">
                <Copy className="w-3.5 h-3.5" /> Copier ARF
              </button>
              <button onClick={exportARF} className="btn btn-sm gap-1.5">
                <Download className="w-3.5 h-3.5" /> Télécharger ARF
              </button>
            </>
          )}
          {files.length > 0 && (
            <button onClick={reset} className="btn btn-sm gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Vider
            </button>
          )}
        </div>
      </div>

      <div className="p-8 max-w-4xl">
        {/* Upload zone */}
        {files.length === 0 && (
          <div
            className={`upload-zone mb-6 ${dragging ? 'border-violet-500 bg-violet-50' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
            onClick={() => inputRef.current?.click()}
          >
            <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
              <Upload className="w-7 h-7 text-violet-500" />
            </div>
            <div className="text-base font-bold text-[#0f1117] mb-1">Déposer vos factures</div>
            <div className="text-sm text-[#858aaa]">1 ou plusieurs fichiers · PDF · PNG · JPG · glissez ou cliquez</div>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={e => e.target.files && addFiles(e.target.files)}
            />
          </div>
        )}

        {/* Files list */}
        {files.length > 0 && (
          <div className="space-y-3 mb-6">
            {files.map((file, idx) => {
              const result = results[idx]
              return (
                <div key={idx} className="card card-body flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#0f1117] truncate text-sm">{file.name}</div>
                    <div className="text-xs text-[#858aaa] mt-0.5">
                      {(file.size / 1024).toFixed(0)} KB
                      {result?.fournisseur && ` · ${result.fournisseur}`}
                      {result?.montant_ttc && ` · ${result.montant_ttc.toLocaleString('fr-FR')} €`}
                    </div>
                    {result?.status === 'done' && result.arf_lines && (
                      <pre className="mt-2 text-[10px] font-mono bg-[#f4f5f9] rounded-lg p-2 overflow-x-auto text-[#3d4263] max-h-24">
                        {result.arf_lines}
                      </pre>
                    )}
                    {result?.status === 'error' && (
                      <div className="text-xs text-red-500 mt-1">{result.error}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {result?.status === 'waiting' && (
                      <span className="badge badge-gray">En attente</span>
                    )}
                    {result?.status === 'processing' && (
                      <span className="flex items-center gap-1.5 text-xs text-violet-500">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyse…
                      </span>
                    )}
                    {result?.status === 'done' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {result?.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    {!processing && (
                      <button
                        onClick={() => removeFile(idx)}
                        className="w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center text-[#858aaa] hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Add more */}
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#dde1ef] text-sm text-[#858aaa] hover:border-violet-300 hover:text-violet-500 transition-all"
            >
              <Upload className="w-4 h-4" /> Ajouter des fichiers
            </button>
          </div>
        )}

        {/* Analyze button */}
        {files.length > 0 && !results.every(r => r.status === 'done') && (
          <button
            onClick={analyzeAll}
            disabled={processing}
            className="btn btn-primary w-full max-w-xs h-11 text-base disabled:opacity-60"
          >
            {processing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyse en cours…</>
            ) : (
              <><CheckCircle className="w-4 h-4" /> Analyser {files.length > 1 ? `les ${files.length} factures` : 'la facture'}</>
            )}
          </button>
        )}

        {/* All done summary */}
        {results.length > 0 && results.every(r => r.status === 'done' || r.status === 'error') && !processing && (
          <div className="mt-4 p-4 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-semibold text-green-700">
                {results.filter(r => r.status === 'done').length} facture(s) traitée(s)
                {results.filter(r => r.status === 'error').length > 0 &&
                  ` · ${results.filter(r => r.status === 'error').length} erreur(s)`}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={copyARF} className="btn btn-sm">⎘ Copier ARF</button>
              <button onClick={exportARF} className="btn btn-primary btn-sm">⬇ Télécharger ARF</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
