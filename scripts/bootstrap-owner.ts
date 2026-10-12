import { checkBootstrapStatus, bootstrapFirstOwner } from "../lib/auth/bootstrap.ts";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    console.log(`
IT Club — Staff Owner Bootstrap Tool
====================================
Usage:
  node --env-file=.env.local --experimental-strip-types scripts/bootstrap-owner.ts --status
  node --env-file=.env.local --experimental-strip-types scripts/bootstrap-owner.ts <USER_UUID_OR_EMAIL>

Notes:
  - This is a ONE-TIME procedure.
  - The Auth user must first be created in Supabase Auth (via Dashboard or invite).
  - The script will reject execution if an Owner is already established.
  - Credentials remain strictly server-side and are never logged.
`);
    process.exit(0);
  }

  if (command === "--status") {
    const status = await checkBootstrapStatus();
    if (status.initialized) {
      console.log(`[STATUS] System initialized. ${status.ownerCount} Owner(s) currently configured.`);
    } else {
      console.log("[STATUS] Awaiting bootstrap. No Owner is currently established.");
    }
    return;
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(command);
  const target = isUuid ? { userId: command } : { email: command };

  console.log(`[BOOTSTRAP] Processing initial Owner assignment for target identifier...`);
  const result = await bootstrapFirstOwner(target);

  if (!result.success) {
    console.error(`[ERROR] ${result.message}`);
    process.exitCode = 1;
    return;
  }

  console.log(`[SUCCESS] ${result.message}`);
  console.log(`[SUCCESS] Assigned Owner user ID: ${result.userId}`);
}

main().catch((err) => {
  console.error("[FATAL]", err instanceof Error ? err.message : "Unknown error");
  process.exitCode = 1;
});
