import { runSmtpSelfTest } from "../lib/email/smtp-self-test.ts";

const target = process.argv[2]?.trim();
runSmtpSelfTest(target || undefined)
  .then((result) => {
    // Deliberately print only operational metadata, never credentials or links.
    console.log(JSON.stringify(result));
    process.exitCode = result.authenticationSucceeded && result.smtpAccepted ? 0 : 1;
  })
  .catch(() => {
    console.log(JSON.stringify({
      authenticationSucceeded: false,
      smtpAccepted: false,
      safeErrorCategory: "PROVIDER_ERROR",
    }));
    process.exitCode = 1;
  });
