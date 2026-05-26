# 🎯 Maeva Deal Radar Room — Web App v2
## Prompt Antigravity (spec-driven, agentic-ready)

> **Pour l'agent Antigravity** : ce document est ta source de vérité. Lis-le intégralement avant d'écrire du code. Travaille en **phases** (P0 → P5), produis des **plans d'exécution** avant chaque phase, et **vérifie** ton travail avec des tests et un type-check à chaque palier. Tout écart par rapport à la spec doit être justifié dans un commentaire.

---

## 1. MISSION

Construire **Maeva Deal Radar Room v2** : un *cockpit institutionnel de prospection gouvernée* destiné à Maeva, professionnelle de la prospection M&A / Private Equity sur l'axe Paris / Île-de-France.

L'app remplace une chaîne CLI Python (SQLite + scripts uv) par une **web app moderne, sobre, déployée sur Vercel, propulsée par Supabase**, avec un design qui s'inspire des terminaux de marché (Bloomberg, Symphony) — mais filtré par les codes esthétiques du conseil M&A : sobriété, densité d'information maîtrisée, typographie sérieuse, dark-mode-first, zéro gadget.

**Principe directeur** : *L'application prépare, structure, contrôle, trace. Maeva décide.* (human-in-the-loop strict).

---

## 2. UTILISATRICE — PERSONA

- **Nom** : Maeva
- **Rôle** : Prospection / business development M&A & PE
- **Zone** : Paris / Île-de-France
- **Cibles** : fonds PE mid-cap, boutiques M&A, partners, investment directors, principals, associates
- **Contraintes métier** :
  - L'erreur de ciblage décrédibilise. Précision > volume.
  - Mode discret obligatoire. Ton sobre, jamais agressif.
  - Travaille souvent en déplacement → l'app **doit** être excellente sur mobile.
  - Besoin de **traçabilité totale** (chaque décision laisse une trace).

---

## 3. STACK 2026 — DÉCISIONS TECHNIQUES (non négociables)

| Couche | Choix | Raison |
|---|---|---|
| Framework | **Next.js 15+ (App Router, RSC, Server Actions)** | Stream UI + Server Actions native |
| Runtime | **React 19** (`use`, `useOptimistic`, Actions) | Optimistic updates first-class |
| Langage | **TypeScript 5.x strict** + `noUncheckedIndexedAccess` | Zéro `any`, zéro `as unknown` sans commentaire |
| Style | **Tailwind CSS v4** (config CSS-first) | Plus rapide, plus simple |
| Composants | **shadcn/ui** (last version, copy-in) | Owned components, theming clean |
| Icônes | **lucide-react** | Sobre, cohérent |
| DB | **Supabase Postgres** | Auth + DB + Realtime + Storage unifiés |
| ORM | **Drizzle ORM** | Type-safe SQL, migrations versionnées |
| Validation | **Zod** (côté server + client) | Single source of truth pour les schémas |
| Forms | **React Hook Form + Zod resolver** | DX + performance |
| Tables | **TanStack Table v8** | Tri, filtres, virtualization, dense |
| Charts | **Tremor** (sur Recharts) | Dashboards M&A-grade out of the box |
| Animations | **Framer Motion** (parcimonie) | Micro-interactions, pas de spectacle |
| State client | **TanStack Query** (uniquement où Server Components ne suffisent pas) | |
| AI SDK | **Vercel AI SDK** + **@anthropic-ai/sdk** | Streaming, tool use |
| Web sourcing | **Tavily SDK** | Déjà adopté dans la v1 |
| Email transactionnel | **Resend** (phase 2 — envoi désactivé en P0) | |
| Jobs / Cron | **Vercel Cron** + **Supabase Queues (pgmq)** | Pas de service externe |
| Observabilité | **Sentry** + **PostHog** (product analytics) | |
| Auth | **Supabase Auth** (magic link + passkey si dispo) | Pas de password |
| Tests | **Vitest** (unit) + **Playwright** (e2e critiques) | |
| Lint / Format | **Biome** (remplace ESLint + Prettier) | Plus rapide en 2026 |
| Package manager | **pnpm** | Workspaces si besoin |
| Déploiement | **Vercel** (Edge où pertinent, Node pour SDK lourds) | |

**Anti-stack** (ne PAS utiliser) : Redux, Sass, Styled Components, REST custom (on utilise Server Actions + RPC Supabase), Prisma (Drizzle est meilleur en 2026).

