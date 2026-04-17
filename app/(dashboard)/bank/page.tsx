// @ts-nocheck
'use client'
import { useState, useRef } from 'react'
import { Landmark, Download, Copy, RotateCcw, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react'

interface BankOperation { date: string; libelle: string; montant: number; sens: 'D' | 'C'; contrepartie: string; libelle_contrepartie: string }
interface BankResult { operations: BankOperation[]; banque: string; periode: string; total_debit: number; total_credit: number; arf_lines: string[] }

export default function BankPage() {
  const [file, setFile] = useState<File | null>(null)
  const [journal, setJournal] = useState('BNQ')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BankResult | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const analyze = async () => {
    if (!file) { setError('Déposez un relevé PDF'); return }
    setLoading(true); setError('')
    const toBase64 = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res((r.result as string).split(',')[1]); r.onerror = rej; r.readAsDataURL(f) })
    try {
      const b64 = await toBase64(file)
      const resp = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 4096,
          system: 'Analyse ce relevé bancaire français et retourne un JSON avec banque, periode, total_debit, total_credit, operations[{date,libelle,montant,sens,contrepartie,libelle_contrepartie}]',
          messages: [{ role: 'user', content: [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } }, { type: 'text', text: 'Analyse ce relevé bancaire' }] }]
        })
      })
      if (!resp.ok) throw new Error('Erreur ' + resp.status)
      const data = await resp.json()
      const raw = data.content?.find((b: any) => b.type === 'text')?.text || '{}'
      const parsed = JSON.parse(raw.replace(/```json\n?|```\n?/g, '').trim())
      setResult({ ...parsed, arf_lines: [] })
    } catch (e: any) { setError(e.message || 'Erreur') } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="bg-[#111827] border-b border-white/[0.07] px-8 py-4">
        <h1 className="text-white font-bold text-lg">Relevé bancaire</h1>
        <p className="text-white/40 text-sm">Importez un relevé PDF</p>
      </div>
      <div className="p-8 max-w-3xl">
        <label className="upload-zone block cursor-pointer" onClick={() => fileRef.current?.click()}>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
          <div className="flex flex-col items-center gap-3">
            <Landmark className="w-10 h-10 text-green-500" />
            <div className="font-semibold">Déposer un relevé bancaire</div>
          </div>
        </label>
        {file && <div className="mt-4 p-3 bg-green-50 rounded-xl">{file.name}</div>}
        <div className="flex gap-4 mt-4">
          <input className="input" value={journal} onChange={e => setJournal(e.target.value.toUpperCase())} placeholder="BNQ" />
          <button onClick={analyze} disabled={!file || loading} className="btn btn-primary">
            {loading ? 'Analyse...' : 'Analyser'}
          </button>
        </div>
        {error && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl">{error}</div>}
        {result && <div className="mt-6 card p-4"><div>Banque: {result.banque}</div><div>Période: {result.periode}</div></div>}
      </div>
    </div>
  )
}
