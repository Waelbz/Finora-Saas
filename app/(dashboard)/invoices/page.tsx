// @ts-nocheck
'use client'
import { useState, useRef } from 'react'
import { Upload, FileText, Download, Copy, RotateCcw, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react'

interface InvoiceResult {
  filename: string
  status: 'waiting' | 'processing' | 'done' | 'error'
  type: 'fournisseur' | 'client'
  fournisseur?: string
  client?: string
  montant_ttc?: number
  journal?: string
  arf_lines?: string
  error?: string
}

export default function InvoicesPage() {
  const [invoiceType, setInvoiceType] = useState<'fournisseur' | 'client'>('fournisseur')
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<InvoiceResult[]>([])
  const [processing, setProcessing] = useState(false)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles).filter(f =>
      ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(f.type)
    )
    setFiles(prev => [...prev, ...arr])
    setResults(prev => [
      ...prev,
      ...arr.map(f => ({ filename: f.name, status: 'waiting' as const, type: invoiceType }))
    ])
  }

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
    setResults(prev => prev.filter((_, i) => i !== idx))
  }

  const reset = () => { setFiles([]); setResults([]) }

  const analyzeAll = async () => {
    if (!files.length) return
    setProcessing(true)

    const toBase64 = (f: File) => new Promise<string>((res, rej) => {
      const r = new FileReader()
      r.onload = () => res((r.result as string).split(',')[1])
      r.onerror = rej
      r.readAsDataURL(f)
    })

    for (let i = 0; i < files.length; i++) {
      setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'processing' } : r))

      try {
        const b64 = await toBase64(files[i])
        const sys = invoiceType === 'fournisseur'
          ? `Expert-comptable français. Analyse cette facture FOURNISSEUR. Retourne JSON: {"fournisseur":"NOM","montant_ttc":123.45,"montant_ht":100,"tva":23.45,"date":"01/03/2026","journal":"HA","compte":"401NOM","arf":"ligne ARF Coala"}`
          : `Expert-comptable français. Analyse cette facture CLIENT. Retourne JSON: {"client":"NOM","montant_ttc":123.45,"montant_ht":100,"tva":23.45,"date":"01/03/2026","journal":"VT","compte":"411NOM","arf":"ligne ARF Coala"}`

        const resp = await fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-opus-4-5',
            max_tokens: 2048,
            system: sys,
            messages: [{
              role: 'user',
              content: [
                { type: files[i].type === 'application/pdf' ? 'document' : 'image', source: { type: 'base64', media_type: files[i].type, data: b64 } },
                { type: 'text', text: 'Analyse cette facture et retourne le JSON' }
              ]
            }]
          })
        })

        if (!resp.ok) throw new Error('Erreur ' + resp.status)
        const data = await resp.json()
        const raw = data.content?.find((b: any) => b.type === 'text')?.text || '{}'
        const parsed = JSON.parse(raw.replace(/\`\`\`json\n?|\`\`\`\n?/g, '').trim())

        setResults(prev => prev.map((r, idx) => idx === i ? {
          ...r,
          status: 'done',
          type: invoiceType,
          fournisseur: parsed.fournisseur,
          client: parsed.client,
          montant_ttc: parsed.montant_ttc,
          journal: parsed.journal,
          arf_lines: parsed.arf
        } : r))
      } catch (e: any) {
        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', error: e.message } : r))
      }
    }

    setProcessing(false)
  }

  const copyAllARF = async () => {
    const arf = results.filter(r => r.arf_lines).map(r => r.arf_lines).join('\n')
    await navigator.clipboard.writeText(arf)
  }

  const downloadARF = () => {
    const arf = `COMPTABILITE "dossier"  DU 01/01/2026  AU  31/12/2026\nPLAN COMPTABLE\nECRITURES\n` +
      results.filter(r => r.arf_lines).map(r => r.arf_lines).join('\n')
    const blob = new Blob([arf], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `factures_${invoiceType}_${Date.now()}.txt`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="bg-[#111827] border-b border-white/[0.07] px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg">Factures</h1>
          <p className="text-white/40 text-sm">Analysez vos factures fournisseurs et clients — export ARF Sage GE</p>
        </div>
        {results.length > 0 && (
          <button onClick={reset} className="btn btn-sm">
            <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
          </button>
        )}
      </div>

      <div className="p-8 max-w-4xl">
        {/* Tabs Fournisseurs / Clients */}
        <div className="flex gap-2 mb-6 border-b border-white/[0.07] pb-2">
          <button
            onClick={() => { setInvoiceType('fournisseur'); reset(); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${invoiceType === 'fournisseur' ? 'bg-violet-600 text-white' : 'bg-white/[0.05] text-white/50 hover:bg-white/[0.08]'}`}
          >
            📄 Factures fournisseurs
          </button>
          <button
            onClick={() => { setInvoiceType('client'); reset(); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${invoiceType === 'client' ? 'bg-violet-600 text-white' : 'bg-white/[0.05] text-white/50 hover:bg-white/[0.08]'}`}
          >
            🧾 Factures clients
          </button>
        </div>

        {/* Zone de dépôt */}
        <label
          className={`upload-zone block cursor-pointer ${dragging ? 'border-violet-500' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            multiple
            className="hidden"
            onChange={e => e.target.files && addFiles(e.target.files)}
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-400/10 flex items-center justify-center">
              <Upload className="w-7 h-7 text-violet-500" />
            </div>
            <div>
              <div className="font-semibold">Déposer {invoiceType === 'fournisseur' ? 'vos factures fournisseurs' : 'vos factures clients'}</div>
              <div className="text-sm text-[#858aaa] mt-1">1 ou plusieurs fichiers · PDF · PNG · JPG · glissez ou cliquez</div>
            </div>
          </div>
        </label>

        {/* Liste des fichiers */}
        {results.length > 0 && (
          <div className="mt-6 space-y-2">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.07] rounded-xl">
                <div className="text-2xl">{r.status === 'done' ? '✅' : r.status === 'error' ? '❌' : r.status === 'processing' ? '⏳' : '⏸️'}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{r.filename}</div>
                  {r.fournisseur && <div className="text-xs text-white/50">Fournisseur: {r.fournisseur} · {r.montant_ttc?.toFixed(2)}€</div>}
                  {r.client && <div className="text-xs text-white/50">Client: {r.client} · {r.montant_ttc?.toFixed(2)}€</div>}
                  {r.error && <div className="text-xs text-red-400">{r.error}</div>}
                </div>
                {r.status === 'waiting' && (
                  <button onClick={() => removeFile(i)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
                )}
              </div>
            ))}

            <div className="flex gap-3 pt-4">
              <button onClick={analyzeAll} disabled={processing || !files.length} className="btn btn-primary">
                {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyse en cours…</> : <><CheckCircle className="w-4 h-4" /> Analyser toutes les factures</>}
              </button>
              {results.some(r => r.status === 'done') && (
                <>
                  <button onClick={copyAllARF} className="btn"><Copy className="w-4 h-4" /> Copier ARF</button>
                  <button onClick={downloadARF} className="btn"><Download className="w-4 h-4" /> Télécharger ARF</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
