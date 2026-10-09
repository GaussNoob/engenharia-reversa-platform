import type { NextConfig } from "next";

const apiOrigin = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:3060";
const production = process.env.NODE_ENV === "production";
const httpsOrigin = (process.env.PUBLIC_ORIGIN ?? "").startsWith("https:");
// Next inlines its hydration scripts, so script-src needs 'unsafe-inline'; the
// policy still blocks third-party scripts, plugins, framing and base/form hijacking.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${production ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  `connect-src 'self'${production ? "" : " ws: wss:"}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");
const config: NextConfig = {
  transpilePackages: [
    "@nucleo/core",
    "@nucleo/models",
    "@nucleo/content",
    "@nucleo/features",
    "@nucleo/platform",
    "@nucleo/api-client",
  ],
  output: "standalone",
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/login", destination: "/entrar", permanent: false },
      { source: "/register", destination: "/criar-conta", permanent: false },
      { source: "/app", destination: "/dashboard", permanent: false },
      {
        source: "/app/courses",
        destination: "/aprender/fundamentos",
        permanent: false,
      },
      { source: "/app/labs", destination: "/laboratorios", permanent: false },
      {
        source: "/app/settings",
        destination: "/configuracoes",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          ...(httpsOrigin
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
        ],
      },
    ];
  },
};
export default config;
