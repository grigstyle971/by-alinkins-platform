import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // Some social apps encode the hash as part of the pathname. Preserve
        // old shared links while /results remains the recommended clean URL.
        source: "/home%23transformation-results",
        destination: "/home?section=transformation-results",
        permanent: true,
      },
    ];
  },
  // PDF pages are rendered only in the Node.js route with this native module.
  // Keep it out of Webpack's browser bundle.
  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist"],
  // The package chooses its Linux binary dynamically at runtime. Include both
  // parts explicitly so Vercel's serverless file tracing keeps that binary.
  outputFileTracingIncludes: {
    "/api/course-pdf-page": [
      "./node_modules/@napi-rs/canvas/**/*",
      "./node_modules/@napi-rs/canvas-linux-x64-gnu/**/*",
      "./node_modules/pdfjs-dist/**/*",
    ],
  },
  async headers() {
    return [{
      // Account setup must never be served from an old mobile browser cache:
      // its form and the current one-time-code flow must always match.
      source: "/set-password",
      headers: [
        { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
      ],
    }, {
      // Purchased-program access is account-specific. Never reuse an old
      // document when an installed browser opens the app again.
      source: "/my-programs/:path*",
      headers: [
        { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
      ],
    }, {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        // The admin preview is loaded in an iframe from this same site.
        // SAMEORIGIN keeps third-party sites from embedding it while allowing that preview.
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: "Content-Security-Policy", value: "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co https://*.mux.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co https://*.mux.com https://challenges.cloudflare.com; worker-src 'self'; media-src 'self' blob: https://*.mux.com; frame-src 'self' https://www.youtube-nocookie.com https://player.vimeo.com https://challenges.cloudflare.com" },
      ],
    }];
  },
  images: {
    // Keep generated local image variants available after the first visit.
    // Static source photos only change when we deploy a new version.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    qualities: [82, 100],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};
export default nextConfig;
