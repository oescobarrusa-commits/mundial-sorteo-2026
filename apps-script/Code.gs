const SHEET_ID = "1w3zvGkTrGO6jSyOIpb5xBotha0OnxwA9tV4XCxHJjKU";
const SHEET_NAME = "participantes";
const BRACKET_SHEET_NAME = "bracket";

function doGet() {
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

  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
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
