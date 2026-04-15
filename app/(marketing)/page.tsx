// @ts-nocheck
import Link from 'next/link'


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white overflow-hidden">
      {/* ── Navigation ── */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5 backdrop-blur-sm sticky top-0 z-50 bg-[#0a0a1a]/80">
        <div className="flex items-center gap-3">
          <svg width="32" height="36" viewBox="0 0 56 56" fill="none">
            <path d="M28 4L52 17.5V38.5L28 52L4 38.5V17.5L28 4Z" stroke="url(#lg)" strokeWidth="3.5" fill="none" strokeLinejoin="round"/>
            <path d="M4 17.5L28 31V52" stroke="url(#lg)" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M52 17.5L28 31" stroke="url(#lg)" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
            <path d="M20 28L20 44M20 34L32 34" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1fd9a4"/>
                <stop offset="100%" stopColor="#6c47ff"/>
              </linearGradient>
            </defs>
          </svg>
          <span className="text-xl font-extrabold tracking-tight font-display">Finora</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
          <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
          <a href="#pricing" className="hover:text-white transition-colors">Tarifs</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-3">
          
          
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative px-8 py-28 text-center max-w-5xl mx-auto">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-green-500/8 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/70 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Réforme facture électronique 2026 — Finora est prêt
          </div>

          <h1 className="text-6xl md:text-7xl font-extrabold font-display leading-[1.05] tracking-[-0.04em] mb-6">
            La comptabilité{' '}
            <span className="text-gradient">intelligente</span>
            <br />pour les pros français
          </h1>

          <p className="text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-10">
            Analysez vos factures, relevés bancaires et bulletins de paie avec l'IA.
            Exportez directement vers <strong className="text-white/80">Sage Génération Expert</strong> en format ARF Coala.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/sign-up" className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-gradient-to-r from-violet-500 to-violet-400 text-white font-bold text-base shadow-[0_8px_32px_rgba(108,71,255,.4)] hover:shadow-[0_12px_40px_rgba(108,71,255,.5)] hover:-translate-y-0.5 transition-all duration-200">
              Commencer
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
            </Link>
            <a href="#features" className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-white/5 border border-white/10 text-white/80 font-medium text-base hover:bg-white/10 transition-all">
              Voir les fonctionnalités
            </a>
          </div>

          <p className="mt-6 text-sm text-white/30">
            Sans engagement · Annulable à tout moment
          </p>
        </div>
      </section>

      {/* ── Social proof ── */}
      <section className="px-8 py-8 border-y border-white/5">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-12 flex-wrap">
          {[
            { label: 'Compatible', value: 'Sage GE' },
            { label: 'Format', value: 'ARF Coala' },
            { label: 'Réforme', value: '2026 Prêt' },
            { label: 'Export', value: 'FEC · PDF · CSV' },
            { label: 'Moteur IA', value: 'Claude Anthropic' },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-lg font-bold text-white font-mono">{item.value}</div>
              <div className="text-xs text-white/40 mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="px-8 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold font-display mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Un assistant comptable complet, conçu pour les cabinets et entreprises françaises
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feat) => (
            <div key={feat.title} className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.06] transition-all group">
              <div className="text-3xl mb-4">{feat.icon}</div>
              <h3 className="font-bold text-base mb-2 font-display">{feat.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{feat.desc}</p>
              {feat.badge && (
                <div className="mt-3 inline-block px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-xs text-green-400 font-mono font-bold">
                  {feat.badge}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="px-8 py-24 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold font-display mb-4">Tarifs transparents</h2>
            <p className="text-white/50 text-lg">Commencez gratuitement, évoluez selon vos besoins</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-8 rounded-3xl border transition-all ${
                  plan.featured
                    ? 'bg-gradient-to-b from-violet-500/20 to-violet-500/5 border-violet-500/40 shadow-[0_0_60px_rgba(108,71,255,.15)]'
                    : 'bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06]'
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-violet-500 rounded-full text-xs font-bold text-white">
                    Le plus populaire
                  </div>
                )}
                <div className="mb-6">
                  <div className="text-lg font-bold font-display mb-1">{plan.name}</div>
                  <div className="text-white/50 text-sm">{plan.desc}</div>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold font-display">{plan.price}</span>
                  {plan.price !== 'Gratuit' && <span className="text-white/40 text-sm ml-1">/mois</span>}
                </div>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-white/70">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#0dba7a" strokeWidth="2.5" strokeLinecap="round"><path d="M2 8l4 4 8-8"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.price === 'Gratuit' ? '/sign-up' : '/sign-up?plan=' + plan.id}
                  className={`block w-full h-11 rounded-xl font-semibold text-sm text-center leading-[44px] transition-all ${
                    plan.featured
                      ? 'bg-gradient-to-r from-violet-500 to-violet-400 text-white shadow-violet hover:brightness-110'
                      : 'bg-white/10 text-white hover:bg-white/15'
                  }`}
                >
                  {plan.price === 'Gratuit' ? 'Commencer' : 'Commencer'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-8 py-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold font-display">Finora</span>
            <span className="text-white/30 text-sm">· Comptabilité IA française</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <a href="#" className="hover:text-white/70 transition-colors">Mentions légales</a>
            <a href="#" className="hover:text-white/70 transition-colors">CGU</a>
            <a href="#" className="hover:text-white/70 transition-colors">Confidentialité</a>
            <span>© 2026 Finora</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

const FEATURES = [
  { icon: '📄', title: 'Analyse de factures', desc: 'Importez une ou plusieurs factures PDF. L\'IA extrait les données et génère les écritures ARF Coala prêtes pour Sage GE.', badge: undefined },
  { icon: '🏦', title: 'Relevés bancaires', desc: 'Analysez vos relevés PDF (LCL, BNP, SG, CIC...). Génération automatique des écritures avec rapprochement comptable.', badge: undefined },
  { icon: '👤', title: 'Module paie', desc: 'Gérez vos salariés, calculez les bulletins de paie et exportez les écritures de paie (6411, 431, 437...).', badge: undefined },
  { icon: '🏗', title: 'Immobilisations', desc: 'Registre des actifs, calcul des amortissements linéaires et dégressifs, export des dotations annuelles.', badge: undefined },
  { icon: '🔍', title: 'Audit comptable IA', desc: 'Analyse multi-documents pour détecter les anomalies, doublons, problèmes de TVA et risques fiscaux.', badge: undefined },
  { icon: '⚡', title: 'Facturation Électronique', desc: 'Créez des factures conformes Factur-X EN16931 avec toutes les mentions obligatoires de la réforme 2026.', badge: '2026' },
  { icon: '💬', title: 'Expert IA', desc: 'Posez vos questions comptables à votre assistant IA. PCG, fiscalité française, droit social, IFRS.', badge: undefined },
  { icon: '📊', title: 'Export multi-format', desc: 'Exportez en ARF Coala (Sage GE), FEC (DGFiP), CSV et PDF. Compatible avec tous les logiciels comptables.', badge: undefined },
  { icon: '🔒', title: 'Données sécurisées', desc: 'Vos données sont stockées en Europe (Supabase). Chiffrement AES-256. Votre clé API Anthropic reste privée.', badge: undefined },
]

const PLANS = [
  {
    id: 'free',
    name: 'Gratuit',
    desc: 'Pour découvrir Finora',
    price: 'Gratuit',
    featured: false,
    features: ['1 société', '10 factures/mois', '2 relevés bancaires', '3 salariés', 'Export ARF & FEC', 'Expert IA (20 msg/jour)'],
  },
  {
    id: 'pro',
    name: 'Finora',
    desc: '49€/mois · ou 412€/an (-30%)',
    price: '49€',
    featured: true,
    features: ['Sociétés illimitées', 'Factures illimitées', 'Relevés illimités', 'Salariés illimités', 'Facturation Électronique 2026', 'Audit IA complet', 'Expert IA illimité', 'Export ARF · FEC · PDF · CSV', 'Toutes les mises à jour'],
  },
]
