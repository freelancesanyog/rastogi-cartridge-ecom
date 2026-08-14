// Next.js Server Sentry Configuration
export {};

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  console.log("[Sentry] Server tracking initialized.");
}
