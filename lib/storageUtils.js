// storageUtils.js

// GASのAPIエンドポイント
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxj9TcZSvpMgSg798M7vyVvh7-64zNgecmyRwOasqYVzzWiXsMRMx6jUcuTBbadnecc/exec';

// データの有効期限（ミリ秒）
const DATA_EXPIRY = 20 * 60 * 1000; // 20分

// GAS保存の最小間隔（ミリ秒）
const GAS_SAVE_INTERVAL = 3 * 60 * 1000; // 3分

// 最後のGAS保存時刻を追跡するオブジェクト
const lastGASSaveTimes = {};

/**
 * データをローカルストレージに保存します
 * @param {string} key - 保存するキー
 * @param {any} data - 保存するデータ
 */
async function saveToLocal(key, data) {
  try {
    await chrome.storage.local.set({ [key]: JSON.stringify(data) });
  } catch (error) {
    console.error("ローカルストレージへの保存エラー:", error.message);
    throw error;
  }
}

/**
 * データをGASに保存します
 * @param {string} unit - ユニット名
 * @param {string} category - カテゴリ名
 * @param {any} data - 保存するデータ
 */
async function saveToGAS(unit, category, data) {
  const key = `${unit}/${category}`;
  const now = Date.now();
  
  // 最後の保存から一定時間経過していない場合はスキップ
  if (lastGASSaveTimes[key] && (now - lastGASSaveTimes[key]) < GAS_SAVE_INTERVAL) {
    console.log(`${key}のGAS保存をスキップします（最後の保存から${Math.floor((now - lastGASSaveTimes[key]) / 1000)}秒）`);
    return;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('action', 'save');
    formData.append('unitNumber', unit);
    formData.append('category', category);
    formData.append('data', JSON.stringify(data));

    const response = await fetch(GAS_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });
    
    // no-corsモードではresponse.json()が使えないため、成功とみなす
    lastGASSaveTimes[key] = now;
  } catch (error) {
    console.error("GASへの保存エラー:", error.message);
    throw error;
  }
}

/**
 * 指定されたunitとcategoryでデータを保存します。
 * @param {string} unit - ユニット名
 * @param {string} category - カテゴリ名
 * @param {any} data - 保存するデータ
 * @returns {Promise<void>} 保存が完了したら解決されるPromise
 */
async function saveData(unit, category, data) {
  if (!unit || !category) {
    return Promise.reject(new Error("Unit and category are required."));
  }

  const key = `${unit}/${category}/data.json`;
  const dataWithTimestamp = {
    ...data,
    timestamp: Date.now()
  };

  try {
    // ローカルストレージに保存
    await saveToLocal(key, dataWithTimestamp);

  } catch (error) {
    console.error("データの保存中にエラーが発生しました:", error.message);
    return Promise.reject(error);
  }
}

/**
 * 指定されたunitとcategoryのデータを取得します。
 * @param {string} unit - ユニット名
 * @param {string} category - カテゴリ名
 * @returns {Promise<any>} 取得したデータ、またはデータが存在しない場合はundefined
 */
async function loadData(unit, category) {
  if (!unit || !category) {
    return Promise.reject(new Error("Unit and category are required."));
  }

  const key = `${unit}/${category}/data.json`;

  try {
    // まずローカルストレージから取得を試みる
    console.log("ローカルストレージからデータを取得します");
    const localResult = await chrome.storage.local.get(key);
    let data = localResult[key] ? JSON.parse(localResult[key]) : null;

    return data;
  } catch (error) {
    console.error("データの取得中にエラーが発生しました:", error.message);
    return undefined;
  }
}

// グローバルオブジェクトに公開
window.storageUtils = {
  saveData,
  loadData
};
