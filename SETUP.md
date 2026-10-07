# Pasalo — going live

Plain-English steps. Do them in order. Anything marked **you** needs your own
login or password, so it has to be you.

---

## 0. Create the Supabase project (**you**, ~5 minutes)

On the "Create a new project" screen:

| Field | What to put | Why |
|---|---|---|
| **Organization** | Leave as-is | Your free org |
| **GitHub (optional)** | **Skip it** | For deploying schema changes from a repo. You don't have one yet, and we're pasting SQL by hand |
| **Project name** | `pasalo` | Just a label |
| **Database password** | Click **Generate a password**, then **save it immediately** | See the warning below |
| **Region** | Open the dropdown, pick **East US** | Closest to Costa Rica of the US options; this affects how fast the app feels |
| **Enable Data API** | **Leave checked** | The app talks to the database through this. Unchecking it breaks everything |
| **Automatically expose new tables** | **Leave checked** | See the note below |

**About the database password:** save it in a password manager the moment it's
generated. You'll rarely need it — the app uses a different key entirely — but
it cannot be recovered later, only reset. Don't paste it into a chat, including
to me. I never need it.

**About "Automatically expose new tables":** Supabase suggests turning this off
as a safety net, in case you ever create a table and forget to protect it.
`schema.sql` turns on Row Level Security for all twelve tables explicitly, so
that net isn't doing anything here — and switching it off would stop the app
from reading its own tables until extra permissions are added. Leave it on, and
use `supabase/verify.sql` (step 1b) to actually confirm nothing is exposed,
which is stronger than trusting a checkbox.

Then click **Create new project** and give it a couple of minutes to finish
setting up.

---

## 1. Create the database (**you**, ~5 minutes)

1. Open your Supabase project
2. Left sidebar → **SQL Editor** → **New query**
3. Open `supabase/schema.sql` from this folder, copy the whole thing, paste it in
4. Before running, scroll to the very bottom and change the five invite codes
   to something only you know
5. Click **Run**

You should see "Success. No rows returned." That's correct — it builds tables
rather than returning data.

**What you just created:** every table the app needs, plus the security rules.
The rules are the important part. Without them, anyone who opens the browser
console could read every private message in the community. With them, the
database itself refuses.

To check it worked: sidebar → **Table Editor**. You should see `profiles`,
`listings`, `messages`, and about eight others.

### 1b. Confirm it's actually locked down

Open a **New query**, paste in `supabase/verify.sql`, and run it. You'll get a
short list of results. **Every line should start with PASS.**

If any line says FAIL, tell me what it says and stop there — a FAIL means
something real is exposed. Run this again any time the database changes.

---

## 2. Connect the app to Supabase (**you**, ~3 minutes)

1. In Supabase: **Project Settings** → **API**
2. Copy the **Project URL** and the **`anon` / `public`** key
3. In this folder, make a copy of `.env.local.example` named `.env.local`
4. Paste your two values in, replacing the placeholders

```bash
cp ~/Desktop/pasalo/.env.local.example ~/Desktop/pasalo/.env.local
```

Then open `.env.local` in a text editor and fill it in.

**About that key:** the `anon` key is designed to be public — it ships inside
every visitor's browser. It's safe because Row Level Security decides what it
can actually see. The **`service_role`** key is the opposite: it bypasses every
rule. Never put it in this file, never paste it into a chat, never commit it.

---

## 3. Turn on email confirmation (**you**, ~5 minutes)

1. Supabase → **Authentication** → **Providers** → **Email**
2. Make sure **Confirm email** is ON
3. Go to **Authentication** → **Emails** → **SMTP Settings**
4. Enter your Resend SMTP details

**Why this matters:** Supabase's built-in email sender is rate-limited to a
handful of messages per hour and is explicitly not for production. Without
Resend connected, signups will silently stop working once more than a couple
of people join in a day.

---

## 4. Everything else is mine

Once steps 1–3 are done I wire the app to the real database: signup, login,
listings, photo uploads, messaging, offers, reviews.

---

## 5. Before you tell anyone about it

- [ ] Security review of the whole app
- [ ] Sign up as a test neighbor and confirm you cannot see another account's
      messages
- [ ] Confirm karma cannot be edited from the browser
- [ ] Invite five people you know, not fifty

---

## How the security model works, briefly

Three rules do most of the work:

**Messages are readable only by the two people in the conversation.** Enforced
by the database, not the app.

**Karma and ratings are calculated by the database.** The columns are
write-protected by a trigger; only internal functions can change them. If the
app could write them, anyone could set their own score.

**Reviews require a completed exchange.** You can only review someone after
both of you confirmed a trade. This is what stops fake review farming.

---

## Invite codes

The app is invite-only. Codes live in the `invites` table and each works once.

To add more: Supabase → **Table Editor** → `invites` → **Insert row**, and put
your new code in the `code` column. Leave everything else blank.
