import type {
  GenerateMessageInput,
  MessageContext,
  MessageTone,
} from "./types";

const TONE_GUIDE: Record<MessageTone, string> = {
  sobre:
    "Ton institutionnel, factuel, sans superlatifs. Vouvoiement systématique.",
  direct:
    "Ton concis et professionnel, une proposition de valeur claire dès la première phrase.",
  personnalise:
    "Ton chaleureux mais expert, avec une accroche personnalisée basée sur le signal.",
};

export function buildGenerationPrompt(
  ctx: MessageContext,
  opts: GenerateMessageInput,
): string {
  const isEmail = ctx.channel === "EMAIL";
  const lengthGuide =
    opts.length === "court"
      ? "Maximum 120 mots pour le corps."
      : "Entre 150 et 220 mots pour le corps.";

  const angleGuide = {
    transaction: "Angle : mandats et transactions récentes en France.",
    portefeuille: "Angle : portefeuille, fonds, participations récentes.",
    equipe: "Angle : équipe, recrutements, organisation.",
  }[opts.angle];

  return `Tu rédiges un message de prospection M&A / PE pour Maeva, basée à Paris (Île-de-France).

Contexte cible :
- Société : ${ctx.company}
- Track : ${ctx.track}
- Contact : ${ctx.contactName ?? "non renseigné"} (${ctx.title ?? "rôle non renseigné"})
- Canal : ${ctx.channel} — étape ${ctx.stepCode}
- Source publique : ${ctx.source ?? "non renseignée"}
- Fait de personnalisation : ${ctx.personalizationFact ?? "à inventer de façon plausible et sobre"}
${ctx.companyNameOriginal ? `- Ancien titre à NE PAS reprendre : ${ctx.companyNameOriginal}` : ""}

Consignes :
- ${TONE_GUIDE[opts.tone]}
- ${lengthGuide}
- ${angleGuide}
- Mentionner explicitement l'Île-de-France ou Paris.
- Faire référence à la source ou au signal public si possible.
- Pas de mots agressifs (urgent, garanti, exclusif…).
- Français impeccable.

${isEmail ? "Format de réponse STRICT (JSON uniquement, sans markdown) :" : "Format de réponse STRICT (JSON uniquement) :"}
{"subject":${isEmail ? '"objet court"' : "null"}, "body": "corps du message avec sauts de ligne \\n"}

Variables déjà résolues dans le corps si tu les utilises : {{company}}, {{persona_name}}, {{personalization_fact}}.`;
}

export function mockGeneratedMessage(
  ctx: MessageContext,
  opts: GenerateMessageInput,
): { subject: string | null; body: string } {
  const persona = ctx.personaName ?? ctx.contactName ?? "Madame, Monsieur";
  const fact =
    ctx.personalizationFact ??
    "votre prise de parole récente sur le marché francilien";
  const sourceHint = ctx.source?.includes("http")
    ? " (signal repéré via votre site)"
    : ctx.source
      ? ` (via ${ctx.source})`
      : "";

  const short = opts.length === "court";
  const body = short
    ? `Bonjour ${persona},\n\nJe me permets de vous contacter au sujet de ${ctx.company}${sourceHint}. ${fact} — cela m'a semblé pertinent pour échanger sur les dynamiques mid-market en Île-de-France.\n\nSeriez-vous disponible pour un échange de 15 minutes ?\n\nCordialement,\nMaeva`
    : `Bonjour ${persona},\n\nJe me permets de vous écrire concernant ${ctx.company}${sourceHint}. En suivant l'actualité des fonds et conseils actifs sur Paris et l'Île-de-France, j'ai noté que ${fact}.\n\nJe travaille avec des équipes transaction et origination sur le segment mid-market francilien. Je serais ravie d'échanger sur vos priorités ${opts.angle === "portefeuille" ? "de portefeuille" : opts.angle === "equipe" ? "d'équipe et d'organisation" : "de mandats"} — sans engagement de votre part.\n\nÊtes-vous ouvert à un court appel cette semaine ou la suivante ?\n\nBien cordialement,\nMaeva`;

  const subject =
    ctx.channel === "EMAIL"
      ? `Échange mid-market Île-de-France — ${ctx.company}`
      : null;

  return { subject, body };
}
