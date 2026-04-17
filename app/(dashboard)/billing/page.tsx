// @ts-nocheck
'use client'
import { useState } from 'react'
import { CreditCard, Check, Loader2 } from 'lucide-react'

export default function BillingPage() {
  const [loading, setLoading] = useState(null)

  const subscribe = async (plan) => {
    setLoading(plan)
    try {
      const resp = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      })
      const data = await resp.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Erreur: ' + (data.error || 'Impossible de créer le checkout'))
        setLoading(null)
      }
    } catch (e) {
      alert('Erreur de connexion')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#0f1117'}}>
      <div style={{backgroundColor: '#111827', borderBottom: '1px solid rgba(255,255,255,0.07)'}} className="px-8 py-4 flex items-center gap-3">
        <CreditCard className="w-5 h-5" style={{color: '#a78bfa'}} />
        <div>
          <h1 className="font-bold text-lg" style={{color: 'white'}}>Abonnement</h1>
          <p className="text-sm" style={{color: 'rgba(255,255,255,0.4)'}}>Choisissez votre formule Finora</p>
        </div>
      </div>

      <div className="p-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div style={{backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)'}} className="rounded-3xl p-8">
            <h3 className="text-xl font-bold mb-1" style={{color: 'white'}}>Finora Mensuel</h3>
            <p className="text-sm mb-6" style={{color: 'rgba(255,255,255,0.5)'}}>Sans engagement</p>
            <div className="mb-6">
              <span className="text-5xl font-bold" style={{color: 'white'}}>49€</span>
              <span className="ml-1" style={{color: 'rgba(255,255,255,0.5)'}}>/mois</span>
            </div>
            <ul className="space-y-3 mb-8">
              {['Sociétés illimitées', 'Factures illimitées', 'Relevés bancaires illimités', 'Salariés illimités', 'Facturation Électronique 2026', 'Audit IA complet', 'Expert IA illimité', 'Export ARF · FEC · PDF · CSV'].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{color: '#1fd9a4'}} />
                  <span style={{color: 'rgba(255,255,255,0.8)'}}>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => subscribe('monthly')}
              disabled={loading !== null}
              style={{backgroundColor: 'rgba(255,255,255,0.08)', color: 'white'}}
              className="block w-full py-3 rounded-xl font-semibold disabled:opacity-50"
            >
              {loading === 'monthly' ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</span> : 'Souscrire — 49€/mois'}
            </button>
          </div>

          <div style={{background: 'linear-gradient(to bottom, rgba(108,71,255,0.2), rgba(108,71,255,0.05))', border: '1px solid rgba(108,71,255,0.4)'}} className="relative rounded-3xl p-8">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 text-xs font-bold rounded-full" style={{backgroundColor: '#6c47ff', color: 'white'}}>Économique</span>
            </div>
            <h3 className="text-xl font-bold mb-1" style={{color: 'white'}}>Finora Annuel</h3>
            <p className="text-sm mb-6" style={{color: 'rgba(255,255,255,0.5)'}}>412€/an — économisez 176€</p>
            <div className="mb-6">
              <span className="text-5xl font-bold" style={{color: 'white'}}>34€</span>
              <span className="ml-1" style={{color: 'rgba(255,255,255,0.5)'}}>/mois</span>
            </div>
            <ul className="space-y-3 mb-8">
              {['Tout Finora Mensuel inclus', 'Facturation annuelle 412€', '-30% sur le tarif mensuel', '2 mois offerts', 'Support prioritaire'].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{color: '#1fd9a4'}} />
                  <span style={{color: 'rgba(255,255,255,0.8)'}}>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => subscribe('yearly')}
              disabled={loading !== null}
              style={{backgroundColor: '#6c47ff', color: 'white'}}
              className="block w-full py-3 rounded-xl font-semibold disabled:opacity-50"
            >
              {loading === 'yearly' ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</span> : 'Souscrire — 412€/an'}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-sm" style={{color: 'rgba(255,255,255,0.4)'}}>
          Paiement sécurisé par Stripe · Annulable à tout moment
        </div>
      </div>
    </div>
  )
}
