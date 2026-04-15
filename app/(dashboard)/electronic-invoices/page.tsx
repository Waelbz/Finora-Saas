'use client'
export default function ElectronicInvoicesPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">Facturation Électronique</h1>
        <span className="px-2 py-0.5 text-xs font-bold bg-violet-500/20 text-violet-400 rounded-full border border-violet-500/30">2026</span>
      </div>
      <p className="text-white/50 mb-8">Conformité réforme facture électronique 2026 — Portail public de facturation (PPF).</p>
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8 text-center">
        <div className="text-4xl mb-4">⚡</div>
        <h2 className="text-lg font-semibold text-white mb-2">Disponible en 2026</h2>
        <p className="text-white/40">Ce module sera activé lors du déploiement de la réforme.</p>
      </div>
    </div>
  )
}
