import type { NextConfig } from "next";
import { MOCKUP_SCENES_ENABLED } from "./src/lib/features";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
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
    ];
  },
};

export default nextConfig;
