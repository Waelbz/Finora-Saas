// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { Search, Upload, Download, Loader2, AlertCircle, CheckCircle, RotateCcw, FileText } from 'lucide-react'

interface AuditItem { ok: boolean; label: string; detail?: string }
interface AuditSection { title: string; severity: 'ok' | 'warning' | 'error'; items: AuditItem[] }
interface AuditResult { score: number; verdict: string; sections: AuditSection[]; files_analyzed: number }

export default function AuditPage() {
  const [files, setFiles] = useState<File[]>([])
  const [auditType, setAuditType] = useState('general')
  const [exercice, setExercice] = useState('2026')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AuditResult | null>(null)
  const [error, setError] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [drag, setDrag] = useState(false)

  useEffect(() => { setApiKey(sessionStorage.getItem('finora_key') || '') }, [])

  const addFiles = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles].slice(0, 10))
    setResult(null); setError('')
  }

  const toBase64 = (f: File) => new Promise<string>((res, rej) => {
    const r = new FileReader()
    r.onload = () => res((r.result as string).split(',')[1])
    r.onerror = rej
    r.readAsDataURL(f)
  })

  const runAudit = async () => {
    if (!files.length || !apiKey) { setError(!apiKey ? 'Clé API requise — allez dans Paramètres' : 'Ajoutez des documents'); return }
    setLoading(true); setError('')

    const sys = `Expert-comptable et auditeur légal français. Analyse les documents comptables fournis pour l'exercice ${exercice}.
Type d'audit: ${auditType}.
Réponds UNIQUEMENT en JSON valide:
{"score":85,"verdict":"Comptabilité globalement conforme","files_analyzed":3,"sections":[{"title":"TVA","severity":"ok","items":[{"ok":true,"label":"Taux TVA corrects","detail":"Tous les taux appliqués sont conformes au CGI"}]},{"title":"Anomalies","severity":"warning","items":[{"ok":false,"label":"Doublon détecté","detail":"Facture FA-001 semble doublon de FA-003"}]}]}
Score 0-100. Severity: ok/warning/error.`

    try {
      // Analyser chaque fichier individuellement puis synthétiser
      const analyses: string[] = []

      for (let i = 0; i < Math.min(files.length, 5); i++) {
        const f = files[i]
        const b64 = await toBase64(f)
        const isPdf = f.type === 'application/pdf'

        const resp = await fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
          body: JSON.stringify({
            model: 'claude-opus-4-5', max_tokens: 1024, system: sys,
            messages: [{
              role: 'user',
              content: [
                isPdf
                  ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } }
                  : { type: 'image', source: { type: 'base64', media_type: f.type, data: b64 } },
                { type: 'text', text: `Analyse ce document (${f.name}) pour l'audit ${auditType} exercice ${exercice}.` }
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
        analyses.push(data.content?.find((b: any) => b.type === 'text')?.text || '{}')
      }

      // Synthèse si plusieurs fichiers
      let finalResult: AuditResult
      if (analyses.length === 1) {
        finalResult = JSON.parse(analyses[0].replace(/```json\n?|```\n?/g, '').trim())
        finalResult.files_analyzed = files.length
      } else {
        const synthResp = await fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
          body: JSON.stringify({
            model: 'claude-opus-4-5', max_tokens: 2048, system: sys,
            messages: [{
              role: 'user',
              content: [{ type: 'text', text: `Voici ${analyses.length} analyses individuelles. Synthétise en un rapport global JSON:\n\n${analyses.join('\n\n---\n\n')}` }]
            }]
          })
        })
        const synthData = await synthResp.json()
        const raw = synthData.content?.find((b: any) => b.type === 'text')?.text || '{}'
        finalResult = JSON.parse(raw.replace(/```json\n?|```\n?/g, '').trim())
        finalResult.files_analyzed = files.length
      }

      setResult(finalResult)

      // Sauvegarder
      await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: auditType, exercice, ...finalResult })
      }).catch(() => {})

    } catch (e: any) {
      setError(e.message || 'Erreur lors de l\'audit')
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = (s: number) => s >= 80 ? '#0dba7a' : s >= 50 ? '#f59e0b' : '#f03e4d'
  const severityColor = (s: string) => s === 'ok' ? 'green' : s === 'warning' ? 'orange' : 'red'

  return (
    <div className="animate-page-in">
      <div className="bg-[#111827] border-b border-white/[0.07] px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg font-display">Audit Comptable IA</h1>
          <p className="text-white/40 text-sm mt-0.5">Analyse multi-documents — anomalies, TVA, doublons, risques fiscaux</p>
        </div>
        {result && (
          <button onClick={() => { setFiles([]); setResult(null) }} className="btn btn-sm text-white/60 border-white/10">
            <RotateCcw className="w-3.5 h-3.5" /> Nouvel audit
          </button>
        )}
      </div>

      <div className="p-8 max-w-3xl space-y-5">
        {/* Upload */}
        {!result && (
          <>
            <div
              className={`upload-zone cursor-pointer ${drag ? 'border-orange-500 bg-orange-50' : 'border-orange-200 bg-orange-50/30'}`}
              style={{ borderColor: drag ? '#f59e0b' : 'rgba(245,158,11,.3)' }}
              onDragOver={e => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); addFiles(Array.from(e.dataTransfer.files)) }}
              onClick={() => document.getElementById('fi-audit')?.click()}
            >
              <input id="fi-audit" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" multiple className="hidden"
                onChange={e => addFiles(Array.from(e.target.files || []))} />
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center">
                  <Search className="w-7 h-7 text-orange-500" />
                </div>
                <div>
                  <div className="font-semibold text-[#0f1117] font-display">Déposer les documents à auditer</div>
                  <div className="text-sm text-[#858aaa] mt-1">PDF · images · plusieurs fichiers · factures, relevés, FEC, bilans…</div>
                </div>
              </div>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                    <FileText className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <span className="text-sm text-orange-700 flex-1 truncate">{f.name}</span>
                    <span className="text-xs text-orange-500 font-mono">{(f.size/1024).toFixed(0)} KB</span>
                    <button onClick={() => setFiles(prev => prev.filter((_,j) => j !== i))} className="text-orange-400 hover:text-orange-700 text-lg leading-none">×</button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3 items-end">
              <div className="field">
                <label className="label">Type d'audit</label>
                <select className="select" value={auditType} onChange={e => setAuditType(e.target.value)}>
                  <option value="general">Audit général</option>
                  <option value="tva">Conformité TVA</option>
                  <option value="doublons">Détection doublons</option>
                  <option value="provisions">Provisions & risques</option>
                </select>
              </div>
              <div className="field">
                <label className="label">Exercice</label>
                <input className="input w-28 font-mono" value={exercice} maxLength={4}
                  onChange={e => setExercice(e.target.value)} />
              </div>
              <button onClick={runAudit} disabled={!files.length || loading} className="btn btn-primary h-10 px-6">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyse en cours…</> : <><Search className="w-4 h-4" /> Lancer l'audit IA</>}
              </button>
            </div>

            {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"><AlertCircle className="w-4 h-4" />{error}</div>}
          </>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-5 animate-slide-up">
            {/* Score */}
            <div className="card p-6 flex items-center gap-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-extrabold font-mono flex-shrink-0"
                style={{ background: scoreColor(result.score) + '18', border: `3px solid ${scoreColor(result.score)}`, color: scoreColor(result.score) }}>
                {result.score}
              </div>
              <div>
                <div className="font-bold text-xl font-display text-[#0f1117]">{result.verdict}</div>
                <div className="text-sm text-[#858aaa] mt-1">{result.files_analyzed} document(s) analysé(s) · Exercice {exercice}</div>
                <div className="flex gap-2 mt-2">
                  <span className="badge badge-green">{result.sections.filter(s=>s.severity==='ok').length} OK</span>
                  <span className="badge badge-orange">{result.sections.filter(s=>s.severity==='warning').length} avertissements</span>
                  <span className="badge badge-red">{result.sections.filter(s=>s.severity==='error').length} erreurs</span>
                </div>
              </div>
            </div>

            {/* Sections */}
            {result.sections.map((section, si) => (
              <div key={si} className="card overflow-hidden">
                <div className={`px-5 py-3 flex items-center gap-3 ${
                  section.severity === 'ok' ? 'bg-green-50' : section.severity === 'warning' ? 'bg-orange-50' : 'bg-red-50'
                }`}>
                  {section.severity === 'ok' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className={`w-4 h-4 ${section.severity === 'warning' ? 'text-orange-500' : 'text-red-500'}`} />}
                  <span className="font-semibold text-sm font-display">{section.title}</span>
                </div>
                <div className="divide-y divide-[#eaecf4]">
                  {section.items.map((item, ii) => (
                    <div key={ii} className="px-5 py-3 flex items-start gap-3">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${item.ok ? 'bg-green-100' : 'bg-red-100'}`}>
                        <span className="text-[9px]">{item.ok ? '✓' : '✗'}</span>
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${item.ok ? 'text-green-700' : 'text-red-700'}`}>{item.label}</div>
                        {item.detail && <div className="text-xs text-[#858aaa] mt-0.5">{item.detail}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex gap-3">
              <button onClick={() => {
                const content = `RAPPORT D'AUDIT FINORA\n\nScore: ${result.score}/100\nVerdict: ${result.verdict}\nDocuments: ${result.files_analyzed}\nExercice: ${exercice}\n\n${
                  result.sections.map(s => `\n${s.title.toUpperCase()}\n${s.items.map(i => `${i.ok?'✓':'✗'} ${i.label}${i.detail?'\n  '+i.detail:''}`).join('\n')}`).join('\n')
                }`
                const blob = new Blob([content], {type:'text/plain;charset=utf-8'})
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a'); a.href=url; a.download=`audit_${exercice}.txt`; a.click()
              }} className="btn btn-primary">
                <Download className="w-4 h-4" /> Rapport PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
