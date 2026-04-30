// @ts-nocheck
'use client'
import { useState, useRef } from 'react'
import { Upload, Download, Copy, RotateCcw, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react'

export default function InvoicesPage() {
  const [invoiceType, setInvoiceType] = useState('fournisseur')
  const [files, setFiles] = useState([])
  const [results, setResults] = useState([])
  const [processing, setProcessing] = useState(false)
  const [drag, setDrag] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const inputRef = useRef(null)

  const extractJSON = (text) => {
    if (!text) return null
    const codeMatch = text.match(/\`\`\`(?:json)?\s*(\{[\s\S]*?\})\s*\`\`\`/)
    if (codeMatch) return codeMatch[1]
    const first = text.indexOf('{')
    const last = text.lastIndexOf('}')
    if (first !== -1 && last > first) return text.substring(first, last + 1)
    return text
  }

  const addFiles = (newFiles) => {
    const arr = Array.from(newFiles).filter(f =>
      ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(f.type)
    )
    if (!arr.length) { setError('Format non supporté. PDF, PNG, JPG uniquement.'); return }
    setError('')
    setFiles(prev => [...prev, ...arr])
    setResults(prev => [...prev, ...arr.map(f => ({ filename: f.name, status: 'waiting', type: invoiceType }))])
  }

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
    setResults(prev => prev.filter((_, i) => i !== idx))
  }

  const reset = () => { setFiles([]); setResults([]); setError('') }

  const analyzeAll = async () => {
    if (!files.length) return
    setProcessing(true); setError('')

    const toBase64 = (f) => new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = () => res(r.result.split(',')[1])
      r.onerror = rej
      r.readAsDataURL(f)
    })

    for (let i = 0; i < files.length; i++) {
      if (results[i]?.status === 'done') continue
      setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'processing' } : r))

      try {
        const b64 = await toBase64(files[i])
        const mediaType = files[i].type
        const isPdf = mediaType === 'application/pdf'

        const sys = invoiceType === 'fournisseur'
          ? `Tu es un expert-comptable français. Analyse cette facture FOURNISSEUR. Réponds UNIQUEMENT en JSON valide sans texte autour, sans markdown:
{"fournisseur":"NOM COMPLET","montant_ttc":123.45,"montant_ht":102.88,"tva":20.57,"taux_tva":20,"date":"01/03/2026","numero":"F-2026-123","journal":"HA","compte_fournisseur":"401NOM","compte_charge":"6061000","arf":"lignes ARF complètes pour Sage GE"}
Règles charges: 6061 fournitures, 606220 carburant, 6068 autres, 6110 sous-traitance, 6132 loyers, 6135 crédit-bail, 623 publicité, 626 téléphone, 6251 déplacements, 627 frais bancaires.`
          : `Tu es un expert-comptable français. Analyse cette facture CLIENT. Réponds UNIQUEMENT en JSON valide sans texte autour, sans markdown:
{"client":"NOM COMPLET","montant_ttc":123.45,"montant_ht":102.88,"tva":20.57,"taux_tva":20,"date":"01/03/2026","numero":"F-2026-123","journal":"VT","compte_client":"411NOM","compte_produit":"706000","arf":"lignes ARF complètes pour Sage GE"}`

        const resp = await fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-opus-4-5',
            max_tokens: 4096,
            system: sys,
            messages: [{
              role: 'user',
              content: [
                { type: isPdf ? 'document' : 'image', source: { type: 'base64', media_type: mediaType, data: b64 } },
                { type: 'text', text: 'Analyse cette facture et retourne UNIQUEMENT le JSON.' }
              ]
            }]
          })
        })

        if (!resp.ok) {
          const e = await resp.json().catch(() => ({}))
          throw new Error(e?.error?.message || 'Erreur API ' + resp.status)
        }

        const data = await resp.json()
        const raw = data.content?.find(b => b.type === 'text')?.text || ''
        if (!raw) throw new Error('Réponse vide de l\'IA')

        const jsonStr = extractJSON(raw)
        let parsed
        try {
          parsed = JSON.parse(jsonStr)
        } catch (parseErr) {
          console.error('Raw:', raw)
          throw new Error('JSON invalide: ' + raw.substring(0, 150))
        }

        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'done', type: invoiceType, ...parsed } : r))
      } catch (e) {
        console.error('Invoice error:', e)
        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', error: e.message } : r))
      }
    }
    setProcessing(false)
  }

  const buildARF = () => {
    const year = new Date().getFullYear()
    return 'COMPTABILITE "dossier"  DU 01/01/' + year + '  AU  31/12/' + year + '\nPLAN COMPTABLE\nECRITURES\n' + results.filter(r => r.arf).map(r => r.arf).join('\n')
  }

  const copyAllARF = async () => {
    await navigator.clipboard.writeText(buildARF())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadARF = () => {
    const blob = new Blob([buildARF()], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'factures_' + invoiceType + '_' + Date.now() + '.txt'
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const anyDone = results.some(r => r.status === 'done')

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
            onClick={() => { setInvoiceType('fournisseur'); reset() }}
            style={invoiceType === 'fournisseur' ? {backgroundColor: '#6c47ff', color: 'white'} : {backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)'}}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          >
            📄 Factures fournisseurs
          </button>
          <button
            onClick={() => { setInvoiceType('client'); reset() }}
            style={invoiceType === 'client' ? {backgroundColor: '#6c47ff', color: 'white'} : {backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)'}}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          >
            🧾 Factures clients
          </button>
        </div>

        <div
          style={{backgroundColor: 'rgba(255,255,255,0.03)', border: '2px dashed ' + (drag ? '#6c47ff' : 'rgba(255,255,255,0.15)')}}
          className="block cursor-pointer rounded-2xl p-10 text-center transition-all"
          onDragEnter={e => { e.preventDefault(); e.stopPropagation(); setDrag(true) }}
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDrag(true) }}
          onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setDrag(false) }}
          onDrop={e => { e.preventDefault(); e.stopPropagation(); setDrag(false); addFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
            multiple
            style={{position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none'}}
            onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }}
          />
          <div className="flex flex-col items-center gap-3" style={{pointerEvents: 'none'}}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, rgba(108,71,255,0.2), rgba(108,71,255,0.1))'}}>
              <Upload className="w-7 h-7" style={{color: '#a78bfa'}} />
            </div>
            <div>
              <div className="font-semibold" style={{color: 'white'}}>Cliquez ou glissez {invoiceType === 'fournisseur' ? 'vos factures fournisseurs' : 'vos factures clients'}</div>
              <div className="text-sm mt-1" style={{color: 'rgba(255,255,255,0.4)'}}>1 ou plusieurs fichiers · PDF · PNG · JPG</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-xl text-sm" style={{backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#fca5a5'}}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

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

            <div className="flex gap-3 pt-4 flex-wrap">
              <button onClick={analyzeAll} disabled={processing || !files.length} style={{backgroundColor: processing ? '#4c1d95' : '#6c47ff', color: 'white'}} className="px-5 py-2 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50">
                {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyse…</> : <><CheckCircle className="w-4 h-4" /> Analyser</>}
              </button>
              {anyDone && (
                <>
                  <button onClick={copyAllARF} style={{backgroundColor: 'rgba(255,255,255,0.08)', color: 'white'}} className="px-4 py-2 rounded-lg flex items-center gap-2">
                    {copied ? <><CheckCircle className="w-4 h-4" style={{color: '#10b981'}} /> Copié !</> : <><Copy className="w-4 h-4" /> Copier ARF</>}
                  </button>
                  <button onClick={downloadARF} style={{backgroundColor: 'rgba(255,255,255,0.08)', color: 'white'}} className="px-4 py-2 rounded-lg flex items-center gap-2"><Download className="w-4 h-4" /> Télécharger</button>
                </>
              )}
            </div>

            {anyDone && (
              <pre style={{backgroundColor: '#0a0d14', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', maxHeight: '400px'}} className="rounded-xl p-4 mt-2 font-mono text-xs whitespace-pre-wrap break-all overflow-y-auto">{buildARF()}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
