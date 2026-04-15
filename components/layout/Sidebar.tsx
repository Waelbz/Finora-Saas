// @ts-nocheck
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { useState } from 'react'
import {
  LayoutDashboard, Building2, FileText, Landmark,
  Users, BarChart3, Search, Receipt, MessageCircle,
  Settings, CreditCard, ChevronDown, Plus, LogOut,
  Zap
} from 'lucide-react'
import type { Company, Profile } from '@/types'
import { clsx } from 'clsx'

interface SidebarProps {
  profile: Profile
  companies: Company[]
  currentCompany: Company | null
  onCompanyChange: (company: Company) => void
}

const MODULES = [
  { href: '/invoices', icon: FileText, label: 'Factures' },
  { href: '/bank', icon: Landmark, label: 'Relevé bancaire' },
  { href: '/payroll', icon: Users, label: 'Paie' },
  { href: '/immobilisations', icon: BarChart3, label: 'Immobilisations' },
  { href: '/audit', icon: Search, label: 'Audit IA' },
  { href: '/historique', icon: BarChart3, label: 'Historique' },
]

const TOOLS = [
  { href: '/electronic-invoices', icon: Zap, label: 'Fact. Élec.', badge: '2026' },
]

const BOTTOM_LINKS = [
  { href: '/chat', icon: MessageCircle, label: 'Expert IA', badge: 'NEW', badgeColor: 'violet' },
  { href: '/settings', icon: Settings, label: 'Paramètres' },
  { href: '/billing', icon: CreditCard, label: 'Abonnement' },
]

export default function Sidebar({ profile, companies, currentCompany, onCompanyChange }: SidebarProps) {
  const pathname = usePathname()
  const [coDropOpen, setCoDropOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => pathname.startsWith(href)

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={clsx(
        'fixed top-0 left-0 h-full z-40 flex flex-col transition-transform duration-300',
        'w-60 bg-[#111827] border-r border-white/[0.07]',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.07]">
          <svg width="32" height="36" viewBox="0 0 56 56" fill="none">
            <path d="M28 4L52 17.5V38.5L28 52L4 38.5V17.5L28 4Z" stroke="url(#sb-lg)" strokeWidth="3.5" fill="none" strokeLinejoin="round"/>
            <path d="M4 17.5L28 31V52" stroke="url(#sb-lg)" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M52 17.5L28 31" stroke="url(#sb-lg)" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
            <path d="M20 28L20 44M20 34L32 34" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <defs>
              <linearGradient id="sb-lg" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1fd9a4"/>
                <stop offset="100%" stopColor="#6c47ff"/>
              </linearGradient>
            </defs>
          </svg>
          <div>
            <div className="text-lg font-extrabold text-white tracking-tight font-display">Finora</div>
            <div className="text-[9px] text-white/30 font-mono uppercase tracking-[.14em] mt-0.5">Comptabilité IA</div>
          </div>
        </div>

        {/* Company selector */}
        <div className="px-3 py-3 border-b border-white/[0.07]">
          {currentCompany ? (
            <div className="relative">
              <button
                onClick={() => setCoDropOpen(!coDropOpen)}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] transition-colors border border-white/[0.08]"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 font-display"
                  style={{ background: currentCompany.color }}
                >
                  {currentCompany.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-semibold text-white truncate font-display">
                    {currentCompany.name}
                  </div>
                  <div className="text-[10px] text-white/35 font-mono">
                    {currentCompany.siren ? `SIREN ${currentCompany.siren}` : currentCompany.exercice}
                  </div>
                </div>
                <ChevronDown className={clsx('w-4 h-4 text-white/30 flex-shrink-0 transition-transform', coDropOpen && 'rotate-180')} />
              </button>

              {/* Company dropdown */}
              {coDropOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a2235] border border-white/10 rounded-xl shadow-xl z-10 overflow-hidden">
                  {companies.map((co) => (
                    <button
                      key={co.id}
                      onClick={() => { onCompanyChange(co); setCoDropOpen(false) }}
                      className={clsx(
                        'w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.06] transition-colors text-left',
                        co.id === currentCompany.id && 'bg-white/[0.04]'
                      )}
                    >
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: co.color }}
                      >
                        {co.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm text-white/80 truncate">{co.name}</span>
                    </button>
                  ))}
                  <Link
                    href="/companies/new"
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.06] transition-colors border-t border-white/[0.07] text-violet-400"
                    onClick={() => setCoDropOpen(false)}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Nouvelle société</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/companies"
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-dashed border-white/20 hover:border-white/40 transition-colors text-white/50 hover:text-white/70"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Sélectionner une société</span>
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all',
              isActive('/dashboard')
                ? 'bg-white/[0.10] text-white'
                : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
            )}
          >
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
            Dashboard
          </Link>

          {/* Modules société */}
          {(
            <>
              <div className="px-3 pt-4 pb-1.5">
                <span className="text-[9px] font-semibold text-white/25 uppercase tracking-[.12em] font-mono">
                  Modules
                </span>
              </div>
              {MODULES.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                    isActive(href)
                      ? 'bg-white/[0.10] text-white'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </Link>
              ))}

              <div className="px-3 pt-4 pb-1.5">
                <span className="text-[9px] font-semibold text-white/25 uppercase tracking-[.12em] font-mono">
                  Outils
                </span>
              </div>
              {TOOLS.map(({ href, icon: Icon, label, badge }) => (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all relative',
                    isActive(href)
                      ? 'bg-white/[0.10] text-white'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                  {badge && (
                    <span className="ml-auto text-[9px] font-bold font-mono bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full border border-green-500/30">
                      {badge}
                    </span>
                  )}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Bottom links + user */}
        <div className="px-3 pb-3 pt-2 border-t border-white/[0.07] space-y-0.5">
          {BOTTOM_LINKS.map(({ href, icon: Icon, label, badge, badgeColor }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all relative',
                isActive(href)
                  ? 'bg-white/[0.10] text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {badge && (
                <span className={clsx(
                  'ml-auto text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full',
                  badgeColor === 'violet'
                    ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                )}>
                  {badge}
                </span>
              )}
            </Link>
          ))}

          {/* Plan badge */}
          <div className="flex items-center justify-between px-3 py-2 mt-1">
            <div className="flex items-center gap-2">
              <div className={clsx(
                'text-[9px] font-bold font-mono px-2 py-1 rounded-full uppercase',
                profile.plan === 'cabinet'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : profile.plan === 'pro'
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : 'bg-white/10 text-white/40 border border-white/10'
              )}>
                {profile.plan}
              </div>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </aside>
    </>
  )
}
