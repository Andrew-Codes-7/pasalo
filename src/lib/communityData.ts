import type { StringKey } from "./i18n";

/**
 * Fixed option lists for the three community sections.
 *
 * Kept here rather than in the database: these are design decisions, not
 * content. Adding a category should be a considered change, not something any
 * member can do by typing a new one into a form — otherwise the directory
 * fragments into "Plumber", "plumbing", "Fontanero" and stops being browsable.
 */

export const SERVICE_CATEGORIES: {
  id: string;
  label: string;
  labelEs: string;
  icon: string;
}[] = [
  { id: "realestate", label: "Real estate & rentals", labelEs: "Bienes raíces y alquileres", icon: "home" },
  { id: "construction", label: "Construction & repair", labelEs: "Construcción y reparación", icon: "tool" },
  { id: "cleaning", label: "Cleaning", labelEs: "Limpieza", icon: "home" },
  { id: "transport", label: "Transport & taxi", labelEs: "Transporte y taxi", icon: "car" },
  { id: "auto", label: "Auto & mechanic", labelEs: "Mecánica", icon: "car" },
  { id: "garden", label: "Garden & pool", labelEs: "Jardín y piscina", icon: "plant" },
  { id: "beauty", label: "Beauty & wellness", labelEs: "Belleza y bienestar", icon: "spark" },
  { id: "tutoring", label: "Lessons & tutoring", labelEs: "Clases y tutoría", icon: "grid" },
  { id: "pets", label: "Pet care", labelEs: "Cuidado de mascotas", icon: "paw" },
  { id: "childcare", label: "Childcare", labelEs: "Cuidado de niños", icon: "kid" },
  { id: "tech", label: "Tech & internet", labelEs: "Tecnología e internet", icon: "device" },
  { id: "food", label: "Food & catering", labelEs: "Comida y catering", icon: "gift" },
  { id: "other", label: "Other", labelEs: "Otros", icon: "grid" },
];

export function serviceCategory(id: string) {
  return SERVICE_CATEGORIES.find((c) => c.id === id) ?? SERVICE_CATEGORIES.at(-1)!;
}

export const BULLETIN_KINDS: {
  id: "alert" | "news" | "notice" | "lost_found" | "recommendation";
  label: string;
  labelEs: string;
  hint: string;
}[] = [
  { id: "alert", label: "Alert", labelEs: "Alerta", hint: "Water out, road closed, storm warning" },
  { id: "news", label: "News", labelEs: "Noticia", hint: "New business, town announcement" },
  { id: "notice", label: "Notice", labelEs: "Aviso", hint: "General information" },
  { id: "lost_found", label: "Lost & found", labelEs: "Perdido y encontrado", hint: "Lost dog, found keys" },
  { id: "recommendation", label: "Recommendation", labelEs: "Recomendación", hint: "Somewhere worth going" },
];

export const EVENT_KINDS: {
  id: "social" | "swap" | "sport" | "volunteer" | "class" | "market";
  label: string;
  labelEs: string;
}[] = [
  { id: "swap", label: "Swap day", labelEs: "Día de intercambio" },
  { id: "social", label: "Social", labelEs: "Social" },
  { id: "sport", label: "Sport", labelEs: "Deporte" },
  { id: "volunteer", label: "Volunteer", labelEs: "Voluntariado" },
  { id: "class", label: "Class or workshop", labelEs: "Clase o taller" },
  { id: "market", label: "Market", labelEs: "Feria" },
];

export type { StringKey };
