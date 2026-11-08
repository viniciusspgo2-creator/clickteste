import type { NextConfig } from "next";
import { MOCKUP_SCENES_ENABLED } from "./src/lib/features";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  async redirects() {
    return [
      { source: "/mockup-caneca-3d", destination: "/", permanent: true },
      ...(!MOCKUP_SCENES_ENABLED ? [{source:"/mockup-cenarios/:path*",destination:"/",permanent:false}] : []),
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      ...["/api/admin/:path*", "/api/access/:path*"].map(source => ({ source, headers: [
        { key: "Cache-Control", value: "private, no-store" },
        { key: "Vary", value: "Cookie, Authorization" },
        { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
      ] })),
    ];
  },
};

export default nextConfig;
