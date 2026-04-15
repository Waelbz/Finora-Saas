'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Plus, Download, Trash2, ChevronRight } from 'lucide-react'

interface Immo {
  id: string; nom: string; description?: string; valeur: number
  date_acquisition: string; duree: number; mode: 'lineaire' | 'degressif'
  compte_immo: string; compte_dotation: string; compte_amort: string; current_year: number
}

interface AmortLine { annee: number; brut: number; dotation: number; cumul: number; vnc: number }

function calcAmort(immo: Immo): AmortLine[] {
  const lines: AmortLine[] = []
  const year = new Date(immo.date_acquisition).getFullYear()
  let cumul = 0
  const taux = 1 / immo.duree

  for (let i = 0; i < immo.duree; i++) {
    let dotation: number
    if (immo.mode === 'lineaire') {
      dotation = immo.valeur * taux
    } else {
      const coeff = immo.duree <= 3 ? 1.25 : immo.duree <= 4 ? 1.5 : immo.duree <= 6 ? 1.75 : 2.25
      const vnc = immo.valeur - cumul
      dotation = Math.max(vnc * taux * coeff, vnc / (immo.duree - i))
    }
    dotation = Math.min(dotation, immo.valeur - cumul)
    cumul += dotation
    lines.push({ annee: year + i, brut: immo.valeur, dotation, cumul, vnc: immo.valeur - cumul })
  }
  return lines
}

const COMPTES_IMMO = [
  { label: '211 Terrains', value: '211000' }, { label: '212 Agencements terrains', value: '212000' },
  { label: '213 Constructions', value: '213000' }, { label: '214 Constructions/terrains tiers', value: '214000' },
  { label: '215 Installations techniques', value: '215000' }, { label: '218 Autres immo corporelles', value: '218100' },
  { label: '205 Logiciels/licences', value: '205000' }, { label: '206 Droit au bail', value: '206000' },
  { label: '207 Fonds commercial', value: '207000' },
]

