// @ts-nocheck
'use client'
import { useState, useRef } from 'react'
import { Landmark, Download, Copy, RotateCcw, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react'

export default function BankPage() {
  const [file, setFile] = useState(null)
  const [journal, setJournal] = useState('BNQ')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [drag, setDrag] = useState(false)
  const fileRef = useRef(null)

  const handleFile = (f) => {
    if (f.type !== 'application/pdf') { setError('PDF uniquement'); return }
    setFile(f); setResult(null); setError('')
  }

  const extractJSON = (text) => {
    if (!text) return null
    const codeMatch = text.match(/\`\`\`(?:json)?\s*(\{[\s\S]*?\})\s*\`\`\`/)
    if (codeMatch) return codeMatch[1]
    const first = text.indexOf('{')
    const last = text.lastIndexOf('}')
    if (first !== -1 && last > first) return text.substring(first, last + 1)
    return text
  }

  const analyze = async () => {
    if (!file) { setError('Déposez un relevé PDF'); return }
    setLoading(true); setError('')

    const toBase64 = (f) => new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = () => res(r.result.split(',')[1])
      r.onerror = rej
      r.readAsDataURL(f)
    })

    try {
      const b64 = await toBase64(file)
      const sys = `Tu es un expert-comptable français. Analyse TOUTES les opérations de ce relevé bancaire. Réponds UNIQUEMENT en JSON valide sans texte autour, sans markdown:
{"banque":"LCL","periode":"Mars 2026","total_debit":1234.56,"total_credit":5678.90,"operations":[{"date":"01/03/2026","libelle":"VIREMENT DUPONT","montant":1500.00,"sens":"C","contrepartie":"411000","libelle_contrepartie":"411DUP"}]}

Règles contreparties:
- Virement client reçu → 411000
- Paiement fournisseur → 401XXX
- Frais bancaires → 627100
- URSSAF → 6454000
- Impôts/TVA → 6370000
- Virement interne → 511000
- Inconnu → 471000

Sens: "D"=débit, "C"=crédit. Montant toujours positif.`

      const resp = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 8192,
          system: sys,
          messages: [{
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } },
              { type: 'text', text: 'Analyse ce relevé et retourne UNIQUEMENT le JSON.' }
            ]
          }]
        })
      })

      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}))
        throw new Error(e?.error?.message || 'Erreur API ' + resp.status)
      }

      const data = await resp.json()
      const raw = data.content?.find((b) => b.type === 'text')?.text || ''
      if (!raw) throw new Error('Réponse vide de l\'IA')

      const jsonStr = extractJSON(raw)
      let parsed
      try {
        parsed = JSON.parse(jsonStr)
      } catch (parseErr) {
        console.error('Raw response:', raw)
        throw new Error('JSON invalide. Réponse: ' + raw.substring(0, 200))
      }

      if (!parsed.operations || !Array.isArray(parsed.operations) || parsed.operations.length === 0) {
        throw new Error('Aucune opération détectée')
      }

      const arfLines = []
      parsed.operations.forEach((op, i) => {
        const piece = 'REL' + String(i+1).padStart(4,'0')
        const libelle = (op.libelle || '').substring(0, 30).replace(/"/g, "'")
        const montant = Math.abs(op.montant).toFixed(3).replace('.', ',')
        if (op.sens === 'C') {
          arfLines.push('\t' + op.date + ' ' + journal + ' 512000 "' + piece + '" "' + libelle + '" D ' + montant + ' E')
          arfLines.push('\t' + op.date + ' ' + journal + ' ' + op.contrepartie + ' "' + piece + '" "' + libelle + '" C ' + montant + ' E')
        } else {
          arfLines.push('\t' + op.date + ' ' + journal + ' 512000 "' + piece + '" "' + libelle + '" C ' + montant + ' E')
          arfLines.push('\t' + op.date + ' ' + journal + ' ' + op.contrepartie + ' "' + piece + '" "' + libelle + '" D ' + montant + ' E')
        }
      })

      setResult({ ...parsed, arf_lines: arfLines })
    } catch (e) {
      console.error('Bank error:', e)
      setError(e.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const buildARF = () => {
    if (!result) return ''
    const year = new Date().getFullYear()
    return 'COMPTABILITE "dossier"  DU 01/01/' + year + '  AU  31/12/' + year + '\nPLAN COMPTABLE\nECRITURES\n' + result.arf_lines.join('\n')
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
    a.href = url; a.download = 'releve_' + journal + '_' + Date.now() + '.txt'
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#0f1117'}}>
      <div style={{backgroundColor: '#111827', borderBottom: '1px solid rgba(255,255,255,0.07)'}} className="px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg" style={{color: 'white'}}>Relevé bancaire</h1>
          <p className="text-sm" style={{color: 'rgba(255,255,255,0.4)'}}>Importez un relevé PDF — écritures ARF générées automatiquement</p>
        </div>
        {result && (
          <button onClick={() => { setFile(null); setResult(null); setError('') }} style={{color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)'}} className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Nouveau
          </button>
        )}
      </div>

      <div className="p-8 max-w-3xl">
        {!result && (
          <div className="space-y-5">
            <div
              style={{backgroundColor: 'rgba(255,255,255,0.03)', border: '2px dashed ' + (drag ? '#6c47ff' : 'rgba(255,255,255,0.15)')}}
              className="block cursor-pointer rounded-2xl p-10 text-center transition-all"
              onDragEnter={e => { e.preventDefault(); e.stopPropagation(); setDrag(true) }}
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDrag(true) }}
              onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setDrag(false) }}
              onDrop={e => { e.preventDefault(); e.stopPropagation(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                style={{position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none'}}
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = '' }}
              />
              <div className="flex flex-col items-center gap-3" style={{pointerEvents: 'none'}}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))'}}>
                  <Landmark className="w-7 h-7" style={{color: '#10b981'}} />
                </div>
                <div>
                  <div className="font-semibold" style={{color: 'white'}}>Cliquez ou glissez votre relevé bancaire</div>
                  <div className="text-sm mt-1" style={{color: 'rgba(255,255,255,0.4)'}}>PDF uniquement · LCL, BNP, SG, CIC, CA…</div>
                </div>
              </div>
            </div>

            {file && (
              <div className="flex items-center gap-3 p-4 rounded-xl" style={{backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)'}}>
                <CheckCircle className="w-5 h-5" style={{color: '#10b981'}} />
                <span className="text-sm font-medium flex-1 truncate" style={{color: '#10b981'}}>{file.name}</span>
                <button onClick={() => setFile(null)}><X className="w-4 h-4" style={{color: 'rgba(255,255,255,0.5)'}} /></button>
              </div>
            )}

            <div className="flex items-end gap-4">
              <div className="max-w-[160px]">
                <label className="text-xs mb-1 block" style={{color: 'rgba(255,255,255,0.6)'}}>Journal bancaire</label>
                <input
                  className="w-full px-3 py-2 rounded-lg font-mono uppercase"
                  style={{backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white'}}
                  value={journal}
                  maxLength={6}
                  onChange={e => setJournal(e.target.value.toUpperCase())}
                />
              </div>
              <button
                onClick={analyze}
                disabled={!file || loading}
                style={{backgroundColor: (!file || loading) ? '#4c1d95' : '#6c47ff', color: 'white'}}
                className="h-10 px-6 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyse…</> : <><CheckCircle className="w-4 h-4" /> Analyser</>}
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl text-sm" style={{backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#fca5a5'}}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div style={{backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)'}} className="rounded-xl p-3">
                <div className="text-[10px] uppercase" style={{color: 'rgba(255,255,255,0.4)'}}>Banque</div>
                <div className="font-bold" style={{color: 'white'}}>{result.banque}</div>
              </div>
              <div style={{backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)'}} className="rounded-xl p-3">
                <div className="text-[10px] uppercase" style={{color: 'rgba(255,255,255,0.4)'}}>Période</div>
                <div className="font-bold" style={{color: 'white'}}>{result.periode}</div>
              </div>
              <div style={{backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)'}} className="rounded-xl p-3">
                <div className="text-[10px] uppercase" style={{color: 'rgba(255,255,255,0.4)'}}>Débit</div>
                <div className="font-bold" style={{color: 'white'}}>{result.total_debit?.toFixed(2) || '0.00'} €</div>
              </div>
              <div style={{backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)'}} className="rounded-xl p-3">
                <div className="text-[10px] uppercase" style={{color: 'rgba(255,255,255,0.4)'}}>Crédit</div>
                <div className="font-bold" style={{color: 'white'}}>{result.total_credit?.toFixed(2) || '0.00'} €</div>
              </div>
            </div>

            <div style={{backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)'}} className="rounded-xl p-3 text-sm">
              <strong style={{color: 'white'}}>{result.operations?.length || 0}</strong> opération(s) extraite(s)
            </div>

            <div className="flex gap-3">
              <button onClick={copyARF} style={{backgroundColor: 'rgba(255,255,255,0.08)', color: 'white'}} className="px-4 py-2 rounded-lg flex items-center gap-2">
                {copied ? <><CheckCircle className="w-4 h-4" style={{color: '#10b981'}} /> Copié !</> : <><Copy className="w-4 h-4" /> Copier ARF</>}
              </button>
              <button onClick={downloadARF} style={{backgroundColor: '#6c47ff', color: 'white'}} className="px-4 py-2 rounded-lg flex items-center gap-2">
                <Download className="w-4 h-4" /> Télécharger ARF
              </button>
            </div>

            <pre style={{backgroundColor: '#0a0d14', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', maxHeight: '400px'}} className="rounded-xl p-4 mt-2 font-mono text-xs whitespace-pre-wrap break-all overflow-y-auto">{buildARF()}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
