"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackBar } from "@/components/BackBar";
import { Field, Pill, SubmitBar, TextArea, TextInput } from "@/components/FormKit";
import { useApp } from "@/components/Providers";
import { ZONES } from "@/lib/data";
import { SERVICE_CATEGORIES } from "@/lib/communityData";
import { createService } from "@/lib/community";

/**
 * Adding a service.
 *
 * The "is this you?" question matters more than it looks: the directory is
 * meant to be seeded with providers who have never heard of this app, so
 * listing someone must not claim to *be* them. An entry added on someone's
 * behalf stays unclaimed until they join and take it over.
 */
export default function AddServicePage() {
  const { lang } = useApp();
  const router = useRouter();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [rateNote, setRateNote] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [zones, setZones] = useState<string[]>([]);
  const [isMine, setIsMine] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = Boolean(name.trim() && category && isMine !== null);

  function toggleZone(id: string) {
    setZones((z) => (z.includes(id) ? z.filter((x) => x !== id) : [...z, id]));
  }

  async function submit() {
    setError(null);
    if (!ready) return;
    setBusy(true);
    try {
      const result = await createService({
        name,
        categoryId: category,
        description,
        rateNote,
        phone,
        whatsapp,
        zones,
        isMine: isMine === true,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/services?submitted=1");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl pb-32">
      <BackBar title="Add a service" />

      <div className="space-y-7 px-4 pt-5">
        <Field
          label="Is this your own service?"
          hint="You can list someone else — a good electrician, your favourite taxi driver. They can claim it later."
          required
        >
          <div className="flex gap-2">
            <Pill active={isMine === true} onClick={() => setIsMine(true)} label="It's mine" />
            <Pill
              active={isMine === false}
              onClick={() => setIsMine(false)}
              label="Someone I recommend"
            />
          </div>
        </Field>

        <Field label="Name" hint="The person or business people would ask for." required>
          <TextInput
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jorge — AC repair"
            aria-label="Name"
          />
        </Field>

        <Field label="Category" required>
          <div className="flex flex-wrap gap-2">
            {SERVICE_CATEGORIES.map((c) => (
              <Pill
                key={c.id}
                active={category === c.id}
                onClick={() => setCategory(c.id)}
                label={lang === "es" ? c.labelEs : c.label}
              />
            ))}
          </div>
        </Field>

        <Field label="What they do" hint="A sentence or two is plenty.">
          <TextArea
            rows={4}
            value={description}
            maxLength={2000}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Fixed our AC same day, fair price, speaks English and Spanish."
            aria-label="Description"
          />
        </Field>

        <Field
          label="Rough cost"
          hint="Free text — “about ₡25.000 a visit” or “depends on the job” are both fine."
        >
          <TextInput
            value={rateNote}
            maxLength={120}
            onChange={(e) => setRateNote(e.target.value)}
            placeholder="depends on the job"
            aria-label="Rough cost"
          />
        </Field>

        <Field label="Phone">
          <TextInput
            value={phone}
            maxLength={32}
            inputMode="tel"
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+506 8888 8888"
            aria-label="Phone"
          />
        </Field>

        <Field label="WhatsApp" hint="Leave blank if it's the same as the phone number.">
          <TextInput
            value={whatsapp}
            maxLength={32}
            inputMode="tel"
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+506 8888 8888"
            aria-label="WhatsApp"
          />
        </Field>

        <Field label="Areas covered" hint="Tap all that apply.">
          <div className="flex flex-wrap gap-2">
            {ZONES.map((z) => (
              <Pill
                key={z.id}
                active={zones.includes(z.id)}
                onClick={() => toggleZone(z.id)}
                label={z.label}
              />
            ))}
          </div>
        </Field>
      </div>

      <SubmitBar
        label="Add to the directory"
        busy={busy}
        disabled={!ready}
        error={error}
        onSubmit={submit}
      />
    </div>
  );
}
