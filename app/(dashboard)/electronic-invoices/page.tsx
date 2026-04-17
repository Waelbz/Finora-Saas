// @ts-nocheck
export default function ElectronicInvoicesPage() {
  return (
    <div className="min-h-screen" style={{backgroundColor: '#0f1117'}}>
      <div style={{backgroundColor: '#111827', borderBottom: '1px solid rgba(255,255,255,0.07)'}} className="px-8 py-4 flex items-center gap-3">
        <h1 className="font-bold text-lg" style={{color: 'white'}}>Facturation Électronique</h1>
        <span style={{backgroundColor: 'rgba(108,71,255,0.2)', color: '#a78bfa', border: '1px solid rgba(108,71,255,0.3)'}} className="px-2 py-0.5 text-xs font-bold rounded-full">2026</span>
      </div>

      <div className="p-8">
        <p className="text-sm mb-8" style={{color: 'rgba(255,255,255,0.5)'}}>Conformité réforme facture électronique obligatoire en France</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-4xl">
          <div style={{backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)'}} className="rounded-2xl p-6">
            <div className="text-2xl mb-3">📅</div>
            <h3 className="font-semibold mb-1" style={{color: 'white'}}>Calendrier</h3>
            <p className="text-sm" style={{color: 'rgba(255,255,255,0.5)'}}>Obligation progressive à partir de 2026 selon la taille de l'entreprise.</p>
          </div>
          <div style={{backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)'}} className="rounded-2xl p-6">
            <div className="text-2xl mb-3">🏛️</div>
            <h3 className="font-semibold mb-1" style={{color: 'white'}}>Portail PPF</h3>
            <p className="text-sm" style={{color: 'rgba(255,255,255,0.5)'}}>Portail Public de Facturation géré par l'État — émission et réception des e-factures.</p>
          </div>
          <div style={{backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)'}} className="rounded-2xl p-6">
            <div className="text-2xl mb-3">📋</div>
            <h3 className="font-semibold mb-1" style={{color: 'white'}}>Formats acceptés</h3>
            <p className="text-sm" style={{color: 'rgba(255,255,255,0.5)'}}>Factur-X, UBL, CII — formats structurés avec toutes mentions obligatoires.</p>
          </div>
          <div style={{backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)'}} className="rounded-2xl p-6">
            <div className="text-2xl mb-3">⚡</div>
            <h3 className="font-semibold mb-1" style={{color: 'white'}}>Finora prêt</h3>
            <p className="text-sm" style={{color: 'rgba(255,255,255,0.5)'}}>Le module sera activé lors du déploiement officiel de la réforme en 2026.</p>
          </div>
        </div>

        <div style={{backgroundColor: 'rgba(108,71,255,0.1)', border: '1px solid rgba(108,71,255,0.2)'}} className="rounded-2xl p-6 text-center max-w-4xl">
          <div className="text-3xl mb-3">🔔</div>
          <h2 className="font-semibold mb-2" style={{color: 'white'}}>Notification à venir</h2>
          <p className="text-sm" style={{color: 'rgba(255,255,255,0.5)'}}>Vous serez notifié dès que le module sera disponible.</p>
        </div>
      </div>
    </div>
  )
}