---

## 4. ARCHITECTURE LOGIQUE — 13 COUCHES → 6 MODULES

La v1 Python définit 13 couches. On les **regroupe en 6 modules** UI cohérents :

| # | Module UI | Couches v1 absorbées | Statut |
|---|---|---|---|
| 1 | **Sourcing Web** | C1 (Web sourcing) | Lecture + déclencheur run |
| 2 | **Leads & Shortlist** | C2 (Lead builder) + C3 (Shortlist) | CRUD + scoring |
| 3 | **Messages & Séquences** | C4 (Messages) + C5 (Relances) + C6 (Calendar) | Génération + édition |
| 4 | **Pipeline & Pilotage** | C7 (SQLite) + statuts | Kanban + actions |
| 5 | **Gouvernance** | C9 (Audit qualité) + C10 (Review queue) + C11 (Normalisation) + C12 (Régénération) | Workflows de revue |
| 6 | **Journal & Exports** | C8 (Events) + C13 (Export propre) | Audit trail + CSV/JSON |

---

## 5. MODÈLE DE DONNÉES — SUPABASE / DRIZZLE

### Tables principales (schema `public`)

```ts
// 5.1 — web_discoveries (sources brutes du sourcing Tavily)
export const webDiscoveries = pgTable('web_discoveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  sourceTitle: text('source_title').notNull(),
  sourceUrl: text('source_url').notNull(),
  domain: text('domain').notNull(),
  companyNameRaw: text('company_name_raw'),
  pageType: text('page_type'), // fund_page | team_page | news | portfolio | other
  snippet: text('snippet'),
  extractedText: text('extracted_text'),
  score: numeric('score', { precision: 5, scale: 2 }),
  signals: jsonb('signals').$type<Signal[]>().default([]),
  runId: uuid('run_id').references(() => sourcingRuns.id),
}, (t) => ({
  domainIdx: index('web_discoveries_domain_idx').on(t.domain),
  urlUnique: uniqueIndex('web_discoveries_url_unique').on(t.sourceUrl),
}));

// 5.2 — sourcing_runs (un run = un déclenchement Tavily)
export const sourcingRuns = pgTable('sourcing_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  triggeredAt: timestamp('triggered_at', { withTimezone: true }).defaultNow().notNull(),
  triggeredBy: uuid('triggered_by').references(() => authUsers.id),
  queries: jsonb('queries').$type<string[]>().notNull(),
  status: text('status').$type<'RUNNING' | 'DONE' | 'FAILED'>().notNull(),
  resultsCount: integer('results_count').default(0),
  errorMessage: text('error_message'),
});

// 5.3 — leads (issus du lead_builder)
export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  discoveryId: uuid('discovery_id').references(() => webDiscoveries.id),
  companyName: text('company_name').notNull(), // normalisé
  companyNameOriginal: text('company_name_original'), // brut avant normalisation
  website: text('website'),
  pageUrl: text('page_url'),
  geography: text('geography').default('Île-de-France'),
  sector: text('sector'), // PE | MA | IB | TS
  track: text('track').$type<'PE' | 'MA'>().notNull(),
  targetRole: text('target_role'),
  personaName: text('persona_name'),
  personalizationFact: text('personalization_fact'),
  primarySignal: text('primary_signal'),
  confidenceScore: numeric('confidence_score', { precision: 5, scale: 2 }),
  reviewStatus: text('review_status').$type<'PENDING' | 'KEEP' | 'STOP' | 'CORRECT'>().default('PENDING'),
});

// 5.4 — sequence_tasks (table centrale du pilotage — équivalent maeva_sequence_tasks)
export const sequenceTasks = pgTable('sequence_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  sequenceUid: text('sequence_uid').notNull(), // clé technique unique (anti-collision)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  leadId: uuid('lead_id').references(() => leads.id),
  company: text('company').notNull(),
  track: text('track').$type<'PE' | 'MA'>().notNull(),
  contactName: text('contact_name'),
  title: text('title'),
  location: text('location'),
  source: text('source'),
  stepCode: text('step_code').$type<'STEP_0_EMAIL' | 'STEP_1_LINKEDIN' | 'STEP_2_FOLLOWUP_1_EMAIL' | 'STEP_3_FOLLOWUP_2_EMAIL'>().notNull(),
  plannedDate: date('planned_date').notNull(),
  channel: text('channel').$type<'EMAIL' | 'LINKEDIN'>().notNull(),
  messageSubject: text('message_subject'),
  messageBody: text('message_body'),
  status: text('status').$type<'PLANNED' | 'DONE' | 'POSTPONED' | 'CANCELLED' | 'STOPPED'>().default('PLANNED').notNull(),
  executionNote: text('execution_note'),
  executedAt: timestamp('executed_at', { withTimezone: true }),
  stopReason: text('stop_reason'),
}, (t) => ({
  uidUnique: uniqueIndex('sequence_tasks_uid_unique').on(t.sequenceUid),
  statusIdx: index('sequence_tasks_status_idx').on(t.status),
  plannedIdx: index('sequence_tasks_planned_idx').on(t.plannedDate),
  companyIdx: index('sequence_tasks_company_idx').on(t.company),
}));

// 5.5 — sequence_events (journal — équivalent maeva_sequence_events)
export const sequenceEvents = pgTable('sequence_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
  eventType: text('event_type').$type<EventType>().notNull(),
  taskId: uuid('task_id').references(() => sequenceTasks.id),
  actorId: uuid('actor_id').references(() => authUsers.id),
  payload: jsonb('payload').$type<Record<string, unknown>>(),
  note: text('note'),
}, (t) => ({
  typeIdx: index('sequence_events_type_idx').on(t.eventType),
  occurredIdx: index('sequence_events_occurred_idx').on(t.occurredAt),
}));

// EventType union
type EventType =
  | 'CALENDAR_IMPORTED'
  | 'SEQUENCE_STOPPED'
  | 'COMPANY_CORRECTED'
  | 'COMPANY_NORMALIZED'
  | 'MESSAGES_REGENERATED'
  | 'TASK_DONE'
  | 'TASK_POSTPONED'
  | 'TASK_CANCELLED'
  | 'REVIEW_DECISION_APPLIED'
  | 'AI_DAILY_BRIEF_GENERATED';

// 5.6 — review_decisions (file de revue humaine)
export const reviewDecisions = pgTable('review_decisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  source: text('source').notNull(),
  rawCompany: text('raw_company'),
  decision: text('decision').$type<'KEEP' | 'STOP' | 'CORRECT'>().notNull(),
  correctedCompany: text('corrected_company'),
  reason: text('reason'),
  appliedAt: timestamp('applied_at', { withTimezone: true }),
  appliedBy: uuid('applied_by').references(() => authUsers.id),
});

// 5.7 — company_aliases (mapping URL/domain → nom normalisé canonique)
export const companyAliases = pgTable('company_aliases', {
  id: uuid('id').primaryKey().defaultRandom(),
  domain: text('domain').notNull(),
  canonicalName: text('canonical_name').notNull(),
  track: text('track').$type<'PE' | 'MA'>(),
  notes: text('notes'),
}, (t) => ({
  domainUnique: uniqueIndex('company_aliases_domain_unique').on(t.domain),
}));
```

