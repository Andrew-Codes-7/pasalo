import type { NextConfig } from "next";

/**
 * Uploaded listing photos are served from Supabase Storage, which is a
 * different domain. next/image refuses remote hosts unless they are listed
 * here, so without this every real listing photo renders as a broken image.
 *
 * The hostname is derived from the same env var the app uses, so it follows
 * the project automatically instead of being hardcoded.
 */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // The floating dev badge sits on top of the bottom action bar, which is
  // exactly where the price and primary buttons live.
  devIndicators: false,
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
