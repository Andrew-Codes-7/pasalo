import type { SVGProps } from "react";

/**
 * One inline SVG set so the app never pulls an icon font or a remote sprite.
 * All paths are drawn on a 24px grid with a 1.75 stroke to stay consistent.
 */

export type IconName =
  | "search"
  | "heart"
  | "heart-filled"
  | "star"
  | "star-filled"
  | "user"
  | "arrow-left"
  | "pin"
  | "plus"
  | "camera"
  | "send"
  | "shield"
  | "check"
  | "message"
  | "gift"
  | "sofa"
  | "wave"
  | "plant"
  | "device"
  | "tool"
  | "car"
  | "kid"
  | "shirt"
  | "paw"
  | "chevron-right"
  | "flag"
  | "spark"
  | "clock"
  | "grid"
  | "sun"
  | "moon"
  | "menu"
  | "home"
  | "users"
  | "calendar"
  | "megaphone";

const PATHS: Record<IconName, React.ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  heart: (
    <path d="M12 20s-7.5-4.7-7.5-9.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8C19.5 15.3 12 20 12 20Z" />
  ),
  "heart-filled": (
    <path
      d="M12 20s-7.5-4.7-7.5-9.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8C19.5 15.3 12 20 12 20Z"
      fill="currentColor"
      stroke="none"
    />
  ),
  star: (
    <path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4L4.2 9.7l5.4-.8L12 4Z" />
  ),
  "star-filled": (
    <path
      d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4L4.2 9.7l5.4-.8L12 4Z"
      fill="currentColor"
      stroke="none"
    />
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
    </>
  ),
  "arrow-left": (
    <>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6.5-5.6 6.5-10.2A6.5 6.5 0 0 0 5.5 10.8C5.5 15.4 12 21 12 21Z" />
      <circle cx="12" cy="10.5" r="2.3" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8.5h3l1.5-2h7L17 8.5h3v10H4v-10Z" />
      <circle cx="12" cy="13" r="3" />
    </>
  ),
  send: <path d="M20 4 9.5 14.5M20 4l-6.5 16-4-7.5L2 8.5 20 4Z" />,
  shield: (
    <>
      <path d="M12 3.5 5.5 6v6c0 4 6.5 8.5 6.5 8.5S18.5 16 18.5 12V6L12 3.5Z" />
      <path d="m9.3 12 2 2 3.4-3.6" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  message: (
    <path d="M20 12.5c0 3.6-3.6 6.5-8 6.5a9.6 9.6 0 0 1-2.6-.35L4.5 20l1.2-3.3A6.2 6.2 0 0 1 4 12.5C4 8.9 7.6 6 12 6s8 2.9 8 6.5Z" />
  ),
  gift: (
    <>
      <path d="M4.5 11h15v8.5h-15V11Z" />
      <path d="M3.5 8h17v3h-17V8ZM12 8v11.5" />
      <path d="M12 8S10.8 4.5 8.8 4.5A2 2 0 0 0 8.8 8H12Zm0 0s1.2-3.5 3.2-3.5A2 2 0 0 1 15.2 8H12Z" />
    </>
  ),
  sofa: (
    <>
      <path d="M5 11V8.5A2 2 0 0 1 7 6.5h10a2 2 0 0 1 2 2V11" />
      <path d="M3.5 11.5a1.8 1.8 0 0 1 3.6 0V14h9.8v-2.5a1.8 1.8 0 0 1 3.6 0v6H3.5v-6Z" />
    </>
  ),
  wave: (
    <>
      <path d="M3 14.5c1.8 0 1.8-2 3.6-2s1.8 2 3.6 2 1.8-2 3.6-2 1.8 2 3.6 2 1.8-2 3.6-2" />
      <path d="M3 18.5c1.8 0 1.8-2 3.6-2s1.8 2 3.6 2 1.8-2 3.6-2 1.8 2 3.6 2 1.8-2 3.6-2" />
      <path d="M7 10.5C7 7 9.5 4.5 13 4.5c2.5 0 4 1.5 4 3" />
    </>
  ),
  plant: (
    <>
      <path d="M12 20v-7" />
      <path d="M12 13c0-3-2-5.5-5-5.5 0 3 2 5.5 5 5.5Z" />
      <path d="M12 15c0-3.4 2.2-6 5.5-6 0 3.4-2.2 6-5.5 6Z" />
    </>
  ),
  device: (
    <>
      <rect x="4" y="4.5" width="16" height="11" rx="1.5" />
      <path d="M8 19.5h8" />
    </>
  ),
  tool: (
    <>
      <path d="M14.5 4.5a4 4 0 0 0 5 5l-9.5 9.5a2.5 2.5 0 0 1-3.5-3.5l9.5-9.5Z" />
      <path d="M14.5 4.5 19.5 9.5" />
    </>
  ),
  car: (
    <>
      <path d="M4 15.5v-2l1.8-4.2A2 2 0 0 1 7.6 8h8.8a2 2 0 0 1 1.8 1.3L20 13.5v2" />
      <path d="M4 15.5h16v3H4v-3Z" />
      <circle cx="7.5" cy="15.5" r="1" />
      <circle cx="16.5" cy="15.5" r="1" />
    </>
  ),
  kid: (
    <>
      <circle cx="12" cy="7" r="3" />
      <path d="M12 10v6M9 20l3-4 3 4M8.5 13h7" />
    </>
  ),
  shirt: (
    <path d="M9 4.5 5 6.5l1 4 2-.7V19.5h8V9.8l2 .7 1-4-4-2a3 3 0 0 1-6 0Z" />
  ),
  paw: (
    <>
      <ellipse cx="8" cy="8.5" rx="1.7" ry="2.2" />
      <ellipse cx="16" cy="8.5" rx="1.7" ry="2.2" />
      <ellipse cx="5.2" cy="13.5" rx="1.6" ry="2" />
      <ellipse cx="18.8" cy="13.5" rx="1.6" ry="2" />
      <path d="M12 12.5c2.6 0 4.5 2 4.5 4a2.6 2.6 0 0 1-3.4 2.4 4 4 0 0 0-2.2 0A2.6 2.6 0 0 1 7.5 16.5c0-2 1.9-4 4.5-4Z" />
    </>
  ),
  "chevron-right": <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />,
  flag: (
    <>
      <path d="M6 20V4.5" />
      <path d="M6 5.5h11l-2 3.5 2 3.5H6" />
    </>
  ),
  spark: (
    <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.3l-1.8-5.7L4.5 10.8 10.2 9 12 3.5Z" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.4" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  home: (
    <>
      <path d="m3.5 11 8.5-7 8.5 7" />
      <path d="M5.5 9.7V20h13V9.7" />
      <path d="M10 20v-5.5h4V20" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.6a3.2 3.2 0 0 1 0 5.8M17.5 19.5a5.6 5.6 0 0 0-2-4.3" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14" rx="2" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </>
  ),
  megaphone: (
    <>
      <path d="M4 10.5v3a1.5 1.5 0 0 0 1.5 1.5H8l7 4.5V6L8 10.5H5.5A1.5 1.5 0 0 0 4 12Z" />
      <path d="M18 9.5a4 4 0 0 1 0 5" />
    </>
  ),
};

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

export function Icon({ name, size = 20, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
