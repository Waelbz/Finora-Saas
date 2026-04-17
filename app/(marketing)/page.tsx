// @ts-nocheck
import Link from 'next/link'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

const FEATURES = [
  { icon: '📄', title: 'Analyse de factures', desc: "Importez vos factures fournisseurs et clients. L'IA extrait les données et génère les écritures ARF Coala pour Sage GE." },
  { icon: '🏦', title: 'Relevés bancaires', desc: 'Analysez vos relevés PDF (LCL, BNP, SG, CIC...). Génération automatique des écritures avec rapprochement comptable.' },
  { icon: '👥', title: 'Module paie', desc: 'Gérez vos salariés, calculez les bulletins de paie et exportez les écritures de paie (6411, 431, 437...).' },
  { icon: '🏗️', title: 'Immobilisations', desc: 'Registre des actifs, calcul des amortissements linéaires et dégressifs, export des dotations annuelles.' },
  { icon: '🔍', title: 'Audit comptable IA', desc: 'Analyse multi-documents pour détecter les anomalies, doublons, problèmes de TVA et risques fiscaux.' },
  { icon: '⚡', title: 'Facturation Électronique', desc: 'Créez des factures conformes Factur-X EN16931 avec toutes les mentions obligatoires de la réforme 2026.', badge: '2026' },
  { icon: '💬', title: 'Expert IA', desc: 'Posez vos questions comptables à votre assistant IA. PCG, fiscalité française, droit comptable.' },
  { icon: '📊', title: 'Export multi-format', desc: 'Exportez en ARF Coala (Sage GE), FEC (DGFiP), CSV et PDF. Compatible avec tous les logiciels.' },
  { icon: '🔒', title: 'Données sécurisées', desc: 'Vos données sont stockées en Europe (Supabase). Chiffrement AES-256. Votre clé API reste privée.' },
]

