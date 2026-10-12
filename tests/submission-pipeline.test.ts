import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/register/route.ts";
import { resetMemoryRateLimits } from "../lib/security/rate-limiter.ts";
import { createClient } from "@supabase/supabase-js";

const validSyntheticPayload = {
  fullName: "Mariam Youssef Ibrahim",
  nationalId: "30408250101242", // Synthetic: 2004-08-25 in Cairo (01)
  academicId: "BATU-2024-5555",
  phone: "+201098765432",
  whatsapp: "+201098765432",
  universityEmail: "20245555@batechu.com",
  googleEmail: "mariam.backup@gmail.com",
  year: "first",
  department: "Information Technology",
  experienceLevel: "beginner",
  skills: "Basic HTML and Python fundamentals",
  experienceDetails: "First year university practical labs",
  primaryTrack: "it",
  secondaryTrack: "rnd",
  motivation: "I want to actively participate in IT Club activities and learn software engineering best practices.",
  learningGoal: "Understand modern web development and work collaboratively in technical projects.",
  consent: true,
};

let ipSeq = 1;
function createRequest(body: unknown, options: { contentType?: string; ip?: string; contentLength?: string } = {}): Request {
  const headers = new Headers();
  headers.set("content-type", options.contentType ?? "application/json");
  const ip = options.ip ?? `198.18.0.${ipSeq++}`;
  headers.set("x-forwarded-for", ip);
  if (options.contentLength) headers.set("content-length", options.contentLength);

  const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
  return new Request("http://localhost:3000/api/register", {
    method: "POST",
    headers,
    body: bodyStr,
  });
}

