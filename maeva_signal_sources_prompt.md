# FEATURE — Sources de signaux enrichies + Qualification sémantique des leads

> Priorité haute. Ces 4 intégrations transforment le Signal Feed
> de démo en outil d'intelligence marché réel.

---

## 0. RÈGLE ABSOLUE (rappel)

Zéro donnée fictive ou hardcodée sur des acteurs réels (LBO France,
Apax, etc.). Chaque item du Signal Feed doit avoir une source_url
vérifiable et une published_at réelle. Si une source échoue,
afficher un état vide — jamais de fallback inventé.

---

## 1. TABLE signal_feed (créer si absente)

```sql
CREATE TABLE signal_feed (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fetched_at    timestamptz NOT NULL DEFAULT now(),
  published_at  timestamptz,
  source        text NOT NULL,        -- 'BODACC' | 'RSS_BFM' | 'RSS_LEMONDE' | 'PAPPERS' | 'TAVILY'
  source_url    text,
  title         text NOT NULL,
  snippet       text,
  company_name  text,                 -- entité principale détectée
  signal_type   text,                 -- 'NOMINATION' | 'FUSION' | 'CESSION' | 'DEAL' | 'NEWS'
  relevance_score numeric(5,2),       -- 0.0 → 1.0, calculé par embedding
  tags          text[],               -- ['PE', 'MA', 'IDF', 'MID-CAP', ...]
  raw_json      jsonb,                -- payload brut de la source
  embedding     vector(1536),         -- pgvector pour recherche sémantique
  lead_id       uuid REFERENCES leads(id)  -- si rattaché à un lead connu
);

CREATE INDEX signal_feed_published_idx ON signal_feed (published_at DESC);
CREATE INDEX signal_feed_source_idx    ON signal_feed (source);
CREATE INDEX signal_feed_company_idx   ON signal_feed (company_name);
CREATE INDEX signal_feed_embedding_idx ON signal_feed
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

Activer l'extension pgvector dans Supabase :
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## 2. SOURCE 1 — BODACC (OpenData, gratuit, sans clé)

### Pourquoi c'est stratégique
BODACC publie les annonces légales AVANT la presse :
nominations de dirigeants, fusions, cessions, RCS, dépôts de comptes.
C'est la source la plus fiable et la plus rapide sur les mouvements PE/MA.

### API

Base URL : https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets

Datasets utiles :
- annonces-commerciales          → fusions, cessions, créations
- annonces-civiles-et-commerciales → procédures, nominations

Exemple de requête (Île-de-France, 30 derniers jours) :
```
GET https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records
  ?where=ville like "Paris" OR departement_code_insee in ("75","77","78","91","92","93","94","95")
  &order_by=dateparution DESC
  &limit=50
  &select=id,registre,ville,cp,typeavis,familleavis,numerodepartement,
           dateparution,tribunal,commercant,complementlegal
```

### Fichier à créer : lib/sources/bodacc.ts

```typescript
import { db } from '@/lib/db';
import { signalFeed } from '@/lib/db/schema';

const BODACC_BASE = 'https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets';

export async function fetchBodaccSignals() {
  const params = new URLSearchParams({
    where: `departement_code_insee in ("75","77","78","91","92","93","94","95")`,
    order_by: 'dateparution DESC',
    limit: '100',
    select: 'id,registre,commercant,typeavis,familleavis,dateparution,ville,complementlegal',
  });

  const res = await fetch(
    `${BODACC_BASE}/annonces-commerciales/records?${params}`,
    { next: { revalidate: 1800 } }  // cache 30 min
  );

  if (!res.ok) throw new Error(`BODACC fetch failed: ${res.status}`);
  const data = await res.json();

  const PE_MA_KEYWORDS = [
    'cession', 'fusion', 'acquisition', 'apport', 'scission',
    'capital', 'investissement', 'holding', 'fonds', 'transmission',
    'nomination', 'gérant', 'directeur', 'président',
  ];

  const relevant = data.results.filter((r: any) => {
    const text = [r.commercant, r.complementlegal, r.familleavis].join(' ').toLowerCase();
    return PE_MA_KEYWORDS.some(kw => text.includes(kw));
  });

  // Upsert en base (idempotent sur bodacc id)
  for (const r of relevant) {
    await db.insert(signalFeed).values({
      source: 'BODACC',
      source_url: `https://www.bodacc.fr/annonce/detail-annonce/A/${r.id}`,
      published_at: new Date(r.dateparution),
      title: `${r.familleavis} — ${r.commercant}`,
      snippet: r.complementlegal?.substring(0, 300),
      company_name: r.commercant,
      signal_type: mapBodaccType(r.familleavis),
      tags: detectTags(r),
      raw_json: r,
    }).onConflictDoNothing();
  }

  return relevant.length;
}

