module.exports = async function handler(request, response) {
  const appsScriptUrl = process.env.APPS_SCRIPT_API_URL;

  if (!appsScriptUrl) {
    return response.status(500).json({
      ok: false,
      error: "Missing APPS_SCRIPT_API_URL"
    });
  }

  try {
    if (request.method === "GET") {
      return handleGet(request, response, appsScriptUrl);
    }

    if (request.method === "POST") {
      return handlePost(request, response, appsScriptUrl);
    }

    response.setHeader("Allow", "GET, POST");
    return response.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (error) {
    return response.status(502).json({
      ok: false,
      error: "Unable to reach quiniela backend"
    });
  }
};

async function handleGet(request, response, appsScriptUrl) {
  const url = new URL(request.url, `https://${request.headers.host || "localhost"}`);
  const action = url.searchParams.get("action") || "getQuinielaDashboard";
  const endpoint = new URL(appsScriptUrl);
  endpoint.searchParams.set("action", action);
  endpoint.searchParams.set("t", Date.now().toString());

  if (url.searchParams.has("code")) {
    endpoint.searchParams.set("code", url.searchParams.get("code"));
  }

  const upstreamResponse = await fetch(endpoint.toString(), { cache: "no-store" });
  if (!upstreamResponse.ok) {
    throw new Error(`Apps Script responded ${upstreamResponse.status}`);
  }

  const payload = await upstreamResponse.json();
  response.setHeader("Cache-Control", "no-store");
  return response.status(200).json(payload);
}

async function handlePost(request, response, appsScriptUrl) {
  const body = await readJsonBody(request);
  const endpoint = new URL(appsScriptUrl);

  const upstreamResponse = await fetch(endpoint.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      ...body,
      action: body.action || "saveQuinielaPicks"
    })
  });

  if (!upstreamResponse.ok) {
    throw new Error(`Apps Script responded ${upstreamResponse.status}`);
  }

  const payload = await upstreamResponse.json();
  response.setHeader("Cache-Control", "no-store");
  return response.status(200).json(payload);
}

function readJsonBody(request) {
  return new Promise((resolve) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
    });

    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (error) {
        resolve({});
      }
    });
  });
}
