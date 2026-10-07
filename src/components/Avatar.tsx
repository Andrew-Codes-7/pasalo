import type { User } from "@/lib/types";
import { Icon } from "./Icon";

const TINTS = [
  "bg-brand-700 text-white",
  "bg-brand-800 text-white",
  "bg-brand-600 text-white",
  "bg-brand-900 text-white",
  "bg-brand-500 text-brand-900",
];

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/**
 * Initials rather than photos. Real profile photos land with the upload flow;
 * until then initials keep the screens honest instead of borrowing stock
 * faces that make the app look more populated than it is.
 */
export function Avatar({
  user,
  size = 40,
  showVerified = false,
}: {
  user: User;
  size?: number;
  showVerified?: boolean;
}) {
  const tint = TINTS[user.name.length % TINTS.length];

  return (
    <span
      className="relative inline-block shrink-0"
      style={{ width: size, height: size }}
    >
      <span
        className={`grid h-full w-full place-items-center rounded-full font-semibold ${tint}`}
        style={{ fontSize: size * 0.36 }}
        aria-hidden="true"
      >
        {initials(user.name)}
      </span>
      {showVerified && user.neighborVerified && (
        <span
          className="absolute -bottom-0.5 -right-0.5 grid place-items-center rounded-full bg-surface text-brand-600 ring-2 ring-surface"
          style={{ width: size * 0.42, height: size * 0.42 }}
        >
          <Icon name="shield" size={size * 0.28} strokeWidth={2.4} />
        </span>
      )}
    </span>
  );
}