### Row Level Security (RLS)

- **Toutes les tables** : RLS activé.
- Politique par défaut : seul l'utilisateur authentifié `auth.uid()` peut lire/écrire. (App mono-utilisatrice MVP. Mais coder RLS dès P0 pour permettre une éventuelle équipe en v3.)

### Vues matérialisées

- `mv_pipeline_summary` : compteurs par statut (PLANNED / DONE / etc.) + par track — rafraîchie toutes les 5 min via pg_cron.
- `mv_daily_queue` : tâches du jour, triées par track et channel.

---

## 6. INFORMATION ARCHITECTURE

```
/                                  → Dashboard (vue exécutive)
/today                             → File du jour (mode exécution mobile)
/sourcing                          → Module Sourcing Web
/sourcing/runs/[id]                → Détail d'un run Tavily
/leads                             → Module Leads & Shortlist (table dense)
/leads/[id]                        → Fiche lead (drawer + page full)
/pipeline                          → Kanban des séquences
/messages                          → Bibliothèque de messages + éditeur
/messages/[taskId]                 → Éditeur de message + preview
/governance                        → Hub gouvernance
/governance/review                 → Review queue
/governance/normalize              → Outil de normalisation
/governance/quality-audit          → Rapport qualité
/journal                           → Audit trail (timeline + filtres)
/exports                           → Exports CSV/JSON + historique
/settings                          → Profil, intégrations, préférences
/copilot                           → Maeva Copilot (chat AI sur les données)
```

