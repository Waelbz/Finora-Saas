// @ts-nocheck
'use client'
import { useState, useRef } from 'react'
import { Upload, Download, Copy, RotateCcw, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react'

export default function InvoicesPage() {
  const [invoiceType, setInvoiceType] = useState('fournisseur')
  const [files, setFiles] = useState([])
  const [results, setResults] = useState([])
  const [processing, setProcessing] = useState(false)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const addFiles = (newFiles) => {
    const arr = Array.from(newFiles).filter(f =>
      ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(f.type)
    )
    setFiles(prev => [...prev, ...arr])
    setResults(prev => [...prev, ...arr.map(f => ({ filename: f.name, status: 'waiting', type: invoiceType }))])
  }

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
    setResults(prev => prev.filter((_, i) => i !== idx))
  }

  const reset = () => { setFiles([]); setResults([]) }

  const analyzeAll = async () => {
    if (!files.length) return
    setProcessing(true)

    const toBase64 = (f) => new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = () => res(r.result.split(',')[1])
      r.onerror = rej
      r.readAsDataURL(f)
    })

    for (let i = 0; i < files.length; i++) {
      setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'processing' } : r))
      try {
        const b64 = await toBase64(files[i])
        const sys = invoiceType === 'fournisseur'
          ? 'Expert-comptable français. Analyse cette facture FOURNISSEUR. Retourne JSON: {"fournisseur":"NOM","montant_ttc":123.45,"montant_ht":100,"tva":23.45,"date":"01/03/2026","journal":"HA","compte":"401NOM","arf":"ligne ARF"}'
          : 'Expert-comptable français. Analyse cette facture CLIENT. Retourne JSON: {"client":"NOM","montant_ttc":123.45,"montant_ht":100,"tva":23.45,"date":"01/03/2026","journal":"VT","compte":"411NOM","arf":"ligne ARF"}'

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
        const raw = data.content?.find(b => b.type === 'text')?.text || '{}'
        const parsed = JSON.parse(raw.replace(/\`\`\`json\n?|\`\`\`\n?/g, '').trim())
        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'done', type: invoiceType, fournisseur: parsed.fournisseur, client: parsed.client, montant_ttc: parsed.montant_ttc, journal: parsed.journal, arf_lines: parsed.arf } : r))
      } catch (e) {
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
    const arf = 'COMPTABILITE "dossier"  DU 01/01/2026  AU  31/12/2026\nPLAN COMPTABLE\nECRITURES\n' + results.filter(r => r.arf_lines).map(r => r.arf_lines).join('\n')
    const blob = new Blob([arf], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'factures_' + invoiceType + '_' + Date.now() + '.txt'
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#0f1117'}}>
      <div style={{backgroundColor: '#111827', borderBottom: '1px solid rgba(255,255,255,0.07)'}} className="px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg" style={{color: 'white'}}>Factures</h1>
          <p className="text-sm" style={{color: 'rgba(255,255,255,0.4)'}}>Analysez vos factures fournisseurs et clients — export ARF Sage GE</p>
        </div>
        {results.length > 0 && (
          <button onClick={reset} style={{color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)'}} className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
          </button>
        )}
      </div>

      <div className="p-8 max-w-4xl">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setInvoiceType('fournisseur'); reset(); }}
            style={invoiceType === 'fournisseur' ? {backgroundColor: '#6c47ff', color: 'white'} : {backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)'}}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          >
            📄 Factures fournisseurs
          </button>
          <button
            onClick={() => { setInvoiceType('client'); reset(); }}
            style={invoiceType === 'client' ? {backgroundColor: '#6c47ff', color: 'white'} : {backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)'}}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          >
            🧾 Factures clients
          </button>
        </div>

        <label
          style={{backgroundColor: 'rgba(255,255,255,0.03)', border: '2px dashed ' + (dragging ? '#6c47ff' : 'rgba(255,255,255,0.15)')}}
          className="block cursor-pointer rounded-2xl p-10 text-center transition-all"
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" multiple className="hidden" onChange={e => e.target.files && addFiles(e.target.files)} />
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, rgba(108,71,255,0.2), rgba(108,71,255,0.1))'}}>
              <Upload className="w-7 h-7" style={{color: '#a78bfa'}} />
            </div>
            <div>
              <div className="font-semibold" style={{color: 'white'}}>Déposer {invoiceType === 'fournisseur' ? 'vos factures fournisseurs' : 'vos factures clients'}</div>
              <div className="text-sm mt-1" style={{color: 'rgba(255,255,255,0.4)'}}>1 ou plusieurs fichiers · PDF · PNG · JPG · glissez ou cliquez</div>
            </div>
          </div>
        </label>

        {results.length > 0 && (
          <div className="mt-6 space-y-2">
            {results.map((r, i) => (
              <div key={i} style={{backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)'}} className="flex items-center gap-3 p-3 rounded-xl">
                <div className="text-2xl">{r.status === 'done' ? '✅' : r.status === 'error' ? '❌' : r.status === 'processing' ? '⏳' : '⏸️'}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{color: 'white'}}>{r.filename}</div>
                  {r.fournisseur && <div className="text-xs" style={{color: 'rgba(255,255,255,0.5)'}}>Fournisseur: {r.fournisseur} · {r.montant_ttc?.toFixed(2)}€</div>}
                  {r.client && <div className="text-xs" style={{color: 'rgba(255,255,255,0.5)'}}>Client: {r.client} · {r.montant_ttc?.toFixed(2)}€</div>}
                  {r.error && <div className="text-xs" style={{color: '#f87171'}}>{r.error}</div>}
                </div>
                {r.status === 'waiting' && (
                  <button onClick={() => removeFile(i)} style={{color: 'rgba(255,255,255,0.4)'}}><X className="w-4 h-4" /></button>
                )}
              </div>
            ))}

            <div className="flex gap-3 pt-4">
              <button onClick={analyzeAll} disabled={processing || !files.length} style={{backgroundColor: processing ? '#4c1d95' : '#6c47ff', color: 'white'}} className="px-5 py-2 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50">
                {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyse…</> : <><CheckCircle className="w-4 h-4" /> Analyser</>}
              </button>
              {results.some(r => r.status === 'done') && (
                <>
                  <button onClick={copyAllARF} style={{backgroundColor: 'rgba(255,255,255,0.08)', color: 'white'}} className="px-4 py-2 rounded-lg flex items-center gap-2"><Copy className="w-4 h-4" /> Copier ARF</button>
                  <button onClick={downloadARF} style={{backgroundColor: 'rgba(255,255,255,0.08)', color: 'white'}} className="px-4 py-2 rounded-lg flex items-center gap-2"><Download className="w-4 h-4" /> Télécharger</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
