// スプレッドシートのIDを設定
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID";

// ユニット番号を正規化する関数
function normalizeUnitNumber(unitNumber) {
  // 数値の場合は文字列に変換し、2桁の0埋めにする
  return String(unitNumber).padStart(2, "0");
}

// データを保存する関数
function saveData(unitNumber, category, data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Data") || ss.insertSheet("Data");

  // ヘッダー行がない場合は追加
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["unitNumber", "category", "data"]);
  }

  // ユニット番号を正規化
  const normalizedUnitNumber = normalizeUnitNumber(unitNumber);

  // 既存のデータを検索
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  let rowIndex = -1;

  // 2行目から検索（1行目はヘッダー）
  for (let i = 1; i < values.length; i++) {
    if (
      normalizeUnitNumber(values[i][0]) === normalizedUnitNumber &&
      values[i][1] === category
    ) {
      rowIndex = i + 1; // 1-based index
      break;
    }
  }

  // データをJSON形式で保存
  const rowData = [normalizedUnitNumber, category, JSON.stringify(data)];

  if (rowIndex > 0) {
    // 既存のデータを更新
    sheet.getRange(rowIndex, 1, 1, 3).setValues([rowData]);
  } else {
    // 新しいデータを追加
    sheet.appendRow(rowData);
  }

  return { success: true };
}

// データを取得する関数
function getData(unitNumber, category) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Data");

  if (!sheet || sheet.getLastRow() === 0) {
    return null;
  }

  // ユニット番号を正規化
  const normalizedUnitNumber = normalizeUnitNumber(unitNumber);

  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();

  // 2行目から検索（1行目はヘッダー）
  for (let i = 1; i < values.length; i++) {
    if (
      normalizeUnitNumber(values[i][0]) === normalizedUnitNumber &&
      values[i][1] === category
    ) {
      try {
        return JSON.parse(values[i][2]);
      } catch (e) {
        console.error("JSONのパースに失敗しました:", e);
        return null;
      }
    }
  }

  return null;
}

// CORSヘッダーを設定する関数
function setCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "https://w1.linguaporta.jp",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "3600",
    "Access-Control-Allow-Credentials": "true",
  };
}

// Web APIとして公開する関数
function doGet(e) {
  const headers = setCorsHeaders();

  // プリフライトリクエストへの対応
  if (e.method === "OPTIONS") {
    return ContentService.createTextOutput("")
      .setMimeType(ContentService.MimeType.TEXT)
      .setHeaders(headers);
  }

  const action = e.parameter.action;
  const unitNumber = e.parameter.unitNumber;
  const category = e.parameter.category;
  const data = e.parameter.data;

  let result;

  if (action === "save") {
    result = saveData(unitNumber, category, JSON.parse(data));
  } else if (action === "get") {
    result = getData(unitNumber, category);
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
}

// POSTリクエストに対応する関数
function doPost(e) {
  const headers = setCorsHeaders();

  // プリフライトリクエストへの対応
  if (e.method === "OPTIONS") {
    return ContentService.createTextOutput("")
      .setMimeType(ContentService.MimeType.TEXT)
      .setHeaders(headers);
  }

  // POSTデータの取得
  const postData = e.postData.contents;
  let params;

  try {
    // URLSearchParams形式のデータをパース
    const searchParams = new URLSearchParams(postData);
    params = {
      action: searchParams.get("action"),
      unitNumber: searchParams.get("unitNumber"),
      category: searchParams.get("category"),
      data: searchParams.get("data"),
    };
  } catch (error) {
    console.error("POSTデータのパースに失敗:", error);
    return ContentService.createTextOutput(
      JSON.stringify({ error: "Invalid request data" })
    )
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  }

  const action = params.action;
  const unitNumber = params.unitNumber;
  const category = params.category;
  const data = params.data;

  let result;

  if (action === "save") {
    result = saveData(unitNumber, category, JSON.parse(data));
  } else if (action === "get") {
    result = getData(unitNumber, category);
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
}
