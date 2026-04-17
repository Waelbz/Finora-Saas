// @ts-nocheck
'use client'
import { useEffect, useState } from 'react'

export default function HistoriquePage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/audit').then(r => r.json()).then(d => { setItems(d.data || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen" style={{backgroundColor: '#0f1117'}}>
      <div style={{backgroundColor: '#111827', borderBottom: '1px solid rgba(255,255,255,0.07)'}} className="px-8 py-4">
        <h1 className="font-bold text-lg" style={{color: 'white'}}>Historique</h1>
        <p className="text-sm" style={{color: 'rgba(255,255,255,0.4)'}}>Toutes vos opérations comptables</p>
      </div>

      <div className="p-8">
        {loading ? (
          <div className="text-center py-20" style={{color: 'rgba(255,255,255,0.4)'}}>Chargement...</div>
        ) : items.length === 0 ? (
          <div style={{backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)'}} className="rounded-2xl p-16 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-lg font-semibold mb-2" style={{color: 'white'}}>Aucune opération</h2>
            <p style={{color: 'rgba(255,255,255,0.4)'}}>Vos opérations comptables apparaîtront ici après traitement.</p>
          </div>
        ) : (
          <div className="space-y-2 max-w-4xl">
            {items.map((item, i) => (
              <div key={i} style={{backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)'}} className="rounded-xl p-4 flex items-center gap-4">
                <div className="text-2xl">📝</div>
                <div className="flex-1">
                  <div className="font-medium" style={{color: 'white'}}>{item.description || item.type}</div>
                  <div className="text-xs mt-0.5" style={{color: 'rgba(255,255,255,0.4)'}}>{item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : ''}</div>
                </div>
                {item.amount && (<div className="font-mono text-sm" style={{color: 'rgba(255,255,255,0.7)'}}>{item.amount.toFixed(2)} €</div>)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
