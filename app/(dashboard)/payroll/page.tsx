// @ts-nocheck
'use client'
import { useState, useRef } from 'react'
import { Users, Upload, CheckCircle, Loader2, Download, Copy, X, AlertCircle } from 'lucide-react'

interface PayrollResult {
  filename: string
  status: 'waiting' | 'processing' | 'done' | 'error'
  salarie?: string
  salaire_brut?: number
  salaire_net?: number
  cotisations?: number
  arf?: string
  error?: string
}

export default function PayrollPage() {
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<PayrollResult[]>([])
  const [processing, setProcessing] = useState(false)
  const [journal, setJournal] = useState('PAIE')
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles).filter(f => f.type === 'application/pdf')
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
        const resp = await fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-opus-4-5',
            max_tokens: 2048,
            system: 'Expert-comptable français. Analyse ce bulletin de paie. Retourne JSON: {"salarie":"NOM","salaire_brut":2500.00,"salaire_net":1950.00,"cotisations_salariales":550.00,"cotisations_patronales":1050.00,"date":"03/2026","arf_lines":"lignes ARF pour 6411 salaires bruts, 431 URSSAF, 437 mutuelle, 421 net à payer"}',
            messages: [{
              role: 'user',
              content: [
                { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } },
                { type: 'text', text: 'Analyse ce bulletin de paie' }
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
          salarie: parsed.salarie,
          salaire_brut: parsed.salaire_brut,
          salaire_net: parsed.salaire_net,
          cotisations: parsed.cotisations_salariales,
          arf: parsed.arf_lines
        } : r))
      } catch (e: any) {
        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', error: e.message } : r))
      }
    }

    setProcessing(false)
  }

  const copyAllARF = async () => {
    const arf = results.filter(r => r.arf).map(r => r.arf).join('\n')
    await navigator.clipboard.writeText(arf)
  }

  const downloadARF = () => {
    const arf = `COMPTABILITE "dossier"  DU 01/01/2026  AU  31/12/2026\nPLAN COMPTABLE\nECRITURES\n` +
      results.filter(r => r.arf).map(r => r.arf).join('\n')
    const blob = new Blob([arf], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `paie_${Date.now()}.txt`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="bg-[#111827] border-b border-white/[0.07] px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg">Paie</h1>
          <p className="text-white/40 text-sm">Bulletins de paie et écritures comptables</p>
        </div>
        {results.length > 0 && <button onClick={reset} className="btn btn-sm">Réinitialiser</button>}
      </div>

      <div className="p-8 max-w-4xl">
        <label className="upload-zone block cursor-pointer" onClick={() => inputRef.current?.click()}>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={e => e.target.files && addFiles(e.target.files)}
          />
          <div className="flex flex-col items-center gap-3">
            <Users className="w-10 h-10 text-violet-500" />
            <div>
              <div className="font-semibold">Déposer vos bulletins de paie</div>
              <div className="text-sm text-[#858aaa]">PDF · PayFit, Silae, ADP, Sage Paie…</div>
            </div>
          </div>
        </label>

        {results.length > 0 && (
          <div className="mt-6 space-y-2">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.07] rounded-xl">
                <div className="text-2xl">{r.status === 'done' ? '✅' : r.status === 'error' ? '❌' : r.status === 'processing' ? '⏳' : '⏸️'}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{r.filename}</div>
                  {r.salarie && <div className="text-xs text-white/50">{r.salarie} · Brut {r.salaire_brut?.toFixed(2)}€ · Net {r.salaire_net?.toFixed(2)}€</div>}
                  {r.error && <div className="text-xs text-red-400">{r.error}</div>}
                </div>
                {r.status === 'waiting' && (
                  <button onClick={() => removeFile(i)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
                )}
              </div>
            ))}

            <div className="flex gap-3 pt-4">
              <input className="input max-w-[120px]" value={journal} onChange={e => setJournal(e.target.value.toUpperCase())} placeholder="PAIE" />
              <button onClick={analyzeAll} disabled={processing || !files.length} className="btn btn-primary">
                {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyse…</> : <><CheckCircle className="w-4 h-4" /> Analyser tous les bulletins</>}
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
