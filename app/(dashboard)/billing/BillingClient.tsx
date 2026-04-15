'use client'

import { useState } from 'react'

interface BillingClientProps {
  currentPlan: string
}

export default function BillingClient({ currentPlan }: BillingClientProps) {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro', interval }),
      })
      const { url, error } = await res.json()
      if (error) { alert(error); return }
      if (url) window.location.href = url
    } catch {
      alert('Erreur lors de la redirection vers le paiement')
    } finally {
      setLoading(false)
    }
  }

  const isPro = currentPlan === 'pro'

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        {['monthly', 'yearly'].map((i) => (
          <button key={i} onClick={() => setInterval(i as 'monthly' | 'yearly')}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              interval === i ? 'bg-violet-500 text-white shadow-violet' : 'bg-white text-[#858aaa] border border-[#dde1ef]'
            }`}
          >
            {i === 'monthly' ? 'Mensuel' : 'Annuel'}
            {i === 'yearly' && <span className="ml-2 text-[10px] font-bold text-green-500">-23%</span>}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gratuit */}
        <div className={`card p-6 ${currentPlan === 'free' ? 'ring-2 ring-green-400' : ''}`}>
          {currentPlan === 'free' && <div className="inline-block px-2 py-0.5 bg-green-500 rounded-full text-[10px] font-bold text-white mb-3">PLAN ACTUEL</div>}
          <div className="mb-4"><div className="font-bold text-lg font-display">Gratuit</div><div className="text-sm text-[#858aaa]">Pour découvrir Finora</div></div>
          <div className="mb-6"><span className="text-3xl font-extrabold font-display">0€</span><span className="text-[#858aaa] text-sm ml-1">/mois</span></div>
          <ul className="space-y-2.5 mb-6">
            {['1 société', '10 factures/mois', '2 relevés bancaires', '3 salariés', 'Export ARF & FEC', 'Expert IA (20 msg/jour)'].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-[#3d4263]">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#0dba7a" strokeWidth="2.5" strokeLinecap="round"><path d="M2 8l4 4 8-8"/></svg>{f}
              </li>
            ))}
          </ul>
          <div className={`w-full h-10 rounded-xl text-sm font-semibold text-center leading-[40px] ${currentPlan === 'free' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-[#f4f5f9] text-[#858aaa]'}`}>
            {currentPlan === 'free' ? '✓ Plan actuel' : 'Plan de base'}
          </div>
        </div>

        {/* Finora Pro */}
        <div className={`card p-6 border-violet-300 shadow-[0_0_30px_rgba(108,71,255,.12)] relative ${isPro ? 'ring-2 ring-violet-400' : ''}`}>
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-violet-500 to-violet-400 rounded-full text-xs font-bold text-white">
            {isPro ? '✓ ABONNEMENT ACTIF' : 'ACCÈS COMPLET'}
          </div>
          <div className="mb-4 mt-2"><div className="font-bold text-lg font-display">Finora</div><div className="text-sm text-[#858aaa]">Tous les modules, sans limite</div></div>
          <div className="mb-1">
            <span className="text-3xl font-extrabold font-display">{interval === 'monthly' ? '49€' : '452€'}</span>
            <span className="text-[#858aaa] text-sm ml-1">/{interval === 'monthly' ? 'mois' : 'an'}</span>
          </div>
          {interval === 'yearly' && <div className="text-xs text-green-600 font-semibold mb-3">Soit 37,67€/mois — économisez 136€/an</div>}
          <ul className="space-y-2 mb-6 mt-3">
            {['Sociétés illimitées', 'Factures illimitées', 'Relevés bancaires illimités', 'Salariés illimités', 'Facturation Électronique 2026', 'Audit IA complet', 'Expert IA illimité', 'Export ARF · FEC · PDF · CSV', 'Toutes les mises à jour incluses'].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-[#3d4263]">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#6c47ff" strokeWidth="2.5" strokeLinecap="round"><path d="M2 8l4 4 8-8"/></svg>{f}
              </li>
            ))}
          </ul>
          {isPro ? (
            <a href="https://billing.stripe.com" target="_blank" rel="noopener noreferrer"
              className="block w-full h-10 rounded-xl bg-white border border-violet-200 text-violet-600 text-sm font-semibold text-center leading-[40px] hover:bg-violet-50 transition-colors">
              Gérer mon abonnement →
            </a>
          ) : (
            <button onClick={handleUpgrade} disabled={loading}
              className="w-full h-10 rounded-xl bg-gradient-to-r from-violet-500 to-violet-400 text-white text-sm font-bold shadow-violet hover:brightness-110 transition-all disabled:opacity-60">
              {loading ? 'Redirection…' : `S'abonner — ${interval === 'monthly' ? '49€/mois' : '452€/an'}`}
            </button>
          )}
        </div>
      </div>
      <p className="text-center text-sm text-[#858aaa] mt-6">Paiement sécurisé par Stripe · Annulable à tout moment · Sans engagement</p>
    </div>
  )
}
