import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // There is an unrelated package.json in the home directory above this
  // project; without pinning the root, Turbopack walks up and picks it up.
  turbopack: { root: import.meta.dirname },
  // The floating dev badge sits on top of the bottom nav, which makes visual
  // checks of that nav impossible.
  devIndicators: false,
};

export default nextConfig;