export default function ImmobilisationsPage() {
  const [immos, setImmos] = useState<Immo[]>([])
  const [selected, setSelected] = useState<Immo | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [mode, setMode] = useState<'lineaire' | 'degressif'>('lineaire')
  const [form, setForm] = useState<Partial<Immo>>({
    mode: 'lineaire', duree: 5, current_year: 2026,
    compte_immo: '218100', compte_dotation: '681100', compte_amort: '281100'
  })

  useEffect(() => {
    fetch('/api/immobilisations').then(r => r.json()).then(d => setImmos(d.data || [])).catch(() => {})
  }, [])

  const kpis = {
    total: immos.length,
    brut: immos.reduce((s, i) => s + i.valeur, 0),
    dotations: immos.reduce((s, i) => { const lines = calcAmort(i); const yr = lines.find(l => l.annee === i.current_year); return s + (yr?.dotation || 0) }, 0),
    vnc: immos.reduce((s, i) => { const lines = calcAmort(i); const yr = lines.find(l => l.annee === i.current_year); return s + (yr?.vnc || 0) }, 0),
  }

  const save = async () => {
    if (!form.nom || !form.valeur || !form.date_acquisition) return
    const immo: Immo = {
      id: Date.now().toString(), nom: form.nom, description: form.description,
      valeur: Number(form.valeur), date_acquisition: form.date_acquisition || '',
      duree: Number(form.duree) || 5, mode: form.mode || 'lineaire',
      compte_immo: form.compte_immo || '218100', compte_dotation: form.compte_dotation || '681100',
      compte_amort: form.compte_amort || '281100', current_year: Number(form.current_year) || 2026,
    }
    setImmos(p => [...p, immo])
    setSelected(immo); setShowForm(false)
    await fetch('/api/immobilisations', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(immo) }).catch(() => {})
  }

  const exportARF = (immo: Immo) => {
    const lines = calcAmort(immo)
    const yr = lines.find(l => l.annee === immo.current_year) || lines[0]
    if (!yr) return
    const dot = yr.dotation.toFixed(3).replace('.', ',')
    const arf = `COMPTABILITE "dossier"  DU 01/01/${immo.current_year}  AU  31/12/${immo.current_year}\nPLAN COMPTABLE\nECRITURES\n\t31/12/${immo.current_year} OD ${immo.compte_dotation} "IMMO${immo.current_year}" "Dot. amort. ${immo.nom}" D ${dot} E\n\t31/12/${immo.current_year} OD ${immo.compte_amort} "IMMO${immo.current_year}" "Dot. amort. ${immo.nom}" C ${dot} E`
    const blob = new Blob([arf], { type: 'text/plain;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `immo_${immo.nom.replace(/\s+/g,'_')}.txt`; a.click()
  }

  return (
    <div className="animate-page-in">
      <div className="bg-[#111827] border-b border-white/[0.07] px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg font-display">Immobilisations</h1>
          <p className="text-white/40 text-sm mt-0.5">Registre des actifs et calcul des amortissements</p>
        </div>
        <button onClick={() => { setShowForm(true); setSelected(null) }} className="btn btn-primary btn-sm">
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </button>
      </div>

      <div className="p-8 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Nombre', value: kpis.total.toString() },
            { label: 'Valeur brute', value: `${kpis.brut.toLocaleString('fr-FR')} €` },
            { label: `Dotations ${form.current_year}`, value: `${kpis.dotations.toFixed(0)} €` },
            { label: 'VNC totale', value: `${kpis.vnc.toFixed(0)} €` },
          ].map(k => (
            <div key={k.label} className="kpi-card">
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value tabular-nums">{k.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          {/* List */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-[#eaecf4] flex items-center justify-between">
              <span className="section-title">Actifs ({immos.length})</span>
            </div>
            {immos.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🏗</div><div className="empty-sub">Aucune immobilisation</div></div>
            ) : (
              <div className="divide-y divide-[#eaecf4]">
                {immos.map(immo => (
                  <button key={immo.id} onClick={() => { setSelected(immo); setShowForm(false) }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#f8f9fc] transition-colors ${selected?.id === immo.id ? 'bg-violet-50' : ''}`}>
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="w-4 h-4 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#0f1117] truncate">{immo.nom}</div>
                      <div className="text-xs text-[#858aaa] font-mono">{immo.valeur.toLocaleString('fr-FR')} € · {immo.duree} ans</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#c0c5de]" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detail / Form */}
          <div className="card p-6">
            {showForm ? (
              <div className="space-y-4 max-w-lg">
                <h3 className="font-bold font-display text-[#0f1117] text-lg">Nouvelle immobilisation</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="field col-span-2"><label className="label">Nom *</label><input className="input" value={form.nom || ''} onChange={e => setForm(p => ({...p, nom: e.target.value}))} placeholder="Ordinateur portable MacBook Pro" /></div>
                  <div className="field"><label className="label">Valeur HT (€) *</label><input className="input font-mono" type="number" value={form.valeur || ''} onChange={e => setForm(p => ({...p, valeur: Number(e.target.value)}))} /></div>
                  <div className="field"><label className="label">Date acquisition *</label><input className="input" type="date" value={form.date_acquisition || ''} onChange={e => setForm(p => ({...p, date_acquisition: e.target.value}))} /></div>
                  <div className="field"><label className="label">Durée (années)</label><input className="input font-mono" type="number" min="1" max="50" value={form.duree || 5} onChange={e => setForm(p => ({...p, duree: Number(e.target.value)}))} /></div>
                  <div className="field"><label className="label">Mode</label>
                    <select className="select" value={form.mode} onChange={e => setForm(p => ({...p, mode: e.target.value as any}))}>
                      <option value="lineaire">Linéaire</option>
                      <option value="degressif">Dégressif</option>
                    </select>
                  </div>
                  <div className="field col-span-2"><label className="label">Compte immobilisation</label>
                    <select className="select" value={form.compte_immo} onChange={e => setForm(p => ({...p, compte_immo: e.target.value}))}>
                      {COMPTES_IMMO.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="field"><label className="label">Exercice</label><input className="input font-mono" type="number" value={form.current_year || 2026} onChange={e => setForm(p => ({...p, current_year: Number(e.target.value)}))} /></div>
                </div>
                <div className="flex gap-3">
                  <button onClick={save} className="btn btn-primary">Enregistrer</button>
                  <button onClick={() => setShowForm(false)} className="btn">Annuler</button>
                </div>
              </div>
            ) : selected ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold font-display text-xl text-[#0f1117]">{selected.nom}</h3>
                    <div className="text-sm text-[#858aaa] mt-1 font-mono">{selected.compte_immo} · Acquis le {new Date(selected.date_acquisition).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <button onClick={() => { setImmos(p => p.filter(x => x.id !== selected.id)); setSelected(null) }} className="btn btn-destructive btn-sm">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Mode toggle */}
                <div className="flex gap-2">
                  {(['lineaire','degressif'] as const).map(m => (
                    <button key={m} onClick={() => setMode(m)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${mode === m ? 'bg-violet-500 text-white' : 'bg-[#f4f5f9] text-[#858aaa] hover:text-[#0f1117]'}`}>
                      {m === 'lineaire' ? 'Linéaire' : 'Dégressif'}
                    </button>
                  ))}
                </div>

                {/* Amortissement table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#f4f5f9]">
                      <tr>{['Année','Brut','Dotation','Cumul amort.','VNC'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[10px] font-bold text-[#858aaa] font-mono uppercase tracking-wide">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaecf4]">
                      {calcAmort({ ...selected, mode }).map((line, i) => (
                        <tr key={i} className={line.annee === selected.current_year ? 'bg-violet-50 font-semibold' : 'hover:bg-[#f8f9fc]'}>
                          {[line.annee, line.brut.toFixed(2), line.dotation.toFixed(2), line.cumul.toFixed(2), line.vnc.toFixed(2)].map((v, j) => (
                            <td key={j} className="px-3 py-2 font-mono text-xs tabular-nums">{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => exportARF(selected)} className="btn btn-primary">
                    <Download className="w-4 h-4" /> ARF dotation {selected.current_year}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-[#858aaa]">
                <BarChart3 className="w-10 h-10 opacity-20" />
                <div className="text-sm">Sélectionnez une immobilisation ou créez-en une</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
