const SHEET_ID = "1w3zvGkTrGO6jSyOIpb5xBotha0OnxwA9tV4XCxHJjKU";
const SHEET_NAME = "participantes";
const BRACKET_SHEET_NAME = "bracket";
const QUINIELA_CODES_SHEET_NAME = "ParticipacionesQuiniela";
const QUINIELA_RESPONSES_SHEET_NAME = "QuinielaRespuestas";

function doGet(e) {
  const action = String(e?.parameter?.action || "").trim();
  if (action === "validateQuinielaCode") return jsonResponse(validateQuinielaCode(e.parameter.code));
  if (action === "getQuinielaDashboard") return jsonResponse(getQuinielaDashboard());

  const sheet = getSheet();
  const values = sheet.getDataRange().getDisplayValues();
  const rows = values
    .filter((row) => row.some((cell) => String(cell).trim()))
    .filter((row, index) => index !== 0 || !isHeaderRow(row))
    .map((row) => ({
      participantName: String(row[0] || "").trim(),
      teamCode: String(row[1] || "").trim().toUpperCase()
    }))
    .filter((row) => row.participantName);

  const payload = {
    participants: unique(rows.map((row) => row.participantName)),
    assignments: rows.filter((row) => row.teamCode),
    bracket: getBracket()
  };

  return jsonResponse(payload);
}

function doPost(e) {
  const payload = parseJsonBody(e);
  const action = String(payload.action || e?.parameter?.action || "").trim();
  if (action === "saveQuinielaPicks") return jsonResponse(saveQuinielaPicks(payload));
  return jsonResponse({ ok: false, error: "Acción no válida." });
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function parseJsonBody(e) {
  try {
    return JSON.parse(e?.postData?.contents || "{}");
  } catch (error) {
    return {};
  }
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  if (SHEET_NAME) return spreadsheet.getSheetByName(SHEET_NAME);
  return spreadsheet.getSheets()[0];
}

function getBracket() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheet = spreadsheet.getSheetByName(BRACKET_SHEET_NAME);
  if (!sheet) return { rounds: [], champion: "" };

  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return { rounds: [], champion: "" };

  const headers = values[0].map((header) => normalizeHeader(header));
  const champion = getColumnValues(values, headers, ["winner", "champion", "campeon"])[0] || "";
  const rounds = getBracketRoundConfigs()
    .map((config) => {
      const columnIndex = headers.findIndex((header) => config.headers.includes(header));
      if (columnIndex === -1) return null;

      const teams = getColumnValues(values, headers, config.headers);
      const matches = [];

      for (let index = 0; index < teams.length; index += 2) {
        if (teams[index] && teams[index + 1]) {
          matches.push({
            a: teams[index],
            b: teams[index + 1],
            winner: config.name === "Final" && [teams[index], teams[index + 1]].includes(champion)
              ? champion
              : ""
          });
        }
      }

      return matches.length ? { name: config.name, matches } : null;
    })
    .filter(Boolean);

  return { rounds, champion };
}

function getColumnValues(values, headers, headerCandidates) {
  const columnIndex = headers.findIndex((header) => headerCandidates.includes(header));
  if (columnIndex === -1) return [];
  return values
    .slice(1)
    .map((row) => String(row[columnIndex] || "").trim().toUpperCase())
    .filter(Boolean);
}

function getBracketRoundConfigs() {
  return [
    { name: "Dieciseisavos", headers: ["dieciseisavos", "roundof32"] },
    { name: "Octavos", headers: ["octavos", "roundof16"] },
    { name: "Cuartos", headers: ["cuartos", "cuartosdefinal", "quarterfinals"] },
    { name: "Semifinal", headers: ["semifinal", "semifinales", "semifinals"] },
    { name: "Final", headers: ["final"] }
  ];
}

function getQuinielaPickCategoryCodes() {
  return [
    ["MEX", "CAN", "BRA", "USA", "GER", "NED", "BEL", "ESP", "FRA", "ARG", "POR", "ENG"],
    ["ZAF", "KOR", "BIH", "QAT", "MAR", "HAI", "PAR", "AUS", "CUW", "CIV", "JPN", "SWE", "EGY", "IRN", "CPV", "KSA", "SEN", "IRQ", "ALG", "AUT", "COD", "UZB", "CRO", "GHA"],
    ["ZAF", "KOR", "BIH", "QAT", "MAR", "HAI", "PAR", "AUS", "CUW", "CIV", "JPN", "SWE", "EGY", "IRN", "CPV", "KSA", "SEN", "IRQ", "ALG", "AUT", "COD", "UZB", "CRO", "GHA"],
    ["ZAF", "KOR", "BIH", "QAT", "MAR", "HAI", "PAR", "AUS", "CUW", "CIV", "JPN", "SWE", "EGY", "IRN", "CPV", "KSA", "SEN", "IRQ", "ALG", "AUT", "COD", "UZB", "CRO", "GHA"],
    ["ZAF", "KOR", "BIH", "QAT", "MAR", "HAI", "PAR", "AUS", "CUW", "CIV", "JPN", "SWE", "EGY", "IRN", "CPV", "KSA", "SEN", "IRQ", "ALG", "AUT", "COD", "UZB", "CRO", "GHA"],
    ["CZE", "SUI", "SCO", "TUR", "ECU", "TUN", "NZL", "URU", "NOR", "JOR", "COL", "PAN"],
    ["CZE", "SUI", "SCO", "TUR", "ECU", "TUN", "NZL", "URU", "NOR", "JOR", "COL", "PAN"],
    ["CZE", "SUI", "SCO", "TUR", "ECU", "TUN", "NZL", "URU", "NOR", "JOR", "COL", "PAN"]
  ];
}

