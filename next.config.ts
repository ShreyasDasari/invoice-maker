import type { NextConfig } from 'next';

/** Security headers applied to every route. */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js injects inline bootstrap scripts. 'wasm-unsafe-eval' is required
      // because @react-pdf/renderer compiles a WebAssembly layout engine to
      // build the PDF; it permits WebAssembly only, NOT eval() of JavaScript
      // strings, so 'unsafe-eval' is deliberately not granted.
      "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:",
      "style-src 'self' 'unsafe-inline'",
      // data:/blob: cover user logo uploads and generated PDF object URLs.
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' blob: data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  experimental: { optimizePackageImports: [] },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
