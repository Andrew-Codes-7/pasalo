"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PendingQueue } from "@/lib/fetchPending";
import { moderate, type Kind } from "@/lib/moderation";
import { zoneById } from "@/lib/data";
import { serviceCategory } from "@/lib/communityData";
import { Icon } from "./Icon";

/**
 * The review queue.
 *
 * Deliberately shows the whole submission rather than a summary row — you are
 * deciding whether a neighbour's words go up in front of the town, and that is
 * not a decision to make from a truncated preview.
 */
export function ModerationQueue({ queue }: { queue: PendingQueue }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total =
    queue.services.length + queue.events.length + queue.bulletin.length;

  async function act(kind: Kind, id: string, approve: boolean) {
    setError(null);
    setBusy(id);
    try {
      const result = await moderate(kind, id, approve);
      if (!result.ok) {
        setError(result.error ?? "Could not save that.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (total === 0) {
    return (
      <div className="mt-6 rounded-card border border-dashed border-line-strong px-6 py-14 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent-on-soft">
          <Icon name="check" size={24} strokeWidth={2.4} />
        </span>
        <p className="mt-3 font-semibold text-content">Nothing waiting</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-content-muted">
          Submissions from neighbors show up here before anyone else sees them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-5">
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-danger-500/40 bg-danger-500/10 p-3 text-[13px] text-danger-500 dark:text-danger-400"
        >
          {error}
        </p>
      )}

      {queue.bulletin.map((b) => (
        <Card
          key={b.id}
          label="Bulletin"
          author={b.authorName}
          when={b.created_at}
          busy={busy === b.id}
          onApprove={() => act("bulletin_posts", b.id, true)}
          onReject={() => act("bulletin_posts", b.id, false)}
        >
          <h3 className="font-semibold text-content">{b.title}</h3>
          <p className="mt-1 whitespace-pre-line text-[14px] leading-relaxed text-content-muted">
            {b.body}
          </p>
          <p className="mt-2 text-[12px] text-content-faint">
            {b.kind} · {b.zone_id ? zoneById(b.zone_id).label : "whole town"}
          </p>
        </Card>
      ))}

      {queue.services.map((s) => (
        <Card
          key={s.id}
          label="Service"
          author={s.authorName}
          when={s.created_at}
          busy={busy === s.id}
          onApprove={() => act("services", s.id, true)}
          onReject={() => act("services", s.id, false)}
        >
          <h3 className="font-semibold text-content">{s.name}</h3>
          <p className="mt-0.5 text-[13px] text-content-muted">
            {serviceCategory(s.category_id).label}
            {s.provider_id ? " · listing their own service" : " · recommended by a neighbor"}
          </p>
          {s.description && (
            <p className="mt-2 text-[14px] leading-relaxed text-content-muted">
              {s.description}
            </p>
          )}
          <p className="mt-2 text-[12px] text-content-faint">
            {[s.rate_note, s.phone, s.whatsapp].filter(Boolean).join(" · ") ||
              "no contact details given"}
          </p>
        </Card>
      ))}

      {queue.events.map((e) => (
        <Card
          key={e.id}
          label="Meetup"
          author={e.authorName}
          when={e.created_at}
          busy={busy === e.id}
          onApprove={() => act("events", e.id, true)}
          onReject={() => act("events", e.id, false)}
        >
          <h3 className="font-semibold text-content">{e.title}</h3>
          <p className="mt-0.5 text-[13px] text-content-muted">
            {new Date(e.starts_at).toLocaleString()} · {zoneById(e.zone_id).label}
          </p>
          {e.location_note && (
            <p className="mt-1 text-[13px] text-content-muted">
              {e.location_note}
            </p>
          )}
          {e.description && (
            <p className="mt-2 text-[14px] leading-relaxed text-content-muted">
              {e.description}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}

function Card({
  label,
  author,
  when,
  busy,
  onApprove,
  onReject,
  children,
}: {
  label: string;
  author: string;
  when: string;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-card border border-line p-4">
      <div className="mb-2.5 flex items-center gap-2 text-[12px] text-content-muted">
        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-on-soft">
          {label}
        </span>
        <span>from {author}</span>
        <span className="ml-auto">
          {new Date(when).toLocaleDateString()}
        </span>
      </div>

      {children}

      <div className="mt-4 flex gap-2 border-t border-line pt-3">
        <button
          type="button"
          onClick={onReject}
          disabled={busy}
          className="flex-1 rounded-full border border-line py-2.5 text-sm font-semibold text-content-muted transition hover:bg-surface-2 disabled:opacity-40"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={onApprove}
          disabled={busy}
          className="flex-[2] rounded-full bg-btn py-2.5 text-sm font-semibold text-btn-fg transition hover:bg-btn-hover disabled:opacity-40"
        >
          {busy ? "…" : "Approve"}
        </button>
      </div>
    </article>
  );
}
