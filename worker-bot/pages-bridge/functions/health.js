export async function onRequestGet() {
  return Response.json({
    ok: true,
    hub: "https://antidetect-automation.github.io",
  });
}
