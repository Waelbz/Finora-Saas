// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { Plus, Building2, Pencil, Trash2, ArrowRight } from 'lucide-react'
import type { Company } from '@/types'

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', siren: '', dossier: '', exercice: '2026', type: 'sarl', color: '#6c47ff' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const COLORS = ['#6c47ff','#0dba7a','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#10b981','#f97316']

  useEffect(() => {
    fetch('/api/companies')
      .then(r => r.json())
      .then(d => { setCompanies(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const openNew = () => {
    setEditingId(null)
    setForm({ name: '', siren: '', dossier: '', exercice: '2026', type: 'sarl', color: '#6c47ff' })
    setError('')
    setShowForm(true)
  }

  const openEdit = (co: Company) => {
    setEditingId(co.id)
    setForm({ name: co.name, siren: co.siren || '', dossier: co.dossier || '', exercice: co.exercice, type: co.type || 'sarl', color: co.color })
    setError('')
    setShowForm(true)
  }

  const save = async () => {
    if (!form.name.trim()) { setError('Le nom est requis'); return }
    if (form.siren && !/^[0-9]{9}$/.test(form.siren)) { setError('SIREN : 9 chiffres'); return }
    setError(''); setSaving(true)
    try {
      const url = editingId ? `/api/companies/${editingId}` : '/api/companies'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const { data, error: err } = await res.json()
      if (err) { setError(err); return }
      if (editingId) {
        setCompanies(prev => prev.map(c => c.id === editingId ? data : c))
      } else {
        setCompanies(prev => [data, ...prev])
        localStorage.setItem('finora_current_company', data.id)
      }
      setShowForm(false)
    } catch { setError('Erreur serveur') }
    finally { setSaving(false) }
  }

  const remove = async (id: string, name: string) => {
    if (!confirm(`Supprimer "${name}" et toutes ses données ? Cette action est irréversible.`)) return
    await fetch(`/api/companies/${id}`, { method: 'DELETE' })
    setCompanies(prev => prev.filter(c => c.id !== id))
  }

  const selectCompany = (id: string) => {
    localStorage.setItem('finora_current_company', id)
    window.location.href = '/invoices'
  }

  return (
    <div className="animate-page-in">
      <div className="bg-[#111827] border-b border-white/[0.07] px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg font-display">Sociétés</h1>
          <p className="text-white/40 text-sm mt-0.5">Gérez vos entités comptables</p>
        </div>
        <button onClick={openNew} className="btn btn-primary gap-1.5">
          <Plus className="w-4 h-4" /> Nouvelle société
        </button>
      </div>

      <div className="p-8 max-w-3xl">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="spinner" />
          </div>
        ) : companies.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon"><Building2 className="w-10 h-10 text-[#c0c5de]" /></div>
              <div className="empty-title">Aucune société</div>
              <div className="empty-sub">Créez votre première société pour commencer à gérer votre comptabilité</div>
              <button onClick={openNew} className="btn btn-primary mt-4">
                <Plus className="w-4 h-4" /> Créer ma première société
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {companies.map((co) => (
              <div key={co.id} className="card card-body flex items-center gap-4 group">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-extrabold text-white font-display flex-shrink-0"
                  style={{ background: co.color }}
                >
                  {co.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[#0f1117] font-display text-base">{co.name}</div>
                  <div className="text-sm text-[#858aaa] font-mono mt-0.5">
                    {co.siren ? `SIREN ${co.siren}` : '—'} · Dossier {co.dossier || '—'} · {co.exercice}
                  </div>
                </div>
                <div className="flex gap-4 text-center flex-shrink-0">
                  <div>
                    <div className="text-base font-extrabold text-[#0f1117] font-mono tabular-nums">{co.stats?.invoices || 0}</div>
                    <div className="text-[10px] text-[#858aaa] uppercase tracking-wide">Fact.</div>
                  </div>
                  <div>
                    <div className="text-base font-extrabold text-[#0f1117] font-mono tabular-nums">{co.stats?.bulletins || 0}</div>
                    <div className="text-[10px] text-[#858aaa] uppercase tracking-wide">Bull.</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(co)} className="btn btn-sm gap-1">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(co.id, co.name)} className="btn btn-sm btn-destructive gap-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => selectCompany(co.id)} className="btn btn-primary btn-sm gap-1.5">
                    Accéder <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-modal">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-extrabold font-display text-[#0f1117]">
                  {editingId ? 'Modifier la société' : 'Nouvelle société'}
                </h2>
                <p className="text-sm text-[#858aaa] mt-1">Cabinet, entreprise ou micro-entrepreneur</p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl bg-[#f4f5f9] flex items-center justify-center text-[#858aaa] hover:bg-[#eaecf4]">×</button>
            </div>

            <div className="space-y-4">
              <div className="field">
                <label className="label">Nom de la société *</label>
                <input className="input" placeholder="minuit.agency" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="field">
                  <label className="label">SIREN (9 chiffres)</label>
                  <input className="input font-mono" placeholder="919289496" maxLength={9} value={form.siren} onChange={e => setForm(p => ({ ...p, siren: e.target.value.replace(/\D/g, '') }))} />
                </div>
                <div className="field">
                  <label className="label">Exercice</label>
                  <select className="select" value={form.exercice} onChange={e => setForm(p => ({ ...p, exercice: e.target.value }))}>
                    <option>2024</option><option>2025</option><option>2026</option><option>2027</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="field">
                  <label className="label">Code dossier Sage</label>
                  <input className="input font-mono uppercase" placeholder="MINAT" maxLength={8} value={form.dossier} onChange={e => setForm(p => ({ ...p, dossier: e.target.value.toUpperCase() }))} />
                </div>
                <div className="field">
                  <label className="label">Type de structure</label>
                  <select className="select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                    <option value="sarl">SARL / EURL</option>
                    <option value="sas">SAS / SASU</option>
                    <option value="sa">SA</option>
                    <option value="ei">EI / Micro</option>
                    <option value="cabinet">Cabinet</option>
                    <option value="asso">Association</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="label">Couleur</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm(p => ({ ...p, color: c }))}
                      className={`w-8 h-8 rounded-lg transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-[#3d4263]' : 'hover:scale-110'}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={save} disabled={saving} className="btn btn-primary flex-1 h-11">
                {saving ? 'Enregistrement…' : editingId ? 'Modifier' : 'Créer la société'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn h-11 px-5">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
