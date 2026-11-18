export async function GET() {
  return Response.json({ status: "ok", service: "it-club" }, {
    headers: { "Cache-Control": "no-store" },
  });
}