**Navigation primaire** : sidebar gauche rétractable + breadcrumb top.
**Navigation secondaire** : `Cmd+K` / `Ctrl+K` ouvre un **command palette** (cmdk) — accès à toute action en 2 frappes.

---

## 7. DESIGN SYSTEM — "Trading Desk Sobre"

### Identité

- **Dark mode par défaut**, light mode disponible.
- Palette :
  - `--bg-base` : `#0A0B0D` (noir presque pur, pas gris)
  - `--bg-surface` : `#111317`
  - `--bg-elevated` : `#16191F`
  - `--border-subtle` : `#1F232B`
  - `--text-primary` : `#E8EAED`
  - `--text-secondary` : `#9AA0A6`
  - `--accent-pe` : `#F5C518` (or institutionnel pour le track PE)
  - `--accent-ma` : `#5B8DEF` (bleu profond pour le track MA)
  - `--status-planned` : `#9AA0A6`
  - `--status-done` : `#4ADE80`
  - `--status-postponed` : `#FBBF24`
  - `--status-stopped` : `#71717A`
  - `--status-cancelled` : `#F87171`

### Typographie

- **Headings** : *Söhne* (ou *Inter Display* en fallback gratuit)
- **Body** : *Inter*
- **Mono** : *JetBrains Mono* (pour les IDs, URLs, code)
- Échelle : 12 / 13 / 14 / 16 / 20 / 24 / 32 (rythme tight)

### Densité

- **Dense par défaut** sur desktop. Tables avec lignes de 32 px.
- Sur mobile, passer en mode "carte" (1 tâche = 1 card).

### Micro-interactions

- Hover : `transition: 120ms ease-out`
- Tap mobile : feedback haptique via `navigator.vibrate(8)` (si dispo).
- États PLANNED → DONE : check qui se remplit en 200ms avec scale 0.95 → 1.

---

## 8. SPÉCIFICATIONS PAR MODULE

### 8.1 Dashboard — Vue exécutive

**Top-row KPI tiles (5)** :
1. Tâches actives (PLANNED)
2. Tâches du jour
3. Tâches en retard (planned_date < today AND status = PLANNED)
4. Taux d'exécution 7j (DONE / planned sur la fenêtre)
5. Sources arrêtées 30j

**Centre** :
- **Pipeline funnel** : Discoveries → Leads → Tasks Planned → Tasks Done
- **Daily Brief AI** : encart généré chaque matin à 7h via Vercel Cron + Claude (voir 8.7).

**Bas** :
- **Signal Feed** (idée originale) : flux temps réel de news PE/MA Île-de-France, scrappé via Tavily News, dédupliqué, scoré.
- **Recent activity** : 10 derniers events du journal.

### 8.2 Sourcing Web

- Bouton **"Lancer un run"** → modale avec :
  - Queries pré-remplies (éditables) : `private equity Paris`, `m&a advisory Île-de-France`, `mid-market fund France`, etc.
  - Profondeur Tavily (basic / advanced).
  - Limite résultats par query.
- **Liste des runs** : tableau dense avec statut, résultats, durée, déclencheur.
- **Drilldown run** : table des `web_discoveries` produites, filtrable par domain / page_type / score.
- Bouton **"Convertir en leads"** sur sélection multi → appelle le `lead_builder` (Server Action).

### 8.3 Leads & Shortlist

- **Table dense** (TanStack Table + virtualisation) avec colonnes :
  - Company / Track (PE/MA badge) / Target Role / Source / Confidence / Review Status / Actions
- **Filtres en haut** (sticky) : track, review_status, confidence range, geography.
- **Actions par ligne** : Voir détail / KEEP / STOP / CORRECT / Générer messages.
- **Bulk actions** : KEEP/STOP multi-sélection.
- **Export** : CSV (équivalent `maeva_pe_ma_shortlist.csv`).

### 8.4 Messages & Séquences

- **Éditeur de message** style "Linear" :
  - Pane gauche : liste des steps de la séquence (J+0 / J+3 / J+7 / J+14).
  - Pane centre : éditeur Markdown WYSIWYG (Tiptap) avec variables `{{company}}`, `{{persona_name}}`, `{{personalization_fact}}`.
  - Pane droit : **Preview live** rendu comme un vrai email / message LinkedIn (chrome inclus).
- **Bouton "Régénérer avec IA"** : ouvre un menu :
  - Ton : sobre / direct / personnalisé
  - Longueur : court / standard
  - Angle : transaction / portefeuille / équipe
