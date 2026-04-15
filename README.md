# 🚀 Finora — Guide de déploiement complet

> **Stack :** Next.js 15 · Supabase · Clerk · Stripe · Vercel

---

## Étape 1 — Créer les comptes services

### 1.1 Supabase (Base de données)
1. Allez sur **[supabase.com](https://supabase.com)** → *New project*
2. Choisissez une région : **Europe West (Paris)** pour la conformité RGPD
3. Notez votre mot de passe de base de données
4. Dans *Settings → API*, copiez :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

**Exécuter le schema :**
- Dans Supabase → *SQL Editor* → coller le contenu de `supabase/migrations/001_initial_schema.sql`
- Cliquer *Run* ✅

### 1.2 Clerk (Authentification)
1. Allez sur **[clerk.com](https://clerk.com)** → *Create application*
2. Activez : Email, Google, Apple
3. Dans *API Keys*, copiez :
   - `Publishable key` → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `Secret key` → `CLERK_SECRET_KEY`
4. Dans *JWT Templates* → *New template* → Choisir **Supabase**
5. Dans *Webhooks* → Ajouter `https://votre-app.vercel.app/api/webhooks/clerk`

### 1.3 Stripe (Paiements)
1. Allez sur **[stripe.com](https://stripe.com)** → Créez un compte
2. Dans *Developers → API Keys*, copiez :
   - `Publishable key` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `Secret key` → `STRIPE_SECRET_KEY`

**Créer les produits :**
- *Products → Add product* → "Finora Pro" → Price 29€/mois récurrent
  - Copiez le Price ID → `STRIPE_PRICE_PRO_MONTHLY`
- *Products → Add product* → "Finora Pro Annuel" → Price 249€/an récurrent
  - Copiez le Price ID → `STRIPE_PRICE_PRO_YEARLY`
- *Products → Add product* → "Finora Cabinet" → Price 99€/mois
  - Copiez le Price ID → `STRIPE_PRICE_CABINET_MONTHLY`
- *Products → Add product* → "Finora Cabinet Annuel" → Price 849€/an
  - Copiez le Price ID → `STRIPE_PRICE_CABINET_YEARLY`

---

## Étape 2 — Déployer sur Vercel

### 2.1 Préparer le code

```bash
# Dans le dossier finora-saas
git init
git add .
git commit -m "Initial commit — Finora SaaS"

# Créer un repo GitHub
# Sur github.com : New repository → "finora-saas" → Public ou Private
git remote add origin https://github.com/VOTRE_PSEUDO/finora-saas.git
git push -u origin main
```

### 2.2 Déployer sur Vercel

1. Allez sur **[vercel.com](https://vercel.com)** → *New Project*
2. Importez votre repo GitHub `finora-saas`
3. Framework : **Next.js** (auto-détecté)
4. **Ne pas encore déployer** — d'abord ajouter les variables d'environnement

### 2.3 Variables d'environnement Vercel

Dans *Project → Settings → Environment Variables*, ajoutez toutes ces variables :

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY     = pk_live_xxx
CLERK_SECRET_KEY                       = sk_live_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL         = /sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL         = /sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL   = /dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL   = /dashboard

NEXT_PUBLIC_SUPABASE_URL              = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY         = eyxxx
SUPABASE_SERVICE_ROLE_KEY             = eyxxx

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY    = pk_live_xxx
STRIPE_SECRET_KEY                      = sk_live_xxx
STRIPE_WEBHOOK_SECRET                  = whsec_xxx (à remplir après l'étape 3)

STRIPE_PRICE_PRO_MONTHLY              = price_xxx
STRIPE_PRICE_PRO_YEARLY               = price_xxx
STRIPE_PRICE_CABINET_MONTHLY          = price_xxx
STRIPE_PRICE_CABINET_YEARLY           = price_xxx

NEXT_PUBLIC_APP_URL                   = https://votre-app.vercel.app
NEXT_PUBLIC_APP_NAME                  = Finora
```

5. Cliquer *Deploy* → ⏳ Build en cours (~2 min)

---

## Étape 3 — Configurer le webhook Stripe

Une fois le déploiement terminé :

1. Dans Stripe → *Developers → Webhooks → Add endpoint*
2. URL : `https://votre-app.vercel.app/api/stripe/webhook`
3. Events à écouter :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copiez le *Signing secret* → `STRIPE_WEBHOOK_SECRET` dans Vercel
5. Redéployez : `git commit --allow-empty -m "Add webhook secret" && git push`

---

## Étape 4 — Domaine personnalisé (optionnel)

### Acheter le domaine
- **OVH** : `finora.fr` ≈ 8€/an, `finora.app` ≈ 15€/an
- **Namecheap** : souvent moins cher en première année

### Connecter à Vercel
1. *Project → Settings → Domains → Add Domain*
2. Entrez `finora.fr`
3. Vercel vous donne des enregistrements DNS à configurer chez OVH
4. Dans OVH *Zone DNS* → Ajouter les enregistrements A et CNAME indiqués
5. Propagation DNS : 10 min à 48h

### Mettre à jour les URLs
Dans Vercel, mettre à jour `NEXT_PUBLIC_APP_URL` avec votre vrai domaine.

Dans Clerk *Domains* → Ajouter votre domaine de production.

---

## Étape 5 — Vérification finale

### Checklist avant mise en prod

```
☐ Page d'accueil charge correctement (/)
☐ Sign-up fonctionne → utilisateur créé dans Clerk + profil créé dans Supabase
☐ Sign-in fonctionne
☐ Dashboard charge avec les données
☐ Création de société fonctionne (POST /api/companies)
☐ Analyse d'une facture fonctionne (l'utilisateur saisit sa clé API Anthropic)
☐ Stripe Checkout s'ouvre pour le plan Pro
☐ Webhook Stripe reçoit les events (Stripe Dashboard → Webhooks → view logs)
```

### Tester le paiement
Stripe en mode test : carte `4242 4242 4242 4242`, expiration `12/26`, CVV `123`

---

## Architecture finale

```
┌─────────────────────────────────────────────────────────────┐
│                         FINORA SAAS                         │
├──────────────┬──────────────┬───────────────┬───────────────┤
│   Frontend   │     Auth     │   Database    │   Payments    │
│   Next.js    │    Clerk     │   Supabase    │    Stripe     │
│   Vercel     │  (JWT/OAuth) │  PostgreSQL   │  Webhooks     │
│   CDG1 🇫🇷   │              │  RLS enabled  │               │
└──────────────┴──────────────┴───────────────┴───────────────┘
                          │
                    Anthropic API
               (clé fournie par l'utilisateur)
```

---

## Structure des fichiers

```
finora-saas/
├── app/
│   ├── (marketing)/page.tsx          # Landing page
│   ├── (auth)/sign-in/page.tsx       # Connexion
│   ├── (auth)/sign-up/page.tsx       # Inscription
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Layout avec sidebar
│   │   ├── DashboardShell.tsx        # Client shell
│   │   ├── dashboard/page.tsx        # Dashboard KPIs
│   │   ├── companies/page.tsx        # Gestion sociétés
│   │   ├── invoices/page.tsx         # Factures IA
│   │   ├── bank/page.tsx             # Relevés bancaires
│   │   ├── payroll/page.tsx          # Module paie
│   │   ├── audit/page.tsx            # Audit IA
│   │   ├── immobilisations/page.tsx  # Immobilisations
│   │   ├── chat/page.tsx             # Expert IA
│   │   ├── settings/page.tsx         # Paramètres
│   │   └── billing/page.tsx          # Abonnement
│   └── api/
│       ├── companies/route.ts
│       ├── invoices/route.ts
│       ├── bank/route.ts
│       ├── payroll/employees/route.ts
│       ├── audit/route.ts
│       ├── immobilisations/route.ts
│       └── stripe/
│           ├── checkout/route.ts
│           └── webhook/route.ts
├── components/
│   └── layout/Sidebar.tsx
├── lib/
│   ├── stripe.ts
│   ├── actions/profile.ts
│   ├── actions/companies.ts
│   └── supabase/client.ts + server.ts
├── supabase/migrations/001_initial_schema.sql
├── types/index.ts
├── middleware.ts
├── .env.example
├── vercel.json
└── README.md
```

---

## Coûts en production

| Service | Plan gratuit | Au-delà |
|---------|-------------|---------|
| **Vercel** | 100GB bandwidth | Pro 20$/mois |
| **Supabase** | 500MB DB, 5GB storage | Pro 25$/mois |
| **Clerk** | 10 000 MAU | 0.02$/MAU ensuite |
| **Stripe** | — | 1.5% + 0.25€ par transaction |
| **Anthropic** | — | Clé API de chaque utilisateur |
| **Domaine** | — | ~10€/an |

**Total démarrage : 0€/mois** jusqu'à environ 500 utilisateurs actifs.

---

## Support

Pour toute question sur le déploiement, consulter :
- [docs.clerk.com](https://docs.clerk.com)
- [supabase.com/docs](https://supabase.com/docs)
- [vercel.com/docs](https://vercel.com/docs)
- [stripe.com/docs](https://stripe.com/docs)
