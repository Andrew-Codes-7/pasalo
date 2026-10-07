"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackBar } from "@/components/BackBar";
import { Field, Pill, Select, SubmitBar, TextArea, TextInput } from "@/components/FormKit";
import { useApp } from "@/components/Providers";
import { ZONES } from "@/lib/data";
import { BULLETIN_KINDS } from "@/lib/communityData";
import { createBulletinPost } from "@/lib/community";
import type { BulletinRow } from "@/lib/supabase/types";

/**
 * Posting to the bulletin.
 *
 * Everything expires by default. A noticeboard where last March's water
 * outage is still pinned stops being worth reading, so the question is how
 * long a notice stays up rather than whether it comes down.
 */
export default function PostBulletinPage() {
  const { lang } = useApp();
  const router = useRouter();

  const [kind, setKind] = useState<BulletinRow["kind"]>("notice");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [zone, setZone] = useState("");
  const [expiry, setExpiry] = useState("7");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = Boolean(title.trim().length >= 3 && body.trim());
  const chosen = BULLETIN_KINDS.find((k) => k.id === kind);

  async function submit() {
    setError(null);
    if (!ready) return;
    setBusy(true);
    try {
      const result = await createBulletinPost({
        title,
        body,
        kind,
        zoneId: zone || null,
        expiresInDays: expiry === "never" ? null : Number(expiry),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/?submitted=1");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl pb-32">
      <BackBar title="Post to the bulletin" />

      <div className="space-y-7 px-4 pt-5">
        <Field label="What kind of post?" required>
          <div className="flex flex-wrap gap-2">
            {BULLETIN_KINDS.map((k) => (
              <Pill
                key={k.id}
                active={kind === k.id}
                onClick={() => setKind(k.id)}
                label={lang === "es" ? k.labelEs : k.label}
              />
            ))}
          </div>
          {chosen && (
            <p className="mt-2 text-[13px] text-content-faint">{chosen.hint}</p>
          )}
        </Field>

        <Field label="Headline" required>
          <TextInput
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Water off in Sardinal Thursday morning"
            aria-label="Headline"
          />
        </Field>

        <Field label="Details" required>
          <TextArea
            rows={6}
            value={body}
            maxLength={4000}
            onChange={(e) => setBody(e.target.value)}
            placeholder="AyA are working on the main line. Expect no water from about 7am until midday."
            aria-label="Details"
          />
        </Field>

        <Field label="Area" hint="Leave as the whole town if it affects everyone.">
          <Select
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            aria-label="Area"
          >
            <option value="">The whole town</option>
            {ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Take it down after"
          hint="Old notices clutter the board. Most things can go in a week."
        >
          <Select
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            aria-label="Expiry"
          >
            <option value="1">1 day</option>
            <option value="3">3 days</option>
            <option value="7">1 week</option>
            <option value="30">1 month</option>
            <option value="never">Leave it up</option>
          </Select>
        </Field>
      </div>

      <SubmitBar
        label="Post to the bulletin"
        busy={busy}
        disabled={!ready}
        error={error}
        onSubmit={submit}
      />
    </div>
  );
}
