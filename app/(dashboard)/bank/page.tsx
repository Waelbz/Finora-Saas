// @ts-nocheck
'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, Landmark, Download, Copy, RotateCcw, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react'

interface BankOperation {
  date: string
  libelle: string
  montant: number
  sens: 'D' | 'C'
  contrepartie: string
  libelle_contrepartie: string
}

interface BankResult {
  operations: BankOperation[]
  banque: string
  periode: string
  total_debit: number
  total_credit: number
  arf_lines: string[]
}

export default function BankPage() {
  const [file, setFile] = useState<File | null>(null)
  const [journal, setJournal] = useState('BNQ')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BankResult | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  useEffect(() => {
    setApiKey(sessionStorage.getItem('finora_key') || '')
  }, [])

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') { setError('PDF uniquement'); return }
    setFile(f)
    setResult(null)
    setError('')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const analyze = async () => {
    if (!file || !apiKey) { setError(!apiKey ? 'Configurez votre clé API dans Paramètres' : 'Déposez un relevé'); return }
    setLoading(true); setError('')

    const toBase64 = (f: File) => new Promise<string>((res, rej) => {
      const r = new FileReader()
      r.onload = () => res((r.result as string).split(',')[1])
      r.onerror = rej
      r.readAsDataURL(f)
    })

    try {
      const b64 = await toBase64(file)
      const sys = `Expert-comptable français. Analyse ce relevé bancaire et extrait TOUTES les opérations.
Réponds UNIQUEMENT en JSON valide sans backticks:
{"banque":"LCL","periode":"Mars 2026","total_debit":1234.56,"total_credit":5678.90,"operations":[{"date":"01/03/2026","libelle":"VIREMENT CLIENT DUPONT","montant":1500.00,"sens":"C","contrepartie":"411000","libelle_contrepartie":"411DUP"}]}
Règles comptes:
- Virement reçu client → 411000 (crédit 512, débit 411)
- Paiement fournisseur → 401XXX (débit 401, crédit 512)
- Frais bancaires → 627100 (débit 627100, crédit 512)
- URSSAF/cotisations → 6454000 (débit direct 512)
- Impôts/taxes → 6370000
- Virement interne → 511000
- Inconnu → 471000`

      const resp = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 4096,
          system: sys,
          messages: [{
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } },
              { type: 'text', text: 'Analyse ce relevé bancaire et retourne le JSON.' }
            ]
          }]
        })
      })

      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}))
        if (resp.status === 401) throw new Error('Clé API invalide')
        throw new Error((e as any)?.error?.message || `Erreur ${resp.status}`)
      }

      const data = await resp.json()
      const raw = data.content?.find((b: any) => b.type === 'text')?.text || '{}'
      const parsed: BankResult = JSON.parse(raw.replace(/```json\n?|```\n?/g, '').trim())

      // Générer les lignes ARF
      const today = new Date()
      const dd = String(today.getDate()).padStart(2,'0')
      const mm = String(today.getMonth()+1).padStart(2,'0')
      const yyyy = today.getFullYear()
      const arfLines: string[] = []

      parsed.operations.forEach((op, i) => {
        const piece = `REL${String(i+1).padStart(4,'0')}`
        const libelle = op.libelle.substring(0, 30).replace(/"/g, "'")
        const montant = Math.abs(op.montant).toFixed(3).replace('.', ',')
        const dateFormatted = op.date || `${dd}/${mm}/${yyyy}`
        const [d, m, y] = dateFormatted.split('/')
        const dateARF = `${d}/${m}/${y || yyyy}`

        if (op.sens === 'C') {
          arfLines.push(`\t${dateARF} ${journal} 512000 "${piece}" "${libelle}" D ${montant} E`)
          arfLines.push(`\t${dateARF} ${journal} ${op.contrepartie} "${piece}" "${libelle}" C ${montant} E`)
        } else {
          arfLines.push(`\t${dateARF} ${journal} 512000 "${piece}" "${libelle}" C ${montant} E`)
          arfLines.push(`\t${dateARF} ${journal} ${op.contrepartie} "${piece}" "${libelle}" D ${montant} E`)
        }
      })

      setResult({ ...parsed, arf_lines: arfLines })

      // Sauvegarder en BDD
      await fetch('/api/bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          bank_name: parsed.banque,
          period: parsed.periode,
          journal,
          operations: parsed.operations,
          arf_lines: arfLines,
          total_debit: parsed.total_debit,
          total_credit: parsed.total_credit,
        })
      }).catch(() => {})

    } catch (e: any) {
      setError(e.message || 'Erreur lors de l\'analyse')
    } finally {
      setLoading(false)
    }
  }

  const buildARF = () => {
    if (!result) return ''
    return `COMPTABILITE "dossier"  DU 01/01/2026  AU  31/12/2026\nPLAN COMPTABLE\nECRITURES\n${result.arf_lines.join('\n')}`
  }

  const copyARF = async () => {
    await navigator.clipboard.writeText(buildARF())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadARF = () => {
    const blob = new Blob([buildARF()], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `releve_${journal}_${Date.now()}.txt`
    a.click(); URL.revokeObjectURL(url)
  }

  const downloadCSV = () => {
    if (!result) return
    const rows = [['Date','Libellé','Montant','Sens','Compte','Libellé compte']]
    result.operations.forEach(op => {
      rows.push([op.date, op.libelle, String(op.montant), op.sens, op.contrepartie, op.libelle_contrepartie])
    })
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `releve_${Date.now()}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="animate-page-in">
      <div className="bg-[#111827] border-b border-white/[0.07] px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg font-display">Relevé bancaire</h1>
          <p className="text-white/40 text-sm mt-0.5">Importez un relevé PDF — écritures ARF générées automatiquement</p>
        </div>
        {result && (
          <button onClick={() => { setFile(null); setResult(null); setError('') }} className="btn btn-sm text-white/60 border-white/10">
            <RotateCcw className="w-3.5 h-3.5" /> Nouveau
          </button>
        )}
      </div>

      <div className="p-8 max-w-3xl">
        {/* Upload */}
        {!result && (
          <div className="space-y-5">
            <label
              className={`upload-zone block cursor-pointer ${drag ? 'border-violet-500 bg-[#f5f3ff]' : ''}`}
              onDragOver={e => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-400/10 flex items-center justify-center">
                  <Landmark className="w-7 h-7 text-green-500" />
                </div>
                <div>
                  <div className="font-semibold text-[#0f1117] font-display">Déposer un relevé bancaire</div>
                  <div className="text-sm text-[#858aaa] mt-1">PDF uniquement · LCL, BNP, SG, CIC, CA…</div>
                </div>
              </div>
            </label>

            {file && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm font-medium text-green-700 flex-1 truncate">{file.name}</span>
                <span className="text-xs text-green-600 font-mono">{(file.size / 1024).toFixed(0)} KB</span>
                <button onClick={() => setFile(null)} className="text-green-600 hover:text-green-800"><X className="w-4 h-4" /></button>
              </div>
            )}

            <div className="flex items-end gap-4">
              <div className="field max-w-[160px]">
                <label className="label">Journal bancaire</label>
                <input className="input font-mono uppercase" value={journal} maxLength={6}
                  onChange={e => setJournal(e.target.value.toUpperCase())} placeholder="BNQ" />
              </div>
              <button onClick={analyze} disabled={!file || loading} className="btn btn-primary h-10 px-6">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyse en cours…</> : <><CheckCircle className="w-4 h-4" /> Analyser le relevé</>}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}
          </div>
        )}

        {/* Résultats */}
        {result && (
          <div className="space-y-5 animate-slide-up">
            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Banque', value: result.banque },
                { label: 'Période', value: result.periode },
                { label: 'Total débit', value: `${result.total_debit?.toFixed(2)} €` },
                { label: 'Total crédit', value: `${result.total_credit?.toFixed(2)} €` },
              ].map(m => (
                <div key={m.label} className="card p-3">
                  <div className="text-[10px] text-[#858aaa] font-mono uppercase tracking-wide">{m.label}</div>
                  <div className="font-bold text-sm text-[#0f1117] font-mono mt-1 tabular-nums">{m.value}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#0f1117]">
                    <tr>
                      {['Date', 'Libellé', 'Compte', 'Débit', 'Crédit'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-white/70 font-mono uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaecf4]">
                    {result.operations.map((op, i) => (
                      <tr key={i} className="hover:bg-[#f8f9fc] transition-colors">
                        <td className="px-4 py-2.5 font-mono text-xs text-[#858aaa] whitespace-nowrap">{op.date}</td>
                        <td className="px-4 py-2.5 text-[#0f1117] truncate max-w-[200px]">{op.libelle}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-violet-600">{op.contrepartie}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-right text-red-600 tabular-nums">
                          {op.sens === 'D' ? op.montant.toFixed(2) : ''}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-right text-green-600 tabular-nums">
                          {op.sens === 'C' ? op.montant.toFixed(2) : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Export */}
            <div className="flex flex-wrap gap-3">
              <button onClick={copyARF} className="btn">
                {copied ? <><CheckCircle className="w-4 h-4 text-green-500" /> Copié !</> : <><Copy className="w-4 h-4" /> Copier ARF</>}
              </button>
              <button onClick={downloadARF} className="btn btn-primary">
                <Download className="w-4 h-4" /> ARF Coala
              </button>
              <button onClick={downloadCSV} className="btn">
                <Download className="w-4 h-4" /> CSV
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
