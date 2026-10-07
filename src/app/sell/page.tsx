"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { CATEGORIES, ZONES } from "@/lib/data";
import { BackBar } from "@/components/BackBar";
import { Icon } from "@/components/Icon";
import { useApp } from "@/components/Providers";
import type { StringKey } from "@/lib/i18n";
import type { ListingCondition } from "@/lib/supabase/types";
import { deleteListingPhoto, uploadListingPhoto } from "@/lib/uploadPhoto";
import { createListing } from "@/lib/listings";
import { useRouter } from "next/navigation";

const CONDITIONS: { id: ListingCondition; key: StringKey }[] = [
  { id: "new", key: "condNew" },
  { id: "like-new", key: "condLikeNew" },
  { id: "good", key: "condGood" },
  { id: "fair", key: "condFair" },
  { id: "for-parts", key: "condForParts" },
];

/**
 * Posting flow. Deliberately one scrolling page rather than a wizard — the
 * form is short enough, and a multi-step flow is where casual give-aways get
 * abandoned.
 */
export default function SellPage() {
  const { t, lang } = useApp();
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState<ListingCondition>("good");
  const [zone, setZone] = useState(ZONES[0].id);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();
  type Photo = { path: string; url: string; accent: string };
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setPhotoError(null);
    setUploading(true);
    try {
      // Sequential rather than parallel: on Costa Rican mobile data, six
      // simultaneous uploads all crawl and any one failing is harder to report.
      for (const file of Array.from(files).slice(0, 8 - photos.length)) {
        const result = await uploadListingPhoto(file);
        if (!result.ok) {
          setPhotoError(result.error);
          break;
        }
        setPhotos((ps) => [
          ...ps,
          { path: result.path, url: result.publicUrl, accent: result.accent },
        ]);
      }
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  async function handlePost() {
    setPostError(null);
    if (!canPost) return;
    setPosting(true);
    try {
      const result = await createListing({
        title,
        description,
        priceUsd: isFree ? null : Number(price),
        categoryId: category,
        zoneId: zone,
        condition,
        // Tint for the browse card, sampled from the cover photo.
        accent: photos[0]?.accent ?? "#4a5560",
        photoPaths: photos.map((p) => p.path),
      });

      if (!result.ok) {
        setPostError(result.error);
        return;
      }
      // Straight to the finished listing so it is obvious it worked.
      router.push(`/listing/${result.id}`);
      router.refresh();
    } catch (e) {
      setPostError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setPosting(false);
    }
  }

  async function removePhoto(path: string) {
    setPhotos((ps) => ps.filter((p) => p.path !== path));
    await deleteListingPhoto(path);
  }

  const canPost = Boolean(
    title.trim() && category && photos.length > 0 && (isFree || price),
  );

  return (
    <div className="mx-auto w-full max-w-2xl pb-32">
      <BackBar title={t("postAnItem")} />

      <div className="space-y-7 px-4 pt-5">
        <Field label={t("photos")} hint={t("photosHint")} required>
          <div className="grid grid-cols-4 gap-2">
            {photos.map((photo, i) => (
              <div
                key={photo.path}
                className="relative aspect-square overflow-hidden rounded-xl bg-surface-2"
              >
                <Image
                  src={photo.url}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-cover"
                  unoptimized
                />
                {i === 0 && (
                  <span className="absolute inset-x-1 bottom-1 rounded-md bg-black/70 py-0.5 text-center text-[10px] font-semibold text-white">
                    {t("cover")}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(photo.path)}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white"
                >
                  <Icon name="plus" size={12} className="rotate-45" />
                </button>
              </div>
            ))}

            {photos.length < 8 && (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-line-strong text-content-faint transition hover:border-brand-500 hover:text-brand-600 disabled:opacity-50"
              >
                <span className="text-center">
                  <Icon name="camera" size={22} className="mx-auto" />
                  <span className="mt-1 block text-[11px] font-medium">
                    {uploading ? "…" : t("add")}
                  </span>
                </span>
              </button>
            )}
          </div>

          {/* The button above is what people see; this is the real control. */}
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {photoError && (
            <p role="alert" className="mt-2 text-[13px] text-danger-500 dark:text-danger-400">
              {photoError}
            </p>
          )}
        </Field>

        <Field label={t("price")} required>
          <div className="flex gap-2">
            <ModeCard
              active={isFree}
              onClick={() => setIsFree(true)}
              icon="gift"
              title={t("giveAwayOption")}
              sub={t("freePlusKarma")}
            />
            <ModeCard
              active={!isFree}
              onClick={() => setIsFree(false)}
              icon="spark"
              title={t("setAPrice")}
              sub={t("offersAllowed")}
            />
          </div>

          {!isFree && (
            <div className="relative mt-3">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-content-faint">
                $
              </span>
              <input
                type="number"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                aria-label={t("price")}
                className="w-full rounded-2xl border border-line bg-surface-2 py-3.5 pl-9 pr-4 text-lg font-semibold text-content focus:border-brand-500 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand-500/12"
              />
            </div>
          )}
        </Field>

        <Field label={t("whatIsIt")} required>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={70}
            placeholder={t("titlePlaceholder")}
            aria-label={t("whatIsIt")}
            className="w-full rounded-2xl border border-line bg-surface-2 px-4 py-3.5 text-[15px] text-content placeholder:text-content-faint focus:border-brand-500 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand-500/12"
          />
          <p className="mt-1.5 text-right text-[12px] text-content-faint">
            {title.length}/70
          </p>
        </Field>

        <Field label={t("category")} required>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter((c) => c.id !== "free").map((c) => (
              <Pill
                key={c.id}
                active={category === c.id}
                onClick={() => setCategory(c.id)}
                label={lang === "es" ? c.labelEs : c.label}
              />
            ))}
          </div>
        </Field>

        <Field label={t("condition")}>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <Pill
                key={c.id}
                active={condition === c.id}
                onClick={() => setCondition(c.id)}
                label={t(c.key)}
              />
            ))}
          </div>
        </Field>

        <Field label={t("pickupArea")} hint={t("pickupAreaHint")}>
          <select
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            aria-label={t("pickupArea")}
            className="w-full appearance-none rounded-2xl border border-line bg-surface-2 px-4 py-3.5 text-[15px] text-content focus:border-brand-500 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand-500/12"
          >
            {ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t("description")} hint={t("descriptionHint")}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder={t("descriptionPlaceholder")}
            aria-label={t("description")}
            className="w-full resize-none rounded-2xl border border-line bg-surface-2 px-4 py-3.5 text-[15px] leading-relaxed text-content placeholder:text-content-faint focus:border-brand-500 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand-500/12"
          />
        </Field>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl">
          {postError && (
            <p
              role="alert"
              className="mb-2.5 rounded-xl border border-danger-500/40 bg-danger-500/10 p-2.5 text-[13px] leading-snug text-danger-500 dark:text-danger-400"
            >
              {postError}
            </p>
          )}
          <button
            type="button"
            onClick={handlePost}
            disabled={!canPost || posting}
            className="w-full rounded-full bg-btn py-3.5 text-[15px] font-semibold text-btn-fg transition hover:bg-btn-hover disabled:opacity-35"
          >
            {posting ? "…" : isFree ? t("postGiveaway") : t("postForSale")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[15px] font-semibold text-content">
        {label}
        {required && <span className="ml-1 text-brand-600">*</span>}
      </p>
      {hint && <p className="mt-0.5 text-[13px] text-content-muted">{hint}</p>}
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

function ModeCard({
  active,
  onClick,
  icon,
  title,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: "gift" | "spark";
  title: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "flex-1 rounded-2xl border-2 p-3.5 text-left transition",
        active
          ? "border-brand-500 bg-accent-soft"
          : "border-line hover:border-line-strong",
      ].join(" ")}
    >
      <Icon
        name={icon}
        size={18}
        className={active ? "text-brand-600 dark:text-brand-400" : "text-content-faint"}
      />
      <span className="mt-1.5 block text-sm font-semibold text-content">
        {title}
      </span>
      <span className="block text-[12px] text-content-muted">{sub}</span>
    </button>
  );
}

function Pill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "rounded-full border px-3.5 py-2 text-sm font-medium transition",
        active
          ? "border-transparent bg-btn text-btn-fg"
          : "border-line text-content-muted hover:border-line-strong hover:text-content",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
