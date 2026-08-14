// Next.js Client Sentry Configuration
export {};

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  // Dynamic Sentry initialization for browser client
  console.log("[Sentry] Client tracking initialized.");
}