function validateQuinielaCode(code) {
  const normalizedCode = normalizeCode(code);
  const entry = getQuinielaParticipationByCode(normalizedCode);
  if (!entry) return { ok: false, error: "Código no válido. Revisa tu enlace o contacta al organizador." };

  const existing = getQuinielaResponseByCode(normalizedCode);
  return {
    ok: true,
    ...entry,
    alreadySubmitted: existing ? existing.isLocked : false,
    canEdit: existing ? !existing.isLocked : true,
    picks: existing ? existing.picks : []
  };
}

function saveQuinielaPicks(payload) {
  const normalizedCode = normalizeCode(payload.code);
  const entry = getQuinielaParticipationByCode(normalizedCode);
  if (!entry) return { ok: false, error: "Código no válido. Revisa tu enlace o contacta al organizador." };

  const existing = getQuinielaResponseByCode(normalizedCode);
  if (existing && existing.isLocked) {
    return {
      ok: false,
      alreadySubmitted: true,
      error: "Esta quiniela ya fue registrada y no se puede modificar.",
      picks: existing.picks
    };
  }

  const picks = normalizePicks(payload.picks);
  const validationError = validatePicks(picks);
  if (validationError) return { ok: false, error: validationError };

  const sheet = getOrCreateSheet(QUINIELA_RESPONSES_SHEET_NAME, getQuinielaResponseHeaders());
  const rowValues = [
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss"),
    entry.code,
    entry.participantName,
    entry.ticketNumber,
    ...picks.flatMap((pick) => [pick.code, pick.name]),
    "CONFIRMED"
  ];

  if (existing && existing.rowNumber) {
    sheet.getRange(existing.rowNumber, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return {
    ok: true,
    message: "Quiniela registrada correctamente.",
    picks
  };
}

function getQuinielaDashboard() {
  const sheet = getSheetIfExists(QUINIELA_RESPONSES_SHEET_NAME);
  if (!sheet) return { ok: true, entries: [] };

  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return { ok: true, entries: [] };

  const headers = values[0].map((header) => normalizeHeader(header));
  const entries = values.slice(1)
    .filter((row) => row.some((cell) => String(cell).trim()))
    .map((row) => {
      const code = normalizeCode(getValueByHeader(row, headers, ["code"]));
      const participation = getQuinielaParticipationByCode(code);
      const picks = [];
      for (let index = 1; index <= 8; index += 1) {
        const pickCode = normalizeCode(getValueByHeader(row, headers, [`pick${index}code`]));
        const name = getValueByHeader(row, headers, [`pick${index}name`]);
        if (pickCode || name) picks.push({ code: pickCode, name });
      }

      return {
        timestamp: getValueByHeader(row, headers, ["timestamp"]),
        participantName: getValueByHeader(row, headers, ["participantname", "name"]),
        ticketNumber: getValueByHeader(row, headers, ["ticketnumber"]),
        mainTeamCode: participation ? participation.mainTeamCode : "",
        mainTeamName: participation ? participation.mainTeamName : "",
        status: getValueByHeader(row, headers, ["status"]),
        picks
      };
    })
    .filter((entry) => entry.participantName && String(entry.status).trim().toUpperCase() === "CONFIRMED");

  return { ok: true, entries };
}

function getQuinielaParticipationByCode(code) {
  const sheet = getSheetIfExists(QUINIELA_CODES_SHEET_NAME);
  if (!sheet || !code) return null;

  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return null;

  const headers = values[0].map((header) => normalizeHeader(header));
  const row = values.slice(1).find((item) => normalizeCode(getValueByHeader(item, headers, ["code"])) === code);
  if (!row) return null;

  const isActiveValue = getValueByHeader(row, headers, ["isactive", "active"]);
  const isActive = !isActiveValue || ["true", "si", "sí", "yes", "1"].includes(String(isActiveValue).trim().toLowerCase());
  if (!isActive) return null;

  const mainTeamCode = normalizeCode(getValueByHeader(row, headers, ["mainteamcode", "teamcode"]));
  const mainTeamName = getValueByHeader(row, headers, ["mainteamname", "teamname"]) || getOfficialTeamMap()[mainTeamCode] || "";

  return {
    code,
    participantName: getValueByHeader(row, headers, ["participantname", "name"]),
    ticketNumber: getValueByHeader(row, headers, ["ticketnumber", "ticket"]),
    mainTeamCode,
    mainTeamName
  };
}

function getQuinielaResponseByCode(code) {
  const sheet = getSheetIfExists(QUINIELA_RESPONSES_SHEET_NAME);
  if (!sheet || !code) return null;

  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return null;

  const headers = values[0].map((header) => normalizeHeader(header));
  const rowIndex = values.slice(1).findIndex((item) => normalizeCode(getValueByHeader(item, headers, ["code"])) === code);
  if (rowIndex === -1) return null;

  const row = values[rowIndex + 1];
  if (!row) return null;

  const picks = [];
  for (let index = 1; index <= 8; index += 1) {
    const pickCode = normalizeCode(getValueByHeader(row, headers, [`pick${index}code`]));
    const pickName = getValueByHeader(row, headers, [`pick${index}name`]);
    if (pickCode) picks.push({ code: pickCode, name: pickName });
  }

  const status = getValueByHeader(row, headers, ["status"]);
  return {
    rowNumber: rowIndex + 2,
    status,
    isLocked: Boolean(String(status).trim()),
    picks
  };
}

function normalizePicks(picks) {
  return Array.isArray(picks)
    ? picks.map((pick) => {
      const code = normalizeCode(typeof pick === "string" ? pick : pick.code);
      const team = getOfficialTeamMap()[code];
      return {
        code,
        name: team || String(pick.name || "").trim()
      };
    })
    : [];
}

function validatePicks(picks) {
  const categoryError = "La quiniela no cumple con las categorías requeridas.";
  if (picks.length !== 8) return categoryError;
  const teamMap = getOfficialTeamMap();
  const codes = picks.map((pick) => pick.code);
  if (codes.some((code) => !teamMap[code])) return categoryError;
  if (new Set(codes).size !== 8) return categoryError;
  const categoryCodes = getQuinielaPickCategoryCodes();
  if (codes.some((code, index) => !categoryCodes[index].includes(code))) return categoryError;
  return "";
}

function getSheetIfExists(sheetName) {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(sheetName);
}

function getOrCreateSheet(sheetName, headers) {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(sheetName);
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
  return sheet;
}

function getValueByHeader(row, headers, headerCandidates) {
  const index = headers.findIndex((header) => headerCandidates.includes(header));
  return index === -1 ? "" : String(row[index] || "").trim();
}

function normalizeCode(value) {
  return String(value || "").trim().toUpperCase();
}

function getQuinielaResponseHeaders() {
  return [
    "timestamp",
    "code",
    "participantName",
    "ticketNumber",
    "pick1Code",
    "pick1Name",
    "pick2Code",
    "pick2Name",
    "pick3Code",
    "pick3Name",
    "pick4Code",
    "pick4Name",
    "pick5Code",
    "pick5Name",
    "pick6Code",
    "pick6Name",
    "pick7Code",
    "pick7Name",
    "pick8Code",
    "pick8Name",
    "status"
  ];
}

function getOfficialTeamMap() {
  return {
    MEX: "México",
    ZAF: "Sudáfrica",
    KOR: "Corea del Sur",
    CZE: "Republica Checa",
    CAN: "Canadá",
    BIH: "Bosnia y Herzegovina",
    QAT: "Catar",
    SUI: "Suiza",
    BRA: "Brasil",
    MAR: "Marruecos",
    HAI: "Haití",
    SCO: "Escocia",
    USA: "Estados Unidos",
    PAR: "Paraguay",
    AUS: "Australia",
    TUR: "Turquía",
    GER: "Alemania",
    CUW: "Curazao",
    CIV: "Costa de Marfil",
    ECU: "Ecuador",
    NED: "Holanda",
    JPN: "Japón",
    SWE: "Suecia",
    TUN: "Túnez",
    BEL: "Bélgica",
    EGY: "Egipto",
    IRN: "Irán",
    NZL: "Nueva Zelanda",
    ESP: "España",
    CPV: "Cabo Verde",
    KSA: "Arabia Saudita",
    URU: "Uruguay",
    FRA: "Francia",
    SEN: "Senegal",
    IRQ: "Irak",
    NOR: "Noruega",
    ARG: "Argentina",
    ALG: "Argelia",
    AUT: "Austria",
    JOR: "Jordania",
    POR: "Portugal",
    COD: "Congo",
    UZB: "Uzbekistán",
    COL: "Colombia",
    ENG: "Inglaterra",
    CRO: "Croacia",
    GHA: "Ghana",
    PAN: "Panamá"
  };
}

function isHeaderRow(row) {
  const firstColumn = normalizeHeader(row[0] || "");
  const secondColumn = normalizeHeader(row[1] || "");
  return ["name", "participantname", "participant"].includes(firstColumn) ||
    ["teamcode", "code", "countrycode"].includes(secondColumn);
}

function normalizeHeader(value) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