- **Lint de qualité** (idée originale) : un linter live qui flag :
  - 🟡 message > 800 caractères
  - 🟡 absence de référence à la source publique
  - 🟡 absence de contexte Île-de-France
  - 🔴 contient encore un ancien titre de page (regex sur company_name_original)
  - 🔴 ton trop agressif (mots interdits configurables)

### 8.5 Pipeline & Pilotage

- **Vue Kanban** (drag & drop avec dnd-kit) :
  - Colonnes : PLANNED → DONE → POSTPONED → CANCELLED → STOPPED
  - Cartes : company / step_code / planned_date / track badge
- **Vue Calendrier** (toggle) : grille mensuelle avec tâches par jour.
- **Vue Liste** (toggle) : table dense.
- **Actions rapides** sur chaque carte (menu `...`) :
  - Marquer DONE (avec note rapide)
  - Reporter (date picker)
  - Annuler (avec raison)
  - **Stopper toute la séquence de cette company** (avec raison)
- **Conflict detection** (idée originale) : badge ⚠️ si une même persona est ciblée via deux tracks.

### 8.6 Gouvernance

- **Hub** avec 3 cartes : Review Queue / Normalize / Quality Audit.

#### Review Queue
- Table des décisions en attente, avec preview de la source (iframe lazy).
- Pour chaque ligne : trois boutons KEEP / STOP / CORRECT.
- CORRECT ouvre un combobox alimenté par `company_aliases` (autocomplétion).
- **Application en batch** : tu sélectionnes N lignes, tu cliques "Appliquer décisions" → Server Action qui :
  1. Met à jour `leads.reviewStatus` et `leads.companyName` si correction
  2. Crée des events `REVIEW_DECISION_APPLIED`
  3. Si STOP : passe les `sequence_tasks` correspondantes en `STOPPED` avec `stopReason`

#### Normalize
- Vue "domain → canonical name" éditable.
- Bouton "Auto-normalize" : parcourt les tâches actives, déduit le nom canonique depuis `company_aliases`, applique en transaction, journalise.

#### Quality Audit
- Rapport généré à la demande : pourcentage de tâches KEEP / STOP / REVIEW, top domaines suspects, sources à investiguer.

### 8.7 Maeva Copilot (innovation 2026)

**Chat AI sur les données** — implémenté avec **Vercel AI SDK + tool use**.

L'agent a accès à des **tools** :
- `getPipelineSummary()` → renvoie les KPI
- `listTasks({ filters })` → renvoie une page de tâches
- `getLead(id)` → détail
- `getEventsForCompany(name)` → historique
- `proposeAction({ taskId, action, reason })` → propose une action (validation manuelle Maeva)

Exemples de questions :
- *"Quelles sociétés n'ont eu aucune action depuis 5 jours ?"*
- *"Montre-moi les leads PE mid-market avec un confidence < 0.6"*
- *"Génère un brief des relances de demain"*
- *"Stoppe la séquence Bridgepoint, raison : déjà contactée par un ami"* → l'agent propose, Maeva confirme par un bouton.

**Streaming UI** : réponses streamées avec markdown rendu en temps réel.
**Persistance** : conversations sauvegardées (table `copilot_conversations`).

### 8.8 Daily Brief (innovation 2026)

Vercel Cron quotidien (07:00 Europe/Paris) → Edge Function :
1. Lit les tâches du jour, les retards, les events des dernières 24h, les news du Signal Feed.
2. Construit un prompt structuré envoyé à Claude (Sonnet 4.6 ou plus récent).
3. Génère un brief markdown :
   - "Bonjour Maeva. Aujourd'hui, **3 emails J+0, 2 relances LinkedIn, 4 follow-ups**."
   - "À noter : **Astorg** annoncé hier le closing de son fonds VIII (signal repéré). Pertinent pour ta séquence en cours."
   - "Alerte qualité : 2 tâches REVIEW non traitées depuis 7 jours."
4. Push notification (web push) + insertion dans le Dashboard.

### 8.9 Mobile Execution Mode (`/today`)

- Vue spécifiquement optimisée téléphone.
- Liste verticale des tâches du jour, triée par channel + heure suggérée.
- **Swipe right** = DONE / **Swipe left** = POSTPONE.
- **Long press** = ouvrir détail + voice note (capture audio → transcrit via Whisper API → stocké dans `executionNote`).
- PWA installable (manifest + service worker).

