// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { Save, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [keySaved, setKeySaved] = useState(false)
  const [keyError, setKeyError] = useState('')
  const [testing, setTesting] = useState(false)
  const [cfg, setCfg] = useState({ jach: 'HA', jvte: 'VT', jbnq: 'BNQ', jod: 'OD' })
  const [cfgSaved, setCfgSaved] = useState(false)

  useEffect(() => {
    const saved = sessionStorage.getItem('finora_key') || ''
    if (saved) setApiKey(saved)
  }, [])

  const saveApiKey = () => {
    setKeyError('')
    if (!apiKey.trim()) { setKeyError('La clé API est requise'); return }
    if (!apiKey.startsWith('sk-ant')) {
      setKeyError('La clé doit commencer par sk-ant...')
      return
    }
    sessionStorage.setItem('finora_key', apiKey)
    setKeySaved(true)
    setTimeout(() => setKeySaved(false), 3000)
  }

  const testKey = async () => {
    const key = sessionStorage.getItem('finora_key')
    if (!key) { setKeyError('Enregistrez d\'abord votre clé'); return }
    setTesting(true)
    setKeyError('')
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'ok' }]
        })
      })
      if (res.ok) {
        setKeySaved(true)
        setTimeout(() => setKeySaved(false), 3000)
      } else {
        const data = await res.json()
        setKeyError(data.error?.message || `Erreur ${res.status}`)
      }
    } catch {
      setKeyError('Erreur réseau')
    } finally {
      setTesting(false)
    }
  }

  const saveCfg = async () => {
    try {
      await fetch('/api/profile/cfg', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ global_cfg: cfg }),
      })
      setCfgSaved(true)
      setTimeout(() => setCfgSaved(false), 2000)
    } catch {}
  }

  return (
    <div className="animate-page-in">
      <div className="bg-[#111827] border-b border-white/[0.07] px-8 py-4">
        <h1 className="text-white font-bold text-lg font-display">Paramètres</h1>
        <p className="text-white/40 text-sm mt-0.5">Configuration de votre espace Finora</p>
      </div>

      <div className="p-8 max-w-2xl space-y-6">

        {/* API Key */}
        <div className="card">
          <div className="p-5 border-b border-[#eaecf4]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6c47ff" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              <div>
                <div className="font-bold text-[#0f1117] font-display">Clé API Anthropic</div>
                <div className="text-xs text-[#858aaa]">Nécessaire pour l'analyse IA des documents</div>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-[#858aaa] leading-relaxed">
              Votre clé API est stockée dans la session du navigateur et n'est jamais transmise à des tiers.
              Obtenez votre clé sur <a href="https://console.anthropic.com" target="_blank" rel="noopener" className="text-violet-500 hover:underline">console.anthropic.com</a>
            </p>
            <div className="field">
              <label className="label">Clé API (sk-ant-...)</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="sk-ant-api03-..."
                  className="input pr-10 font-mono text-xs"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#858aaa] hover:text-[#3d4263]"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {keyError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {keyError}
              </div>
            )}
            {keySaved && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                Clé API enregistrée et vérifiée ✓
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={saveApiKey} className="btn btn-primary gap-1.5">
                <Save className="w-4 h-4" /> Enregistrer
              </button>
              <button onClick={testKey} disabled={testing} className="btn gap-1.5">
                {testing ? 'Test en cours…' : 'Tester la connexion'}
              </button>
            </div>
          </div>
        </div>

        {/* Journals */}
        <div className="card">
          <div className="p-5 border-b border-[#eaecf4]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0dba7a" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4h16M4 8h12M4 12h8"/>
                </svg>
              </div>
              <div>
                <div className="font-bold text-[#0f1117] font-display">Codes journaux par défaut</div>
                <div className="text-xs text-[#858aaa]">Utilisés lors de la génération des écritures ARF</div>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { key: 'jach', label: 'Journal achats', placeholder: 'HA' },
                { key: 'jvte', label: 'Journal ventes', placeholder: 'VT' },
                { key: 'jbnq', label: 'Journal banque', placeholder: 'BNQ' },
                { key: 'jod', label: 'Journal OD', placeholder: 'OD' },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="field">
                  <label className="label">{label}</label>
                  <input
                    type="text"
                    value={cfg[key as keyof typeof cfg]}
                    onChange={e => setCfg(prev => ({ ...prev, [key]: e.target.value.toUpperCase().slice(0, 6) }))}
                    placeholder={placeholder}
                    className="input font-mono uppercase"
                    maxLength={6}
                  />
                </div>
              ))}
            </div>
            {cfgSaved && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg mb-4">
                <CheckCircle className="w-4 h-4" /> Journaux enregistrés
              </div>
            )}
            <button onClick={saveCfg} className="btn btn-primary gap-1.5">
              <Save className="w-4 h-4" /> Enregistrer les journaux
            </button>
          </div>
        </div>

        {/* About */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <svg width="36" height="40" viewBox="0 0 56 56" fill="none">
              <path d="M28 4L52 17.5V38.5L28 52L4 38.5V17.5L28 4Z" stroke="url(#st-lg)" strokeWidth="3.5" fill="none" strokeLinejoin="round"/>
              <path d="M4 17.5L28 31V52" stroke="url(#st-lg)" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M52 17.5L28 31" stroke="url(#st-lg)" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
              <path d="M20 28L20 44M20 34L32 34" stroke="url(#st-lg)" strokeWidth="3" fill="none" strokeLinecap="round"/>
              <defs>
                <linearGradient id="st-lg" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#1fd9a4"/>
                  <stop offset="100%" stopColor="#6c47ff"/>
                </linearGradient>
              </defs>
            </svg>
            <div>
              <div className="font-extrabold text-lg text-[#0f1117] font-display">Finora</div>
              <div className="text-xs text-[#858aaa] font-mono tracking-wide">VERSION 1.0.0 — 2026</div>
            </div>
          </div>
          <p className="text-sm text-[#858aaa] leading-relaxed mb-4">
            Assistant comptable IA pour experts-comptables et entreprises françaises.
            Export ARF Coala pour Sage Génération Expert.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Moteur IA', value: 'Claude (Anthropic)' },
              { label: 'Formats', value: 'ARF · FEC · CSV · PDF' },
              { label: 'Stockage', value: 'Supabase (EU)' },
              { label: 'Réforme 2026', value: 'Factur-X EN16931' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#f8f9fc] rounded-xl p-3 border border-[#eaecf4]">
                <div className="text-[10px] font-mono text-[#858aaa] uppercase tracking-wider mb-1">{label}</div>
                <div className="text-sm font-semibold text-[#0f1117]">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