const PLANS = [
  {
    id: 'monthly',
    name: 'Finora Mensuel',
    desc: 'Sans engagement',
    price: '49€',
    period: '/mois',
    featured: false,
    features: ['Sociétés illimitées', 'Factures illimitées', 'Relevés bancaires illimités', 'Salariés illimités', 'Facturation Électronique 2026', 'Audit IA complet', 'Expert IA illimité', 'Export ARF · FEC · PDF · CSV'],
  },
  {
    id: 'yearly',
    name: 'Finora Annuel',
    desc: '412€/an — économisez 176€',
    price: '34€',
    period: '/mois',
    featured: true,
    features: ['Tout Finora Mensuel inclus', 'Facturation annuelle 412€', '-30% sur le tarif mensuel', '2 mois offerts', 'Support prioritaire'],
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen text-white" style={{backgroundColor: '#0f1117'}}>
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 56 56" fill="none">
            <path d="M28 4L52 17.5V38.5L28 52L4 38.5V17.5L28 4Z" stroke="url(#lg)" strokeWidth="3.5" fill="none" strokeLinejoin="round"/>
            <path d="M4 17.5L28 31V52" stroke="url(#lg)" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M52 17.5L28 31" stroke="url(#lg)" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1fd9a4"/>
                <stop offset="100%" stopColor="#6c47ff"/>
              </linearGradient>
            </defs>
          </svg>
          <span className="text-lg font-bold">Finora</span>
        </Link>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm text-white/70 hover:text-white">Fonctionnalités</a>
          <a href="#pricing" className="text-sm text-white/70 hover:text-white">Tarifs</a>
          <a href="#faq" className="text-sm text-white/70 hover:text-white">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <SignedOut>
            <Link href="/sign-in" className="text-sm text-white/70 hover:text-white px-4 py-2">Connexion</Link>
            <Link href="/sign-up" className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">Commencer</Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="text-sm text-white/70 hover:text-white px-4 py-2">Tableau de bord</Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>

      <section className="relative px-8 py-28 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.07] text-sm text-white/70 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
          Réforme facture électronique 2026 — Finora est prêt
        </div>
        <h1 className="text-6xl md:text-7xl font-bold tracking-tight leading-[0.95] mb-6">
          La comptabilité{' '}
          <span className="bg-gradient-to-r from-violet-400 via-violet-500 to-teal-400 bg-clip-text text-transparent">intelligente</span>
          <br />
          pour les pros français
        </h1>
        <p className="text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
          Analysez vos factures, relevés bancaires et bulletins de paie avec l'IA.
          Exportez directement vers <span className="text-white font-semibold">Sage Génération Expert</span> en format ARF Coala.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <SignedOut>
            <Link href="/sign-up" className="inline-flex items-center gap-2 h-12 px-6 bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold rounded-xl">
              Commencer
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="inline-flex items-center gap-2 h-12 px-6 bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold rounded-xl">
              Accéder au tableau de bord
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </SignedIn>
          <a href="#features" className="inline-flex items-center gap-2 h-12 px-6 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-white font-semibold rounded-xl">
            Voir les fonctionnalités
          </a>
        </div>
        <div className="mt-6 text-sm text-white/30">Sans engagement · Annulable à tout moment</div>
      </section>

      <section className="py-12 px-8 max-w-5xl mx-auto border-t border-white/[0.05]">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
          {[
            { label: 'Compatible', value: 'Sage GE' },
            { label: 'Format', value: 'ARF Coala' },
            { label: 'Réforme', value: '2026 Prêt' },
            { label: 'Export', value: 'FEC · PDF · CSV' },
            { label: 'Moteur IA', value: 'Claude Anthropic' },
          ].map((item) => (
            <div key={item.value}>
              <div className="text-lg font-bold font-mono tracking-tight">{item.value}</div>
              <div className="text-xs text-white/40 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="py-24 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">Tout ce dont vous avez besoin</h2>
          <p className="text-xl text-white/50">Un assistant comptable complet, conçu pour les cabinets et entreprises françaises</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((feat) => (
            <div key={feat.title} className="p-6 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
              <div className="text-3xl mb-4">{feat.icon}</div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">{feat.title}</h3>
                {feat.badge && <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-500/20 text-teal-400 rounded border border-teal-500/30">{feat.badge}</span>}
              </div>
              <p className="text-white/50 text-sm leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="py-24 px-8 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">Tarifs transparents</h2>
          <p className="text-xl text-white/50">Un seul plan, deux modes de facturation</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={'relative p-8 rounded-3xl border ' + (plan.featured
                ? 'bg-gradient-to-b from-violet-500/20 to-violet-500/5 border-violet-500/40'
                : 'bg-white/[0.03] border-white/[0.07]')}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 text-xs font-bold bg-violet-600 text-white rounded-full">Économique</span>
                </div>
              )}
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-sm text-white/50 mb-6">{plan.desc}</p>
              <div className="mb-6">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className="text-white/50 ml-1">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 mt-0.5"><path d="M3 9L7 13L15 5" stroke="#1fd9a4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span className="text-white/80">{f}</span>
                  </li>
                ))}
              </ul>
              <SignedOut>
                <Link href={'/sign-up?plan=' + plan.id} className={'block text-center w-full py-3 rounded-xl font-semibold ' + (plan.featured ? 'bg-violet-600 text-white' : 'bg-white/[0.08] text-white')}>
                  Commencer
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href={'/billing?plan=' + plan.id} className={'block text-center w-full py-3 rounded-xl font-semibold ' + (plan.featured ? 'bg-violet-600 text-white' : 'bg-white/[0.08] text-white')}>
                  Souscrire
                </Link>
              </SignedIn>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-12 px-8 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold">Finora</span>
            <span className="text-white/30 text-sm">· Comptabilité IA française</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/50">
            <a href="#" className="hover:text-white">Mentions légales</a>
            <a href="#" className="hover:text-white">CGU</a>
            <a href="#" className="hover:text-white">Confidentialité</a>
            <span className="text-white/30">© 2026 Finora</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
