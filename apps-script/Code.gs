const SHEET_ID = "1w3zvGkTrGO6jSyOIpb5xBotha0OnxwA9tV4XCxHJjKU";
const SHEET_NAME = "";

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
    assignments: rows.filter((row) => row.teamCode)
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
