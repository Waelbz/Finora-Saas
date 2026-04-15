// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { Users, Upload, Plus, Download, Loader2, CheckCircle, AlertCircle, ChevronRight, Trash2 } from 'lucide-react'

interface Employee {
  id: string
  nom: string
  poste: string
  contrat: string
  brut: number
  cotis_sal: number
  cotis_pat: number
  pas: number
  tr_val: number
  tr_pct: number
  mutuelle_sal: number
  mutuelle_emp: number
  color: string
}

interface PayrollResult {
  net: number
  cotis_sal: number
  cotis_pat: number
  tr_sal: number
  arf_lines: string[]
}

const COLORS = ['#6c47ff','#0dba7a','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#10b981']

export default function PayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selected, setSelected] = useState<Employee | null>(null)
  const [tab, setTab] = useState<'import' | 'module'>('import')
  const [loading, setLoading] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [newEmp, setNewEmp] = useState<Partial<Employee>>({ contrat: 'CDI', cotis_sal: 22, cotis_pat: 42, tr_val: 9, tr_pct: 50 })

  useEffect(() => {
    setApiKey(sessionStorage.getItem('finora_key') || '')
    // Load employees from API
    fetch('/api/payroll/employees')
      .then(r => r.json())
      .then(d => setEmployees(d.data || []))
      .catch(() => {})
  }, [])

  const calcNet = (emp: Employee, jours = emp.cotis_sal ? 22 : 22): PayrollResult => {
    const brut = emp.brut
    const cotSal = brut * (emp.cotis_sal / 100)
    const cotPat = brut * (emp.cotis_pat / 100)
    const tr = emp.tr_val * (emp.tr_pct / 100) * Math.floor(jours / 1)
    const net = brut - cotSal - emp.pas - tr
    const arfLines: string[] = []
    const today = new Date()
    const mm = String(today.getMonth()+1).padStart(2,'0')
    const yyyy = today.getFullYear()
    const d = `01/${mm}/${yyyy}`
    const nom = emp.nom.substring(0,20).replace(/"/g,"'")

    arfLines.push(`\t${d} OD 6411000 "PAIE${mm}" "Salaire brut ${nom}" D ${brut.toFixed(3).replace('.',',')} E`)
    arfLines.push(`\t${d} OD 4210000 "PAIE${mm}" "Salaire brut ${nom}" C ${brut.toFixed(3).replace('.',',')} E`)
    arfLines.push(`\t${d} OD 4310000 "PAIE${mm}" "Cotis sal ${nom}" D ${cotSal.toFixed(3).replace('.',',')} E`)
    arfLines.push(`\t${d} OD 6451000 "PAIE${mm}" "Cotis pat ${nom}" D ${cotPat.toFixed(3).replace('.',',')} E`)
    arfLines.push(`\t${d} OD 4370000 "PAIE${mm}" "Cotis pat ${nom}" C ${cotPat.toFixed(3).replace('.',',')} E`)
    if (emp.pas > 0) {
      arfLines.push(`\t${d} OD 4421000 "PAIE${mm}" "PAS ${nom}" D ${emp.pas.toFixed(3).replace('.',',')} E`)
    }

    return { net, cotis_sal: cotSal, cotis_pat: cotPat, tr_sal: tr, arf_lines: arfLines }
  }

  const analyzeImport = async () => {
    if (!importFile || !apiKey) { setError(!apiKey ? 'Clé API requise' : 'Déposez un bulletin'); return }
    setLoading(true); setError('')
    const r = new FileReader()
    r.onload = async () => {
      try {
        const b64 = (r.result as string).split(',')[1]
        const sys = `Expert-comptable. Extrait les données de ce bulletin de paie en JSON UNIQUEMENT sans backticks.
{"salarie":"PRENOM NOM","poste":"Intitulé poste","contrat":"CDI","brut":3000.00,"cotis_sal_pct":22.0,"cotis_pat_pct":42.0,"pas":0.0,"tr_val":9.0,"tr_pct":50.0,"net":2200.00,"periode":"03/2026"}`
        const resp = await fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
          body: JSON.stringify({ model: 'claude-opus-4-5', max_tokens: 512, system: sys, messages: [{ role: 'user', content: [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } }, { type: 'text', text: 'Extrait les données.' }] }] })
        })
        const data = await resp.json()
        const raw = data.content?.find((b: any) => b.type === 'text')?.text || '{}'
        const parsed = JSON.parse(raw.replace(/```json\n?|```\n?/g, '').trim())
        setImportResult(parsed)
      } catch (e: any) { setError(e.message) }
      finally { setLoading(false) }
    }
    r.readAsDataURL(importFile)
  }

  const createEmployee = async () => {
    if (!newEmp.nom) return
    const emp: Employee = {
      id: Date.now().toString(),
      nom: newEmp.nom || '',
      poste: newEmp.poste || '',
      contrat: newEmp.contrat || 'CDI',
      brut: Number(newEmp.brut) || 0,
      cotis_sal: Number(newEmp.cotis_sal) || 22,
      cotis_pat: Number(newEmp.cotis_pat) || 42,
      pas: Number(newEmp.pas) || 0,
      tr_val: Number(newEmp.tr_val) || 9,
      tr_pct: Number(newEmp.tr_pct) || 50,
      mutuelle_sal: Number(newEmp.mutuelle_sal) || 0,
      mutuelle_emp: Number(newEmp.mutuelle_emp) || 0,
      color: COLORS[employees.length % COLORS.length],
    }
    setEmployees(prev => [...prev, emp])
    setSelected(emp)
    setShowNewForm(false)
    setNewEmp({ contrat: 'CDI', cotis_sal: 22, cotis_pat: 42, tr_val: 9, tr_pct: 50 })
  }

  const downloadARF = (emp: Employee) => {
    const res = calcNet(emp)
    const arf = `COMPTABILITE "dossier"  DU 01/01/2026  AU  31/12/2026\nPLAN COMPTABLE\nECRITURES\n${res.arf_lines.join('\n')}`
    const blob = new Blob([arf], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `paie_${emp.nom.replace(/\s+/g,'_')}.txt`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="animate-page-in">
      <div className="bg-[#111827] border-b border-white/[0.07] px-8 py-4">
        <h1 className="text-white font-bold text-lg font-display">Paie</h1>
        <p className="text-white/40 text-sm mt-0.5">Bulletins de paie et écritures comptables</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 px-8 pt-6 pb-0">
        {[
          { id: 'import' as const, label: 'Import bulletin → ARF', sub: 'Rapide' },
          { id: 'module' as const, label: 'Module paie complet', sub: 'Salariés & bulletins' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex flex-col items-start px-5 py-3.5 rounded-t-xl border border-b-0 transition-all font-sans min-w-[180px] ${
              tab === t.id ? 'bg-white border-[#dde1ef] text-[#0f1117]' : 'bg-[#f4f5f9] border-transparent text-[#858aaa] hover:text-[#3d4263]'
            }`}
          >
            <span className="text-sm font-semibold">{t.label}</span>
            <span className="text-[11px] mt-0.5 opacity-60">{t.sub}</span>
          </button>
        ))}
      </div>

      <div className="border-t border-[#dde1ef] bg-white min-h-[calc(100vh-180px)]">
        {/* Import Tab */}
        {tab === 'import' && (
          <div className="p-8 max-w-2xl space-y-5">
            <label className="upload-zone block cursor-pointer" onClick={() => document.getElementById('fi-pay')?.click()}>
              <input id="fi-pay" type="file" accept=".pdf" className="hidden" onChange={e => { setImportFile(e.target.files?.[0] || null); setImportResult(null) }} />
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-violet-500" />
                </div>
                <div>
                  <div className="font-semibold text-[#0f1117] font-display">Déposer un bulletin de paie</div>
                  <div className="text-sm text-[#858aaa] mt-1">PDF · PayFit, Silae, ADP, Sage Paie…</div>
                </div>
              </div>
            </label>

            {importFile && (
              <div className="flex items-center gap-3 p-3 bg-violet-50 border border-violet-200 rounded-xl">
                <CheckCircle className="w-4 h-4 text-violet-500" />
                <span className="text-sm text-violet-700 flex-1 truncate">{importFile.name}</span>
                <button onClick={analyzeImport} disabled={loading} className="btn btn-primary btn-sm">
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Analyser'}
                </button>
              </div>
            )}

            {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"><AlertCircle className="w-4 h-4" />{error}</div>}

            {importResult && (
              <div className="card p-6 space-y-4 animate-slide-up">
                <h3 className="font-bold font-display text-[#0f1117]">Données extraites</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Salarié', importResult.salarie],
                    ['Poste', importResult.poste],
                    ['Brut', `${importResult.brut} €`],
                    ['Net', `${importResult.net} €`],
                    ['Période', importResult.periode],
                    ['Contrat', importResult.contrat],
                  ].map(([l, v]) => (
                    <div key={l} className="bg-[#f8f9fc] rounded-lg p-3">
                      <div className="text-[10px] text-[#858aaa] font-mono uppercase tracking-wide">{l}</div>
                      <div className="font-semibold text-sm text-[#0f1117] mt-0.5">{v || '—'}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const emp: Employee = {
                      id: Date.now().toString(),
                      nom: importResult.salarie, poste: importResult.poste,
                      contrat: importResult.contrat || 'CDI',
                      brut: importResult.brut || 0,
                      cotis_sal: importResult.cotis_sal_pct || 22,
                      cotis_pat: importResult.cotis_pat_pct || 42,
                      pas: importResult.pas || 0,
                      tr_val: importResult.tr_val || 9, tr_pct: importResult.tr_pct || 50,
                      mutuelle_sal: 0, mutuelle_emp: 0,
                      color: COLORS[employees.length % COLORS.length],
                    }
                    downloadARF(emp)
                  }}
                  className="btn btn-primary"
                >
                  <Download className="w-4 h-4" /> Télécharger ARF Sage GE
                </button>
              </div>
            )}
          </div>
        )}

        {/* Module Tab */}
        {tab === 'module' && (
          <div className="grid grid-cols-[260px_1fr] h-[calc(100vh-180px)]">
            {/* Employee list */}
            <div className="border-r border-[#eaecf4] overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="section-title">Salariés</span>
                <button onClick={() => setShowNewForm(true)} className="btn btn-sm">
                  <Plus className="w-3.5 h-3.5" /> Ajouter
                </button>
              </div>
              <div className="space-y-2">
                {employees.map(emp => (
                  <button key={emp.id} onClick={() => setSelected(emp)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      selected?.id === emp.id ? 'bg-violet-50 border border-violet-200' : 'hover:bg-[#f8f9fc]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: emp.color }}>
                      {emp.nom.slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#0f1117] truncate">{emp.nom}</div>
                      <div className="text-xs text-[#858aaa] truncate">{emp.poste || emp.contrat}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#c0c5de] flex-shrink-0" />
                  </button>
                ))}
                {employees.length === 0 && (
                  <div className="empty-state py-8">
                    <div className="empty-icon">👤</div>
                    <div className="empty-sub">Aucun salarié</div>
                  </div>
                )}
              </div>
            </div>

            {/* Detail panel */}
            <div className="overflow-y-auto p-6">
              {showNewForm ? (
                <div className="max-w-lg space-y-4">
                  <h3 className="font-bold font-display text-[#0f1117] text-lg">Nouveau salarié</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="field col-span-2"><label className="label">Nom complet *</label><input className="input" value={newEmp.nom || ''} onChange={e => setNewEmp(p => ({...p, nom: e.target.value}))} placeholder="Prénom NOM" /></div>
                    <div className="field"><label className="label">Poste</label><input className="input" value={newEmp.poste || ''} onChange={e => setNewEmp(p => ({...p, poste: e.target.value}))} /></div>
                    <div className="field"><label className="label">Contrat</label>
                      <select className="select" value={newEmp.contrat} onChange={e => setNewEmp(p => ({...p, contrat: e.target.value}))}>
                        {['CDI','CDD','Apprenti','Stage'].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="field"><label className="label">Salaire brut (€)</label><input className="input font-mono" type="number" value={newEmp.brut || ''} onChange={e => setNewEmp(p => ({...p, brut: Number(e.target.value)}))} /></div>
                    <div className="field"><label className="label">PAS (%)</label><input className="input font-mono" type="number" value={newEmp.pas || 0} onChange={e => setNewEmp(p => ({...p, pas: Number(e.target.value)}))} /></div>
                    <div className="field"><label className="label">Cotis. salariales (%)</label><input className="input font-mono" type="number" value={newEmp.cotis_sal || 22} onChange={e => setNewEmp(p => ({...p, cotis_sal: Number(e.target.value)}))} /></div>
                    <div className="field"><label className="label">Cotis. patronales (%)</label><input className="input font-mono" type="number" value={newEmp.cotis_pat || 42} onChange={e => setNewEmp(p => ({...p, cotis_pat: Number(e.target.value)}))} /></div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={createEmployee} className="btn btn-primary">Enregistrer</button>
                    <button onClick={() => setShowNewForm(false)} className="btn">Annuler</button>
                  </div>
                </div>
              ) : selected ? (
                <div className="max-w-xl space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white font-display" style={{ background: selected.color }}>
                      {selected.nom.slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold font-display text-xl text-[#0f1117]">{selected.nom}</h3>
                      <div className="text-sm text-[#858aaa]">{selected.poste} · {selected.contrat}</div>
                    </div>
                  </div>

                  {/* Calcul en temps réel */}
                  {(() => {
                    const res = calcNet(selected)
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            ['Brut mensuel', `${selected.brut.toFixed(2)} €`, 'text-[#0f1117]'],
                            ['Net à payer', `${res.net.toFixed(2)} €`, 'text-green-600'],
                            ['Cotis. salariales', `${res.cotis_sal.toFixed(2)} €`, 'text-orange-600'],
                            ['Cotis. patronales', `${res.cotis_pat.toFixed(2)} €`, 'text-red-600'],
                          ].map(([l, v, cls]) => (
                            <div key={l} className="kpi-card">
                              <div className="kpi-label">{l}</div>
                              <div className={`text-2xl font-extrabold font-mono tabular-nums ${cls}`}>{v}</div>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => downloadARF(selected)} className="btn btn-primary">
                            <Download className="w-4 h-4" /> ARF Sage GE
                          </button>
                          <button onClick={() => {
                            const res2 = calcNet(selected)
                            const csv = `Nom,Poste,Brut,Net,CotisSal,CotisPat\n"${selected.nom}","${selected.poste}",${selected.brut},${res2.net.toFixed(2)},${res2.cotis_sal.toFixed(2)},${res2.cotis_pat.toFixed(2)}`
                            const blob = new Blob(['\uFEFF'+csv], {type:'text/csv'})
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a'); a.href=url; a.download=`bulletin_${selected.nom}.csv`; a.click()
                          }} className="btn">
                            <Download className="w-4 h-4" /> CSV
                          </button>
                          <button onClick={() => {
                            setEmployees(e => e.filter(x => x.id !== selected.id))
                            setSelected(null)
                          }} className="btn btn-destructive ml-auto">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )
                  })()}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-[#858aaa]">
                  <Users className="w-12 h-12 opacity-20" />
                  <div className="text-base font-semibold">Sélectionnez un salarié</div>
                  <div className="text-sm text-center max-w-xs">ou cliquez sur Ajouter pour créer un nouveau profil</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