function mapBodaccType(familleavis: string): string {
  if (familleavis?.toLowerCase().includes('vente')) return 'CESSION';
  if (familleavis?.toLowerCase().includes('fusion')) return 'FUSION';
  if (familleavis?.toLowerCase().includes('nomination')) return 'NOMINATION';
  return 'NEWS';
}

function detectTags(r: any): string[] {
  const tags: string[] = ['BODACC', 'IDF'];
  const text = [r.commercant, r.complementlegal].join(' ').toLowerCase();
  if (text.includes('private equity') || text.includes('lbo') || text.includes('fonds')) tags.push('PE');
  if (text.includes('fusion') || text.includes('acquisition') || text.includes('cession')) tags.push('MA');
  return tags;
}
```

### Cron : toutes les 30 minutes
Route : app/api/cron/signal-bodacc/route.ts

---

## 3. SOURCE 2 — RSS BFM Business + Le Monde Économie

### Pourquoi c'est utile
Ces flux RSS donnent les deals annoncés le jour J, avec un niveau
de vérification éditorial. Moins précoce que BODACC mais plus narratif.

### Feeds RSS

BFM Business :
- https://www.bfmtv.com/rss/economie/
- https://www.bfmtv.com/rss/economie/entreprises/

Le Monde Économie :
- https://www.lemonde.fr/economie/rss_full.xml

### Package à installer
```bash
pnpm add fast-xml-parser
```

### Fichier : lib/sources/rss-feeds.ts

```typescript
import { XMLParser } from 'fast-xml-parser';
import { db } from '@/lib/db';
import { signalFeed } from '@/lib/db/schema';

const RSS_FEEDS = [
  { url: 'https://www.bfmtv.com/rss/economie/', source: 'RSS_BFM' },
  { url: 'https://www.bfmtv.com/rss/economie/entreprises/', source: 'RSS_BFM' },
  { url: 'https://www.lemonde.fr/economie/rss_full.xml', source: 'RSS_LEMONDE' },
];

const PE_MA_KEYWORDS = [
  'acquisition', 'cession', 'rachat', 'fusion', 'private equity',
  'fonds d\'investissement', 'lbo', 'capital-investissement', 'deal',
  'm&a', 'transaction', 'portefeuille', 'investissement', 'holding',
];

export async function fetchRssSignals() {
  const parser = new XMLParser({ ignoreAttributes: false });
  let count = 0;

  for (const feed of RSS_FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { 'User-Agent': 'MaevaDealRadar/2.0' },
        next: { revalidate: 3600 },
      });
      if (!res.ok) continue;

      const xml = await res.text();
      const parsed = parser.parse(xml);
      const items = parsed?.rss?.channel?.item ?? [];

      for (const item of (Array.isArray(items) ? items : [items])) {
        const text = [item.title, item.description].join(' ').toLowerCase();
        const isRelevant = PE_MA_KEYWORDS.some(kw => text.includes(kw));
        if (!isRelevant) continue;

        await db.insert(signalFeed).values({
          source: feed.source,
          source_url: item.link,
          published_at: item.pubDate ? new Date(item.pubDate) : new Date(),
          title: item.title,
          snippet: stripHtml(item.description ?? '').substring(0, 400),
          signal_type: 'NEWS',
          tags: [feed.source === 'RSS_BFM' ? 'BFM' : 'LEMONDE', 'FR'],
          raw_json: item,
        }).onConflictDoUpdate({
          target: [signalFeed.source_url],
          set: { fetched_at: new Date() },
        });

        count++;
      }
    } catch (err) {
      console.error(`RSS fetch failed for ${feed.url}:`, err);
    }
  }
  return count;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