describe("Registration Submission API Pipeline (POST /api/register)", () => {
  beforeEach(() => {
    resetMemoryRateLimits();
  });

  it("rejects non-JSON Content-Type with 415 Unsupported Media Type", async () => {
    const req = createRequest("test", { contentType: "text/plain" });
    const res = await POST(req);
    assert.equal(res.status, 415);
    const json = await res.json();
    assert.equal(json.code, "UNSUPPORTED_MEDIA_TYPE");
  });

  it("rejects oversized request bodies with 413 Payload Too Large", async () => {
    const req = createRequest("x", { contentLength: "100000" });
    const res = await POST(req);
    assert.equal(res.status, 413);
    const json = await res.json();
    assert.equal(json.code, "PAYLOAD_TOO_LARGE");
  });

  it("rejects malformed JSON syntax with 400 Malformed JSON", async () => {
    // Request with invalid JSON body
    const malformedReq = new Request("http://localhost:3000/api/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": `198.18.1.${ipSeq++}`,
      },
      body: "{ not a json string",
    });
    const res = await POST(malformedReq);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.code, "MALFORMED_JSON");
  });

  it("returns 400 with field errors when required fields are missing", async () => {
    const incompletePayload = {
      fullName: "",
      nationalId: "",
      academicId: "",
    };
    const req = createRequest(incompletePayload);
    const res = await POST(req);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.code, "VALIDATION_FAILED");
    assert.ok(json.errors);
    assert.ok(json.errors.fullName);
    assert.ok(json.errors.nationalId);
    assert.ok(json.errors.academicId);
  });

  it("rejects invalid university email formats with field error on universityEmail", async () => {
    const invalidEmailPayload = {
      ...validSyntheticPayload,
      universityEmail: "student@gmail.com", // Not @batechu.com
    };
    const req = createRequest(invalidEmailPayload);
    const res = await POST(req);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.code, "VALIDATION_FAILED");
    assert.ok(json.errors.universityEmail);
    assert.match(json.errors.universityEmail, /@batechu\.com/i);
  });

  it("rejects invalid Egyptian National IDs (impossible month) with field error on nationalId", async () => {
    const invalidNidPayload = {
      ...validSyntheticPayload,
      nationalId: "30413150101242", // Month 13
    };
    const req = createRequest(invalidNidPayload);
    const res = await POST(req);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.code, "VALIDATION_FAILED");
    assert.ok(json.errors.nationalId);
  });

  it("rejects bot trap submissions with AUTOMATION_DETECTED code", async () => {
    const botPayload = {
      ...validSyntheticPayload,
      hp_confirm: "automated-crawler-detected",
    };
    const req = createRequest(botPayload);
    const res = await POST(req);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.code, "AUTOMATION_DETECTED");
  });

  it("enforces rate limits on repeated submissions returning 429 with Retry-After", async () => {
    const ip = `198.51.100.${Math.floor(10 + Math.random() * 200)}`;
    // Send 6 requests up to the max limit
    for (let i = 0; i < 6; i++) {
      const req = createRequest(
        { ...validSyntheticPayload, academicId: `BATU-LIMIT-${i}-${Date.now()}` },
        { ip }
      );
      await POST(req);
    }

    // 7th request must be rejected with 429
    const reqBlocked = createRequest(validSyntheticPayload, { ip });
    const resBlocked = await POST(reqBlocked);
    assert.equal(resBlocked.status, 429);
    const jsonBlocked = await resBlocked.json();
    assert.equal(jsonBlocked.code, "RATE_LIMITED");
    assert.ok(resBlocked.headers.get("retry-after"));
  });

  it("handles valid synthetic payload, successfully inserts into database with 201 Created and PENDING_REVIEW", async () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const uniqueEmail = `2024${Date.now().toString().slice(-4)}${randomSuffix}@batechu.com`;
    const uniqueAcademicId = `BATU-TEST-${Date.now().toString().slice(-5)}-${randomSuffix}`;
    // Valid Egyptian National ID: Century (3) + 2004-08-25 (040825) + Cairo (01) + sequence (randomSuffix)
    const uniqueNid = `3040825010${randomSuffix}`;

    const payload = {
      ...validSyntheticPayload,
      fullName: "Synthetic Automated Tester",
      universityEmail: uniqueEmail,
      academicId: uniqueAcademicId,
      nationalId: uniqueNid,
    };

    const req = createRequest(payload);
    const res = await POST(req);
    const json = await res.json();

    assert.equal(res.status, 201);
    assert.equal(json.ok, true);
    assert.match(json.reference, /^ITC-[A-Z0-9]{8}$/);
    assert.equal(json.status, "PENDING_REVIEW");

    // Verify row was actually persisted in Supabase
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey) {
      const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: persistedRow, error: fetchError } = await supabase
        .from("applications")
        .select("id, application_reference, full_name, national_id, university_email, status")
        .eq("application_reference", json.reference)
        .maybeSingle();

      assert.equal(fetchError, null);
      assert.ok(persistedRow, "Persisted row must exist in Supabase applications table");
      assert.equal(persistedRow.application_reference, json.reference);
      assert.equal(persistedRow.national_id, uniqueNid);
      assert.equal(persistedRow.university_email, uniqueEmail);
      assert.equal(persistedRow.status, "PENDING_REVIEW");

      // Clean up test row
      await supabase.from("applications").delete().eq("id", persistedRow.id);
    }
  });

  it("rejects duplicate submissions with 409 DUPLICATE_APPLICATION", async () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const uniqueEmail = `2024${Date.now().toString().slice(-4)}${randomSuffix}@batechu.com`;
    const uniqueAcademicId = `BATU-DUP-${Date.now().toString().slice(-5)}-${randomSuffix}`;
    const uniqueNid = `3040825010${randomSuffix}`;

    const payload = {
      ...validSyntheticPayload,
      fullName: "Duplicate Test Applicant",
      universityEmail: uniqueEmail,
      academicId: uniqueAcademicId,
      nationalId: uniqueNid,
    };

    // First insertion should succeed
    const req1 = createRequest(payload);
    const res1 = await POST(req1);
    assert.equal(res1.status, 201);
    const json1 = await res1.json();

    // Second insertion with identical nationalId and email should produce 409
    const req2 = createRequest(payload);
    const res2 = await POST(req2);
    assert.equal(res2.status, 409);
    const json2 = await res2.json();
    assert.equal(json2.code, "DUPLICATE_APPLICATION");

    // Clean up
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey) {
      const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      await supabase.from("applications").delete().eq("application_reference", json1.reference);
    }
  });

  it("diagnoses missing Supabase credentials without leaking secrets", async () => {
    const originalUrl = process.env.SUPABASE_URL;
    const originalPublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalService = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const originalAnon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    try {
      // Temporarily remove keys to test credential-missing guard
      delete process.env.SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      delete process.env.SUPABASE_ANON_KEY;

      const payload = {
        ...validSyntheticPayload,
        universityEmail: `2024${Date.now().toString().slice(-6)}@batechu.com`,
        academicId: `BATU-NOCRED-${Date.now()}`,
        nationalId: "30408250109999",
      };

      const req = createRequest(payload);
      const res = await POST(req);
      assert.equal(res.status, 503);
      const json = await res.json();
      assert.equal(json.code, "CONFIGURATION_MISSING");
      assert.ok(json.requestId);
      assert.doesNotMatch(JSON.stringify(json), /sb_publishable|service_role|eyJ/);
    } finally {
      // Restore credentials
      if (originalUrl) process.env.SUPABASE_URL = originalUrl;
      if (originalPublicUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = originalPublicUrl;
      if (originalService) process.env.SUPABASE_SERVICE_ROLE_KEY = originalService;
      if (originalAnon) process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalAnon;
    }
  });
});
