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

// Web APIとして公開する関数
function doGet(e) {
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

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
    ContentService.MimeType.JSON
  );
}