---

## 9. SERVER ACTIONS — CONVENTIONS

Toutes les mutations passent par des **Server Actions** typées + Zod.

```ts
// app/(app)/pipeline/_actions/mark-task-done.ts
'use server';

import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sequenceTasks, sequenceEvents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const schema = z.object({
  taskId: z.string().uuid(),
  note: z.string().max(500).optional(),
});

export async function markTaskDone(input: z.infer<typeof schema>) {
  const { user } = await auth();
  if (!user) throw new Error('UNAUTHENTICATED');

  const parsed = schema.parse(input);

  await db.transaction(async (tx) => {
    await tx
      .update(sequenceTasks)
      .set({ status: 'DONE', executedAt: new Date(), executionNote: parsed.note })
      .where(eq(sequenceTasks.id, parsed.taskId));

    await tx.insert(sequenceEvents).values({
      eventType: 'TASK_DONE',
      taskId: parsed.taskId,
      actorId: user.id,
      note: parsed.note,
    });
  });

  revalidatePath('/pipeline');
  revalidatePath('/today');
}
```

**Règles** :
- Toute mutation crée un `sequence_event` (audit trail).
- Toute mutation utilise une transaction si elle touche > 1 table.
- Pas d'API routes REST custom (sauf webhook entrant).

---

## 10. INTÉGRATIONS

### 10.1 Tavily

- SDK : `@tavily/core` (vérifier dernière version au moment du build).
- Wrapper côté serveur uniquement (clé en `process.env.TAVILY_API_KEY`).
- Rate limiting : token bucket en mémoire + retry exponentiel.

### 10.2 Anthropic Claude

- Pour génération messages, daily brief, copilot.
- Modèle par défaut : `claude-sonnet-4-7` (vérifier la version courante à la date du build).
- Streaming via Vercel AI SDK (`streamText`).

### 10.3 Email (Phase 2 — désactivé en P0)

- Resend pour envoi transactionnel.
- Webhook entrant pour tracking d'ouverture / réponse (Phase 3).

### 10.4 Web Push

- VAPID keys gérées via Supabase.
- Notifications : daily brief, tâches en retard, mentions copilot.

---

## 11. JOBS / CRON

| Job | Fréquence | Runtime |
|---|---|---|
| Daily Brief | 07:00 daily Europe/Paris | Edge |
| Refresh `mv_pipeline_summary` | Toutes les 5 min | Supabase pg_cron |
| Signal Feed update | Toutes les 30 min | Vercel Cron Node |
| Detect overdue tasks → notify | 09:00 + 17:00 | Edge |
| Nightly quality audit | 03:00 daily | Node |

---

## 12. FONCTIONNALITÉS ORIGINALES (le "wow factor")

| # | Feature | Pourquoi c'est ingénieux |
|---|---|---|
| 1 | **Cmd+K command palette** | Trader-grade UX, accès à tout en 2 frappes |
| 2 | **Maeva Copilot avec tool use** | Maeva *parle* à ses données — pas de tableau de bord à apprendre |
| 3 | **Daily Brief AI auto-généré** | Démarre la journée avec une intelligence éditoriale, pas une liste sèche |
| 4 | **Signal Feed temps réel** | Donne un contexte marché, pas seulement un CRM |
| 5 | **Linter de message live** | Évite les fautes d'amateur (titre de page resté dans l'objet) |
| 6 | **Voice notes Whisper sur mobile** | Permet d'enregistrer un retour de RDV dans la rue |
| 7 | **Conflict detection** | Évite les doubles approches (catastrophe en M&A) |
| 8 | **Source reliability scoring** | Le système *apprend* des décisions STOP/KEEP de Maeva |
| 9 | **Diff view du journal** | Chaque normalisation montre l'avant/après |
| 10 | **PWA + offline-first sur `/today`** | Maeva consulte sa file en métro sans réseau |
| 11 | **Audit trail timelinable** | Visualisation temporelle des décisions, pas une simple table |
| 12 | **Geo overlay Île-de-France** | Carte des deals avec clusters par arrondissement (modal optionnel) |
| 13 | **Anti-burnout pacing** | Cap configurable de N actions/jour, pour préserver la qualité |
| 14 | **A/B sur les openers** (phase 3) | Une fois l'envoi activé, tracker quel opener génère plus de réponses |
| 15 | **Browser extension companion** (phase 3) | Bouton "Ajouter à Maeva" sur LinkedIn / Pitchbook |

