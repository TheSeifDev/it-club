import { NextResponse } from "next/server.js";
import { getCurrentStudent, isQrEligibleStatus } from "../../../../lib/auth/student.ts";
import {
  getOrCreateInterviewQrToken,
  renderQrPngBuffer,
  renderQrDataUrl,
} from "../../../../lib/interviews/qr-service.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // 1. Authenticate student session
  const student = await getCurrentStudent();
  if (!student) {
    return NextResponse.json(
      {
        error: "Authenticated student membership required.",
        code: "UNAUTHORIZED_STUDENT",
      },
      {
        status: 401,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }

  if (student.isTempPasswordExpired) {
    return NextResponse.json(
      {
        error: "Your temporary credentials have expired. Access is locked.",
        code: "CREDENTIAL_EXPIRED",
      },
      {
        status: 403,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }

  if (student.passwordChangeRequired) {
    return NextResponse.json(
      {
        error: "You must change your temporary password before accessing QR credentials.",
        code: "PASSWORD_CHANGE_REQUIRED",
      },
      {
        status: 403,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }

  const { application } = student;

  // 2. Enforce QR eligibility server-side
  if (!isQrEligibleStatus(application.status)) {
    return NextResponse.json(
      {
        error:
          "Interview QR credentials are only available for accepted or scheduled applications.",
        code: "QR_NOT_ELIGIBLE",
        currentStatus: application.status,
      },
      {
        status: 403,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }

  // 3. Retrieve or create durable token
  const tokenRes = await getOrCreateInterviewQrToken(
    application.id,
    application.status
  );

  if (!tokenRes.eligible || !tokenRes.qrPayload) {
    return NextResponse.json(
      {
        error: tokenRes.error || "Unable to issue interview QR credentials.",
        code: tokenRes.code || "ISSUANCE_FAILED",
      },
      {
        status: 400,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format");
  const isDownload = format === "png" || url.searchParams.get("download") === "true";

  // 4. Return PNG binary buffer for direct download
  if (isDownload) {
    const pngBuffer = await renderQrPngBuffer(tokenRes.qrPayload);
    const bodyBytes = new Uint8Array(pngBuffer);

    return new Response(bodyBytes, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": 'attachment; filename="IT-Club-Interview-QR.png"',
        "Content-Length": pngBuffer.length.toString(),
        "Cache-Control": "no-store, max-age=0, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  }

  // 5. Return JSON with Data URL for dashboard embedding
  const qrDataUrl = await renderQrDataUrl(tokenRes.qrPayload);

  return NextResponse.json(
    {
      ok: true,
      eligible: true,
      status: tokenRes.status,
      qrDataUrl,
      expiresAt: tokenRes.expiresAt,
      checkedInAt: tokenRes.checkedInAt,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
        "Pragma": "no-cache",
      },
    }
  );
}
