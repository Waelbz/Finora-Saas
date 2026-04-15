// @ts-nocheck
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getOrCreateProfile } from '@/lib/actions/profile'
import { getCompanies } from '@/lib/actions/companies'
import { createAdminClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const profile = await getOrCreateProfile()
  if (!profile) redirect('/sign-in')

  const companies = await getCompanies()
  const admin = createAdminClient()

  // Stats globales
  const [{ count: invoiceCount }, { count: employeeCount }, { count: auditCount }] = await Promise.all([
    admin.from('invoices').select('*', { count: 'exact', head: true }).eq('profile_id', profile.id),
    admin.from('employees').select('*', { count: 'exact', head: true }).eq('profile_id', profile.id),
    admin.from('audit_reports').select('*', { count: 'exact', head: true }).eq('profile_id', profile.id),
  ])

  // Activité récente
  const { data: activity } = await admin
    .from('activity_log')
    .select('*')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="animate-page-in">
      {/* Topbar */}
      <div className="bg-[#111827] border-b border-white/[0.07] px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg font-display">Tableau de bord</h1>
          <p className="text-white/40 text-sm mt-0.5">Vue d'ensemble de votre activité comptable</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge ${
            profile.plan === 'cabinet' ? 'badge-orange' :
            profile.plan === 'pro' ? 'badge-violet' : 'badge-gray'
          }`}>
            Plan {profile.plan}
          </span>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="kpi-card">
            <div className="kpi-label">Sociétés</div>
            <div className="kpi-value">{companies.length}</div>
            <div className="text-xs text-[#858aaa] mt-1">
              {profile.plan === 'free' ? '1 max (gratuit)' : `Plan ${profile.plan}`}
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Factures traitées</div>
            <div className="kpi-value tabular-nums">{invoiceCount || 0}</div>
            <div className="text-xs text-[#858aaa] mt-1">Total toutes sociétés</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Salariés</div>
            <div className="kpi-value tabular-nums">{employeeCount || 0}</div>
            <div className="text-xs text-[#858aaa] mt-1">Profils actifs</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Audits IA</div>
            <div className="kpi-value tabular-nums">{auditCount || 0}</div>
            <div className="text-xs text-[#858aaa] mt-1">Rapports générés</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Companies */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#0f1117] font-display">Vos sociétés</h2>
              <a href="/companies" className="text-sm text-violet-500 hover:text-violet-600 font-medium">
                Tout voir →
              </a>
            </div>
            {companies.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-icon">🏢</div>
                  <div className="empty-title">Aucune société</div>
                  <div className="empty-sub">Créez votre première société pour commencer</div>
                  <a href="/companies" className="btn btn-primary mt-4">
                    + Créer une société
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {companies.slice(0, 4).map((co) => (
                  <div key={co.id} className="card card-body flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white font-display flex-shrink-0"
                      style={{ background: co.color }}
                    >
                      {co.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[#0f1117] font-display truncate">{co.name}</div>
                      <div className="text-xs text-[#858aaa] font-mono mt-0.5">
                        {co.siren ? `SIREN ${co.siren}` : '—'} · Exercice {co.exercice}
                      </div>
                    </div>
                    <div className="flex gap-3 text-center flex-shrink-0">
                      <div>
                        <div className="text-sm font-bold text-[#0f1117] font-mono tabular-nums">{co.stats?.invoices || 0}</div>
                        <div className="text-[9px] text-[#858aaa] uppercase tracking-wide">Fact.</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#0f1117] font-mono tabular-nums">{co.stats?.bulletins || 0}</div>
                        <div className="text-[9px] text-[#858aaa] uppercase tracking-wide">Bull.</div>
                      </div>
                    </div>
                    <a
                      href={`/invoices?company=${co.id}`}
                      className="btn btn-sm flex-shrink-0"
                    >
                      Accéder →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity feed */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#0f1117] font-display">Activité récente</h2>
            </div>
            <div className="card">
              {!activity || activity.length === 0 ? (
                <div className="empty-state py-8">
                  <div className="empty-icon">📋</div>
                  <div className="empty-sub">Aucune activité</div>
                </div>
              ) : (
                <div className="divide-y divide-[#eaecf4]">
                  {activity.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-4">
                      <div className="text-lg flex-shrink-0">
                        {item.type === 'invoice' ? '📄' :
                         item.type === 'bank' ? '🏦' :
                         item.type === 'payroll' ? '💰' :
                         item.type === 'audit' ? '🔍' : '📁'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#0f1117] truncate">{item.label}</div>
                        <div className="text-xs text-[#858aaa] mt-0.5 font-mono">
                          {new Date(item.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </div>
                      {item.amount && (
                        <div className="text-sm font-bold text-[#3d4263] font-mono flex-shrink-0">
                          {item.amount}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="font-bold text-[#0f1117] font-display mb-4">Actions rapides</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: '/invoices', icon: '📄', label: 'Analyser des factures', color: '#6c47ff' },
              { href: '/bank', icon: '🏦', label: 'Importer un relevé', color: '#0dba7a' },
              { href: '/payroll', icon: '💰', label: 'Traiter la paie', color: '#f59e0b' },
              { href: '/chat', icon: '💬', label: 'Poser une question', color: '#6c47ff' },
            ].map((action) => (
              <a
                key={action.href}
                href={action.href}
                className="card card-body flex flex-col items-center gap-3 text-center hover:shadow-md transition-shadow group"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: action.color + '15' }}
                >
                  {action.icon}
                </div>
                <div className="text-sm font-semibold text-[#0f1117] group-hover:text-violet-500 transition-colors">
                  {action.label}
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
