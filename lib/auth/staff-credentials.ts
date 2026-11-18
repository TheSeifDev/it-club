import { randomBytes } from "node:crypto";

/** Generate a fresh, high-entropy one-time credential; never persist its value. */
export function generateStaffTemporaryPassword(): string {
  return randomBytes(24).toString("base64url");
}