```

### Cron : toutes les heures
Route : app/api/cron/signal-rss/route.ts

---

## 4. SOURCE 3 — Pappers (API payante, crédits requis)

### Pourquoi c'est stratégique
Pappers donne accès aux données légales enrichies via RCS/INSEE :
- Identité de la société (SIREN, SIRET, forme juridique)
- Dirigeants actuels et historiques (noms, rôles, dates de nomination)
- Capital social, chiffre d'affaires, effectifs
- Documents déposés (bilans, statuts, K-bis)
- Événements (modifications, radiations, procédures)

C'est le meilleur enrichissement lead disponible en France.

### Configuration

Ajouter dans .env.local :
```
PAPPERS_API_KEY=your_pappers_api_key
```

Docs API : https://www.pappers.fr/api/documentation

### Fichier : lib/sources/pappers.ts

```typescript
const PAPPERS_BASE = 'https://api.pappers.fr/v2';

export interface PappersCompany {
  siren: string;
  nom_entreprise: string;
  forme_juridique: string;
  capital: number;
  chiffre_affaires: number | null;
  effectif: string | null;
  siege: {
    adresse_ligne_1: string;
    code_postal: string;
    ville: string;
  };
  dirigeants: Array<{
    nom: string;
    prenom: string;
    qualite: string;
    date_prise_de_poste: string;
  }>;
  derniere_mise_a_jour: string;
}

export async function enrichLeadWithPappers(
  companyName: string
): Promise<PappersCompany | null> {
  const key = process.env.PAPPERS_API_KEY;
  if (!key) {
    console.warn('PAPPERS_API_KEY manquant — enrichissement désactivé');
    return null;
  }

  // 1. Recherche par nom
  const searchRes = await fetch(
    `${PAPPERS_BASE}/recherche?q=${encodeURIComponent(companyName)}&api_token=${key}&precision=standard`
  );
  if (!searchRes.ok) return null;
  const searchData = await searchRes.json();

  const topResult = searchData.resultats?.[0];
  if (!topResult?.siren) return null;

  // 2. Fiche complète par SIREN
  const detailRes = await fetch(
    `${PAPPERS_BASE}/entreprise?siren=${topResult.siren}&api_token=${key}&dirigeants=true&finances=true`
  );
  if (!detailRes.ok) return null;

  return await detailRes.json();
}

// Enrichissement en batch sur les leads KEEP sans siren
export async function enrichPendingLeads() {
  const leads = await db.query.leads.findMany({
    where: and(
      eq(leads.reviewStatus, 'KEEP'),
      isNull(leads.siren)
    ),
    limit: 10, // limiter pour préserver les crédits
  });

  for (const lead of leads) {
    const data = await enrichLeadWithPappers(lead.companyName);
    if (!data) continue;

    await db.update(leads).set({
      siren: data.siren,
      capitalSocial: data.capital,
      formeJuridique: data.forme_juridique,
      pappersData: data,  // stocke le JSON complet dans un champ jsonb
    }).where(eq(leads.id, lead.id));
  }
}
```

### Colonnes à ajouter sur la table leads

```sql
ALTER TABLE leads ADD COLUMN IF NOT EXISTS siren text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS capital_social integer;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS forme_juridique text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pappers_data jsonb;
```

### UI — Panneau Pappers sur la fiche lead (/leads/[id])

Afficher une section "Données légales (Pappers)" avec :
- SIREN cliquable → lien vers pappers.fr/entreprise/[siren]
- Capital social formaté (ex : "2 500 000 €")
- Dirigeants : liste avec nom, qualité, date de prise de poste
- Badge "Enrichi via Pappers" + date de dernière mise à jour
- Si PAPPERS_API_KEY absent ou crédits épuisés : banner amber
  "Enrichissement Pappers non disponible — vérifiez votre clé API"

### Bouton "Enrichir avec Pappers" sur Leads & Shortlist

Sur chaque ligne avec reviewStatus = KEEP :
Bouton secondaire "Enrichir" → appelle enrichLeadWithPappers(lead.id)
Loading state → résultat affiché inline dans la ligne.

---

## 5. RECHERCHE SÉMANTIQUE — Qualifier un lead

### Principe
Quand Maeva cherche "fonds mid-cap industriels Paris actifs en 2026",
la recherche sémantique retrouve les leads et signaux pertinents
même si les mots exacts ne matchent pas — via embeddings pgvector.

### Architecture

```
Input texte (query Maeva)
  → Génération embedding via OpenAI text-embedding-3-small
  → Requête pgvector cosine similarity sur signal_feed.embedding + leads.embedding
  → Résultats triés par score
  → Affichés dans le Copilot ET dans une barre de recherche globale
