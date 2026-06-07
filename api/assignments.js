module.exports = async function handler(request, response) {
  const appsScriptUrl = process.env.APPS_SCRIPT_API_URL;

  if (!appsScriptUrl) {
    return response.status(500).json({
      participants: [],
      assignments: [],
      error: "Missing APPS_SCRIPT_API_URL"
    });
  }

  try {
    const endpoint = new URL(appsScriptUrl);
    endpoint.searchParams.set("t", Date.now().toString());

    const upstreamResponse = await fetch(endpoint.toString(), { cache: "no-store" });
    if (!upstreamResponse.ok) {
      throw new Error(`Apps Script responded ${upstreamResponse.status}`);
    }

    const payload = await upstreamResponse.json();
    response.setHeader("Cache-Control", "no-store");
    return response.status(200).json(normalizeExternalData(payload));
  } catch (error) {
    return response.status(502).json({
      participants: [],
      assignments: [],
      error: "Unable to load assignments"
    });
  }
};

function normalizeExternalData(payload) {
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];
  const participants = Array.isArray(payload?.participants)
    ? payload.participants.map((name) => String(name).trim()).filter(Boolean)
    : rows.map((row) => String(row.participantName || row.name || "").trim()).filter(Boolean);
  const assignments = Array.isArray(payload?.assignments)
    ? payload.assignments
    : rows;

  return {
    participants: [...new Set(participants)],
    assignments: assignments.map((assignment) => ({
      participantName: String(assignment.participantName || assignment.name || "").trim(),
      teamCode: String(assignment.teamCode || assignment.code || "").trim().toUpperCase()
    })).filter((assignment) => assignment.participantName && assignment.teamCode)
  };
}
