# Pasalo

*Dalo. Encontralo. Pasalo.*

A community marketplace for Playas del Coco and the towns around it. Neighbors
give away, find, and trade things. Free listings first; paid listings later.

Invite-only while the community is small.

---

## Running it locally

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

The dev server only serves your own machine. The live site runs on Netlify and
is unaffected by whether this is running.

## Setting it up for real

See **[SETUP.md](SETUP.md)** — creating the Supabase project, running the
database schema, and connecting email.

## What's where

| Path | What it holds |
|---|---|
| `src/app/` | Screens (browse, listing, profile, messages, sell, signup) |
| `src/components/` | Shared pieces — cards, header, logo, providers |
| `src/lib/data.ts` | **Sample data.** Replaced by real queries once Supabase is wired |
| `src/lib/i18n.ts` | All interface text, English and Spanish |
| `supabase/schema.sql` | Tables, security rules, karma and review logic |
| `supabase/verify.sql` | Security check — run it after any database change |
| `public/samples/` | Placeholder listing photos. Deleted once real uploads work |

## Design decisions worth knowing

**Two greens, on purpose.** The logo green (`#0ebf6b`) is too light to carry
white text — about 2.9:1 contrast, well under the 4.5:1 minimum. So it stays
the identity colour (logo, icons, highlights) while filled buttons use a deeper
green in light mode. Dark mode flips: the bright green comes forward with dark
text on it, which is both readable and closer to how the logo actually looks.

**No map.** In a town plus ten miles, place names beat pins — and a pin on a
listing tells strangers where the valuables are. Location is stored as a zone
id, so a map can be added later without a rewrite.

**Karma rewards giving, not buying.** Giving something away is worth 25 points
against 5 for a plain listing. That ratio is the whole incentive design.

**The database enforces the rules, not the app.** Anyone can open a browser
console and issue their own queries, so "the app only shows you your messages"
is not security. See `supabase/schema.sql`.

## Status

Interface complete. Backend in progress — nothing persists yet.