```

### Colonnes embeddings

```sql
-- Sur leads (si pas déjà fait)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS embedding vector(1536);
CREATE INDEX IF NOT EXISTS leads_embedding_idx
  ON leads USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
```

### Fichier : lib/ai/embeddings.ts

```typescript
import OpenAI from 'openai';
import { db } from '@/lib/db';
import { leads, signalFeed } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.substring(0, 8000), // limite de tokens
  });
  return res.data[0].embedding;
}

// Génère l'embedding d'un lead à partir de ses champs texte
export function leadToText(lead: typeof leads.$inferSelect): string {
  return [
    lead.companyName,
    lead.sector,
    lead.targetRole,
    lead.primarySignal,
    lead.personalizationFact,
    lead.geography,
  ].filter(Boolean).join(' — ');
}

// Recherche sémantique multi-table
export async function semanticSearch(query: string, limit = 10) {
  const queryEmbedding = await generateEmbedding(query);
  const vectorStr = JSON.stringify(queryEmbedding);

  const results = await db.execute(sql`
    SELECT
      'lead'       AS entity_type,
      id           AS entity_id,
      company_name AS title,
      primary_signal AS snippet,
      1 - (embedding <=> ${vectorStr}::vector) AS score
    FROM leads
    WHERE embedding IS NOT NULL
    UNION ALL
    SELECT
      'signal'     AS entity_type,
      id           AS entity_id,
      title        AS title,
      snippet      AS snippet,
      1 - (embedding <=> ${vectorStr}::vector) AS score
    FROM signal_feed
    WHERE embedding IS NOT NULL
    ORDER BY score DESC
    LIMIT ${limit}
  `);

  return results.rows;
}
```

### Fichier : lib/ai/qualify-lead.ts

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { enrichLeadWithPappers } from '@/lib/sources/pappers';

const anthropic = new Anthropic();

export async function qualifyLead(leadId: string) {
  // 1. Charge le lead + ses données Pappers si disponibles
  const lead = await db.query.leads.findFirst({
    where: eq(leads.id, leadId),
  });
  if (!lead) throw new Error('Lead not found');

  // 2. Enrichit avec Pappers si pas encore fait
  let pappersData = lead.pappersData;
  if (!pappersData && process.env.PAPPERS_API_KEY) {
    pappersData = await enrichLeadWithPappers(lead.companyName);
  }

  // 3. Cherche les signaux liés à cette société
  const signals = await db.query.signalFeed.findMany({
    where: like(signalFeed.companyName, `%${lead.companyName}%`),
    orderBy: [desc(signalFeed.publishedAt)],
    limit: 5,
  });

  // 4. Demande à Claude de qualifier
  const prompt = `
Tu es un analyste M&A expert du marché français.

Lead à qualifier :
- Société : ${lead.companyName}
- Track : ${lead.track}
- Signal principal : ${lead.primarySignal}
- Rôle cible : ${lead.targetRole}
- Source : ${lead.pageUrl}
- Confiance actuelle : ${lead.confidenceScore}

${pappersData ? `Données légales (Pappers) :
- Forme : ${pappersData.forme_juridique}
- Capital : ${pappersData.capital?.toLocaleString('fr-FR')} €
- Dirigeants : ${pappersData.dirigeants?.slice(0, 3).map(d => `${d.prenom} ${d.nom} (${d.qualite})`).join(', ')}` : ''}

${signals.length > 0 ? `Signaux récents détectés :
${signals.map(s => `- [${s.source}] ${s.title} (${s.publishedAt})`).join('\n')}` : ''}

Analyse en 3 parties (réponse JSON strict) :
{
  "qualification_score": 0.0 à 1.0,
  "synthese": "2-3 phrases sur la pertinence de ce lead pour Maeva",
  "signaux_positifs": ["liste des éléments favorables"],
  "signaux_negatifs": ["liste des points de vigilance"],
  "angle_recommande": "comment Maeva devrait aborder ce contact",
  "timing": "URGENT | NORMAL | ATTENDRE",
  "timing_raison": "pourquoi ce timing"
}
Réponds UNIQUEMENT en JSON valide, sans markdown.
`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  const qualification = JSON.parse(text);

  // 5. Sauvegarde la qualification
  await db.update(leads).set({
    confidenceScore: qualification.qualification_score,
    qualificationData: qualification,
    qualifiedAt: new Date(),
  }).where(eq(leads.id, leadId));

  return qualification;
}
```

