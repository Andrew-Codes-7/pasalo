"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { BackBar } from "@/components/BackBar";
import { Field, Pill, Select, SubmitBar, TextArea, TextInput } from "@/components/FormKit";
import { Icon } from "@/components/Icon";
import { useApp } from "@/components/Providers";
import { useSession } from "@/lib/useSession";
import { ZONES } from "@/lib/data";
import { EVENT_KINDS } from "@/lib/communityData";
import { createEvent } from "@/lib/community";
import type { EventRow } from "@/lib/supabase/types";

/**
 * Hosting a meetup.
 *
 * Gated on karma by the database, not just hidden here — a locked screen that
 * still lets the request through would be theatre. This checks first only so
 * the refusal is explained rather than arriving as a database error.
 */
export default function HostMeetupPage() {
  const { lang } = useApp();
  const router = useRouter();
  const { profile, loading } = useSession();

  const [kind, setKind] = useState<EventRow["kind"]>("swap");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [zone, setZone] = useState(ZONES[0].id);
  const [locationNote, setLocationNote] = useState("");
  const [capacity, setCapacity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const karma = profile?.karma ?? 0;
  const canHost = Boolean(profile?.is_moderator || karma >= 200);
  const ready = Boolean(title.trim().length >= 3 && startsAt && zone);

  async function submit() {
    setError(null);
    if (!ready) return;
    setBusy(true);
    try {
      const result = await createEvent({
        title,
        description,
        kind,
        startsAt,
        zoneId: zone,
        locationNote,
        capacity: capacity ? Number(capacity) : null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/meetups?submitted=1");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (!loading && !canHost) {
    return (
      <div className="mx-auto w-full max-w-md px-4 pb-16">
        <BackBar title="Host a meetup" />
        <div className="mt-8 rounded-card border border-line p-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface-2 text-content-faint">
            <Icon name="shield" size={26} />
          </span>
          <h1 className="mt-4 text-lg font-bold text-content">
            Hosting unlocks at 200 karma
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-content-muted">
            You have {karma}. Organising brings people to a real place at a real
            time, so it&apos;s earned by contributing first — giving something
            away is worth 25.
          </p>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${Math.min(100, (karma / 200) * 100)}%` }}
            />
          </div>
          <Link
            href="/sell"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-btn px-5 py-2.5 text-sm font-semibold text-btn-fg transition hover:bg-btn-hover"
          >
            <Icon name="gift" size={16} />
            Give something away
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl pb-32">
      <BackBar title="Host a meetup" />

      <div className="space-y-7 px-4 pt-5">
        <Field label="What kind?" required>
          <div className="flex flex-wrap gap-2">
            {EVENT_KINDS.map((k) => (
              <Pill
                key={k.id}
                active={kind === k.id}
                onClick={() => setKind(k.id)}
                label={lang === "es" ? k.labelEs : k.label}
              />
            ))}
          </div>
        </Field>

        <Field label="Name it" required>
          <TextInput
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Saturday swap day at the park"
            aria-label="Title"
          />
        </Field>

        <Field label="When" required>
          <TextInput
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            aria-label="Date and time"
          />
        </Field>

        <Field label="Area" required>
          <Select
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            aria-label="Area"
          >
            {ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Where exactly"
          hint="A meeting point in words — the app never publishes an address."
        >
          <TextInput
            value={locationNote}
            maxLength={200}
            onChange={(e) => setLocationNote(e.target.value)}
            placeholder="By the basketball court, Centro park"
            aria-label="Meeting point"
          />
        </Field>

        <Field label="What to expect">
          <TextArea
            rows={5}
            value={description}
            maxLength={4000}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Bring anything you're giving away. Coffee provided. Rain cancels."
            aria-label="Description"
          />
        </Field>

        <Field label="Limit numbers?" hint="Leave blank for no limit.">
          <TextInput
            type="number"
            inputMode="numeric"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="No limit"
            aria-label="Capacity"
          />
        </Field>
      </div>

      <SubmitBar
        label="Create meetup"
        busy={busy}
        disabled={!ready}
        error={error}
        onSubmit={submit}
      />
    </div>
  );
}
