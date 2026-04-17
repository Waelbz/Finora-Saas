// @ts-nocheck
'use client'
import { useState, useRef } from 'react'
import { Search, Upload, AlertCircle, CheckCircle, Loader2, FileText, X } from 'lucide-react'

interface AuditResult {
  status: 'ok' | 'warning' | 'error'
  summary: string
  anomalies: { type: string; description: string; severity: 'low' | 'medium' | 'high' }[]
  suggestions: string[]
}

export default function AuditPage() {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AuditResult | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles).filter(f => f.type === 'application/pdf')
    setFiles(prev => [...prev, ...arr])
  }

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx))

  const runAudit = async () => {
    if (!files.length) { setError('Déposez au moins 1 fichier PDF'); return }
    setLoading(true); setError(''); setResult(null)

    const toBase64 = (f: File) => new Promise<string>((res, rej) => {
      const r = new FileReader()
      r.onload = () => res((r.result as string).split(',')[1])
      r.onerror = rej
      r.readAsDataURL(f)
    })

    try {
      const docs = await Promise.all(files.map(async f => ({
        type: 'document' as const,
        source: { type: 'base64' as const, media_type: 'application/pdf', data: await toBase64(f) }
      })))

      const resp = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 4096,
          system: 'Expert-comptable français. Audite ces documents comptables et détecte anomalies, doublons, problèmes TVA, risques fiscaux. Retourne JSON: {"status":"ok|warning|error","summary":"...","anomalies":[{"type":"...","description":"...","severity":"low|medium|high"}],"suggestions":["..."]}',
          messages: [{
            role: 'user',
            content: [...docs, { type: 'text', text: 'Audite ces documents et retourne le JSON' }]
          }]
        })
      })

      if (!resp.ok) throw new Error('Erreur ' + resp.status)
      const data = await resp.json()
      const raw = data.content?.find((b: any) => b.type === 'text')?.text || '{}'
      const parsed = JSON.parse(raw.replace(/\`\`\`json\n?|\`\`\`\n?/g, '').trim())
      setResult(parsed)
    } catch (e: any) {
      setError(e.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="bg-[#111827] border-b border-white/[0.07] px-8 py-4">
        <h1 className="text-white font-bold text-lg">Audit IA</h1>
        <p className="text-white/40 text-sm">Analyse multi-documents pour détecter anomalies et risques fiscaux</p>
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
            <Search className="w-10 h-10 text-violet-500" />
            <div>
              <div className="font-semibold">Déposer vos documents comptables</div>
              <div className="text-sm text-[#858aaa]">PDF multiples · factures, relevés, paie</div>
            </div>
          </div>
        </label>

        {files.length > 0 && (
          <div className="mt-6 space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.07] rounded-xl">
                <FileText className="w-5 h-5 text-violet-400" />
                <span className="flex-1 text-sm text-white">{f.name}</span>
                <button onClick={() => removeFile(i)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={runAudit} disabled={loading} className="btn btn-primary mt-4">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Audit en cours…</> : <><Search className="w-4 h-4" /> Lancer l'audit</>}
            </button>
          </div>
        )}

        {error && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl">{error}</div>}

        {result && (
          <div className="mt-8 space-y-4">
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-2 text-white">Résumé</h2>
              <p className="text-white/70">{result.summary}</p>
            </div>

            {result.anomalies?.length > 0 && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4 text-white">Anomalies détectées</h2>
                <div className="space-y-3">
                  {result.anomalies.map((a, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <AlertCircle className={`w-5 h-5 flex-shrink-0 ${a.severity === 'high' ? 'text-red-500' : a.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'}`} />
                      <div>
                        <div className="font-medium text-white">{a.type}</div>
                        <div className="text-sm text-white/60">{a.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.suggestions?.length > 0 && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4 text-white">Recommandations</h2>
                <ul className="space-y-2">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-white/70">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
