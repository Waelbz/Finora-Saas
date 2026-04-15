// @ts-nocheck
'use client'
import { useEffect, useState } from 'react'

export default function HistoriquePage() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    fetch('/api/audit')
      .then(r => r.json())
      .then(d => setLogs(d.data || []))
      .catch(() => {})
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Historique</h1>
      <p className="text-white/50 mb-8">Toutes vos opérations comptables.</p>
      {logs.length === 0 ? (
        <div className="text-center text-white/30 py-20">Aucune opération pour le moment.</div>
      ) : (
        <div className="space-y-2">
          {logs.map((log, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 text-white/70">
              {JSON.stringify(log)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