### UI — Qualification dans la fiche lead

Bouton **"⚡ Qualifier ce lead"** :
- Loading state : "Analyse en cours..." (spinner)
- Résultat affiché dans un panneau :
  - Score de qualification (barre de progression colorée)
  - Synthèse (texte claude)
  - Signaux positifs (badges verts)
  - Signaux négatifs (badges rouge/amber)
  - Angle recommandé (encart bleu)
  - Timing badge : URGENT (rouge) | NORMAL (amber) | ATTENDRE (gris)

### UI — Barre de recherche globale sémantique

Dans le header (Cmd+K palette), ajouter un mode "Recherche sémantique" :
- Placeholder : "Chercher un lead ou un signal... ex: fonds mid-cap Paris actifs"
- Résultats en temps réel pendant la frappe (debounce 400ms)
- Groupés par type : Leads (badge bleu) / Signaux (badge or)
- Score affiché en % de pertinence
- Click → ouvre la fiche lead ou le signal

---

## 6. JOBS CRON — planning complet

| Route | Fréquence | Sources |
|---|---|---|
| /api/cron/signal-bodacc | Toutes les 30 min | BODACC |
| /api/cron/signal-rss | Toutes les heures | BFM + Le Monde |
| /api/cron/signal-tavily | Toutes les 2h | Tavily News |
| /api/cron/enrich-leads | Tous les jours 06h | Pappers (10 leads/run) |
| /api/cron/generate-embeddings | Toutes les heures | OpenAI embeddings |
| /api/cron/daily-brief | Tous les jours 07h | Synthèse multi-sources |

Vercel cron config dans vercel.json :
```json
{
  "crons": [
    { "path": "/api/cron/signal-bodacc", "schedule": "*/30 * * * *" },
    { "path": "/api/cron/signal-rss", "schedule": "0 * * * *" },
    { "path": "/api/cron/signal-tavily", "schedule": "0 */2 * * *" },
    { "path": "/api/cron/enrich-leads", "schedule": "0 6 * * *" },
    { "path": "/api/cron/generate-embeddings", "schedule": "0 * * * *" },
    { "path": "/api/cron/daily-brief", "schedule": "0 7 * * *" }
  ]
}
```

Toutes les routes cron doivent vérifier :
```typescript
if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

---

## 7. VARIABLES D'ENVIRONNEMENT à ajouter

```bash
PAPPERS_API_KEY=             # clé Pappers (crédits requis)
OPENAI_API_KEY=              # pour embeddings text-embedding-3-small
                             # (déjà utilisé pour Whisper voice notes)
```

---

## 8. AFFICHAGE Signal Feed — mise à jour UI

Chaque item du Signal Feed doit désormais afficher :
- Badge source coloré : BODACC (violet) | BFM (rouge) | LEMONDE (bleu) | TAVILY (or)
- Type de signal : NOMINATION | FUSION | CESSION | DEAL | NEWS
- Lien cliquable vers source_url (s'ouvre dans nouvel onglet)
- Timestamp relatif ("Il y a 2h", "Hier")
- Bouton "+ Ajouter comme lead" si company_name détecté
  → crée un lead pré-rempli depuis le signal

---

## 9. ACCEPTANCE CRITERIA

- [ ] BODACC : au moins 1 run réel retourne des annonces IDF
- [ ] RSS BFM : le feed retourne des articles réels avec URLs vérifiables
- [ ] Signal Feed : ZERO item avec source_url = example.com ou null
- [ ] Signal Feed : chaque item a un badge source et un lien cliquable
- [ ] Pappers : bouton "Enrichir" sur une lead KEEP → données légales affichées
- [ ] Pappers : si clé absente → banner amber (pas d'erreur silencieuse)
- [ ] Recherche sémantique : query "fonds mid-cap Paris" → résultats pertinents
- [ ] Qualifier lead : score + synthèse affichés en < 10 secondes
- [ ] Embeddings : générés automatiquement sur nouveaux leads/signaux
- [ ] Cron BODACC : vérifié via Vercel Dashboard logs
```