---

## 13. PHASES D'EXÉCUTION (pour Antigravity)

> **Exécute strictement dans l'ordre.** À la fin de chaque phase, lance les tests, fais un type-check (`tsc --noEmit`), et présente un récap à l'utilisateur AVANT de passer à la suivante.

### Phase 0 — Fondations (1 session)
- Init projet Next.js 15 + TS + Tailwind v4 + Biome + Vitest.
- Setup Supabase (local via CLI), Drizzle, migrations initiales (tables 5.1 à 5.7).
- Setup shadcn/ui base components.
- Setup auth Supabase magic link.
- RLS policies de base.
- **Acceptance** : login fonctionne, schema migré, page d'accueil affiche "Bienvenue Maeva".

### Phase 1 — Pipeline read-only
- Routes `/pipeline`, `/today`, `/journal`.
- Affichage Kanban + Liste + Calendrier.
- Lecture des `sequence_tasks` et `sequence_events`.
- Filtres, tri, recherche.
- **Acceptance** : Maeva voit toutes ses tâches sur 3 vues, peut filtrer par statut/track.

### Phase 2 — Pipeline interactif
- Server Actions : `markTaskDone`, `postponeTask`, `cancelTask`, `stopCompany`.
- Drag & drop Kanban.
- Swipe gestures mobile sur `/today`.
- Audit trail temps réel (Supabase Realtime).
- Cmd+K palette (actions principales).
- **Acceptance** : Maeva peut piloter sa file de A à Z. Chaque action laisse une trace.

### Phase 3 — Gouvernance
- Review queue, Normalize, Quality Audit.
- Application en batch des décisions.
- Régénération de messages avec noms normalisés.
- **Acceptance** : import des 100 tâches actives existantes via seed → Maeva peut nettoyer / corriger comme en CLI.

### Phase 4 — Génération AI
- Module Messages avec éditeur Tiptap.
- Génération via Claude (Server Action streaming).
- Linter de qualité live.
- Régénération en batch.
- **Acceptance** : Maeva peut générer/éditer un message en 30 secondes avec preview live.

### Phase 5 — Innovation
- Daily Brief AI cron.
- Maeva Copilot (chat + tool use).
- Signal Feed.
- Voice notes Whisper.
- PWA + push notifications.
- **Acceptance** : Maeva reçoit un brief chaque matin, peut converser avec ses données, et utilise l'app installée comme PWA.

---

## 14. QUALITY GATES (à chaque PR)

- ✅ `tsc --noEmit` passe (zéro erreur)
- ✅ `biome check` passe
- ✅ Tests Vitest passent
- ✅ Lighthouse mobile > 90 sur `/today` et `/`
- ✅ Aucune query Supabase sans index sur les colonnes filtrées
- ✅ Toute mutation est testée (au moins un happy path)
- ✅ Aucun secret en clair (vérification gitleaks)
- ✅ A11y : `eslint-plugin-jsx-a11y` zero error

---

## 15. ANTI-PATTERNS À ÉVITER

❌ Composants client par défaut — RSC d'abord, `'use client'` seulement si nécessaire (interaction / state local).
❌ `any` en TypeScript — utiliser `unknown` + narrow.
❌ Mutations sans Server Action (pas de `fetch('/api/...')` custom).
❌ State global Redux/Zustand — préférer URL state (nuqs) + RSC.
❌ Headings purement décoratifs — la sémantique compte (M&A = sérieux = a11y soignée).
❌ Animations gratuites (rotations, parallax, gradients animés) — design sobre, point final.
❌ Emojis dans l'UI métier (sauf statuts).
❌ "Loading..." brut — toujours des skeletons.
❌ Toasts pour les confirmations critiques — utiliser des `AlertDialog`.
❌ Pages > 200 lignes de JSX — découper en composants serveur + client.

---

## 16. STRUCTURE DE DOSSIERS

