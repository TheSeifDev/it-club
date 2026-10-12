import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RegistrationBody = {
  fullName?: unknown;
  nationalId?: unknown;
  academicId?: unknown;
  phone?: unknown;
  whatsapp?: unknown;
  universityEmail?: unknown;
  googleEmail?: unknown;
  year?: unknown;
  department?: unknown;
  experienceLevel?: unknown;
  skills?: unknown;
  experienceDetails?: unknown;
  volunteerExperience?: unknown;
  primaryTrack?: unknown;
  secondaryTrack?: unknown;
  motivation?: unknown;
  learningGoal?: unknown;
  contribution?: unknown;
  availability?: unknown;
  consent?: unknown;
};

const allowedTracks = new Set(["hr", "pr", "sm", "oc", "it", "rnd"]);
const allowedLevels = new Set(["new", "beginner", "computer_skills", "experienced"]);
const allowedYears = new Set(["first", "second", "third", "fourth", "other"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+()\d\s-]{8,20}$/;

function clean(value: unknown, maxLength = 2000): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: RegistrationBody;
  try {
    body = (await request.json()) as RegistrationBody;
  } catch {
    return badRequest("Invalid request body.");
  }

  const fullName = clean(body.fullName, 160);
  const nationalId = clean(body.nationalId, 14);
  const academicId = clean(body.academicId, 80);
  const phone = clean(body.phone, 30);
  const whatsapp = clean(body.whatsapp, 30);
  const universityEmail = clean(body.universityEmail, 254).toLowerCase();
  const googleEmail = clean(body.googleEmail, 254).toLowerCase();
  const year = clean(body.year, 20);
  const department = clean(body.department, 120);
  const experienceLevel = clean(body.experienceLevel, 40);
  const skills = clean(body.skills, 3000);
  const experienceDetails = clean(body.experienceDetails, 3000);
  const volunteerExperience = clean(body.volunteerExperience, 3000);
  const primaryTrack = clean(body.primaryTrack, 10).toLowerCase();
  const secondaryTrack = clean(body.secondaryTrack, 10).toLowerCase();
  const motivation = clean(body.motivation, 4000);
  const learningGoal = clean(body.learningGoal, 3000);
  const contribution = clean(body.contribution, 3000);
  const availability = clean(body.availability, 30);
  const consent = body.consent === true;

  if (fullName.length < 3) return badRequest("Enter your full name.");
  if (!/^\d{14}$/.test(nationalId)) return badRequest("National ID must contain 14 digits.");
  if (!academicId) return badRequest("Academic ID is required.");
  if (!phonePattern.test(phone) || !phonePattern.test(whatsapp)) return badRequest("Enter valid phone and WhatsApp numbers.");
  if (!emailPattern.test(universityEmail)) return badRequest("Enter a valid university email.");
  if (googleEmail && !emailPattern.test(googleEmail)) return badRequest("Enter a valid Google email or leave it empty.");
  if (!allowedYears.has(year)) return badRequest("Choose a valid academic year.");
  if (department.length < 2) return badRequest("Department is required.");
  if (!allowedLevels.has(experienceLevel)) return badRequest("Choose your current experience level.");
  if (experienceLevel !== "new" && !skills) return badRequest("Please describe your current skills.");
  if (!allowedTracks.has(primaryTrack)) return badRequest("Choose a valid first track preference.");
  if (secondaryTrack && (!allowedTracks.has(secondaryTrack) || secondaryTrack === primaryTrack)) {
    return badRequest("Choose a different second track preference.");
  }
  if (motivation.length < 20) return badRequest("Please tell us why you want to join IT Club.");
  if (learningGoal.length < 10) return badRequest("Please tell us what you want to learn.");
  if (!consent) return badRequest("Please confirm that your information is accurate.");

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Registration is not configured yet. Please try again later." },
      { status: 503 },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { "x-application-source": "it-club-register" } },
  });

  const reference = `ITC-${randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;

  const { error } = await supabase.from("applications").insert({
    application_reference: reference,
    full_name: fullName,
    national_id: nationalId,
    academic_id: academicId,
    phone,
    whatsapp,
    university_email: universityEmail,
    google_email: googleEmail || null,
    academic_year: year,
    department,
    experience_level: experienceLevel,
    skills: skills || null,
    experience_details: experienceDetails || null,
    volunteer_experience: volunteerExperience || null,
    primary_track: primaryTrack,
    secondary_track: secondaryTrack || null,
    motivation,
    learning_goal: learningGoal,
    contribution: contribution || null,
    availability: availability || null,
    status: "PENDING_REVIEW",
    consented_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === "23505") {
      return badRequest(
        "A previous application appears to use one of these details. Please check your national ID, academic ID and university email. If you think this is a mistake, contact IT Club recruitment.",
        409,
      );
    }
    // Do not return database error details to an unauthenticated applicant.
    console.error("[registration] Supabase insert failed:", error.code);
    return NextResponse.json(
      { error: "We could not save your application right now. Please try again later." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { ok: true, reference, status: "PENDING_REVIEW" },
    { status: 201 },
  );
}
