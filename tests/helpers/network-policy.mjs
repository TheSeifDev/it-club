import { isIP } from "node:net";

const integrationEnabled = process.env.RUN_SUPABASE_INTEGRATION_TESTS === "true";

if (integrationEnabled) {
  const required = [
    "SUPABASE_INTEGRATION_TEST_URL",
    "SUPABASE_INTEGRATION_TEST_PUBLISHABLE_KEY",
    "SUPABASE_INTEGRATION_TEST_SERVICE_ROLE_KEY",
  ];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length) {
    throw new Error(`Supabase integration tests are enabled but missing: ${missing.join(", ")}`);
  }
  // Existing integration tests use the conventional names. Explicitly map only
  // the opt-in, isolated test project and never inherit an application's keys.
  process.env.SUPABASE_URL = process.env.SUPABASE_INTEGRATION_TEST_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.SUPABASE_INTEGRATION_TEST_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_INTEGRATION_TEST_SERVICE_ROLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_INTEGRATION_TEST_PUBLISHABLE_KEY;
  process.env.SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_INTEGRATION_TEST_PUBLISHABLE_KEY;
} else {
  const realFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (input, init) => {
    const raw = typeof input === "string" || input instanceof URL ? input : input.url;
    const url = new URL(raw);
    const address = url.hostname.replace(/^\[|\]$/g, "");
    const local = address === "localhost" || address.endsWith(".localhost") || isIP(address) === 4 && address.startsWith("127.") || address === "::1";
    if (!local) {
      throw new Error(`Blocked outbound HTTP during tests (${url.protocol}//${url.host}). Set RUN_SUPABASE_INTEGRATION_TESTS=true only with an isolated development Supabase project.`);
    }
    return realFetch(input, init);
  };
}
