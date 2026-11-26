import type { NextConfig } from "next";

const isPublicHttpsPreview = process.env.NEXT_PUBLIC_PREVIEW_MODE === "true";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  ...(!isPublicHttpsPreview ? [{ key: "X-Frame-Options", value: "DENY" }] : []),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      ...(!isPublicHttpsPreview ? ["frame-ancestors 'none'"] : []),
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // The HTTPS Preview proxy forwards dev-resource requests through loopback.
  // This is dev-only origin validation; production CSP and auth stay unchanged.
  allowedDevOrigins: isPublicHttpsPreview
    ? ["127.0.0.1", "**.manus.computer"]
    : ["127.0.0.1"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      { source: "/login", destination: "/interview/login", permanent: false },
      { source: "/admin/login", destination: "/interview/login?mode=content", permanent: false },
      {
        source: "/admin/applications/:path*",
        destination: "/interview/applications/:path*",
        permanent: false,
      },
      {
        source: "/admin/interviews/:path*",
        destination: "/interview/interviews/:path*",
        permanent: false,
      },
      { source: "/admin/audit-logs/:path*", destination: "/interview/audit-logs/:path*", permanent: false },
      { source: "/admin/change-password/:path*", destination: "/interview/change-password/:path*", permanent: false },
      { source: "/admin/settings/:path*", destination: "/interview/settings/:path*", permanent: false },
      { source: "/admin/staff/:path*", destination: "/interview/staff/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
