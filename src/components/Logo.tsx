import Image from "next/image";

/**
 * The real Pasalo artwork, not a redrawing.
 *
 * `public/logoAndName.png` is the supplied lockup: flat green on a near-black
 * field, mark stacked over the wordmark over the tagline. That file cannot be
 * used directly in the header — the baked-in black background would render as
 * a box in light mode, and the stacked arrangement is the wrong shape for a
 * corner.
 *
 * So it was split into three transparent pieces (see the extraction script in
 * the project notes). Alpha was recovered from each pixel's position between
 * the backdrop and the logo green rather than colour-keyed, which keeps the
 * anti-aliased curves smooth. The pieces are the original artwork — same
 * shapes, same letterforms, same green (#0ebf6b) — just cut out and trimmed.
 */

const MARK = { src: "/logo-mark.png", w: 417, h: 512 };
const NAME = { src: "/logo-name.png", w: 889, h: 256 };
const TAGLINE = { src: "/logo-tagline.png", w: 1553, h: 64 };

/** The P mark alone — tight spaces, app icons, favicons. */
export function LogoMark({
  size = 44,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={MARK.src}
      alt="Pasalo"
      width={MARK.w}
      height={MARK.h}
      priority
      style={{ height: size, width: "auto" }}
      className={className}
    />
  );
}

/**
 * Mark and wordmark side by side for the header corner. The wordmark is set
 * to about 46% of the mark's height, which is the ratio they hold in the
 * original lockup.
 */
export function Logo({
  height = 52,
  className = "",
}: {
  height?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className}`}
      role="img"
      aria-label="Pasalo"
    >
      <Image
        src={MARK.src}
        alt=""
        width={MARK.w}
        height={MARK.h}
        priority
        style={{ height, width: "auto" }}
      />
      <Image
        src={NAME.src}
        alt=""
        width={NAME.w}
        height={NAME.h}
        priority
        style={{ height: height * 0.46, width: "auto" }}
      />
    </span>
  );
}

/** Mark over wordmark over tagline — the original stacked lockup, for signup. */
export function LogoLockup({
  height = 96,
  className = "",
}: {
  height?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex flex-col items-center gap-2.5 ${className}`}
      role="img"
      aria-label="Pasalo — Dalo. Encontralo. Pasalo."
    >
      <Image
        src={MARK.src}
        alt=""
        width={MARK.w}
        height={MARK.h}
        priority
        style={{ height, width: "auto" }}
      />
      <Image
        src={NAME.src}
        alt=""
        width={NAME.w}
        height={NAME.h}
        priority
        style={{ height: height * 0.38, width: "auto" }}
      />
      <Image
        src={TAGLINE.src}
        alt=""
        width={TAGLINE.w}
        height={TAGLINE.h}
        style={{ height: height * 0.052, width: "auto" }}
      />
    </span>
  );
}