```
maeva-deal-radar/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (app)/
│   │   ├── layout.tsx              # Sidebar + breadcrumb + CmdK
│   │   ├── page.tsx                # Dashboard
│   │   ├── today/
│   │   ├── sourcing/
│   │   ├── leads/
│   │   ├── pipeline/
│   │   ├── messages/
│   │   ├── governance/
│   │   ├── journal/
│   │   ├── exports/
│   │   ├── copilot/
│   │   └── settings/
│   ├── api/
│   │   ├── cron/
│   │   │   ├── daily-brief/
│   │   │   ├── signal-feed/
│   │   │   └── overdue-tasks/
│   │   └── webhook/
│   │       └── resend/             # phase 2
│   └── globals.css
├── components/
│   ├── ui/                         # shadcn primitives
│   ├── pipeline/
│   ├── leads/
│   ├── messages/
│   ├── governance/
│   ├── copilot/
│   └── shared/
├── lib/
│   ├── db/
│   │   ├── schema.ts
│   │   ├── index.ts
│   │   └── queries/
│   ├── ai/
│   │   ├── anthropic.ts
│   │   ├── prompts/
│   │   └── tools/
│   ├── tavily/
│   ├── auth/
│   ├── events/                     # event bus + journal
│   └── utils/
├── drizzle/
│   └── migrations/
├── public/
│   ├── manifest.json
│   └── icons/
├── tests/
│   ├── unit/
│   └── e2e/
├── scripts/
│   ├── seed-from-csv.ts            # import des CSV v1
│   └── normalize-companies.ts
├── biome.json
├── drizzle.config.ts
├── next.config.ts
├── package.json
├── tailwind.config.css             # v4 CSS-first
├── tsconfig.json
└── vercel.json
```

---

## 17. MIGRATION DEPUIS LA V1 PYTHON

Un script `scripts/seed-from-csv.ts` doit ingérer :
- `exports/maeva_clean_sequence_queue.csv` → `sequence_tasks`
- `exports/maeva_pe_ma_shortlist.csv` → `leads`
- `exports/maeva_review_queue.csv` → `review_decisions`

Idempotent (basé sur `sequence_uid` et `source_url`).

**Avant de lancer le seed** : créer un export depuis la v1, le déposer dans `/seeds/v1/`.

---

## 18. VARIABLES D'ENVIRONNEMENT

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=                       # Drizzle (pooler 6543)
DIRECT_URL=                         # Migrations (5432)

# AI
ANTHROPIC_API_KEY=
OPENAI_API_KEY=                     # Whisper voice notes

# Sourcing
TAVILY_API_KEY=

# Email (phase 2)
RESEND_API_KEY=

# Push
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Observability
SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=

# App
NEXT_PUBLIC_APP_URL=
CRON_SECRET=                        # protège les routes /api/cron/*
```

---

## 19. CRITÈRES D'ACCEPTATION GLOBAUX

Au terme de la Phase 5, Maeva doit pouvoir :

1. Se logger en magic link en < 10 secondes.
2. Voir sa file du jour sur téléphone en 1 tap.
3. Marquer une tâche DONE en swipe + voice note transcrite.
4. Lancer un sourcing Tavily → obtenir 20 discoveries → en convertir 10 en leads en < 3 minutes.
5. Demander au Copilot "Quels leads PE mid-market à ne pas oublier ?" et recevoir une réponse streamée pertinente.
6. Recevoir son daily brief chaque matin à 07:00.
7. Voir le journal complet de chaque tâche avec les events horodatés.
8. Exporter le `clean_sequence_queue.csv` à tout moment.
9. Naviguer entièrement au clavier via Cmd+K.
10. Utiliser l'app offline sur mobile pour consulter `/today`.

---

## 20. INSTRUCTIONS FINALES POUR L'AGENT

1. **Lis ce document deux fois avant d'écrire la première ligne de code.**
2. **Produis un plan d'exécution** par phase avant de coder. Présente-le à l'utilisateur pour validation.
3. **Travaille petit, commit souvent.** Une PR par feature.
4. **Documente les décisions architecturales** dans `/docs/adr/NNNN-title.md` (Architecture Decision Records).
5. **Préfère la suppression à l'ajout.** Si une feature double-emploie, fusionne.
6. **Pose des questions** quand la spec est ambiguë — ne devine pas sur les sujets sensibles (M&A est un domaine où les fautes coûtent cher).
7. **Sécurité** : aucune clé serveur ne fuite côté client. Toute Server Action vérifie l'auth.
8. **Performance** : RSC d'abord. Streaming. Pas de hydration cliffs.
9. **Accessibilité** : navigable au clavier, contrastes AA minimum, labels explicites.
10. **Esthétique** : si tu hésites entre "sobre" et "élaboré", choisis sobre. Toujours.

---

**Fin du brief.** Bonne construction.

— *Document maintenu par Big Boss · Version 1.0 · {{date}}*
