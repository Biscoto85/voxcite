import { Router } from 'express';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { civicEvents, eventProposals, newsletterSubscriptions } from '../db/schema.js';

export const mobiliserRouter = Router();

// ── Validation helpers ───────────────────────────────────────────────

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const UUID_RE  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_CATEGORIES = ['petition', 'atelier', 'rencontre', 'formation', 'manifestation', 'autre'];
const VALID_DOMAINS    = ['democratie', 'environnement', 'economie', 'sante', 'education', 'numerique', 'international', 'securite'];

function sanitizeText(s: unknown, maxLen: number): string {
  if (typeof s !== 'string') return '';
  return s.trim().slice(0, maxLen);
}

// ── GET /events — liste des événements actifs ────────────────────────

mobiliserRouter.get('/events', async (_req, res) => {
  try {
    const events = await db
      .select()
      .from(civicEvents)
      .where(eq(civicEvents.isActive, true))
      .orderBy(desc(civicEvents.createdAt))
      .limit(20);
    res.json(events);
  } catch (err) {
    console.error('[mobiliser] GET /events error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /events/propose — proposer un événement ─────────────────────
// Rate limited upstream (general rateLimit — 500 req/15 min/IP is sufficient here)

mobiliserRouter.post('/events/propose', async (req, res) => {
  const {
    title, description, url, eventDate, location,
    organizer, category, proposerEmail, nonPartisanAcknowledged,
  } = req.body as Record<string, unknown>;

  const titleClean       = sanitizeText(title, 120);
  const descriptionClean = sanitizeText(description, 1000);
  const urlClean         = sanitizeText(url, 500);
  const locationClean    = sanitizeText(location, 200);
  const organizerClean   = sanitizeText(organizer, 200);
  const categoryClean    = sanitizeText(category, 30);

  if (!titleClean)       { res.status(400).json({ error: 'Titre requis' }); return; }
  if (!descriptionClean) { res.status(400).json({ error: 'Description requise' }); return; }
  if (!organizerClean)   { res.status(400).json({ error: 'Organisateur requis' }); return; }
  if (!VALID_CATEGORIES.includes(categoryClean)) {
    res.status(400).json({ error: 'Catégorie invalide' }); return;
  }
  if (!nonPartisanAcknowledged) {
    res.status(400).json({ error: 'Tu dois confirmer le caractère non-partisan de l\'initiative' }); return;
  }

  let parsedDate: Date | null = null;
  if (eventDate && typeof eventDate === 'string') {
    const d = new Date(eventDate);
    if (!isNaN(d.getTime())) parsedDate = d;
  }

  let cleanEmail: string | null = null;
  if (proposerEmail && typeof proposerEmail === 'string') {
    const e = proposerEmail.trim().toLowerCase();
    if (EMAIL_RE.test(e)) cleanEmail = e;
  }

  await db.insert(eventProposals).values({
    title: titleClean,
    description: descriptionClean,
    url: urlClean || null,
    eventDate: parsedDate,
    location: locationClean || null,
    organizer: organizerClean,
    category: categoryClean,
    proposerEmail: cleanEmail,
    nonPartisanAcknowledged: true,
    status: 'pending',
  });

  res.status(201).json({ ok: true });
});

// ── POST /newsletter/subscribe ────────────────────────────────────────
// RGPD : consentement explicite obligatoire (géré côté client via checkbox)

mobiliserRouter.post('/newsletter/subscribe', async (req, res) => {
  const { email, domains, consentGiven } = req.body as Record<string, unknown>;

  if (!consentGiven) {
    res.status(400).json({ error: 'Le consentement est obligatoire' }); return;
  }

  const emailClean = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(emailClean)) {
    res.status(400).json({ error: 'Adresse email invalide' }); return;
  }

  // Validate domains array
  const domainsClean: string[] = [];
  if (Array.isArray(domains)) {
    for (const d of domains) {
      if (typeof d === 'string' && VALID_DOMAINS.includes(d)) domainsClean.push(d);
    }
  }

  try {
    // Upsert: réactiver si déjà inscrit
    await db.execute(sql`
      INSERT INTO newsletter_subscriptions (email, domains, is_active)
      VALUES (${emailClean}, ${JSON.stringify(domainsClean)}::jsonb, true)
      ON CONFLICT (email) DO UPDATE
      SET is_active = true,
          domains   = ${JSON.stringify(domainsClean)}::jsonb
    `);

    // Retrieve the unsubscribe token to return it (for display or email confirmation)
    const [row] = await db
      .select({ token: newsletterSubscriptions.unsubscribeToken })
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.email, emailClean));

    res.status(201).json({ ok: true, unsubscribeToken: row?.token });
  } catch (err) {
    console.error('[mobiliser] newsletter/subscribe error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /newsletter/unsubscribe/:token ───────────────────────────────
// GET (pas DELETE) pour fonctionner depuis un lien email cliquable.

mobiliserRouter.get('/newsletter/unsubscribe/:token', async (req, res) => {
  const { token } = req.params;

  if (!UUID_RE.test(token)) {
    res.status(400).json({ error: 'Lien invalide' }); return;
  }

  const result = await db
    .update(newsletterSubscriptions)
    .set({ isActive: false })
    .where(
      and(
        eq(newsletterSubscriptions.unsubscribeToken, token as `${string}-${string}-${string}-${string}-${string}`),
        eq(newsletterSubscriptions.isActive, true),
      ),
    )
    .returning({ id: newsletterSubscriptions.id });

  if (result.length === 0) {
    // Already unsubscribed or token not found — silently OK
    res.status(200).json({ ok: true, alreadyUnsubscribed: true });
    return;
  }

  res.status(200).json({ ok: true });
});
