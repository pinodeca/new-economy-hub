import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No backend: content changes only on merge to main, not per-request, so
  // this ships as static HTML/CSS/JS (see docs/DECISIONS.md). Deploys to
  // Azure Static Web Apps' plain static hosting, no Node server required.
  output: "export",
  // Static export can't use Next's server-side image optimization API.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
